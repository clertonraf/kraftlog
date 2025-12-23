#!/bin/bash

# Maestro E2E Test Runner Script

echo "🧪 KraftLog E2E Test Runner"
echo ""

# Add Maestro to PATH if not already there
export PATH="$PATH:$HOME/.maestro/bin"

# Check if Maestro is installed
if ! command -v maestro &> /dev/null; then
    echo "❌ Maestro is not installed"
    echo "Please install it with: curl -Ls \"https://get.maestro.mobile.dev\" | bash"
    exit 1
fi

# Function to check if app is installed
check_app_installed() {
    SIMULATOR_UDID=$(xcrun simctl list devices | grep "Booted" | grep -o '\([A-F0-9-]\{36\}\)' | head -1)
    if [ -z "$SIMULATOR_UDID" ]; then
        return 1
    fi
    # Check for Expo Go (used in development)
    xcrun simctl listapps "$SIMULATOR_UDID" 2>/dev/null | grep -q "host.exp.Exponent"
}

# Function to reset iOS simulator (only if needed)
reset_simulator() {
    echo "🔄 Checking simulator..."
    
    # Get the booted simulator UDID
    SIMULATOR_UDID=$(xcrun simctl list devices | grep "Booted" | grep -o '\([A-F0-9-]\{36\}\)' | head -1)
    
    if [ -z "$SIMULATOR_UDID" ]; then
        echo "⚠️  No booted simulator found. Booting iPhone 17 Pro..."
        # Boot iPhone 17 Pro (or latest available)
        SIMULATOR_UDID=$(xcrun simctl list devices | grep "iPhone" | tail -1 | grep -o '\([A-F0-9-]\{36\}\)')
        xcrun simctl boot "$SIMULATOR_UDID" 2>/dev/null
        sleep 5
    fi
    
    # Check if app is installed
    if check_app_installed; then
        echo "✅ Expo Go is installed, ready to test"
        echo ""
    else
        echo "⚠️  Expo Go not installed!"
        echo ""
        echo "Please install Expo Go first:"
        echo "1. In your Expo terminal, press 'i'"
        echo "2. Wait for Expo Go to install and open"
        echo "3. Then run tests again"
        echo ""
        exit 1
    fi
}

# Check if backend is running
if ! curl -f http://localhost:8080/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}' &> /dev/null; then
    echo "⚠️  Backend API is not responding"
    echo ""
    echo "Starting backend with Docker Compose..."
    docker-compose up -d 2>/dev/null || true
    echo "⏳ Waiting for backend to start..."
    sleep 15
    
    if ! curl -f http://localhost:8080/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}' &> /dev/null; then
        echo "⚠️  Backend still not responding"
        echo "Please start it manually with: ./scripts/start-backend.sh"
        echo ""
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        echo "✅ Backend is running"
        echo ""
    fi
else
    echo "✅ Backend API is running"
    echo ""
fi

# Check simulator and app before running tests
reset_simulator

# Parse arguments
TEST_TYPE="${1:-all}"

case $TEST_TYPE in
    "all")
        echo "▶️  Running all E2E tests..."
        maestro test .maestro/*.yaml
        ;;
    "smoke")
        echo "▶️  Running smoke tests..."
        maestro test .maestro/01-login-flow.yaml .maestro/05-tab-navigation.yaml
        ;;
    "login")
        echo "▶️  Running login tests..."
        maestro test .maestro/01-login-flow.yaml .maestro/04-logout-flow.yaml
        ;;
    "navigation")
        echo "▶️  Running navigation tests..."
        maestro test .maestro/02-routines-navigation.yaml .maestro/05-tab-navigation.yaml
        ;;
    "report")
        echo "▶️  Running all tests with HTML report..."
        maestro test --format html --output e2e-report.html .maestro/*.yaml
        echo "📊 Report generated: e2e-report.html"
        open e2e-report.html 2>/dev/null || echo "Open e2e-report.html in your browser"
        ;;
    "watch")
        echo "▶️  Running tests in watch mode..."
        maestro test --continuous .maestro/
        ;;
    *)
        echo "Usage: $0 [all|smoke|login|navigation|report|watch]"
        echo ""
        echo "Options:"
        echo "  all         - Run all tests (default)"
        echo "  smoke       - Run critical smoke tests"
        echo "  login       - Run login/logout tests"
        echo "  navigation  - Run navigation tests"
        echo "  report      - Run all tests and generate HTML report"
        echo "  watch       - Run tests continuously (watch mode)"
        echo ""
        echo "Examples:"
        echo "  $0 all"
        echo "  $0 smoke"
        echo "  $0 report"
        exit 1
        ;;
esac

echo ""
echo "✅ Test run complete!"

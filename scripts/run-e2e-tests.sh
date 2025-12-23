#!/bin/bash

# Maestro E2E Test Runner Script

echo "🧪 KraftLog E2E Test Runner"
echo ""

# Check if Maestro is installed
if ! command -v maestro &> /dev/null; then
    echo "❌ Maestro is not installed or not in PATH"
    echo "Please run: export PATH=\"\$PATH\":\"\$HOME/.maestro/bin\""
    exit 1
fi

# Check if backend is running
if ! curl -f http://localhost:8080/actuator/health &> /dev/null; then
    echo "⚠️  Backend API is not running"
    echo "Please start it with: ./scripts/start-backend.sh"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

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

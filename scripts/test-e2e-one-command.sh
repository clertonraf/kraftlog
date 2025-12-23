#!/bin/bash

echo "🚀 KraftLog E2E Tests - One Command Runner"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Cleanup function
cleanup() {
    if [ ! -z "$EXPO_BG_PID" ]; then
        echo ""
        echo "🧹 Cleaning up background processes..."
        kill $EXPO_BG_PID 2>/dev/null || true
    fi
}
trap cleanup EXIT

# Function to wait for backend
wait_for_backend() {
    echo "⏳ Waiting for backend to be ready..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        # Check if backend responds (any HTTP response is good)
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/auth/login \
            -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}' \
            | grep -q "^[0-9]"; then
            echo -e "${GREEN}✅ Backend is ready!${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    
    echo -e "${RED}❌ Backend did not start in time${NC}"
    return 1
}

# Step 1: Start backend
echo "1️⃣  Checking backend..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/auth/login \
    -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}' 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "000" ]; then
    echo "   Starting backend..."
    docker-compose up -d > /dev/null 2>&1
    if ! wait_for_backend; then
        echo ""
        echo "Troubleshooting:"
        echo "  docker-compose logs backend --tail 20"
        exit 1
    fi
else
    echo -e "   ${GREEN}✅ Backend responding (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Step 2: Check/Start Expo
echo "2️⃣  Checking Expo..."
EXPO_RUNNING=false
if pgrep -f "expo start" > /dev/null; then
    echo -e "   ${GREEN}✅ Expo is running${NC}"
    EXPO_RUNNING=true
else
    echo "   Starting Expo in background..."
    npx expo start > /tmp/expo-test.log 2>&1 &
    EXPO_BG_PID=$!
    echo "   ⏳ Waiting for Expo to start (15 seconds)..."
    sleep 15
    
    if pgrep -f "expo start" > /dev/null; then
        echo -e "   ${GREEN}✅ Expo started${NC}"
        EXPO_RUNNING=true
    else
        echo -e "${RED}❌ Failed to start Expo${NC}"
        echo "   Check logs: cat /tmp/expo-test.log"
        exit 1
    fi
fi
echo ""

# Step 3: Check simulator and app
echo "3️⃣  Checking iOS Simulator..."
SIMULATOR_UDID=$(xcrun simctl list devices | grep "Booted" | grep -o '\([A-F0-9-]\{36\}\)' | head -1)

if [ -z "$SIMULATOR_UDID" ]; then
    echo "   Booting simulator..."
    # Get latest iPhone simulator
    SIMULATOR_UDID=$(xcrun simctl list devices | grep "iPhone" | tail -1 | grep -o '\([A-F0-9-]\{36\}\)')
    if [ -z "$SIMULATOR_UDID" ]; then
        echo -e "${RED}❌ No simulator found${NC}"
        echo "   Please open Simulator manually"
        exit 1
    fi
    xcrun simctl boot "$SIMULATOR_UDID" > /dev/null 2>&1 || true
    echo "   ⏳ Waiting for simulator to boot..."
    sleep 10
    echo -e "   ${GREEN}✅ Simulator booted${NC}"
else
    echo -e "   ${GREEN}✅ Simulator already booted${NC}"
fi
echo ""

# Step 4: Check app installation
echo "4️⃣  Checking app installation..."
# For Expo Go, we check if Expo Go itself is installed
if xcrun simctl listapps "$SIMULATOR_UDID" 2>/dev/null | grep -q "host.exp.Exponent"; then
    echo -e "   ${GREEN}✅ Expo Go is installed${NC}"
else
    echo "   Expo Go not installed. Please install Expo Go on simulator first."
    echo "   Opening App Store..."
    xcrun simctl openurl "$SIMULATOR_UDID" "https://apps.apple.com/app/apple-store/id982107779" 2>/dev/null || true
    echo ""
    read -p "   After installing Expo Go, press Enter to continue..." 
fi

# Open the app in Expo Go
echo "   Opening app in Expo Go..."
xcrun simctl openurl "$SIMULATOR_UDID" "exp://localhost:8081" 2>/dev/null || true
echo "   ⏳ Waiting for app to load (10 seconds)..."
sleep 10
echo -e "   ${GREEN}✅ App should be ready${NC}"
echo ""

# Step 5: Run tests
echo "5️⃣  Running E2E smoke tests..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Run tests but don't let them stop Expo
set +e
./scripts/run-e2e-tests.sh smoke
TEST_EXIT_CODE=$?
set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests failed (exit code: $TEST_EXIT_CODE)${NC}"
    echo ""
    echo "Troubleshooting tips:"
    echo "1. Check if app is showing on simulator"
    echo "2. Try manually: npx expo start, press 'i', then run: npm run test:e2e:smoke"
    echo "3. Check backend: docker-compose logs backend --tail 20"
fi

exit $TEST_EXIT_CODE

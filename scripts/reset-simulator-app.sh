#!/bin/bash

echo "🔄 Resetting iOS Simulator App..."
echo ""

# Get the booted simulator UDID
SIMULATOR_UDID=$(xcrun simctl list devices | grep "Booted" | grep -o '\([A-F0-9-]\{36\}\)' | head -1)

if [ -z "$SIMULATOR_UDID" ]; then
    echo "❌ No booted simulator found"
    echo "Please start the iOS Simulator first"
    exit 1
fi

echo "📱 Terminating app..."
xcrun simctl terminate "$SIMULATOR_UDID" org.reactjs.native.example.kraftlog 2>/dev/null || true

echo "🗑️  Clearing app data..."
xcrun simctl privacy "$SIMULATOR_UDID" reset all org.reactjs.native.example.kraftlog 2>/dev/null || true

echo "🗑️  Uninstalling app..."
xcrun simctl uninstall "$SIMULATOR_UDID" org.reactjs.native.example.kraftlog 2>/dev/null || true

echo ""
echo "✅ Simulator app reset complete"
echo ""
echo "To reinstall:"
echo "1. In Expo terminal, press 'i'"
echo "2. Wait for app to install"
echo "3. Run tests: npm run test:e2e:smoke"

#!/bin/bash

echo "🔄 Resetting App in iOS Simulator"
echo ""

# Get booted simulator
SIMULATOR_UDID=$(xcrun simctl list devices | grep "Booted" | grep -o '\([A-F0-9-]\{36\}\)' | head -1)

if [ -z "$SIMULATOR_UDID" ]; then
    echo "❌ No simulator is booted"
    echo "Please start the iOS simulator first"
    exit 1
fi

echo "📱 Found simulator: $SIMULATOR_UDID"
echo ""

# Uninstall the app completely
echo "🗑️  Uninstalling app..."
xcrun simctl uninstall "$SIMULATOR_UDID" org.reactjs.native.example.kraftlog 2>/dev/null || true

echo "✅ App uninstalled"
echo ""
echo "Now in your Expo terminal, press 'i' to reinstall the app"
echo "Or run: npm start (if not running) then press 'i'"

#!/bin/bash

echo "📱 Clearing iOS Simulator app data..."

# Get simulator device ID
SIMULATOR_ID=$(xcrun simctl list devices | grep "iPhone 17 Pro" | grep "Booted" | grep -E -o -i "([0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12})" | head -n 1)

if [ -z "$SIMULATOR_ID" ]; then
  echo "⚠️  No booted iPhone 17 Pro simulator found"
  exit 1
fi

echo "✅ Found simulator: $SIMULATOR_ID"

# Find the app bundle ID
BUNDLE_ID="host.exp.Exponent"

# Terminate app
xcrun simctl terminate "$SIMULATOR_ID" "$BUNDLE_ID" 2>/dev/null || true

# Clear app data
xcrun simctl privacy "$SIMULATOR_ID" reset all "$BUNDLE_ID" 2>/dev/null || true

echo "✅ App data cleared successfully"

# KraftLog E2E Tests with Maestro

## Overview
End-to-end tests for KraftLog mobile app using Maestro.

## Requirements
- Maestro CLI installed
- iOS Simulator with app installed
- Backend API running (or skip backend check)

## Important Note: Expo Go Limitation
⚠️ **Current tests require a development build, not Expo Go.**

Maestro cannot reliably launch apps through Expo Go. You have two options:

### Option 1: Create a Development Build (Recommended)
```bash
# Install EAS CLI
npm install -g eas-cli

# Create development build for iOS simulator
eas build --profile development --platform ios --local

# Install the build on simulator
# The .app file will be in the build output
```

### Option 2: Manual Test Execution
1. Start the app in Expo Go manually
2. Run tests without the automatic reset:
```bash
# Comment out reset_simulator() call in scripts/run-e2e-tests.sh
# Then run:
npm run test:e2e:smoke
```

## Test Suites

### Smoke Tests (Critical Flows)
```bash
npm run test:e2e:smoke
```
Tests:
- Login flow
- Tab navigation

### All Tests
```bash
npm run test:e2e
```

### Watch Mode
```bash
npm run test:e2e:watch
```

### Generate HTML Report
```bash
npm run test:e2e:report
```

## Test Files

- `01-login-flow.yaml` - Login and basic navigation
- `02-routines-navigation.yaml` - Routines list and details
- `03-workout-history.yaml` - Workout history viewing
- `04-logout-flow.yaml` - Logout functionality
- `05-tab-navigation.yaml` - Bottom tab navigation
- `06-sync-indicator.yaml` - Sync status verification

## Writing Tests

Maestro uses YAML syntax:

```yaml
appId: com.clerton.kraftlog
---
- launchApp
- tapOn: "Login"
- inputText: "user@example.com"
- assertVisible: "Welcome"
```

## Troubleshooting

### App doesn't launch
- Ensure app is installed on simulator
- Build a development build (see Option 1 above)
- Check app bundle ID: `com.clerton.kraftlog`

### Tests fail immediately
- Backend API might not be running
- App might not be installed
- Simulator might need manual launch

### Flaky tests
- Add more `waitForAnimationToEnd` commands
- Increase wait times if needed
- Ensure backend is responsive

## Resources

- [Maestro Documentation](https://maestro.mobile.dev/)
- [Maestro CLI Reference](https://maestro.mobile.dev/cli/commands)
- [EAS Build Documentation](https://docs.expo.dev/build/setup/)

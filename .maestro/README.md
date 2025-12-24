# KraftLog E2E Tests with Maestro

## Overview
Comprehensive end-to-end tests for KraftLog mobile app using Maestro test framework.

## Requirements
- Maestro CLI installed (`brew tap mobile-dev/tap && brew install maestro`)
- iOS Simulator running
- Expo Go app installed on simulator
- Backend API running on `localhost:8080` (optional, tests can run without backend)

## Quick Start

### 1. Start Prerequisites
```bash
# Terminal 1: Start backend
./scripts/start-backend.sh

# Terminal 2: Start Expo
npx expo start
# Press 'i' to open in iOS simulator
```

### 2. Run Tests
```bash
# Run smoke tests (critical flows only)
npm run test:e2e:smoke

# Run all E2E tests
npm run test:e2e

# Run in watch mode (auto-rerun on changes)
npm run test:e2e:watch
```

## Test Suites

### Smoke Tests (Critical Flows)
```bash
npm run test:e2e:smoke
```
**Included tests:**
- Login flow
- Tab navigation

These are the most critical user journeys that must always work.

### Full Test Suite
```bash
npm run test:e2e
```
**All tests include:**
1. Login and authentication
2. Routines navigation and viewing
3. Workout history
4. Logout flow
5. Tab navigation
6. Data synchronization
7. Starting workouts
8. Exercise library browsing
9. Creating new routines
10. Profile and settings

### Watch Mode
```bash
npm run test:e2e:watch
```
Automatically reruns tests when files change. Great for development.

## Test Files

| File | Description | Coverage |
|------|-------------|----------|
| `01-login-flow.yaml` | Login with credentials and basic app launch | Auth system |
| `02-routines-navigation.yaml` | Browse routines, tap to view details | Routines CRUD |
| `03-workout-history-flow.yaml` | View past workouts and workout logs | History tracking |
| `04-logout-flow.yaml` | Logout and return to login screen | Session management |
| `05-tab-navigation.yaml` | Navigate through all bottom tabs | Navigation |
| `06-sync-status.yaml` | Data persistence and sync indicators | Offline/online sync |
| `07-workout-start-flow.yaml` | Start a workout from a routine | Active workout |
| `08-exercise-library-flow.yaml` | Browse and search exercises | Exercise database |
| `09-create-routine-flow.yaml` | Create a new custom routine | Routine creation |
| `10-profile-settings-flow.yaml` | View profile and app settings | User profile |
| `debug-screen.yaml` | Debug helper to capture screen state | Development |

## Writing Tests

Maestro uses YAML syntax for test definitions:

```yaml
appId: host.exp.Exponent  # For Expo Go
---
# Test description
- launchApp
- openLink: exp://192.168.0.104:8081
- waitForAnimationToEnd:
    timeout: 5000
- tapOn: "Login"
- inputText: "user@example.com"
- assertVisible: "Welcome"
```

### Common Commands

- `launchApp` - Launch the app
- `openLink: <url>` - Open a deep link (Expo URL)
- `tapOn: <text|id>` - Tap on element
- `inputText: <text>` - Type text
- `assertVisible: <text|id>` - Assert element is visible
- `assertNotVisible: <text|id>` - Assert element is not visible
- `scroll` - Scroll down
- `back` - Go back
- `waitForAnimationToEnd` - Wait for animations to complete
- `runFlow` - Conditional flow execution

### Best Practices

1. **Always wait for animations**: Add `waitForAnimationToEnd` after navigation
2. **Use conditional flows**: Handle optional screens with `runFlow.when`
3. **Add descriptive comments**: Explain what each test section does
4. **Keep tests independent**: Each test should work standalone
5. **Use appropriate timeouts**: Backend calls may need 5000ms, UI updates 2000ms

## Configuration

### Global Config (`config.yaml`)
```yaml
appId: host.exp.Exponent
defaults:
  animationDuration: 300
  idleTimeout: 3000
env:
  ADMIN_EMAIL: admin@kraftlog.com
  ADMIN_PASSWORD: admin123
```

### Test-Specific Config
Each test file can override the appId and settings:
```yaml
appId: host.exp.Exponent
---
# Test commands...
```

## Troubleshooting

### App doesn't launch
- **Ensure Expo is running**: `npx expo start`, then press 'i'
- **Check simulator is booted**: Open Simulator.app
- **Verify Expo Go is installed**: Open App Store on simulator

### Tests fail with "Unable to launch app"
- **App ID mismatch**: Use `host.exp.Exponent` for Expo Go, not `com.clerton.kraftlog`
- **App not loaded**: Manually open app in Expo Go first
- **Deep link not working**: Check network connection in simulator

### Tests are flaky
- **Increase timeouts**: Some screens may load slowly
- **Add more wait commands**: Especially after navigation
- **Backend not responding**: Start backend before tests
- **Expo metro not ready**: Wait for Expo to fully start

### Backend connection issues
- **Start backend first**: `./scripts/start-backend.sh`
- **Check port**: Backend should be on `localhost:8080`
- **Network in simulator**: Simulator uses host's localhost
- **Backend healthy**: Visit `http://localhost:8080/api/health`

### Reset simulator between runs
The test script automatically:
1. Kills the app to force reload
2. Clears app data
3. Relaunches the app

If issues persist:
```bash
# Manually reset
xcrun simctl shutdown all
xcrun simctl erase all
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install Maestro
        run: |
          brew tap mobile-dev/tap
          brew install maestro
      - name: Install dependencies
        run: npm ci
      - name: Start backend
        run: ./scripts/start-backend.sh &
      - name: Start Expo
        run: npx expo start &
      - name: Wait for services
        run: sleep 30
      - name: Run E2E tests
        run: npm run test:e2e
```

## Resources

- [Maestro Documentation](https://maestro.mobile.dev/)
- [Maestro CLI Reference](https://maestro.mobile.dev/cli/commands)
- [Expo Testing Guide](https://docs.expo.dev/guides/testing-with-jest/)
- [KraftLog API Docs](../README.md)

## Support

If tests fail unexpectedly:
1. Check `debug-screen.yaml` test to see current app state
2. Take screenshots: `maestro test --debug-output=./test-output`
3. Review Maestro logs for detailed error messages
4. Ensure all services (Expo, Backend) are healthy


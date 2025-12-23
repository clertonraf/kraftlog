# E2E Testing with Maestro

This directory contains end-to-end tests for the KraftLog mobile app using [Maestro](https://maestro.mobile.dev).

## Prerequisites

- Maestro installed (should already be installed)
- iOS Simulator or Android Emulator running
- Backend API running (see DOCKER_SETUP.md)
- Expo development build or production build

## Installation

Maestro is already installed. To verify:

```bash
maestro --version
```

If not installed:
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

## Running Tests

### Run All Tests

```bash
# Start Expo app first
npx expo start --ios

# In another terminal, run all tests
maestro test .maestro/
```

### Run Single Test

```bash
maestro test .maestro/01-login-flow.yaml
```

### Run Specific Tests

```bash
# Run login and navigation tests
maestro test .maestro/01-login-flow.yaml .maestro/02-routines-navigation.yaml
```

### Run with Report

```bash
# Generate detailed HTML report
maestro test --format html --output report.html .maestro/
```

### Run in Continuous Mode

```bash
# Watch for changes and re-run tests
maestro test --continuous .maestro/
```

## Test Files

| Test File | Description |
|-----------|-------------|
| `01-login-flow.yaml` | Tests login functionality and profile display |
| `02-routines-navigation.yaml` | Tests navigation to Routines tab |
| `03-workout-history-flow.yaml` | Tests workout history quick action |
| `04-logout-flow.yaml` | Tests logout functionality |
| `05-tab-navigation.yaml` | Tests bottom tab navigation |
| `06-sync-status.yaml` | Tests sync status indicator |

## Writing New Tests

Create a new `.yaml` file in `.maestro/` directory:

```yaml
appId: com.clerton.kraftlog
---
# Test Name
# Description of what this test does

- launchApp
- tapOn: "Button Text"
- assertVisible: "Expected Text"
- inputText: "Some text"
- scroll
- back
```

### Common Commands

**Navigation:**
- `launchApp` - Start the app
- `tapOn: "Text"` - Tap on element with text
- `back` - Go back
- `scroll` - Scroll down

**Assertions:**
- `assertVisible: "Text"` - Assert element is visible
- `assertNotVisible: "Text"` - Assert element is not visible

**Input:**
- `inputText: "text"` - Type text
- `clearInput` - Clear text field

**Waits:**
- `waitForAnimationToEnd` - Wait for animations
- `wait: 1000` - Wait milliseconds

**Advanced:**
```yaml
# Optional assertions
- assertVisible:
    text: "Text"
    optional: true

# Tap by ID
- tapOn:
    id: "button-id"

# Conditional execution
- runFlow:
    when:
      visible: "Text"
    commands:
      - tapOn: "Button"
```

## Testing Strategy

### 1. Critical User Flows
- ✅ Login/Logout
- ✅ Tab navigation
- 🔄 Create routine (TODO)
- 🔄 Log workout (TODO)
- ✅ View history

### 2. Regression Tests
Run after every significant change to ensure nothing breaks.

### 3. Smoke Tests
Quick tests to verify basic functionality:
```bash
maestro test .maestro/01-login-flow.yaml .maestro/05-tab-navigation.yaml
```

## CI/CD Integration

### GitHub Actions

Add to `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  maestro:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install Maestro
        run: curl -Ls "https://get.maestro.mobile.dev" | bash
      
      - name: Install dependencies
        run: npm install
      
      - name: Build iOS app
        run: npx expo build:ios --simulator
      
      - name: Run Maestro tests
        run: maestro test .maestro/
```

## Debugging Tests

### View Test Logs

```bash
# Verbose output
maestro test --verbose .maestro/01-login-flow.yaml
```

### Record Video

```bash
# Record test execution
maestro test --record .maestro/01-login-flow.yaml
```

### Interactive Mode

```bash
# Run Maestro Studio for interactive testing
maestro studio
```

### Common Issues

**Test fails to find element:**
- Check element text exactly matches
- Ensure element is visible on screen
- Add `scroll` if element is off-screen
- Use `optional: true` for conditional elements

**App doesn't launch:**
- Ensure iOS Simulator/Android Emulator is running
- Verify `appId` matches your app's bundle identifier
- Rebuild the app with `npx expo prebuild`

**Timeout errors:**
- Add `wait` commands before assertions
- Increase timeout: `idleTimeout: 5000`
- Use `waitForAnimationToEnd`

## Best Practices

1. **Keep tests independent** - Each test should work standalone
2. **Use descriptive names** - Name tests by feature/flow
3. **Add comments** - Explain what each test section does
4. **Test happy paths first** - Cover main user flows
5. **Handle loading states** - Wait for content to appear
6. **Use environment variables** - For credentials and URLs
7. **Keep tests maintainable** - Reuse common flows via `runFlow`

## Maestro Cloud (Optional)

Upload and run tests on real devices:

```bash
# Login to Maestro Cloud
maestro login

# Upload app and run tests
maestro cloud .maestro/
```

## Resources

- [Maestro Documentation](https://maestro.mobile.dev)
- [Maestro CLI Reference](https://maestro.mobile.dev/cli/commands)
- [Best Practices](https://maestro.mobile.dev/best-practices/best-practices)
- [Examples](https://maestro.mobile.dev/examples)

## Contributing

When adding new features:
1. Write E2E test for the new flow
2. Run all tests to ensure no regressions
3. Update this README if needed

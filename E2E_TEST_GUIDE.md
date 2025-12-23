# E2E Testing Quick Start Guide

## Prerequisites

1. **Backend Running**
   ```bash
   # Start with Docker Compose (recommended)
   docker-compose up -d
   
   # Wait for backend to be healthy
   docker-compose ps
   ```

2. **iOS Simulator Open**
   - Open simulator from Xcode or with: `open -a Simulator`

3. **Expo App Running**
   ```bash
   npm start
   # Press 'i' to open in iOS simulator
   ```

## Running Tests

### Smoke Tests (Quick)
```bash
npm run test:e2e:smoke
```

### All Tests
```bash
npm run test:e2e
```

### Watch Mode (Development)
```bash
npm run test:e2e:watch
```

## Troubleshooting

### ❌ "Network request failed" error

**Cause**: App can't reach backend or using cached bundle with old API URL.

**Solution**:
1. Ensure backend is running: `docker ps | grep kraftlog-backend`
2. Reload the app in simulator: Press `Cmd+R` or shake gesture
3. Or restart Expo: Stop and run `npm start` again

### ❌ Tests fail with "App not found"

**Cause**: App not installed or wrong bundle ID.

**Solution**:
1. Ensure Expo app is running in simulator
2. Check bundle ID matches: `org.reactjs.native.example.kraftlog`

### ❌ "Email" or "Welcome" not visible

**Cause**: App might be in wrong state (login/home screen).

**Solution**:
1. The tests handle both states automatically
2. If still failing, manually logout in the app
3. Run tests again

### ✅ Backend Health Check

Test backend manually:
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kraftlog.com","password":"admin123"}'
```

Should return a JSON with token.

## What Gets Tested

### Smoke Tests (`npm run test:e2e:smoke`)
- ✅ App launches successfully
- ✅ Login flow (if on login screen)
- ✅ Tab navigation between Home and Routines
- ✅ Basic UI elements visible

### All Tests (`npm run test:e2e`)
- All smoke tests +
- Routines list and details
- Workout history
- Logout flow
- Sync indicator
- More comprehensive flows

## Best Practices

1. **Always start with backend running**
2. **Let Expo fully load** before running tests
3. **Run smoke tests first** to verify setup
4. **Check logs** if tests fail to see what's happening
5. **Use watch mode** during test development

## Notes

- Tests automatically reset app data before running
- Backend must be accessible at `http://localhost:8080/api`
- Tests use bundle ID: `org.reactjs.native.example.kraftlog`
- Simulator will automatically launch the app

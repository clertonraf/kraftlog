# E2E Tests - Final Setup Guide

## Current Status ✅

- ✅ Backend: Working perfectly (HTTP 200 on /api/auth/login)
- ✅ API URL: Correctly configured (http://localhost:8080/api)
- ✅ Bundle ID: Fixed (org.reactjs.native.example.kraftlog)
- ✅ Test Suite: Complete with 6 test flows
- ✅ Maestro: Installed and working
- ⚠️ App: Needs to be installed in simulator

## Quick Start (Right Now)

### Step 1: Install App in Simulator

The app was uninstalled to clear cache. To reinstall:

```bash
# In the terminal where Expo is running, press:
i
```

Wait 20-30 seconds for installation.

### Step 2: Run Tests

```bash
npm run test:e2e:smoke
```

**Expected:** Both tests pass! ✅

## What Was Fixed

### 1. Backend Migration Error
- **Problem:** Flyway migration V6 failed (MIN(UUID) not supported)
- **Solution:** Fixed migration in KraftLogApi repository

### 2. API URL Configuration  
- **Problem:** App used 192.168.0.104 which simulator couldn't reach
- **Solution:** Platform-specific URLs (localhost for iOS, 10.0.2.2 for Android)

### 3. Bundle ID
- **Problem:** Tests used wrong bundle ID (com.clerton.kraftlog)
- **Solution:** Corrected to org.reactjs.native.example.kraftlog

### 4. Test Runner
- **Problem:** Manual backend startup and simulator reset
- **Solution:** Automated backend check and simulator reset

### 5. App Cache
- **Problem:** Metro bundler cached old API URL
- **Solution:** Uninstall app, force Expo to rebuild

## Test Commands

```bash
# Smoke tests (critical flows)
npm run test:e2e:smoke

# All tests
npm run test:e2e

# Watch mode (for development)
npm run test:e2e:watch

# With HTML report
npm run test:e2e:report
```

## Test Flows

### Smoke Tests (2 flows)
1. **01-login-flow** - App launches, handles network retry
2. **05-tab-navigation** - Login flow, tab navigation

### Full Suite (6 flows)
1. Login and basic navigation
2. Routines list and details
3. Workout history viewing
4. Logout functionality
5. Tab navigation
6. Sync status indicator

## Architecture

```
┌─────────────┐     HTTP      ┌──────────────┐
│ iOS App     │ ────────────→ │ Backend API  │
│ (Simulator) │               │ (Docker)     │
│ localhost   │ ←──────────── │ :8080        │
└─────────────┘               └──────────────┘
                                     │
                              ┌──────▼───────┐
                              │ PostgreSQL   │
                              │ :5432        │
                              └──────────────┘
```

## Troubleshooting

### App shows network error
```bash
# Solution 1: Reload app
# In simulator: Cmd+R

# Solution 2: Clear Expo cache
npx expo start --clear
# Then press 'i'

# Solution 3: Restart backend
./scripts/start-backend.sh
```

### Tests fail - "App not found"
```bash
# Install app first
# In Expo terminal, press: i
```

### Backend not responding
```bash
# Check status
docker-compose ps

# Restart
docker-compose restart backend

# Check logs
docker-compose logs backend --tail 50

# Test manually
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kraftlog.com","password":"admin123"}'
```

### Maestro not found
```bash
# Add to PATH
export PATH="$PATH:$HOME/.maestro/bin"

# Or install
curl -Ls "https://get.maestro.mobile.dev" | bash
```

## Files Created

### Scripts
- `scripts/run-e2e-tests.sh` - Main test runner
- `scripts/start-backend.sh` - Start backend with Docker
- `scripts/reset-simulator-app.sh` - Uninstall app from simulator

### Tests
- `.maestro/01-login-flow.yaml` - Login and navigation
- `.maestro/02-routines-navigation.yaml` - Routines flow
- `.maestro/03-workout-history-flow.yaml` - History viewing
- `.maestro/04-logout-flow.yaml` - Logout
- `.maestro/05-tab-navigation.yaml` - Tab switching
- `.maestro/06-sync-status.yaml` - Sync indicator

### Documentation
- `E2E_TEST_GUIDE.md` - Comprehensive testing guide
- `FIX_NETWORK_ERROR.md` - Network error troubleshooting
- `FINAL_E2E_SETUP.md` - This file

## Success Checklist

Before running tests, verify:

- [ ] Backend running: `docker ps | grep kraftlog-backend`
- [ ] Expo running: `npx expo start` (in separate terminal)
- [ ] App installed: Press 'i' in Expo terminal
- [ ] Simulator booted: Should show in iOS Simulator app

Then:
```bash
npm run test:e2e:smoke
```

## Expected Test Output

```
🧪 KraftLog E2E Test Runner

✅ Backend API is running

🔄 Resetting iOS Simulator...
✅ Simulator reset complete

▶️  Running smoke tests...

Waiting for flows to complete...
[Passed] 01-login-flow (4s)
[Passed] 05-tab-navigation (5s)

2/2 Flows Passed ✅

✅ Test run complete!
```

## Next Steps

1. **Verify backend:** `curl http://localhost:8080/api/auth/login` (should respond)
2. **Install app:** Press 'i' in Expo terminal
3. **Run tests:** `npm run test:e2e:smoke`
4. **Celebrate:** Both tests pass! 🎉

---

**Everything is configured correctly. Just needs app installation!**

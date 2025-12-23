# One Command E2E Testing

## Quick Start

### First Time Setup (One Time Only)

```bash
# Terminal 1: Start Expo
npx expo start

# Wait for it to show "Metro waiting on..."
# Then press 'i' to install in simulator
```

### Run Tests

After the app is installed once, you can run tests anytime with:

```bash
npm test
```

## What `npm test` Does

1. ✅ Checks backend (starts if needed)
2. ✅ Checks Expo (starts in background if needed)
3. ✅ Checks iOS Simulator (boots if needed)
4. ✅ Checks app installation
5. ✅ Runs smoke tests (2 critical flows)

## Recommended Workflow

### Option 1: Keep Expo Running (Recommended)

```bash
# Terminal 1: Start Expo once
npx expo start
# Press 'i' to install app

# Terminal 2: Run tests anytime
npm test
```

This is the most reliable approach. Expo stays running, and you can run tests whenever you want.

### Option 2: Full Automation

```bash
npm test
```

The script will try to:
- Start backend automatically ✅
- Start Expo in background ⚠️ (works, but slower)
- Install app automatically ⚠️ (may need manual 'i' press)
- Run tests ✅

**Note:** The first time, you may still need to manually press 'i' in the Expo terminal to install the app.

## All Available Commands

```bash
# One command (handles everything)
npm test

# Smoke tests only (requires Expo running)
npm run test:e2e:smoke

# All tests (6 flows)
npm run test:e2e

# Watch mode (re-run on changes)
npm run test:e2e:watch

# With HTML report
npm run test:e2e:report
```

## What Gets Tested

### Smoke Tests (`npm test`)
- ✅ App launches successfully  
- ✅ Login flow works
- ✅ Tab navigation works
- ✅ Backend connectivity

### Full Suite (`npm run test:e2e`)
All smoke tests plus:
- ✅ Routines management
- ✅ Workout history
- ✅ Logout functionality
- ✅ Sync status indicators

## Troubleshooting

### Tests fail with "Unable to launch app"

**Solution:** Install the app first

```bash
# If Expo is running, press 'i' in that terminal
# Or start fresh:
npx expo start
# Press 'i'
# Then in another terminal:
npm test
```

### "Backend did not start"

```bash
# Check Docker
docker ps

# Restart backend
docker-compose restart backend

# Wait 30 seconds, then:
npm test
```

### "Expo failed to start"

```bash
# Start Expo manually instead
npx expo start

# In another terminal:
npm run test:e2e:smoke
```

### App shows network error

```bash
# Delete and reinstall app
./scripts/reset-simulator-app.sh

# Then in Expo terminal, press: i
# Then:
npm test
```

## CI/CD Integration

For automated testing in CI:

```yaml
- name: Start Backend
  run: docker-compose up -d

- name: Wait for Backend
  run: sleep 30

- name: Start Expo
  run: npx expo start &

- name: Install App
  run: |
    # Wait for Expo to be ready
    sleep 20
    # Trigger install (this may need custom solution for CI)

- name: Run E2E Tests
  run: npm run test:e2e:smoke
```

## Success Indicators

Before running tests, verify:

```bash
# Backend running
curl http://localhost:8080/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'
# Should get HTTP 400 (this is good - means backend responds)

# Expo running
ps aux | grep "expo start"
# Should show a process

# Simulator booted
xcrun simctl list devices | grep Booted
# Should show your simulator

# App installed
xcrun simctl listapps booted | grep kraftlog
# Should show the app
```

## Expected Output

When everything works:

```
🚀 KraftLog E2E Tests - One Command Runner

1️⃣  Checking backend...
   ✅ Backend responding (HTTP 400)

2️⃣  Checking Expo...
   ✅ Expo is running

3️⃣  Checking iOS Simulator...
   ✅ Simulator already booted

4️⃣  Checking app installation...
   ✅ App is installed

5️⃣  Running E2E smoke tests...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Waiting for flows to complete...
[Passed] 01-login-flow (4s)
[Passed] 05-tab-navigation (5s)

2/2 Flows Passed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ All tests passed!
```

## Best Practice

**For development:**
1. Start Expo once: `npx expo start`
2. Press 'i' to install app (one time)
3. Leave Expo running
4. Run `npm test` whenever you want to test

This gives you the fastest feedback loop! 🚀

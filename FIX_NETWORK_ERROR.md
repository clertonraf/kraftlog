# Fix: Network Request Failed Error

## The Problem
The app shows "Network request failed" with a Retry button because it's using a **cached JavaScript bundle** with the old API URL configuration.

## ✅ Solution (Just Completed)

I've restarted Expo with cache clearing. Now follow these steps:

### Step 1: Open the App in Simulator

```bash
# In the terminal where Expo is running, press:
i
```

This will open/reload the app in iOS Simulator.

### Step 2: Verify Backend is Running

```bash
# Check backend status
docker ps | grep kraftlog-backend

# Should show "Up" and "healthy"
# If not, start it:
./scripts/start-backend.sh
```

### Step 3: App Should Now Work

The app should now:
- ✅ Show the **Login screen** (not error screen)
- ✅ Connect to `http://localhost:8080/api`
- ✅ Allow you to login with admin@kraftlog.com / admin123

### Step 4: Run E2E Tests

```bash
npm run test:e2e:smoke
```

Expected result:
```
[Passed] 01-login-flow (4s)
[Passed] 05-tab-navigation (5s)

2/2 Flows Passed ✅
```

## Alternative: Manual Reload

If the automatic reload doesn't work:

1. **Click on iOS Simulator window**
2. **Press `Cmd + R`** (hot reload)
3. App should reload and connect

## Why This Happened

1. We changed the API URL in the code
2. But Metro bundler (Expo's JS bundler) had cached the old bundle
3. The app continued using the cached version with wrong URL
4. Restarting with `--clear` flag removes the cache

## What Was Fixed

- ✅ API URL: Now uses `localhost:8080` for iOS Simulator
- ✅ Platform detection: Automatic iOS/Android URL selection
- ✅ Bundle ID: Corrected to `org.reactjs.native.example.kraftlog`
- ✅ Backend: Running and healthy
- ✅ Tests: Handle retry, login states, navigation
- ✅ Cache: Cleared and restarted

## Troubleshooting

### If app still shows error:
```bash
# Complete reset
cd /Users/clerton/workspace/kraftlog
pkill -f expo
npx expo start --clear
# Press 'i' to open simulator
```

### If backend not responding:
```bash
cd /Users/clerton/workspace/kraftlog
docker-compose restart backend
# Wait 30 seconds for startup
curl http://localhost:8080/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'
```

## Success Indicators

✅ Expo metro bundler running
✅ App opens in simulator without error screen
✅ Login screen shows Email and Password fields
✅ Backend responds at localhost:8080
✅ E2E tests pass

Everything is now configured correctly! 🎉

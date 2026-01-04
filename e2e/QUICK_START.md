# Quick Start - Playwright E2E Tests

## ⚠️ Known Issue

Due to peer dependency conflicts between Playwright and React 19 in Expo, Playwright cannot be installed in this project's `node_modules`. 

## ✅ **Working Solution: Global Install**

Install Playwright globally once, then run tests:

```bash
# One-time setup (installs Playwright globally)
npm install -g @playwright/test@1.57.0
playwright install chromium

# Then run tests anytime:
cd /Users/clerton/workspace/kraftlog
playwright test e2e/smoke.spec.ts
playwright test                          # All tests
playwright test --headed                 # With visible browser
playwright test --debug                  # Debug mode
playwright show-report                   # View results
```

## 📋 What Gets Tested

- ✅ **Authentication**: Login, register, password reset
- ✅ **Routines**: Create, edit (dates on web), delete, set active
- ✅ **Exercises**: Search, filter, view details, PDF import
- ✅ **Workouts**: Start sessions, log sets, complete, view history
- ✅ **Settings**: Profile, server config, responsive design
- ✅ **Smoke Tests**: Critical user journeys

## 🔧 Prerequisites

**Backend must be running on port 8080:**
```bash
docker-compose up -d
```

**Default test user:**
- Email: `admin@kraftlog.com`
- Password: `admin123`

## 📊 Test Files

- `e2e/smoke.spec.ts` - Critical smoke tests (fastest)
- `e2e/auth.spec.ts` - Authentication flows
- `e2e/routines.spec.ts` - Routine management
- `e2e/exercises.spec.ts` - Exercise features
- `e2e/workouts.spec.ts` - Workout sessions
- `e2e/settings.spec.ts` - Settings & config

## 🐛 Troubleshooting

### Global install not working?
Try with sudo:
```bash
sudo npm install -g @playwright/test@1.57.0
```

### Port 8081 already in use?
```bash
lsof -ti:8081 | xargs kill -9
```

### Change test credentials?
Set environment variables:
```bash
export TEST_USER_EMAIL=your@email.com
export TEST_USER_PASSWORD=yourpassword
playwright test e2e/smoke.spec.ts
```

### Tests can't start web server?
Start it manually first:
```bash
npm run web
# Then in another terminal:
playwright test e2e/smoke.spec.ts
```

## 📝 Future Fix

This issue will be resolved when either:
- Expo/React Native updates to be compatible with Playwright's peer dependencies
- Playwright releases a version compatible with React 19

For now, the global install method works reliably.

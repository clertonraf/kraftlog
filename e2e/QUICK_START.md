# Quick Start - Playwright E2E Tests

## ⚠️ CRITICAL: Fix NODE_ENV First!

**Your shell has `NODE_ENV=production` set, which prevents devDependencies from installing.**

### Permanent Fix (Do This Once):

Edit `~/.zshrc` (or `~/.bashrc` if you use bash):

```bash
# Remove or comment out any line that sets NODE_ENV=production
# export NODE_ENV=production  # ❌ Remove this!

# Add this instead:
unset NODE_ENV  # ✅ For local development
```

Then reload: `source ~/.zshrc`

## ✅ Setup (One-Time)

### 1. Install Playwright Globally
```bash
npm install -g @playwright/test@1.57.0
playwright install chromium
```

### 2. Install Project Dependencies
```bash
# Make sure NODE_ENV is NOT set to production
echo $NODE_ENV  # Should be empty or 'development'

# If it says 'production', unset it:
unset NODE_ENV

# Then install
npm install
```

## 🚀 Run Tests

**IMPORTANT:** Always use `npx playwright` (not just `playwright`) to use the local version:

```bash
# Make sure backend is running
docker-compose up -d

# Run smoke tests (uses local Playwright)
npx playwright test e2e/smoke.spec.ts

# Run all tests
npx playwright test

# Run with visible browser
npx playwright test --headed

# Run specific test
npx playwright test e2e/auth.spec.ts

# Debug mode
npx playwright test --debug

# View report
npx playwright show-report
```

## 📋 Test Coverage

- ✅ **Authentication**: Login, register, password reset
- ✅ **Routines**: Create, edit (dates on web), delete, set active
- ✅ **Exercises**: Search, filter, view details, PDF import
- ✅ **Workouts**: Start sessions, log sets, complete, view history
- ✅ **Settings**: Profile, server config, responsive design
- ✅ **Smoke Tests**: Critical user journeys

## 🐛 Troubleshooting

### "No tests found" or "test.describe() not expected"
This means you're using the global Playwright instead of local. Use `npx`:
```bash
npx playwright test e2e/smoke.spec.ts  # ✅ Correct
playwright test e2e/smoke.spec.ts      # ❌ Wrong
```

### "TypeError: Cannot read property..." or dependencies not installed
Check NODE_ENV:
```bash
echo $NODE_ENV
```

If it says "production":
```bash
unset NODE_ENV
npm install
```

### Tests timeout looking for elements
The web app may be loading slowly or UI selectors don't match. Check:
```bash
# Look at screenshots in test-results/
ls test-results/*/test-failed-*.png

# Run with headed mode to see what's happening
npx playwright test --headed --debug
```

### Port 8081 already in use
```bash
lsof -ti:8081 | xargs kill -9
```

## 📝 Test Files

- `e2e/smoke.spec.ts` - Critical smoke tests
- `e2e/auth.spec.ts` - Authentication flows
- `e2e/routines.spec.ts` - Routine management
- `e2e/exercises.spec.ts` - Exercise features
- `e2e/workouts.spec.ts` - Workout sessions
- `e2e/settings.spec.ts` - Settings & config

## 🎯 Why Use `npx playwright` Instead of Just `playwright`?

- `npx playwright` → Uses the **local** version from `node_modules/@playwright/test`
- `playwright` → Uses the **global** version from `~/.nvm/versions/node/...`

The test files import from the local version, so the CLI must also use the local version to avoid conflicts.

## ✅ Verification

After setup, verify everything works:

```bash
# 1. Check NODE_ENV
echo $NODE_ENV  # Should be empty or 'development'

# 2. Check Playwright is installed locally
ls node_modules/@playwright/test/index.js

# 3. Run a simple test
npx playwright test e2e/smoke.spec.ts --grep "page load"
```

See `DEPENDENCY_FIX_SUMMARY.md` for more details about the NODE_ENV issue.

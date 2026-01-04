# Quick Start - Playwright E2E Tests

## ⚠️ Important: NODE_ENV Issue

**The dependency issue was caused by `NODE_ENV=production` in your shell environment.**

This setting prevents npm from installing devDependencies (TypeScript, @types/react, etc.).

### Fix for Your Shell

Add this to your `~/.zshrc` or `~/.bashrc`:

```bash
# Only set NODE_ENV=production for deployment, not for development
# unset NODE_ENV  # or set NODE_ENV=development
```

Then reload your shell: `source ~/.zshrc`

## ✅ Setup (One-Time)

### 1. Install Playwright Globally
```bash
npm install -g @playwright/test@1.57.0
playwright install chromium
```

### 2. Run Setup Script
```bash
./scripts/setup-e2e.sh
```

This will:
- Install all dependencies (with devDependencies)
- Create Playwright symlink
- Verify TypeScript and @types/react are installed

## 🚀 Run Tests

```bash
# Make sure backend is running
docker-compose up -d

# Run smoke tests (fastest, 2-3 minutes)
playwright test e2e/smoke.spec.ts

# Run all tests (~5-10 minutes)
playwright test

# Run with visible browser
playwright test --headed

# Run specific test file
playwright test e2e/auth.spec.ts

# Debug mode
playwright test --debug

# View report
playwright show-report
```

## 📋 Test Coverage

- ✅ **Authentication**: Login, register, password reset
- ✅ **Routines**: Create, edit (dates on web), delete, set active
- ✅ **Exercises**: Search, filter, view details, PDF import
- ✅ **Workouts**: Start sessions, log sets, complete, view history
- ✅ **Settings**: Profile, server config, responsive design
- ✅ **Smoke Tests**: Critical user journeys

## 🐛 Troubleshooting

### "Cannot find module '@playwright/test'"
Re-run the setup script:
```bash
./scripts/setup-e2e.sh
```

### "TypeScript not installed" or "Cannot start web server"
Check if NODE_ENV is set:
```bash
echo $NODE_ENV
```

If it says "production", unset it:
```bash
unset NODE_ENV
npm install
```

### Port 8081 already in use
```bash
lsof -ti:8081 | xargs kill -9
```

### Web server won't start
Make sure you're not in production mode:
```bash
unset NODE_ENV
npm run web
```

## 📝 Test Files

- `e2e/smoke.spec.ts` - Critical smoke tests (fastest)
- `e2e/auth.spec.ts` - Authentication flows
- `e2e/routines.spec.ts` - Routine management
- `e2e/exercises.spec.ts` - Exercise features
- `e2e/workouts.spec.ts` - Workout sessions
- `e2e/settings.spec.ts` - Settings & config

## 🎯 CI/CD

Tests run automatically on GitHub Actions (NODE_ENV is not set to production in CI).

# Quick Start - Playwright E2E Tests

## ✅ Setup (One-Time)

### 1. Install Playwright Globally
```bash
npm install -g @playwright/test@1.57.0
playwright install chromium
```

### 2. Create Symlink
```bash
cd /Users/clerton/workspace/kraftlog
mkdir -p node_modules/@playwright
ln -sf ~/.nvm/versions/node/v25.1.0/lib/node_modules/@playwright/test node_modules/@playwright/test
```

### 3. Ensure Dependencies
```bash
npm install
```

## 🚀 Run Tests

```bash
# Make sure backend is running
docker-compose up -d

# Run smoke tests (fastest, 2-3 minutes)
playwright test e2e/smoke.spec.ts

# Run all tests
playwright test

# Run with visible browser
playwright test --headed

# Debug mode
playwright test --debug

# View report
playwright show-report
```

## 📋 Test Coverage

- ✅ Authentication (login, register, password reset)
- ✅ Routines (CRUD + web date editing) 
- ✅ Exercises (search, filter, PDF import)
- ✅ Workouts (sessions, logging, history)
- ✅ Settings (profile, config, responsive)
- ✅ Smoke tests (critical flows)

## 🐛 Troubleshooting

### "Cannot find module '@playwright/test'"
Re-create the symlink:
```bash
mkdir -p node_modules/@playwright
ln -sf ~/.nvm/versions/node/v25.1.0/lib/node_modules/@playwright/test node_modules/@playwright/test
```

### "Cannot navigate to invalid URL"
Web server isn't running. Start manually:
```bash
npm run web
# Then in another terminal:
playwright test --no-server
```

### Port 8081 in use
```bash
lsof -ti:8081 | xargs kill -9
```

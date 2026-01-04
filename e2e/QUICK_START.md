# Quick Start - Playwright E2E Tests

## ⚠️ Installation Note

Due to peer dependency conflicts with React 19, Playwright cannot be installed automatically.

## 🚀 Two Ways to Run Tests

### Option 1: Direct npx (Recommended)

Run tests directly with npx (will download Playwright on first run):

```bash
# When prompted "Need to install... Ok to proceed? (y)", type 'y'

# Run smoke tests (fast)
npx playwright@1.57.0 test e2e/smoke.spec.ts

# Run all tests  
npx playwright@1.57.0 test

# Run with browser visible
npx playwright@1.57.0 test --headed

# Debug mode
npx playwright@1.57.0 test --debug
```

### Option 2: Install browsers once, then use npx

```bash
# First time - install browsers (one-time, 2-3 minutes)
npx playwright@1.57.0 install chromium

# Then run tests
npx playwright@1.57.0 test e2e/smoke.spec.ts
```

## 📋 What Gets Tested

- ✅ **Authentication**: Login, register, password reset
- ✅ **Routines**: Create, edit (including dates on web), set active
- ✅ **Exercises**: Search, filter, view details
- ✅ **Workouts**: Start, log sets, complete, view history
- ✅ **Settings**: Profile, server config, logout
- ✅ **Responsive**: Mobile, tablet, desktop viewports
- ✅ **Error Handling**: Network failures, validation

## 🔧 Prerequisites

- **Backend must be running** on `http://localhost:8080`
- **Test user**: `admin@kraftlog.com` / `admin123` (default)

Start backend:
```bash
docker-compose up -d
```

## 🐛 Troubleshooting

### Tests fail to start web server?
Make sure port 8081 is free:
```bash
lsof -ti:8081 | xargs kill -9
```

### Change test credentials?
Set environment variables:
```bash
export TEST_USER_EMAIL=your@email.com
export TEST_USER_PASSWORD=yourpassword
npx playwright@1.57.0 test e2e/smoke.spec.ts
```

### View test results?
```bash
npx playwright@1.57.0 show-report
```

## 📊 CI/CD

Tests run automatically on GitHub Actions for every push and PR.

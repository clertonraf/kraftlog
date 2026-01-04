# Quick Start - Playwright E2E Tests

## ✅ Ready to Run!

The E2E tests use `npx` which will automatically download Playwright on first run.

## 🚀 Run Tests

```bash
# Run all E2E tests (takes 5-10 minutes)
npm run test:e2e:web

# Run smoke tests only (fast, 2-3 minutes)
npm run test:e2e:web:smoke

# Run with browser visible (see what's happening)
npm run test:e2e:web:headed

# Debug a specific test
npm run test:e2e:web:debug

# View test report after running
npm run test:e2e:web:report
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
- **Web app will auto-start** on `http://localhost:8081`
- **Test user**: `admin@kraftlog.com` / `admin123` (default)

## 🐛 Troubleshooting

### Backend not running?
```bash
docker-compose up -d
```

### Change test credentials?
Set environment variables:
```bash
export TEST_USER_EMAIL=your@email.com
export TEST_USER_PASSWORD=yourpassword
npm run test:e2e:web:smoke
```

### Playwright needs installation?
First run will auto-download (may take 2-3 minutes).

## 📊 CI/CD

Tests run automatically on GitHub Actions for:
- Every push to `main` or `develop`
- Every pull request

View results in GitHub Actions tab.

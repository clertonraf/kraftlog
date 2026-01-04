# E2E Tests with Playwright

Comprehensive end-to-end tests for the KraftLog web application using Playwright.

## 📋 Test Coverage

### Authentication (`auth.spec.ts`)
- ✅ Login with valid/invalid credentials
- ✅ User registration
- ✅ Password reset flow
- ✅ Email validation
- ✅ Navigation to register/forgot password pages

### Routines Management (`routines.spec.ts`)
- ✅ Create new routine
- ✅ Edit routine name and dates (web-specific date inputs)
- ✅ Set routine as active
- ✅ View routine workouts
- ✅ View routine calendar/history
- ✅ Navigate to create workout from routine
- ✅ Form validation (name required, date range)

### Exercises (`exercises.spec.ts`)
- ✅ Display exercises list
- ✅ Search exercises
- ✅ Filter by muscle group
- ✅ View exercise details
- ✅ Watch exercise videos
- ✅ Import exercises from PDF

### Workouts (`workouts.spec.ts`)
- ✅ Start workout from routine
- ✅ Log exercise sets (reps, weight)
- ✅ Complete workout
- ✅ Cancel workout
- ✅ View previous workout data
- ✅ View workout history
- ✅ Filter history by date
- ✅ View completed workout details

### Settings (`settings.spec.ts`)
- ✅ Update user profile
- ✅ Change password
- ✅ Logout
- ✅ Display app version
- ✅ Server configuration (web-specific)
- ✅ Update server URL
- ✅ Responsive design (mobile, tablet, desktop)

### Smoke Tests (`smoke.spec.ts`)
- ✅ Complete user journey (login → create routine → create workout → logout)
- ✅ Main navigation functionality
- ✅ Data persistence across navigation
- ✅ Error handling and graceful degradation
- ✅ Authentication persistence
- ✅ Page load performance
- ✅ Navigation responsiveness

## 🚀 Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

### Run All Tests
```bash
npm run test:e2e:web
```

### Run Smoke Tests (Fast)
```bash
npm run test:e2e:web:smoke
```

### Run with UI (Headed Mode)
```bash
npm run test:e2e:web:headed
```

### Debug Tests
```bash
npm run test:e2e:web:debug
```

### View Test Report
```bash
npm run test:e2e:web:report
```

### Run Specific Test File
```bash
npx playwright test auth.spec.ts
```

### Run Tests in Specific Browser
```bash
npx playwright test --project=chromium
```

## 🔧 Configuration

### Environment Variables

Create a `.env.test` file:

```bash
# Test user credentials
TEST_USER_EMAIL=admin@kraftlog.com
TEST_USER_PASSWORD=admin123

# API base URL (optional)
E2E_BASE_URL=http://localhost:8081

# Backend API URL
EXPO_PUBLIC_API_URL=http://localhost:8080
```

### Playwright Config

Configuration is in `playwright.config.ts`:
- Test directory: `./e2e`
- Base URL: `http://localhost:8081`
- Retries: 2 on CI, 0 locally
- Screenshots: On failure
- Videos: On first retry
- Traces: On first retry

## 📁 Test Structure

```
e2e/
├── fixtures/
│   └── testData.ts           # Common test data and helpers
├── pages/
│   ├── LoginPage.ts          # Page Object Model for login
│   ├── RoutinesPage.ts       # Page Object Model for routines
│   └── ExercisesPage.ts      # Page Object Model for exercises
├── auth.spec.ts              # Authentication tests
├── routines.spec.ts          # Routine management tests
├── exercises.spec.ts         # Exercise management tests
├── workouts.spec.ts          # Workout session tests
├── settings.spec.ts          # Settings and configuration tests
└── smoke.spec.ts             # Critical smoke tests
```

## 📝 Writing New Tests

### Using Page Object Models

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test('my test', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password');
  await loginPage.waitForNavigation();
  
  // Your test logic here
});
```

### Using Test Data

```typescript
import { TEST_USERS, generateTestData } from './fixtures/testData';

test('create routine', async ({ page }) => {
  const testData = generateTestData('MyTest');
  // Use testData.routine, testData.workout, etc.
});
```

## 🐛 Debugging

### Debug Single Test
```bash
npx playwright test --debug auth.spec.ts
```

### View Test Traces
```bash
npx playwright show-trace trace.zip
```

### Screenshot on Failure
Screenshots are automatically captured on test failure in `test-results/`

### Video Recording
Videos are recorded on first retry in `test-results/`

## 📊 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
      
      - name: Run E2E tests
        run: npm run test:e2e:web
        env:
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## 🎯 Best Practices

1. **Use Page Object Models** - Keep locators and actions in page classes
2. **Use Test Data Fixtures** - Centralize test data in fixtures
3. **Write Atomic Tests** - Each test should be independent
4. **Use Meaningful Names** - Test names should describe what they test
5. **Handle Timing** - Use `waitFor` methods, avoid `waitForTimeout`
6. **Clean Up** - Tests should clean up data they create (when possible)
7. **Test User Journeys** - Smoke tests should cover complete flows
8. **Check Responsiveness** - Test on multiple viewport sizes

## 🔄 Maintenance

### Updating Tests After UI Changes

1. Update locators in Page Object Models
2. Run tests to identify failures
3. Update assertions if behavior changed intentionally
4. Add new tests for new features

### Handling Flaky Tests

1. Use proper waits (`waitForSelector`, `waitForLoadState`)
2. Increase timeouts for slow operations
3. Add retries in CI configuration
4. Use test fixtures for consistent state

## 📖 Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

## Installation

Playwright requires --legacy-peer-deps flag:

```bash
npm install --legacy-peer-deps
npx playwright install chromium
```

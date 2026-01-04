import { expect, test } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('Authentication Flow', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should load login page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/KraftLog|Login/i);
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page: _page }) => {
    await loginPage.login('invalid@example.com', 'wrongpassword');

    // Wait for error message
    await expect(loginPage.errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Use environment variables or default test credentials
    const email = process.env.TEST_USER_EMAIL || 'admin@kraftlog.com';
    const password = process.env.TEST_USER_PASSWORD || 'admin123';

    await loginPage.login(email, password);
    await loginPage.waitForNavigation();

    // Should redirect to main app (routines or explore tab)
    await expect(page).toHaveURL(/\/(tabs|routines|explore)/);
  });

  test('should navigate to register page', async ({ page }) => {
    await loginPage.registerLink.click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await loginPage.forgotPasswordLink.click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test('should validate email format', async ({ page: _page }) => {
    await loginPage.emailInput.fill('invalid-email');
    await loginPage.passwordInput.fill('password123');
    await loginPage.loginButton.click();

    // Check for HTML5 validation or error message
    const isInvalid = await loginPage.emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    expect(isInvalid).toBeTruthy();
  });
});

test.describe('Registration Flow', () => {
  test('should register new user', async ({ page }) => {
    await page.goto('/register');

    const timestamp = Date.now();
    const testEmail = `test${timestamp}@kraftlog.com`;

    await page.getByPlaceholder(/email/i).fill(testEmail);
    await page.getByPlaceholder(/^password$/i).fill('Test123456!');
    await page.getByPlaceholder(/confirm.*password/i).fill('Test123456!');
    await page.getByPlaceholder(/name/i).fill('Test User');

    await page.getByRole('button', { name: /register|sign up/i }).click();

    // Should redirect to login or main app
    await expect(page).toHaveURL(/\/(login|tabs)/);
  });

  test('should show error when passwords do not match', async ({ page }) => {
    await page.goto('/register');

    await page.getByPlaceholder(/email/i).fill('test@example.com');
    await page.getByPlaceholder(/^password$/i).fill('Password123');
    await page.getByPlaceholder(/confirm.*password/i).fill('Different123');

    await page.getByRole('button', { name: /register/i }).click();

    await expect(page.getByText(/password.*match/i)).toBeVisible();
  });
});

test.describe('Password Reset Flow', () => {
  test('should request password reset', async ({ page }) => {
    await page.goto('/forgot-password');

    await page.getByPlaceholder(/email/i).fill('test@kraftlog.com');
    await page.getByRole('button', { name: /reset|send/i }).click();

    // Should show success message
    await expect(page.getByText(/sent|email|check/i)).toBeVisible({ timeout: 5000 });
  });
});

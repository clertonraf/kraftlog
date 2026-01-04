import { expect, test } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('Authentication Flow', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should load login page successfully', async ({ page }) => {
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/KraftLog/i)).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await loginPage.login('invalid@example.com', 'wrongpassword');

    // Wait a moment for login attempt
    await page.waitForTimeout(3000);

    // Should still be on login page (not redirected to tabs)
    await expect(page).toHaveURL(/\/login/);

    // Login button should be enabled again (loading finished)
    await expect(loginPage.loginButton).toBeEnabled();
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

    await page.getByPlaceholder(/first.*name/i).fill('Test');
    await page.getByPlaceholder(/last.*name/i).fill('User');
    await page.getByPlaceholder(/email.*\*/i).fill(testEmail);
    await page.getByPlaceholder(/password.*\*/i).fill('Test123456!');

    await page.getByRole('button', { name: /sign up/i }).click();

    // Should redirect to tabs after successful registration
    await page.waitForURL(/\/(tabs)/, { timeout: 15000 });
  });

  test('should show error when required fields are missing', async ({ page }) => {
    await page.goto('/register');

    // Try to register without filling fields
    await page.getByRole('button', { name: /sign up/i }).click();

    // Should still be on register page
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/register/);

    // Button should be enabled again (loading finished)
    await expect(page.getByRole('button', { name: /sign up/i })).toBeEnabled();
  });
});

test.describe('Password Reset Flow', () => {
  test('should request password reset', async ({ page }) => {
    await page.goto('/forgot-password');

    await page.getByPlaceholder(/email/i).fill('test@kraftlog.com');
    await page.getByRole('button', { name: /reset|send/i }).click();

    // Wait for the request to complete
    await page.waitForTimeout(3000);

    // Should still be on forgot password page or navigate back to login
    // (implementation sends alert and navigates back)
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(forgot-password|login)/);
  });
});

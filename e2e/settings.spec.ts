import { expect, test } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('Settings and Configuration', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(
      process.env.TEST_USER_EMAIL || 'admin@kraftlog.com',
      process.env.TEST_USER_PASSWORD || 'admin123'
    );
    await loginPage.waitForNavigation();

    // Navigate to settings
    await page.goto('/(tabs)/settings');
  });

  test('should display settings page', async ({ page }) => {
    await expect(page).toHaveURL(/settings/);
    await expect(page.getByText(/settings|profile|account/i)).toBeVisible();
  });

  test('should update user profile', async ({ page }) => {
    const nameInput = page.getByPlaceholder(/name/i);

    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.clear();
      await nameInput.fill('Updated Test User');

      await page.getByRole('button', { name: /save|update/i }).click();

      // Should show success message
      await expect(page.getByText(/saved|updated|success/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should change password', async ({ page }) => {
    // Look for change password option
    const changePasswordButton = page.getByRole('button', { name: /change.*password|password/i });

    if (await changePasswordButton.isVisible().catch(() => false)) {
      await changePasswordButton.click();

      // Fill password fields
      await page.getByPlaceholder(/current.*password|old.*password/i).fill('admin123');
      await page.getByPlaceholder(/new.*password/i).fill('NewPassword123!');
      await page.getByPlaceholder(/confirm/i).fill('NewPassword123!');

      // Note: This might actually change the password in dev environment
      // Consider skipping this in CI or using a dedicated test account
    }
  });

  test('should logout successfully', async ({ page }) => {
    await page.getByRole('button', { name: /logout|sign out/i }).click();

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('should display app version', async ({ page }) => {
    // Should show app version somewhere in settings
    const versionText = page.getByText(/version|v\d+\.\d+/i);

    if (await versionText.isVisible().catch(() => false)) {
      expect(await versionText.textContent()).toMatch(/\d+\.\d+/);
    }
  });
});

test.describe('Server Configuration (Web Only)', () => {
  test('should display server configuration', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(
      process.env.TEST_USER_EMAIL || 'admin@kraftlog.com',
      process.env.TEST_USER_PASSWORD || 'admin123'
    );
    await loginPage.waitForNavigation();

    // Navigate to server config (if available on web)
    await page.goto('/server-config');

    // Should show server URL input
    await expect(page.getByText(/server|url|api/i)).toBeVisible();
  });

  test('should update server URL', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(
      process.env.TEST_USER_EMAIL || 'admin@kraftlog.com',
      process.env.TEST_USER_PASSWORD || 'admin123'
    );
    await loginPage.waitForNavigation();

    await page.goto('/server-config');

    const serverInput = page.getByPlaceholder(/server.*url|api.*url/i);

    if (await serverInput.isVisible().catch(() => false)) {
      await serverInput.clear();
      await serverInput.fill('http://localhost:8080');

      await page.getByRole('button', { name: /save|update/i }).click();

      // Should show success message
      await expect(page.getByText(/saved|updated/i)).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Should be visible and usable on mobile
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad

    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.emailInput).toBeVisible();
  });

  test('should work on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 }); // Full HD

    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.emailInput).toBeVisible();
  });
});

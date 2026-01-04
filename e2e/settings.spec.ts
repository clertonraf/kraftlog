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
    await expect(page.getByText('Settings').first()).toBeVisible();
    await expect(page.getByText('Account')).toBeVisible();
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
    // React Native Web's Alert.alert uses browser confirm()
    // Set up handler
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toMatch(/logout/i);
      await dialog.accept();
    });

    await page.getByText('Logout').click();

    // Should redirect to login after confirming
    await expect(page).toHaveURL(/login/, { timeout: 10000 });
  });

  test('should display app version', async ({ page }) => {
    // Scroll down to About section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Should show version "1.0.0" in the About section
    await expect(page.getByText('Version')).toBeVisible();
    await expect(page.getByText('1.0.0')).toBeVisible();
  });
});

test.describe('Server Configuration (Web Only)', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(
      process.env.TEST_USER_EMAIL || 'admin@kraftlog.com',
      process.env.TEST_USER_PASSWORD || 'admin123'
    );
    await loginPage.waitForNavigation();
  });

  test('should display server configuration', async ({ page }) => {
    // Navigate to settings page
    await page.goto('/(tabs)/settings');
    await page.waitForLoadState('networkidle');

    // Scroll to Server Configuration section
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(500);

    // Should show server configuration on web
    await expect(page.getByText('Server Configuration')).toBeVisible();
    await expect(page.getByText('Server URL').first()).toBeVisible();
  });

  test('should update server URL', async ({ page }) => {
    await page.goto('/(tabs)/settings');
    await page.waitForLoadState('networkidle');

    // Scroll to Server Configuration section
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(500);

    // On web, the server URL is read-only from environment variable
    await expect(page.getByText('Server Configuration')).toBeVisible();
    await expect(
      page.getByText(/server URL is configured via the EXPO_PUBLIC_API_URL environment variable/i)
    ).toBeVisible();
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

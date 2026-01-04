import { expect, test } from '@playwright/test';
import { TEST_USERS } from './fixtures/testData';
import { LoginPage } from './pages/LoginPage';

/**
 * Smoke tests - Critical user journeys that must always work
 * These tests should be fast and cover the most important functionality
 */

test.describe('Smoke Tests - Critical Flows', () => {
  // Clear storage before each test to ensure clean state
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
    await context.clearPermissions();
  });

  test('complete user journey: login → create routine → create workout → logout', async ({
    page,
  }) => {
    // 1. Login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.admin.email, TEST_USERS.admin.password);
    await loginPage.waitForNavigation();

    await expect(page).toHaveURL(/\/(tabs|routines|explore)/);

    // 2. Navigate to routines
    await page.goto('/(tabs)/routines');
    await expect(page).toHaveURL(/routines/);

    // 3. Create a new routine
    const routineName = `Smoke Test ${Date.now()}`;
    await page
      .getByRole('button', { name: /create|new/i })
      .first()
      .click();
    await page.getByPlaceholder(/routine.*name/i).fill(routineName);
    await page.locator('input[type="date"]').first().fill('2024-01-01');
    await page.locator('input[type="date"]').last().fill('2024-12-31');
    await page.getByRole('button', { name: /save/i }).click();

    // Verify routine was created
    await expect(page).toHaveURL(/routines/);
    await expect(page.getByText(routineName)).toBeVisible({ timeout: 10000 });

    // 4. Open the routine
    await page.getByText(routineName).click();
    await expect(page).toHaveURL(/routine/);

    // 5. Create a workout
    const workoutName = `Smoke Workout ${Date.now()}`;
    const createWorkoutBtn = page.getByRole('button', { name: /create.*workout|add.*workout/i });

    if (await createWorkoutBtn.isVisible().catch(() => false)) {
      await createWorkoutBtn.click();
      await page.getByPlaceholder(/workout.*name/i).fill(workoutName);
      await page.getByRole('button', { name: /save|create/i }).click();

      // Verify workout was created
      await expect(page.getByText(workoutName)).toBeVisible({ timeout: 10000 });
    }

    // 6. Navigate to exercises
    await page.goto('/(tabs)/explore');
    await expect(page).toHaveURL(/explore/);
    await expect(page.getByText(/exercise|explore/i)).toBeVisible();

    // 7. Logout
    await page.goto('/(tabs)/settings');
    const logoutBtn = page.getByRole('button', { name: /logout|sign out/i });

    if (await logoutBtn.isVisible().catch(() => false)) {
      await logoutBtn.click();
      await expect(page).toHaveURL(/login/);
    }
  });

  test('app loads and main navigation works', async ({ page }) => {
    // Login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.admin.email, TEST_USERS.admin.password);
    await loginPage.waitForNavigation();

    // Test all main navigation tabs
    const tabs = [
      { name: 'routines', url: /routines/ },
      { name: 'explore', url: /explore/ },
      { name: 'history', url: /history/ },
    ];

    for (const tab of tabs) {
      await page.goto(`/(tabs)/${tab.name}`);
      await expect(page).toHaveURL(tab.url);
      await expect(page).not.toHaveURL(/login/); // Should still be logged in
    }
  });

  test('data persists across navigation', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.admin.email, TEST_USERS.admin.password);
    await loginPage.waitForNavigation();

    // Create a routine
    await page.goto('/(tabs)/routines');
    const routineName = `Persist Test ${Date.now()}`;
    await page
      .getByRole('button', { name: /create|new/i })
      .first()
      .click();
    await page.getByPlaceholder(/routine.*name/i).fill(routineName);
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByText(routineName)).toBeVisible();

    // Navigate away and back
    await page.goto('/(tabs)/explore');
    await page.goto('/(tabs)/routines');

    // Routine should still be there
    await expect(page.getByText(routineName)).toBeVisible();
  });

  test('error handling - network failure graceful degradation', async ({ page }) => {
    // Login first
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.admin.email, TEST_USERS.admin.password);
    await loginPage.waitForNavigation();

    // Simulate network failure
    await page.route('**/api/**', (route) => route.abort());

    // Try to create a routine (should fail gracefully)
    await page.goto('/(tabs)/routines');
    await page
      .getByRole('button', { name: /create|new/i })
      .first()
      .click();
    await page.getByPlaceholder(/routine.*name/i).fill('Test Routine');
    await page.getByRole('button', { name: /save/i }).click();

    // Should show error message, not crash
    await expect(page.getByText(/error|failed|network/i)).toBeVisible({ timeout: 10000 });

    // Unblock requests
    await page.unroute('**/api/**');
  });

  test('authentication persistence', async ({ page }) => {
    // Login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.admin.email, TEST_USERS.admin.password);
    await loginPage.waitForNavigation();

    // Reload the page
    await page.reload();

    // Should still be logged in (not redirect to login)
    await expect(page).not.toHaveURL(/login/);
  });
});

test.describe('Performance Smoke Tests', () => {
  test('page load time is acceptable', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - startTime;

    // Page should load in less than 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('navigation is responsive', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.admin.email, TEST_USERS.admin.password);
    await loginPage.waitForNavigation();

    const startTime = Date.now();

    // Navigate between tabs
    await page.goto('/(tabs)/routines');
    await page.waitForLoadState('domcontentloaded');
    await page.goto('/(tabs)/explore');
    await page.waitForLoadState('domcontentloaded');

    const navigationTime = Date.now() - startTime;

    // Navigation should be fast (less than 3 seconds)
    expect(navigationTime).toBeLessThan(3000);
  });
});

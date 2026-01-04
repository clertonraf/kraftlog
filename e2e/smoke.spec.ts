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

    // 2. Navigate to routines using tab navigation (no page reload)
    const routinesTab = page
      .getByRole('link', { name: /routines/i })
      .or(page.getByText(/routines/i).first());
    await routinesTab.click();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/routines/);

    // 3. Create a new routine
    const routineName = `Smoke Test ${Date.now()}`;

    // Click FAB and wait for navigation to /routine/create
    const createFab = page
      .getByTestId('create-routine-fab')
      .or(page.getByRole('button', { name: /create.*routine/i }))
      .or(page.locator('[style*="fab"]').getByLabel(/add|create/i));
    await createFab.click({ timeout: 15000 });

    // Wait for navigation to create page
    await page.waitForURL(/routine\/create/, { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Fill form
    const nameInput = page.getByTestId('routine-name-input');
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await nameInput.fill(routineName);

    // Fill dates using ISO format for web inputs
    const today = new Date();
    const endDateVal = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await page.locator('input[type="date"]').first().fill(today.toISOString().split('T')[0]);
    await page.locator('input[type="date"]').last().fill(endDateVal.toISOString().split('T')[0]);

    const saveButton = page.getByTestId('save-routine-button');
    await saveButton.click();

    // Verify routine was created
    await page.waitForURL(/routines/, { timeout: 10000 });
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

    // 6. Navigate to exercises using tab navigation
    const exercisesTab = page
      .getByRole('link', { name: /exercises|explore/i })
      .or(page.getByText(/exercises|explore/i).first());
    await exercisesTab.click();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/explore/);
    await expect(page.getByText(/exercise|explore/i)).toBeVisible();

    // 7. Navigate to settings and logout
    const settingsTab = page
      .getByRole('link', { name: /settings/i })
      .or(page.getByText(/settings/i).first());
    await settingsTab.click();
    await page.waitForTimeout(1000);
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

    await expect(page).toHaveURL(/\/(tabs|routines|explore)/);

    // Test all main navigation tabs using client-side navigation (click tabs)
    const tabs = [
      { name: 'Routines', url: /routines/ },
      { name: 'Exercises', url: /explore/ },
      { name: 'Settings', url: /settings/ },
    ];

    for (const tab of tabs) {
      // Find and click the tab link (not button)
      const tabLink = page
        .getByRole('link', { name: new RegExp(tab.name, 'i') })
        .or(page.getByText(new RegExp(tab.name, 'i')).first());

      await tabLink.click();
      await page.waitForTimeout(1000);

      await expect(page).toHaveURL(tab.url);
      await expect(page).not.toHaveURL(/login/); // Should still be logged in

      // Small delay between navigation
      await page.waitForTimeout(500);
    }
  });

  test('data persists across navigation', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.admin.email, TEST_USERS.admin.password);
    await loginPage.waitForNavigation();

    // Create a routine using tab navigation
    const routinesTab = page
      .getByRole('link', { name: /routines/i })
      .or(page.getByText(/routines/i).first());
    await routinesTab.click();
    await page.waitForTimeout(1000);

    const routineName = `Persist Test ${Date.now()}`;
    const createFab = page
      .getByTestId('create-routine-fab')
      .or(page.getByRole('button', { name: /create.*routine/i }))
      .or(page.locator('[style*="fab"]').getByLabel(/add|create/i));
    await createFab.click({ timeout: 15000 });

    // Wait for navigation to create page
    await page.waitForURL(/routine\/create/, { timeout: 10000 });
    await page.waitForTimeout(1000);

    const nameInput = page.getByTestId('routine-name-input');
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await nameInput.fill(routineName);

    const saveButton = page.getByTestId('save-routine-button');
    await saveButton.click();

    await page.waitForURL(/routines/, { timeout: 10000 });
    await expect(page.getByText(routineName)).toBeVisible({ timeout: 10000 });

    // Navigate away and back using tabs
    const exercisesTab = page
      .getByRole('link', { name: /exercises|explore/i })
      .or(page.getByText(/exercises|explore/i).first());
    await exercisesTab.click();
    await page.waitForTimeout(1000);

    await routinesTab.click();
    await page.waitForTimeout(1000);

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

    // Navigate to routines using tab
    const routinesTab = page
      .getByRole('link', { name: /routines/i })
      .or(page.getByText(/routines/i).first());
    await routinesTab.click();
    await page.waitForTimeout(1000);

    // Try to create a routine (should fail gracefully)
    const createFab = page
      .getByTestId('create-routine-fab')
      .or(page.getByRole('button', { name: /create.*routine/i }))
      .or(page.locator('[style*="fab"]').getByLabel(/add|create/i));
    await createFab.click({ timeout: 15000 });

    // Wait for navigation to create page
    await page.waitForURL(/routine\/create/, { timeout: 10000 });
    await page.waitForTimeout(1000);

    const nameInput = page.getByTestId('routine-name-input');
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await nameInput.fill('Test Routine');

    const saveButton = page.getByTestId('save-routine-button');
    await saveButton.click();

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
    await page.waitForTimeout(2000); // Wait for auth re-initialization

    // Should still be logged in (not redirect to login)
    await expect(page).not.toHaveURL(/login/, { timeout: 10000 });
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

    // Navigate between tabs using tab navigation (not page reloads)
    const routinesTab = page
      .getByRole('link', { name: /routines/i })
      .or(page.getByText(/routines/i).first());
    await routinesTab.click();
    await page.waitForTimeout(500);

    const exercisesTab = page
      .getByRole('link', { name: /exercises|explore/i })
      .or(page.getByText(/exercises|explore/i).first());
    await exercisesTab.click();
    await page.waitForTimeout(500);

    const navigationTime = Date.now() - startTime;

    // Navigation should be fast (less than 3 seconds)
    expect(navigationTime).toBeLessThan(3000);
  });
});

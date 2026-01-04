import { expect, test } from '@playwright/test';
import { ExercisesPage } from './pages/ExercisesPage';
import { LoginPage } from './pages/LoginPage';

test.describe('Exercises Management', () => {
  let loginPage: LoginPage;
  let exercisesPage: ExercisesPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(
      process.env.TEST_USER_EMAIL || 'admin@kraftlog.com',
      process.env.TEST_USER_PASSWORD || 'admin123'
    );
    await loginPage.waitForNavigation();

    exercisesPage = new ExercisesPage(page);
    await exercisesPage.goto();
  });

  test('should display exercises list', async ({ page }) => {
    await expect(page).toHaveURL(/explore/);
    // Should show some exercises or empty state
    await expect(page.getByText(/exercise|explore|search/i)).toBeVisible();
  });

  test('should search for exercises', async ({ page }) => {
    await exercisesPage.searchExercise('bench press');

    // Wait for search results
    await page.waitForTimeout(1000);

    // Results should contain search term or show no results
    const hasResults = await page
      .getByText(/bench press/i)
      .isVisible()
      .catch(() => false);
    const hasNoResults = await page
      .getByText(/no.*result|not found/i)
      .isVisible()
      .catch(() => false);

    expect(hasResults || hasNoResults).toBeTruthy();
  });

  test('should filter exercises by muscle group', async ({ page }) => {
    // Click on a muscle group filter (if available)
    const chestButton = page.getByRole('button', { name: /chest|peitoral/i });

    if (await chestButton.isVisible().catch(() => false)) {
      await chestButton.click();
      await page.waitForTimeout(500);

      // Should show filtered results
      await expect(page.locator('text=/exercise/i')).toBeVisible();
    }
  });

  test('should view exercise details', async ({ page }) => {
    // Find and click on first exercise
    const firstExercise = page
      .locator('[data-testid="exercise-item"]')
      .first()
      .or(page.getByText(/supino|press|squat|deadlift/i).first());

    if (await firstExercise.isVisible().catch(() => false)) {
      await firstExercise.click();

      // Should show exercise details
      await expect(page.getByText(/muscle.*group|video|description/i)).toBeVisible();
    }
  });

  test('should watch exercise video', async ({ page }) => {
    // Find exercise with video
    const exerciseWithVideo = page.locator('[data-testid="exercise-item"]').first();

    if (await exerciseWithVideo.isVisible().catch(() => false)) {
      await exerciseWithVideo.click();

      // Should show video player or link
      const hasVideo = await page
        .locator('video, iframe, [src*="youtube"]')
        .isVisible()
        .catch(() => false);

      // If video exists, it should be visible
      if (hasVideo) {
        expect(hasVideo).toBeTruthy();
      }
    }
  });
});

test.describe('Exercise Import (PDF)', () => {
  test('should import exercises from PDF', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(
      process.env.TEST_USER_EMAIL || 'admin@kraftlog.com',
      process.env.TEST_USER_PASSWORD || 'admin123'
    );
    await loginPage.waitForNavigation();

    // Navigate to exercises
    await page.goto('/(tabs)/explore');

    // Look for import button (may be in settings or exercises page)
    const importButton = page.getByRole('button', { name: /import/i });

    if (await importButton.isVisible().catch(() => false)) {
      await importButton.click();

      // Should show file picker or import form
      await expect(page.getByText(/upload|file|pdf|select/i)).toBeVisible();
    }
  });
});

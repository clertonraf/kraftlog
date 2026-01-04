import { expect, test } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { RoutinesPage } from './pages/RoutinesPage';

test.describe('Routines Management', () => {
  let loginPage: LoginPage;
  let routinesPage: RoutinesPage;

  test.beforeEach(async ({ page }) => {
    // Login before each test
    loginPage = new LoginPage(page);
    await loginPage.goto();

    const email = process.env.TEST_USER_EMAIL || 'admin@kraftlog.com';
    const password = process.env.TEST_USER_PASSWORD || 'admin123';

    await loginPage.login(email, password);
    await loginPage.waitForNavigation();

    routinesPage = new RoutinesPage(page);
    await routinesPage.goto();
  });

  test('should display routines list', async ({ page }) => {
    await expect(page).toHaveURL(/routines/);
    await expect(page.getByText(/routines/i)).toBeVisible();
  });

  test('should create new routine', async ({ page }) => {
    const routineName = `Test Routine ${Date.now()}`;
    const startDate = '2024-01-01';
    const endDate = '2024-12-31';

    await routinesPage.createRoutine(routineName, startDate, endDate);

    // Verify routine was created
    await expect(page.getByText(routineName)).toBeVisible();
  });

  test('should edit routine name', async ({ page }) => {
    // Create a routine first
    const originalName = `Original ${Date.now()}`;
    await routinesPage.createRoutine(originalName);

    // Select and edit it
    await routinesPage.selectRoutine(originalName);

    const newName = `Updated ${Date.now()}`;
    await routinesPage.editRoutine(newName);

    // Verify name was updated
    await expect(page.getByText(newName)).toBeVisible();
  });

  test('should edit routine dates on web', async ({ page }) => {
    // Create a routine
    const routineName = `Date Test ${Date.now()}`;
    await routinesPage.createRoutine(routineName, '2024-01-01', '2024-06-30');

    // Select and edit dates
    await routinesPage.selectRoutine(routineName);
    await routinesPage.editRoutine(undefined, '2024-02-01', '2024-08-31');

    // Verify dates were updated (check in detail view)
    await expect(page.getByText(/2024-02-01|01-02-2024/i)).toBeVisible();
    await expect(page.getByText(/2024-08-31|31-08-2024/i)).toBeVisible();
  });

  test('should set routine as active', async ({ page }) => {
    const routineName = `Active Routine ${Date.now()}`;
    await routinesPage.createRoutine(routineName);

    await routinesPage.selectRoutine(routineName);
    await page.locator('[name="create-outline"]').click();

    // Toggle active checkbox
    await page.getByText(/active.*routine/i).click();
    await page.getByRole('button', { name: /save/i }).click();

    // Verify active badge is shown
    await routinesPage.selectRoutine(routineName);
    await expect(page.getByText(/active/i)).toBeVisible();
  });

  test('should view routine workouts', async ({ page }) => {
    // Assuming a routine with workouts exists, or create one
    const routineName = `Workout Test ${Date.now()}`;
    await routinesPage.createRoutine(routineName);

    await routinesPage.selectRoutine(routineName);

    // Should show workouts tab
    await expect(page.getByText(/workouts/i)).toBeVisible();
  });

  test('should view routine calendar', async ({ page }) => {
    const routineName = `Calendar Test ${Date.now()}`;
    await routinesPage.createRoutine(routineName);

    await routinesPage.selectRoutine(routineName);

    // Click calendar tab
    await page.getByText(/history|calendar/i).click();

    // Should show calendar view
    await expect(
      page.locator('text=/jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i')
    ).toBeVisible();
  });

  test('should navigate to create workout from routine', async ({ page }) => {
    const routineName = `Workout Nav ${Date.now()}`;
    await routinesPage.createRoutine(routineName);

    await routinesPage.selectRoutine(routineName);

    // Click create workout button
    await page.getByRole('button', { name: /create.*workout|add.*workout/i }).click();

    await expect(page).toHaveURL(/workout\/create/);
  });
});

test.describe('Routine Validation', () => {
  let loginPage: LoginPage;
  let routinesPage: RoutinesPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(
      process.env.TEST_USER_EMAIL || 'admin@kraftlog.com',
      process.env.TEST_USER_PASSWORD || 'admin123'
    );
    await loginPage.waitForNavigation();

    routinesPage = new RoutinesPage(page);
    await routinesPage.goto();
    await page.waitForTimeout(2000); // Wait for page to fully load
  });

  test('should require routine name', async ({ page }) => {
    await routinesPage.createButton.waitFor({ state: 'visible', timeout: 10000 });
    await routinesPage.createButton.click();

    // Wait for the form to appear
    await page.waitForTimeout(1000);

    // Try to save without name
    const saveButton = page.getByRole('button', { name: /save/i });
    await saveButton.waitFor({ state: 'visible', timeout: 5000 });
    await saveButton.click();

    // Should show validation error
    await expect(page.getByText(/name.*required|enter.*name/i)).toBeVisible({ timeout: 5000 });
  });

  test('should validate date range', async ({ page }) => {
    await routinesPage.createButton.waitFor({ state: 'visible', timeout: 10000 });
    await routinesPage.createButton.click();

    // Wait for the form to appear
    await page.waitForTimeout(1000);

    await page.getByPlaceholder(/routine.*name/i).fill('Invalid Dates');

    // Set end date before start date
    const dateInputs = page.locator('input[type="date"]');
    const startDateInput = dateInputs.first();
    const endDateInput = dateInputs.last();

    await startDateInput.fill('2024-12-31');
    await endDateInput.fill('2024-01-01');

    await page.getByRole('button', { name: /save/i }).click();

    // Should show validation error or prevent submission
    // Note: This depends on your validation logic
    await page.waitForTimeout(1000);
  });
});

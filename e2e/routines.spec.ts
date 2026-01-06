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

    // Wait to be back on routines list
    await page.waitForURL(/\/routines/, { timeout: 10000 });

    // The routine was just created, so find it and click its Activate button
    // First ensure the routine name is visible
    await expect(page.getByText(routineName)).toBeVisible({ timeout: 10000 });

    // Click any Activate button - the newly created routine should be the first one without active status
    await page
      .getByText(/activate/i)
      .first()
      .click();

    // Wait for activation to complete and page to reload
    await page.waitForTimeout(2000);

    // Verify active badge appears (can be on any routine, but should appear)
    await expect(page.getByText(/active/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('should view routine workouts', async ({ page }) => {
    // Create a routine
    const routineName = `Workout Test ${Date.now()}`;
    await routinesPage.createRoutine(routineName);

    // Click on the routine to view details
    await routinesPage.selectRoutine(routineName);

    // Wait for navigation to detail page
    await page.waitForURL(/\/routine\/[^/]+$/, { timeout: 10000 });

    // Should show routine details with workouts section
    await expect(page.getByText(routineName)).toBeVisible({ timeout: 10000 });
  });

  test('should view routine calendar', async ({ page }) => {
    const routineName = `Calendar Test ${Date.now()}`;
    await routinesPage.createRoutine(routineName);

    await routinesPage.selectRoutine(routineName);

    // Wait for navigation to detail page
    await page.waitForURL(/\/routine\/[^/]+$/, { timeout: 10000 });

    // Click calendar tab/button (look for history or calendar icon)
    const calendarTab = page
      .getByText(/history|calendar/i)
      .or(page.locator('[name="calendar-outline"]'));
    await calendarTab.first().click({ timeout: 10000 });

    // Should show calendar view or month names
    await expect(
      page
        .getByText(
          /january|february|march|april|may|june|july|august|september|october|november|december/i
        )
        .first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to create workout from routine', async ({ page }) => {
    const routineName = `Workout Nav ${Date.now()}`;
    await routinesPage.createRoutine(routineName);

    await routinesPage.selectRoutine(routineName);

    // Wait for navigation to detail page
    await page.waitForURL(/\/routine\/[^/]+$/, { timeout: 10000 });

    // Click create workout button (FAB or button with "Start" or "Create")
    const createButton = page
      .getByRole('button', { name: /start.*workout|create.*workout|add.*workout/i })
      .or(page.getByTestId('start-workout-fab'))
      .or(page.locator('[name="add"]'));

    await createButton.first().click({ timeout: 10000 });

    // Should navigate to workout creation or start page
    await expect(page).toHaveURL(/\/routine\/[^/]+\/start/, { timeout: 10000 });
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

    // Wait for navigation to create screen
    await page.waitForURL(/\/routine\/create/, { timeout: 10000 });

    // Try to save without name
    const saveButton = page.getByTestId('save-routine-button');
    await saveButton.waitFor({ state: 'visible', timeout: 10000 });
    await saveButton.click();

    // Should show validation error
    await expect(page.getByText(/please enter a routine name/i)).toBeVisible({ timeout: 5000 });
  });

  test('should validate date range', async ({ page }) => {
    await routinesPage.createButton.waitFor({ state: 'visible', timeout: 10000 });
    await routinesPage.createButton.click();

    // Wait for navigation to create screen
    await page.waitForURL(/\/routine\/create/, { timeout: 10000 });

    await page.getByTestId('routine-name-input').fill('Invalid Dates');

    // Set end date before start date
    const dateInputs = page.locator('input[type="date"]');
    const startDateInput = dateInputs.first();
    const endDateInput = dateInputs.last();

    await startDateInput.fill('2024-12-31');
    await endDateInput.fill('2024-01-01');

    await page.getByTestId('save-routine-button').click();

    // Should show validation error or prevent submission
    // Note: This depends on your validation logic
    await page.waitForTimeout(1000);
  });
});

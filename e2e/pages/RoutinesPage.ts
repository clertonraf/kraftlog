import type { Locator, Page } from '@playwright/test';

export class RoutinesPage {
  readonly page: Page;
  readonly createButton: Locator;
  readonly routinesList: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use testID which is more reliable
    this.createButton = page.getByTestId('create-routine-fab');
    this.routinesList = page
      .locator('[data-testid="routines-list"]')
      .or(page.locator('text=/routine/i').first());
    this.searchInput = page.getByPlaceholder(/search/i);
  }

  async goto() {
    await this.page.goto('/(tabs)/routines');
  }

  async createRoutine(name: string, startDate?: string, endDate?: string) {
    await this.createButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.createButton.click();

    // Wait for navigation to /routine/create
    await this.page.waitForURL(/\/routine\/create/, { timeout: 10000 });

    const nameInput = this.page.getByTestId('routine-name-input');
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await nameInput.fill(name);

    if (startDate) {
      const startInput = this.page.locator('input[type="date"]').first();
      await startInput.fill(startDate);
    }

    if (endDate) {
      const endInput = this.page.locator('input[type="date"]').last();
      await endInput.fill(endDate);
    }

    const saveButton = this.page.getByTestId('save-routine-button');
    await saveButton.waitFor({ state: 'visible', timeout: 10000 });
    await saveButton.click();

    // Wait for the alert and dismiss it
    this.page.once('dialog', (dialog) => dialog.accept());

    await this.page.waitForURL(/\/routines/, { timeout: 15000 });
  }

  async selectRoutine(name: string) {
    await this.page.getByText(name).click();
  }

  async editRoutine(newName?: string, newStartDate?: string, newEndDate?: string) {
    // Click edit button (pencil icon)
    await this.page
      .locator('[name="create-outline"]')
      .or(this.page.getByRole('button', { name: /edit/i }))
      .click();

    // Wait for navigation to edit screen
    await this.page.waitForURL(/\/routine\/create/, { timeout: 10000 });

    if (newName) {
      const nameInput = this.page.getByTestId('routine-name-input');
      await nameInput.clear();
      await nameInput.fill(newName);
    }

    if (newStartDate) {
      const startInput = this.page.locator('input[type="date"]').first();
      await startInput.fill(newStartDate);
    }

    if (newEndDate) {
      const endInput = this.page.locator('input[type="date"]').last();
      await endInput.fill(newEndDate);
    }

    // Wait for the alert and dismiss it
    this.page.once('dialog', (dialog) => dialog.accept());

    await this.page.getByTestId('save-routine-button').click();
    await this.page.waitForURL(/\/routines/, { timeout: 15000 });
  }

  async deleteRoutine(name: string) {
    await this.selectRoutine(name);
    await this.page.getByRole('button', { name: /delete/i }).click();
    // Confirm deletion
    await this.page.getByRole('button', { name: /confirm|yes|delete/i }).click();
  }
}

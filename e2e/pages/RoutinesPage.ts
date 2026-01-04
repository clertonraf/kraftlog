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

    // Wait for the form to load
    await this.page.waitForTimeout(1000);

    const nameInput = this.page.getByPlaceholder(/routine.*name/i);
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill(name);

    if (startDate) {
      const startInput = this.page.locator('input[type="date"]').first();
      await startInput.fill(startDate);
    }

    if (endDate) {
      const endInput = this.page.locator('input[type="date"]').last();
      await endInput.fill(endDate);
    }

    const saveButton = this.page.getByRole('button', { name: /save/i });
    await saveButton.waitFor({ state: 'visible', timeout: 5000 });
    await saveButton.click();
    await this.page.waitForURL(/\/(tabs)\/routines/, { timeout: 15000 });
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

    if (newName) {
      const nameInput = this.page.getByPlaceholder(/routine.*name/i);
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

    await this.page.getByRole('button', { name: /save/i }).click();
  }

  async deleteRoutine(name: string) {
    await this.selectRoutine(name);
    await this.page.getByRole('button', { name: /delete/i }).click();
    // Confirm deletion
    await this.page.getByRole('button', { name: /confirm|yes|delete/i }).click();
  }
}

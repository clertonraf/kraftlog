import type { Locator, Page } from '@playwright/test';

export class ExercisesPage {
  readonly page: Page;
  readonly createButton: Locator;
  readonly importButton: Locator;
  readonly exercisesList: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.getByRole('button', { name: /create|new.*exercise/i });
    this.importButton = page.getByRole('button', { name: /import/i });
    this.exercisesList = page.locator('[data-testid="exercises-list"]');
    this.searchInput = page.getByPlaceholder(/search/i);
  }

  async goto() {
    await this.page.goto('/(tabs)/explore');
  }

  async createExercise(name: string, muscleGroup?: string, videoUrl?: string) {
    await this.createButton.click();
    await this.page.getByPlaceholder(/exercise.*name/i).fill(name);

    if (muscleGroup) {
      await this.page.getByLabel(/muscle.*group/i).selectOption(muscleGroup);
    }

    if (videoUrl) {
      await this.page.getByPlaceholder(/video.*url|youtube/i).fill(videoUrl);
    }

    await this.page.getByRole('button', { name: /save|create/i }).click();
  }

  async searchExercise(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Wait for debounce
  }

  async filterByMuscleGroup(group: string) {
    await this.page.getByRole('button', { name: new RegExp(group, 'i') }).click();
  }

  async selectExercise(name: string) {
    await this.page.getByText(name).click();
  }
}

import type { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly registerLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByPlaceholder('Email');
    this.passwordInput = page.getByPlaceholder('Password');
    this.loginButton = page.getByRole('button', { name: /login|sign in/i });
    this.registerLink = page.getByText(/don't have.*account|register|sign up/i);
    this.forgotPasswordLink = page.getByText(/forgot.*password/i);
    this.errorMessage = page.getByText(/error|invalid|failed/i);
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async waitForNavigation() {
    await this.page.waitForURL(/\/(tabs|routines|explore)/, { timeout: 10000 });
  }
}

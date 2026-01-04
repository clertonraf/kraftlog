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
    this.loginButton = page.getByTestId('login-button');
    this.registerLink = page.getByText(/don't have.*account|register|sign up/i);
    this.forgotPasswordLink = page.getByTestId('forgot-password-link');
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
    // Wait for navigation away from login page
    // Sometimes it goes to / and then redirects, sometimes directly to /(tabs)
    await this.page.waitForTimeout(2000); // Give time for navigation to start
    
    // Wait until we're not on login page anymore
    const maxWait = 15000;
    const start = Date.now();
    
    while (Date.now() - start < maxWait) {
      const url = this.page.url();
      if (!url.includes('/login')) {
        // Successfully navigated away
        // Wait a bit more for content to load
        await this.page.waitForTimeout(1000);
        return;
      }
      await this.page.waitForTimeout(500);
    }
    
    throw new Error('Timeout waiting for navigation away from login page');
  }
}

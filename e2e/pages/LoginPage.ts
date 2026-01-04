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
    // After login, wait for navigation away from login page
    await this.page.waitForURL((url) => !url.pathname.includes('/login'), {
      timeout: 15000,
    });
    
    // Wait for the app to fully load (tabs or main content)
    // Check for common elements that appear after successful login
    try {
      // Wait for either bottom tabs or main navigation to appear
      await this.page.waitForSelector('[role="navigation"], [data-testid="bottom-tabs"]', {
        timeout: 10000,
      });
    } catch {
      // If tabs don't appear, just wait for network to be idle
      await this.page.waitForLoadState('networkidle', { timeout: 5000 });
    }
  }
}

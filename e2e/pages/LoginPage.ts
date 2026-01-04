import { expect, type Locator, type Page } from '@playwright/test';

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
    // Fill email with retries (sometimes inputs clear themselves on web)
    await this.emailInput.click();
    await this.emailInput.fill(email);
    await this.page.waitForTimeout(300); // Let React process the change

    // Verify email was filled
    const emailValue = await this.emailInput.inputValue();
    if (emailValue !== email) {
      console.warn('Email input cleared, retrying...');
      await this.emailInput.fill(email);
      await this.page.waitForTimeout(300);
    }

    // Fill password
    await this.passwordInput.click();
    await this.passwordInput.fill(password);
    await this.page.waitForTimeout(300);

    // Verify both fields are filled before clicking
    await expect(this.emailInput).toHaveValue(email);
    await expect(this.passwordInput).toHaveValue(password);

    // Click login button
    await this.loginButton.click();
  }

  async waitForNavigation() {
    // Wait for login to complete and navigation to happen
    // The app goes through: login page → loading screen → (tabs)

    // Step 1: Wait for the loading screen to appear (indicates login succeeded)
    try {
      await this.page.waitForSelector('[data-testid="loading-screen"]', {
        timeout: 5000,
        state: 'visible',
      });
    } catch {
      // Loading screen might be too fast to catch, that's OK
    }

    // Step 2: Wait for loading screen to disappear (navigation complete)
    await this.page
      .waitForSelector('[data-testid="loading-screen"]', {
        timeout: 15000,
        state: 'hidden',
      })
      .catch(() => {
        // If loading screen wasn't visible, just wait for URL change
      });

    // Step 3: Verify we're not on login page anymore
    await this.page.waitForFunction(() => !window.location.pathname.includes('/login'), {
      timeout: 5000,
    });

    // Step 4: Wait for final destination (tabs or root that will redirect)
    // Sometimes it goes to / first, then redirects to /(tabs)
    await this.page.waitForTimeout(2000);

    // Step 5: If still at root, wait a bit more for redirect
    const url = this.page.url();
    if (url.endsWith('/') || url.includes('localhost:8081/')) {
      await this.page.waitForTimeout(2000);
    }
  }
}

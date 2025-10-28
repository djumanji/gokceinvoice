import type { Page, Locator } from '@playwright/test';

export class LoginPage {
  // Locators - defined once, used many times
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly registerLink: Locator;
  private readonly themeToggle: Locator;
  private readonly googleLoginButton: Locator;
  private readonly githubLoginButton: Locator;

  constructor(public readonly page: Page) {
    // Use role-based locators for resilience
    this.emailInput = this.page.getByRole('textbox', { name: /email/i });
    this.passwordInput = this.page.getByRole('textbox', { name: /password/i });
    this.loginButton = this.page.getByRole('button', { name: 'Login' });
    this.registerLink = this.page.getByRole('link', { name: 'Register' });
    this.themeToggle = this.page.getByRole('button', { name: 'Toggle theme' });
    this.googleLoginButton = this.page.getByRole('button', { name: 'Continue with Google' });
    this.githubLoginButton = this.page.getByRole('button', { name: 'Continue with GitHub' });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async navigateToRegister() {
    await this.registerLink.click();
  }

  async toggleTheme() {
    await this.themeToggle.click();
  }

  async isFormVisible() {
    return await this.emailInput.isVisible();
  }
}



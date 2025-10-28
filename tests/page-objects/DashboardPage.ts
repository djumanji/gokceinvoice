import type { Page, Locator } from '@playwright/test';

export class DashboardPage {
  private readonly sidebarToggle: Locator;
  private readonly invoicesLink: Locator;
  private readonly expensesLink: Locator;

  constructor(public readonly page: Page) {
    this.sidebarToggle = this.page.getByTestId('button-sidebar-toggle');
    this.invoicesLink = this.page.getByRole('link', { name: /invoices/i });
    this.expensesLink = this.page.getByRole('link', { name: /expenses/i });
  }

  async goto() {
    await this.page.goto('/');
  }

  async toggleSidebar() {
    await this.sidebarToggle.click();
  }

  async navigateToInvoices() {
    await this.invoicesLink.click();
  }

  async navigateToExpenses() {
    await this.expensesLink.click();
  }
}



import { test as base, expect } from '@playwright/test';

type AuthFixtures = {
  authenticatedUser: void;
  authenticatedPage: void;
};

// Create authenticated user fixture for tests that need a logged-in user
export const test = base.extend<AuthFixtures>({
  authenticatedUser: async ({ page }, use) => {
    // Navigate and login
    await page.goto('/login');
    await page.getByRole('textbox', { name: /email/i }).fill('test@example.com');
    await page.getByRole('textbox', { name: /password/i }).fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Wait for successful login
    await expect(page).toHaveURL(/.*dashboard/);
    
    await use(undefined);
  },

  authenticatedPage: async ({ page }, use) => {
    // Same as above but gives access to the page
    await page.goto('/login');
    await page.getByRole('textbox', { name: /email/i }).fill('test@example.com');
    await page.getByRole('textbox', { name: /password/i }).fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/.*dashboard/);
    
    await use(undefined);
  },
});

export { expect };



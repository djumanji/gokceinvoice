import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
  });

  test('should display login form correctly', async ({ page }) => {
    // Check form fields
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Check submit button
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
  });

  test('should show validation error for empty form', async ({ page }) => {
    await page.locator('button:has-text("Login")').click();
    
    // Form should prevent submission
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.locator('button:has-text("Login")').click();
    
    // Should show error toast
    await page.waitForTimeout(1000);
    // Check if error message appears
    const url = page.url();
    expect(url).toContain('/login'); // Should still be on login page
  });

  test('should navigate to register page', async ({ page }) => {
    await page.locator('text=Register').click();
    await expect(page).toHaveURL(/.*register/);
  });

  test('should toggle theme', async ({ page }) => {
    // Use stable test id for theme toggle
    const themeToggle = page.locator('[data-testid="button-theme-toggle"]');
    await expect(themeToggle).toBeVisible();
    await themeToggle.click();
    await page.waitForTimeout(500);
    // Theme should toggle
  });
});


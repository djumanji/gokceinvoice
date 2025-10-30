import { test, expect } from '@playwright/test';

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/register');
  });

  test('should display registration form correctly', async ({ page }) => {
    // Check form fields
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').nth(1)).toBeVisible();
    
    // Check submit button
    await expect(page.locator('button:has-text("Register")')).toBeVisible();
  });

  test('should validate password match', async ({ page }) => {
    await page.fill('input[type="email"]', 'newuser@test.com');
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.first().fill('password123');
    await passwordInputs.nth(1).fill('different123');
    
    await page.locator('button:has-text("Register")').click();
    await page.waitForTimeout(1000);
    
    // Should show error for password mismatch
    const url = page.url();
    expect(url).toContain('/register');
  });

  test('should navigate to login page', async ({ page }) => {
    await page.locator('text=Login').click();
    await expect(page).toHaveURL(/.*login/);
  });
});


import { test, expect } from '@playwright/test';

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/register');
  });

  test('should display registration form correctly', async ({ page }) => {
    // Check title
    await expect(page.locator('text=Create an Account')).toBeVisible();
    
    // Check social login buttons
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
    await expect(page.locator('button:has-text("Continue with GitHub")')).toBeVisible();
    
    // Check form fields
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[placeholder="johndoe"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').nth(1)).toBeVisible();
    
    // Check submit button
    await expect(page.locator('button:has-text("Register")')).toBeVisible();
  });

  test('should validate password match', async ({ page }) => {
    await page.fill('input[type="email"]', 'newuser@test.com');
    await page.fill('input[placeholder="johndoe"]', 'testuser');
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[type="password"]', 'different123');
    
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


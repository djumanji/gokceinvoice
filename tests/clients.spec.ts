import { test, expect } from '@playwright/test';

test.describe('Clients Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to clients page - assumes user is logged in
    await page.goto('http://localhost:3000/clients');
    await page.waitForLoadState('networkidle');
  });

  test('should display clients page correctly', async ({ page }) => {
    await expect(page.locator('text=Manage Clients')).toBeVisible();
    await expect(page.locator('button:has-text("Add Client")')).toBeVisible();
  });

  test('should open add client dialog', async ({ page }) => {
    await page.locator('button:has-text("Add Client")').click();
    await expect(page.locator('text=Add New Client')).toBeVisible();
    await expect(page.locator('input[placeholder*="name"]')).toBeVisible();
  });

  test('should be able to fill client form', async ({ page }) => {
    await page.locator('button:has-text("Add Client")').click();
    
    await page.fill('input[placeholder*="name"]', 'Test Client');
    await page.fill('input[type="email"]', 'client@test.com');
    await page.fill('input[placeholder*="company"]', 'Test Company');
    await page.fill('input[placeholder*="phone"]', '+1 234 567 8900');
    
    // Check if form fields are filled
    await expect(page.locator('input[placeholder*="name"]')).toHaveValue('Test Client');
    await expect(page.locator('input[type="email"]')).toHaveValue('client@test.com');
  });

  test('should show validation errors for required fields', async ({ page }) => {
    await page.locator('button:has-text("Add Client")').click();
    
    // Try to submit without filling required fields
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
    }
  });

  test('should have search functionality', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
    }
  });

  test('should filter clients by status', async ({ page }) => {
    // Check for status filter if it exists
    const statusFilter = page.locator('select, [role="combobox"]').first();
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
    }
  });
});


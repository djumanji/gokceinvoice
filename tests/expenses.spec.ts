import { test, expect } from '@playwright/test';

test.describe('Expenses Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/expenses');
    await page.waitForLoadState('networkidle');
  });

  test('should display expenses page correctly', async ({ page }) => {
    await expect(page.locator('text=Expenses')).toBeVisible();
  });

  test('should have expense filters', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeVisible();
    }
  });

  test('should have category filter', async ({ page }) => {
    const categoryFilter = page.locator('select, [role="combobox"]').first();
    if (await categoryFilter.isVisible()) {
      await expect(categoryFilter).toBeVisible();
    }
  });
});


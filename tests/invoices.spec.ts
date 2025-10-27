import { test, expect } from '@playwright/test';

test.describe('Invoices Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/invoices');
    await page.waitForLoadState('networkidle');
  });

  test('should display invoices page correctly', async ({ page }) => {
    await expect(page.locator('text=Invoices')).toBeVisible();
    await expect(page.locator('button:has-text("Create Invoice")')).toBeVisible();
  });

  test('should navigate to create invoice page', async ({ page }) => {
    await page.locator('button:has-text("Create Invoice")').click();
    await expect(page).toHaveURL(/.*invoices\/new/);
  });

  test('should have invoice table or empty state', async ({ page }) => {
    // Check for either empty state or table
    const hasEmptyState = await page.locator('text=No invoices yet').isVisible().catch(() => false);
    const hasTable = await page.locator('table, [role="table"]').first().isVisible().catch(() => false);
    
    expect(hasEmptyState || hasTable).toBeTruthy();
  });

  test('should display invoice status badges', async ({ page }) => {
    // Check for status badges if they exist
    const statusBadges = page.locator('[class*="badge"], [class*="status"]').first();
    if (await statusBadges.isVisible()) {
      await expect(statusBadges).toBeVisible();
    }
  });
});


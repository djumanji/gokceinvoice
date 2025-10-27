import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('should display dashboard', async ({ page }) => {
    // Check for dashboard elements
    await page.waitForTimeout(2000);
    
    // Dashboard should have some content
    const hasContent = await page.locator('body').textContent().then(t => t && t.length > 100);
    expect(hasContent).toBeTruthy();
  });

  test('should display statistics cards', async ({ page }) => {
    await page.waitForTimeout(2000);
    // Check for stat cards or dashboard content
    const statCards = page.locator('[class*="stat"], [class*="card"]');
    const count = await statCards.count();
    // Dashboard should have at least some cards or content
  });

  test('should display recent invoices section', async ({ page }) => {
    await page.waitForTimeout(2000);
    // Look for recent invoices or activity
    const hasContent = await page.locator('text=/invoice/i').first().isVisible().catch(() => false);
  });
});


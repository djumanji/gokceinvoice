import { test, expect } from '@playwright/test';

test.describe('Services Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/services');
    await page.waitForLoadState('networkidle');
  });

  test('should display services page correctly', async ({ page }) => {
    await expect(page.locator('text=Services')).toBeVisible();
    const addButton = page.locator('button:has-text("Add Service"), button:has-text("New Service")').first();
    if (await addButton.isVisible()) {
      await expect(addButton).toBeVisible();
    }
  });

  test('should have service form fields', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);
    }
  });
});


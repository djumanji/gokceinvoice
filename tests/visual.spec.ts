import { test, expect } from '@playwright/test';

test.describe('Visual snapshots', () => {
  test('marketing home', async ({ page }) => {
    await page.goto('/');
    // wait for primary hero content to render
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('marketing-home.png', { fullPage: true });
  });

  test('dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('dashboard.png', { fullPage: true });
  });
});



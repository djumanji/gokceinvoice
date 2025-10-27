import { test, expect } from '@playwright/test';

test.describe('Lottie Background Tests', () => {
  test('should display Lottie animation on login page', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Wait for Lottie to load
    await page.waitForTimeout(2000);
    
    // Check if Lottie container exists
    const lottieContainer = page.locator('.absolute.inset-0.z-0');
    await expect(lottieContainer).toBeVisible();
    
    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/login-lottie.png', fullPage: true });
  });

  test('should display Lottie animation on register page', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    
    // Wait for Lottie to load
    await page.waitForTimeout(2000);
    
    // Check if Lottie container exists
    const lottieContainer = page.locator('.absolute.inset-0.z-0');
    await expect(lottieContainer).toBeVisible();
    
    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/register-lottie.png', fullPage: true });
  });

  test('should fill screen properly on login page', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);
    
    // Check container fills the screen
    const container = page.locator('.absolute.inset-0.z-0');
    const box = await container.boundingBox();
    
    if (box) {
      expect(box.width).toBeGreaterThan(1000);
      expect(box.height).toBeGreaterThan(600);
    }
  });

  test('should fill screen properly on mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);
    
    const container = page.locator('.absolute.inset-0.z-0');
    const box = await container.boundingBox();
    
    if (box) {
      expect(box.width).toBeGreaterThan(300);
      expect(box.height).toBeGreaterThan(500);
    }
  });
});


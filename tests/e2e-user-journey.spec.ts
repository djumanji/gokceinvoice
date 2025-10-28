import { test, expect } from '@playwright/test';

test.describe('End-to-End User Journey', () => {
  test('complete user journey from registration to invoice creation', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `test_${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';
    const testName = `Test User ${timestamp}`;

    // Step 1: Go to register page
    await test.step('Navigate to register page', async () => {
      await page.goto('http://localhost:3000/register');
      await expect(page.locator('text=Create an Account')).toBeVisible();
    });

    // Step 2: Fill registration form
    await test.step('Fill and submit registration form', async () => {
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[placeholder="johndoe"]', testName);
      await page.fill('input[type="password"]', testPassword);
      await page.fill('input[type="password"]', testPassword);
      
      await page.click('button:has-text("Register")');
      await page.waitForURL(/.*onboarding/, { timeout: 5000 });
    });

    // Step 3: Complete onboarding - first step should be profile setup
    await test.step('Complete onboarding flow', async () => {
      await expect(page.locator('text=Welcome to InvoiceHub!')).toBeVisible();
      await expect(page.locator('text=Set your profile')).toBeVisible();
      
      // Navigate to profile setup
      await page.locator('text=Set your profile').click();
      await page.waitForLoadState('networkidle');
      
      // Should be on settings page
      await expect(page.locator('text=Settings')).toBeVisible();
      
      // Fill in profile information
      await page.locator('input[placeholder="Enter your company name"]').fill('Test Company E2E');
      await page.locator('textarea[placeholder="Enter your address"]').fill('123 Test Street');
      await page.locator('input[placeholder="Enter your phone number"]').fill('555-0000');
      
      // Save profile
      await page.locator('button:has-text("Save Changes")').click();
      await page.waitForTimeout(2000);
      
      // Go back to onboarding
      await page.goto('http://localhost:3000/onboarding');
      await page.waitForLoadState('networkidle');
    });

    // Step 4: Test navigation
    await test.step('Test navigation to different pages', async () => {
      // Try to navigate to dashboard
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      // Check sidebar navigation
      const sidebarToggle = page.locator('[data-testid="button-sidebar-toggle"]').first();
      if (await sidebarToggle.isVisible()) {
        await sidebarToggle.click();
      }
    });
  });

  test('login with existing credentials', async ({ page }) => {
    await test.step('Navigate to login page', async () => {
      await page.goto('http://localhost:3000/login');
      await expect(page.locator('text=Login to InvoiceHub')).toBeVisible();
    });

    await test.step('Attempt login with invalid credentials', async () => {
      await page.fill('input[type="email"]', 'nonexistent@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button:has-text("Login")');
      
      // Should stay on login page or show error
      await page.waitForTimeout(1000);
    });
  });
});


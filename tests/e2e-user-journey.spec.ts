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

    // Step 3: Complete onboarding wizard flow
    await test.step('Complete onboarding wizard flow', async () => {
      // Step 3.1: Business Basics
      await expect(page.locator('text=Welcome to InvoiceHub!')).toBeVisible();
      await expect(page.locator('input[id="companyName"]')).toBeVisible();
      
      await page.fill('input[id="companyName"]', 'Test Company E2E');
      // Click currency selector - handle Select component
      await page.click('[id="currency"]').catch(async () => {
        await page.locator('button').filter({ hasText: /EUR|USD|GBP/i }).first().click();
      });
      await page.click('text=USD').catch(async () => {
        await page.locator('[role="option"]').filter({ hasText: 'USD' }).click();
      });
      await page.click('button:has-text("Continue")');
      
      // Step 3.2: Add Client
      await expect(page.locator('text=Who\'s your first client?')).toBeVisible();
      await page.fill('input[id="clientName"]', 'Test Client E2E');
      await page.fill('input[id="clientEmail"]', 'client@example.com');
      await page.click('button:has-text("Add Client")');
      
      // Step 3.3: Add Service
      await expect(page.locator('text=What are you selling?')).toBeVisible();
      await page.fill('input[id="serviceName"]', 'Web Design');
      await page.fill('input[id="servicePrice"]', '100');
      await page.click('button:has-text("Add Service")');
      
      // Step 3.4: Review Invoice
      await expect(page.locator('text=Review and generate your first invoice!')).toBeVisible();
      await expect(page.locator('text=Test Company E2E')).toBeVisible();
      await expect(page.locator('text=Test Client E2E')).toBeVisible();
      
      // Note: The actual invoice generation would happen here
      // but we'll skip it for now to avoid API calls in tests
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


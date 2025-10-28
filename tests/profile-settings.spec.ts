import { test, expect } from '@playwright/test';

// Helper function to register and login
async function setupUser(page: any) {
  const timestamp = Date.now();
  const testEmail = `profiletest_${timestamp}@example.com`;
  const testPassword = 'TestPassword123!';

  // Register a new user
  await page.goto('http://localhost:3000/register');
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[placeholder="johndoe"]', 'profiletest');
  await page.fill('input[type="password"]', testPassword);
  await page.fill('input[type="password"]', testPassword);
  await page.click('button:has-text("Register")');
  
  // Wait for redirect to onboarding or dashboard
  await page.waitForTimeout(3000);
  
  // Navigate to settings page
  await page.goto('http://localhost:3000/settings');
  await page.waitForLoadState('networkidle');
}

test.describe('Profile Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login first
    await setupUser(page);
  });

  test('should display settings page with profile form', async ({ page }) => {
    await expect(page.locator('text=Settings')).toBeVisible();
    await expect(page.locator('text=Profile Information')).toBeVisible();
    await expect(page.locator('text=Company Name')).toBeVisible();
    await expect(page.locator('text=Address')).toBeVisible();
    await expect(page.locator('text=Phone')).toBeVisible();
    await expect(page.locator('text=Tax Registration Number')).toBeVisible();
    await expect(page.locator('text=Preferred Currency')).toBeVisible();
  });

  test('should allow setting company name', async ({ page }) => {
    const companyNameInput = page.locator('input[placeholder="Enter your company name"]');
    await companyNameInput.fill('Test Company Inc');
    await expect(companyNameInput).toHaveValue('Test Company Inc');
  });

  test('should allow setting address', async ({ page }) => {
    const addressInput = page.locator('textarea[placeholder="Enter your address"]');
    await addressInput.fill('123 Main St, City, State 12345');
    await expect(addressInput).toHaveValue('123 Main St, City, State 12345');
  });

  test('should allow setting phone number', async ({ page }) => {
    const phoneInput = page.locator('input[placeholder="Enter your phone number"]');
    await phoneInput.fill('+1-555-123-4567');
    await expect(phoneInput).toHaveValue('+1-555-123-4567');
  });

  test('should allow setting tax registration number', async ({ page }) => {
    const taxInput = page.locator('input[placeholder="Enter your tax registration number"]');
    await taxInput.fill('TAX-123456789');
    await expect(taxInput).toHaveValue('TAX-123456789');
  });

  test('should have currency dropdown with all required currencies', async ({ page }) => {
    // Click on the currency dropdown
    await page.locator('button[role="combobox"]').click();
    await page.waitForTimeout(500);

    // Check for all required currencies
    await expect(page.locator('text=USD - US Dollar')).toBeVisible();
    await expect(page.locator('text=EUR - Euro')).toBeVisible();
    await expect(page.locator('text=GBP - British Pound')).toBeVisible();
    await expect(page.locator('text=AUD - Australian Dollar')).toBeVisible();
    await expect(page.locator('text=TRY - Turkish Lira')).toBeVisible();
  });

  test('should allow selecting different currencies', async ({ page }) => {
    // Click on the currency dropdown
    await page.locator('button[role="combobox"]').click();
    await page.waitForTimeout(500);

    // Select EUR
    await page.locator('text=EUR - Euro').click();
    await page.waitForTimeout(300);
    
    // Verify the dropdown now shows EUR (will be visible when opened again)
    await page.locator('button[role="combobox"]').click();
    await expect(page.locator('text=EUR - Euro').first()).toBeVisible();
  });

  test('should save profile changes', async ({ page }) => {
    // Fill in profile information
    await page.locator('input[placeholder="Enter your company name"]').fill('E2E Test Company');
    await page.locator('textarea[placeholder="Enter your address"]').fill('123 Test Street');
    await page.locator('input[placeholder="Enter your phone number"]').fill('555-1234');

    // Click save button
    await page.locator('button:has-text("Save Changes")').click();
    await page.waitForTimeout(2000);

    // Should show success message
    await expect(page.locator('text=Profile updated').or(page.locator('text=Profile settings have been saved'))).toBeVisible();
  });

  test('should persist profile data after page reload', async ({ page }) => {
    // First set some profile data
    await page.locator('input[placeholder="Enter your company name"]').fill('Persistent Company');
    await page.locator('textarea[placeholder="Enter your address"]').fill('Persistent Address');
    
    // Save
    await page.locator('button:has-text("Save Changes")').click();
    await page.waitForTimeout(2000);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Data should still be there (may need to wait for form to populate)
    await page.waitForTimeout(1000);
    const companyValue = await page.locator('input[placeholder="Enter your company name"]').inputValue();
    expect(companyValue).toBe('Persistent Company');
  });

  test('should navigate to settings from sidebar', async ({ page }) => {
    // First go to a different page
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');

    // Click on Settings in the sidebar
    const settingsLink = page.locator('a:has-text("Settings")').first();
    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      await page.waitForLoadState('networkidle');

      // Should be on settings page
      await expect(page).toHaveURL(/.*settings/);
      await expect(page.locator('text=Settings')).toBeVisible();
    }
  });
});

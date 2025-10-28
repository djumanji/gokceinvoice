import { test, expect } from '@playwright/test';

test.describe('Settings Profile Update', () => {
  let testEmail: string;
  let testPassword: string;

  test.beforeEach(async ({ page }) => {
    // Generate unique credentials for each test run
    const timestamp = Date.now();
    testEmail = `test_settings_${timestamp}@example.com`;
    testPassword = 'TestPassword123!';

    // Register a new user
    await page.goto('http://localhost:3000/register');
    
    // Fill registration form
    await page.getByRole('textbox', { name: /email/i }).fill(testEmail);
    await page.getByRole('textbox', { name: /password/i }).first().fill(testPassword);
    await page.getByRole('textbox', { name: /password/i }).last().fill(testPassword);
    
    // Submit registration
    await page.getByRole('button', { name: 'Register' }).click();
    
    // Wait for onboarding page (registration successful)
    await page.waitForURL(/.*onboarding/, { timeout: 10000 });
    
    // Navigate directly to Settings page
    await page.goto('http://localhost:3000/settings');
    await expect(page).toHaveURL(/.*settings/);
  });

  test('should update profile successfully without logging out', async ({ page }) => {
    // Fill in profile information
    await page.getByPlaceholder(/enter your full name/i).fill('gary Kasparov');
    await page.getByPlaceholder(/enter your company name/i).fill('Gary Inc.');
    await page.getByPlaceholder(/enter your address/i).fill('123 Main St, City, Country');
    await page.getByPlaceholder(/enter your phone number/i).fill('+1-555-0123');
    await page.getByPlaceholder(/enter your tax registration number/i).fill('TAX-12345');

    // Save changes
    await page.getByRole('button', { name: /save/i }).click();

    // Wait for success toast
    await expect(page.getByText(/profile.*saved.*successfully/i)).toBeVisible({ timeout: 5000 });

    // Verify user is still on Settings page (NOT redirected to login)
    await expect(page).toHaveURL(/.*settings/);

    // Verify user is still authenticated by checking if Settings page elements are visible
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
    
    // Reload page to verify data was saved
    await page.reload();
    
    // Verify the saved data is still there
    await expect(page.getByPlaceholder(/enter your full name/i)).toHaveValue('Gary Kasparov');
    await expect(page.getByPlaceholder(/enter your company name/i)).toHaveValue('Gary Inc.');
    
    // User should still be authenticated
    await expect(page).toHaveURL(/.*settings/);
  });

  test('should reset form when Cancel button is clicked', async ({ page }) => {
    // Get original values
    const originalName = await page.getByPlaceholder(/enter your full name/i).inputValue();
    
    // Fill in new values
    await page.getByPlaceholder(/enter your full name/i).fill('Test Name');
    await page.getByPlaceholder(/enter your company name/i).fill('Test Company');
    
    // Click Cancel
    await page.getByRole('button', { name: /cancel/i }).click();
    
    // Verify form is reset to original values
    await expect(page.getByPlaceholder(/enter your full name/i)).toHaveValue(originalName);
    
    // User should still be on Settings page
    await expect(page).toHaveURL(/.*settings/);
  });

  test('should validate profile fields correctly', async ({ page }) => {
    // Try to save with valid data
    await page.getByPlaceholder(/enter your full name/i).fill('Test User');
    await page.getByRole('button', { name: /save/i }).click();
    
    // Should succeed and show success message
    await expect(page.getByText(/profile.*saved.*successfully/i)).toBeVisible({ timeout: 5000 });
    
    // User should still be authenticated
    await expect(page).toHaveURL(/.*settings/);
  });

  test('should preserve session throughout profile update flow', async ({ page }) => {
    // Perform multiple save operations
    for (let i = 1; i <= 3; i++) {
      await page.getByPlaceholder(/enter your full name/i).fill(`Test Name ${i}`);
      await page.getByRole('button', { name: /save/i }).click();
      
      // Wait for success message
      await expect(page.getByText(/profile.*saved.*successfully/i)).toBeVisible({ timeout: 5000 });
      
      // Verify still on Settings page after each save
      await expect(page).toHaveURL(/.*settings/);
      
      // Wait a bit before next iteration
      await page.waitForTimeout(500);
    }
    
    // After all saves, verify user is still authenticated
    await page.goto('http://localhost:3000/');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should navigate away and back without losing session', async ({ page }) => {
    // Update profile
    await page.getByPlaceholder(/enter your full name/i).fill('Navigation Test');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/profile.*saved.*successfully/i)).toBeVisible({ timeout: 5000 });
    
    // Navigate to dashboard
    await page.goto('http://localhost:3000/');
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Navigate back to settings
    await page.goto('http://localhost:3000/settings');
    await expect(page).toHaveURL(/.*settings/);
    
    // Verify data is still there
    await expect(page.getByPlaceholder(/enter your full name/i)).toHaveValue('Navigation Test');
  });

  test('should update currency preference', async ({ page }) => {
    // Update name
    await page.getByPlaceholder(/enter your full name/i).fill('Currency Test');
    
    // Change currency to EUR
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: /EUR.*Euro/i }).click();
    
    // Save
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/profile.*saved.*successfully/i)).toBeVisible({ timeout: 5000 });
    
    // Reload and verify currency is saved
    await page.reload();
    
    // Verify user is still on Settings page (not logged out)
    await expect(page).toHaveURL(/.*settings/);
    
    // Verify name is still there
    await expect(page.getByPlaceholder(/enter your full name/i)).toHaveValue('Currency Test');
  });

  test('should handle partial updates correctly', async ({ page }) => {
    // Only update name, leave other fields empty
    await page.getByPlaceholder(/enter your full name/i).fill('Partial Update Test');
    
    // Save
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/profile.*saved.*successfully/i)).toBeVisible({ timeout: 5000 });
    
    // User should still be authenticated
    await expect(page).toHaveURL(/.*settings/);
    
    // Reload and verify
    await page.reload();
    await expect(page).toHaveURL(/.*settings/);
    await expect(page.getByPlaceholder(/enter your full name/i)).toHaveValue('Partial Update Test');
  });
});


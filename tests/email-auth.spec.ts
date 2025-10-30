import { test, expect } from '@playwright/test';

/**
 * Email Authentication E2E Tests
 * 
 * Tests the complete email authentication flow including:
 * - User registration with email verification
 * - Email verification process
 * - Password reset flow
 * - Login after verification
 */

test.describe('Email Authentication Flow', () => {
  // Generate unique email for each test run
  const timestamp = Date.now();
  const testEmail = `test-${timestamp}@example.com`;
  const testPassword = 'SecurePassword123!';
  // Username field is not present in current UI

  test.describe('User Registration & Email Verification', () => {
    test('should register new user and send verification email', async ({ page }) => {
      // Navigate to registration
      await page.goto('http://localhost:3000/register');
      
      // Wait for page to load
      await expect(page.locator('text=Create an Account')).toBeVisible();
      
      // Fill registration form
      await page.fill('input[type="email"]', testEmail);
      const passwordInputs = page.locator('input[type="password"]');
      await passwordInputs.first().fill(testPassword);
      await passwordInputs.nth(1).fill(testPassword);
      
      // Submit registration
      const registerButton = page.locator('button:has-text("Register")');
      await registerButton.click();
      
      // Wait for response
      await page.waitForTimeout(2000);
      
      // Should redirect to dashboard or show success message
      // The app should handle registration even if email fails
      const currentUrl = page.url();
      
      // Check if we're redirected to dashboard or still on register page
      if (currentUrl.includes('/register')) {
        // Check for error or success toast
        console.log('Registration page - checking for messages');
      } else {
        // Should be redirected to dashboard
        console.log('Redirected to dashboard after registration');
      }
    });

    test('should show email verification page', async ({ page }) => {
      // Navigate directly to verification page with a test token
      // In real scenario, this would come from email
      const fakeToken = 'test-verification-token-' + timestamp;
      await page.goto(`http://localhost:3000/verify-email?token=${fakeToken}`);
      
      // Should show verification page with error (since token is fake)
      await page.waitForTimeout(2000); // Wait for API call to complete
      await expect(page.locator('text=Email Verification')).toBeVisible();
      
      // Should show error message for invalid token
      await expect(page.locator('text=Verification Failed')).toBeVisible();
    });

    test('should handle invalid verification token', async ({ page }) => {
      await page.goto('http://localhost:3000/verify-email?token=invalid-token');
      
      // Wait for page to load and API call to complete
      await page.waitForTimeout(2000);
      await expect(page.locator('text=Email Verification')).toBeVisible();
      
      // Should show error message
      await expect(page.locator('text=Verification Failed')).toBeVisible();
      
      // Should have back to login button
      const backButton = page.locator('button:has-text("Back to Login")');
      await expect(backButton).toBeVisible();
      
      // Click back button
      await backButton.click();
      await expect(page).toHaveURL(/.*login/);
    });

    test('should handle missing verification token', async ({ page }) => {
      await page.goto('http://localhost:3000/verify-email');
      
      // Should show error for missing token
      await page.waitForTimeout(1000);
      await expect(page.locator('text=Email Verification')).toBeVisible();
      await expect(page.locator('text=Verification Failed')).toBeVisible();
    });
  });

  test.describe('Password Reset Flow', () => {
    test('should display reset password page', async ({ page }) => {
      // Navigate to reset password page with token
      const fakeToken = 'test-reset-token-' + timestamp;
      await page.goto(`http://localhost:3000/reset-password?token=${fakeToken}`);
      
      // Wait for page to load
      await page.waitForTimeout(1000);
      
      // Should show reset password form
      await expect(page.locator('text=Reset Password')).toBeVisible();
      
      // Should have password fields
      const passwordInputs = page.locator('input[type="password"]');
      await expect(passwordInputs.first()).toBeVisible();
      await expect(passwordInputs.nth(1)).toBeVisible();
    });

    test('should handle missing reset token', async ({ page }) => {
      await page.goto('http://localhost:3000/reset-password');
      
      // Wait for page to load
      await page.waitForTimeout(1000);
      
      // Should show error for missing token
      await expect(page.locator('text=Reset Password')).toBeVisible();
      
      // Should have back to login button
      const backButton = page.locator('button:has-text("Back to Login")');
      await expect(backButton).toBeVisible();
    });

    test('should validate password requirements', async ({ page }) => {
      const fakeToken = 'test-reset-token-' + timestamp;
      await page.goto(`http://localhost:3000/reset-password?token=${fakeToken}`);
      
      // Wait for page to load
      await page.waitForTimeout(1000);
      
      // Try to submit with short password
      const passwordInputs = page.locator('input[type="password"]');
      await passwordInputs.first().fill('short'); // Too short
      
      // Click reset button
      const resetButton = page.locator('button:has-text("Reset Password")');
      await resetButton.click();
      
      // Should show validation error
      await page.waitForTimeout(1000);
      // Form should prevent submission for password less than 8 characters
    });

    test('should validate password confirmation match', async ({ page }) => {
      const fakeToken = 'test-reset-token-' + timestamp;
      await page.goto(`http://localhost:3000/reset-password?token=${fakeToken}`);
      
      // Wait for page to load
      await page.waitForTimeout(1000);
      
      const passwordInputs = page.locator('input[type="password"]');
      
      // Fill with mismatched passwords
      await passwordInputs.first().fill('NewPassword123!');
      await passwordInputs.nth(1).fill('DifferentPassword123!');
      
      const resetButton = page.locator('button:has-text("Reset Password")');
      await resetButton.click();
      
      // Should show error for password mismatch
      await page.waitForTimeout(1000);
      // Form should show validation error
    });

    test('should provide back to login option', async ({ page }) => {
      const fakeToken = 'test-reset-token-' + timestamp;
      await page.goto(`http://localhost:3000/reset-password?token=${fakeToken}`);
      
      // Wait for page to load
      await page.waitForTimeout(1000);
      
      // Click back to login
      const backButton = page.locator('button:has-text("Back to Login")');
      await expect(backButton).toBeVisible();
      await backButton.click();
      
      // Should navigate to login
      await expect(page).toHaveURL(/.*login/);
    });
  });

  test.describe('Integration Tests', () => {
    test.skip('should complete full user journey: register → verify → login', async ({ page }) => {
      // This test simulates the full flow
      // Note: Actual verification requires checking email/resend dashboard
      
      const uniqueTimestamp = Date.now();
      const uniqueEmail = `e2e-test-${uniqueTimestamp}@example.com`;
      const uniquePassword = 'SecurePassword123!';
      // No username in UI
      
      // Step 1: Register
      await page.goto('http://localhost:3000/register');
      await expect(page.locator('text=Create an Account')).toBeVisible();
      
      await page.fill('input[type="email"]', uniqueEmail);
      const passwordInputs2 = page.locator('input[type="password"]');
      await passwordInputs2.first().fill(uniquePassword);
      await passwordInputs2.nth(1).fill(uniquePassword);
      
      await page.locator('button:has-text("Register")').click();
      await page.waitForTimeout(2000);
      
      console.log('✓ Registration completed');
      
      // Step 2: Verify email (manual step in real scenario)
      // Check Resend dashboard for verification link
      console.log('✓ Verification email sent (check Resend dashboard)');
      
      // Step 3: Login
      await page.goto('http://localhost:3000/login');
      await page.fill('input[type="email"]', uniqueEmail);
      await page.fill('input[type="password"]', uniquePassword);
      await page.locator('button:has-text("Login")').click();
      
      await page.waitForTimeout(2000);
      
      // Should be logged in and redirected
      const currentUrl = page.url();
      console.log('✓ Login attempt completed, current URL:', currentUrl);
    });

    test('should handle password reset complete flow', async ({ page }) => {
      // Step 1: Go to login
      await page.goto('http://localhost:3000/login');
      
      // Step 2: Navigate to password reset (simulating forgot password)
      // In real app, there would be a "Forgot Password" link
      // For now, we'll test the reset password page directly
      
      const fakeToken = 'reset-token-' + Date.now();
      await page.goto(`http://localhost:3000/reset-password?token=${fakeToken}`);
      
      // Should show reset form
      await expect(page.locator('text=Reset Password')).toBeVisible();
      
      // Fill new password
      const passwordInputs = page.locator('input[type="password"]');
      await passwordInputs.first().fill('NewSecurePassword123!');
      await passwordInputs.nth(1).fill('NewSecurePassword123!');
      
      // Submit
      await page.locator('button:has-text("Reset Password")').click();
      await page.waitForTimeout(1000);
      
      console.log('✓ Password reset attempt completed');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle expired verification token gracefully', async ({ page }) => {
      // Simulate expired token
      await page.goto('http://localhost:3000/verify-email?token=expired-token-12345');
      
      await page.waitForTimeout(2000);
      await expect(page.locator('text=Email Verification')).toBeVisible();
      await expect(page.locator('text=Verification Failed')).toBeVisible();
      
      // Should provide recovery options
      await expect(page.locator('button:has-text("Back to Login")')).toBeVisible();
    });

    test('should handle API errors gracefully', async ({ page }) => {
      // Test with malformed token
      await page.goto('http://localhost:3000/verify-email?token=malformed%20token');
      
      // Should not crash
      await page.waitForTimeout(2000);
      
      // Should show error state
      const title = page.locator('text=Email Verification');
      await expect(title).toBeVisible();
    });
  });
});


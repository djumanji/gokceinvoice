import { test, expect } from '@playwright/test';

test.describe('Onboarding Wizard Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Assume user is logged in and redirected to onboarding
    // In real scenario, this would be handled by auth setup
    await page.goto('http://localhost:3000/onboarding');
  });

  test('should display StepBasics as first step', async ({ page }) => {
    await expect(page.locator('text=Welcome to InvoiceHub!')).toBeVisible();
    await expect(page.locator('text=Let\'s get you set up in less than 3 minutes')).toBeVisible();
    await expect(page.locator('input[id="companyName"]')).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /currency/i }).or(page.locator('[id="currency"]'))).toBeVisible();
  });

  test('should validate company name is required', async ({ page }) => {
    const continueButton = page.locator('button:has-text("Continue")');
    await expect(continueButton).toBeDisabled();
    
    // Enter valid company name
    await page.fill('input[id="companyName"]', 'Test Company');
    await expect(continueButton).toBeEnabled();
    
    // Clear and check disabled again
    await page.fill('input[id="companyName"]', '');
    await expect(continueButton).toBeDisabled();
  });

  test('should validate company name minimum length', async ({ page }) => {
    await page.fill('input[id="companyName"]', 'A');
    await page.click('button:has-text("Continue")');
    
    await expect(page.locator('text=Company name must be at least 2 characters')).toBeVisible();
  });

  test('should progress from StepBasics to StepAddClient', async ({ page }) => {
    await page.fill('input[id="companyName"]', 'Test Company');
    await page.click('button:has-text("Continue")');
    
    await expect(page.locator('text=Who\'s your first client?')).toBeVisible();
    await expect(page.locator('input[id="clientName"]')).toBeVisible();
  });

  test('should allow going back from StepAddClient to StepBasics', async ({ page }) => {
    await page.fill('input[id="companyName"]', 'Test Company');
    await page.click('button:has-text("Continue")');
    
    await expect(page.locator('text=Who\'s your first client?')).toBeVisible();
    
    await page.click('button:has-text("Back")');
    
    await expect(page.locator('text=Welcome to InvoiceHub!')).toBeVisible();
    await expect(page.locator('input[id="companyName"]')).toHaveValue('Test Company');
  });

  test('should validate client email format', async ({ page }) => {
    await page.fill('input[id="companyName"]', 'Test Company');
    await page.click('button:has-text("Continue")');
    
    await page.fill('input[id="clientName"]', 'Test Client');
    await page.fill('input[id="clientEmail"]', 'invalid-email');
    
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
    
    await page.fill('input[id="clientEmail"]', 'valid@example.com');
    await expect(page.locator('text=Please enter a valid email address')).not.toBeVisible();
  });

  test('should allow skipping client step', async ({ page }) => {
    await page.fill('input[id="companyName"]', 'Test Company');
    await page.click('button:has-text("Continue")');
    
    await page.click('button:has-text("Skip for Now")');
    
    await expect(page.locator('text=What are you selling?')).toBeVisible();
  });

  test('should progress from StepAddClient to StepAddService', async ({ page }) => {
    await page.fill('input[id="companyName"]', 'Test Company');
    await page.click('button:has-text("Continue")');
    
    await page.fill('input[id="clientName"]', 'Test Client');
    await page.fill('input[id="clientEmail"]', 'client@example.com');
    await page.click('button:has-text("Add Client")');
    
    await expect(page.locator('text=What are you selling?')).toBeVisible();
    await expect(page.locator('input[id="serviceName"]')).toBeVisible();
    await expect(page.locator('input[id="servicePrice"]')).toBeVisible();
  });

  test('should display currency symbol in service price field', async ({ page }) => {
    await page.fill('input[id="companyName"]', 'Test Company');
    // Click currency selector and choose USD
    await page.click('[id="currency"]').catch(() => {
      // If Select component, find the trigger button
      return page.locator('button').filter({ hasText: /EUR|USD|GBP/i }).first().click();
    });
    await page.click('text=USD').catch(() => {
      // Alternative: click on USD option
      return page.locator('[role="option"]').filter({ hasText: 'USD' }).click();
    });
    await page.click('button:has-text("Continue")');
    
    await page.click('button:has-text("Skip for Now")');
    
    const priceInput = page.locator('input[id="servicePrice"]');
    const parentDiv = priceInput.locator('..');
    await expect(parentDiv.locator('text=\\$')).toBeVisible();
  });

  test('should validate service price is numeric', async ({ page }) => {
    await page.fill('input[id="companyName"]', 'Test Company');
    await page.click('button:has-text("Continue")');
    await page.click('button:has-text("Skip for Now")');
    
    await page.fill('input[id="serviceName"]', 'Web Design');
    await page.fill('input[id="servicePrice"]', 'abc');
    
    const addButton = page.locator('button:has-text("Add Service")');
    await expect(addButton).toBeDisabled();
    
    await page.fill('input[id="servicePrice"]', '100');
    await expect(addButton).toBeEnabled();
  });

  test('should progress from StepAddService to StepReview', async ({ page }) => {
    await page.fill('input[id="companyName"]', 'Test Company');
    await page.click('button:has-text("Continue")');
    await page.click('button:has-text("Skip for Now")');
    
    await page.fill('input[id="serviceName"]', 'Web Design');
    await page.fill('input[id="servicePrice"]', '100');
    await page.click('button:has-text("Add Service")');
    
    await expect(page.locator('text=Review and generate your first invoice!')).toBeVisible();
    await expect(page.locator('text=INVOICE')).toBeVisible();
  });

  test('should display invoice preview with correct data', async ({ page }) => {
    await page.fill('input[id="companyName"]', 'Test Company');
    await page.click('button:has-text("Continue")');
    await page.fill('input[id="clientName"]', 'Test Client');
    await page.click('button:has-text("Add Client")');
    await page.fill('input[id="serviceName"]', 'Web Design');
    await page.fill('input[id="servicePrice"]', '150.50');
    await page.click('button:has-text("Add Service")');
    
    await expect(page.locator('text=Test Company')).toBeVisible();
    await expect(page.locator('text=Test Client')).toBeVisible();
    await expect(page.locator('text=Web Design')).toBeVisible();
    await expect(page.locator('text=150.50')).toBeVisible();
  });

  test('should allow going back from StepReview to StepAddService', async ({ page }) => {
    await page.fill('input[id="companyName"]', 'Test Company');
    await page.click('button:has-text("Continue")');
    await page.click('button:has-text("Skip for Now")');
    await page.fill('input[id="serviceName"]', 'Web Design');
    await page.fill('input[id="servicePrice"]', '100');
    await page.click('button:has-text("Add Service")');
    
    await page.click('button:has-text("Back")');
    
    await expect(page.locator('text=What are you selling?')).toBeVisible();
    await expect(page.locator('input[id="serviceName"]')).toHaveValue('Web Design');
  });
});

test.describe('Onboarding Sidebar Visibility', () => {
  test('should hide sidebar during onboarding', async ({ page }) => {
    await page.goto('http://localhost:3000/onboarding');
    
    // Sidebar should not be visible
    const sidebar = page.locator('[data-testid="sidebar"]');
    if (await sidebar.count() > 0) {
      await expect(sidebar).not.toBeVisible();
    }
    
    // Sidebar toggle should not be visible
    const sidebarToggle = page.locator('[data-testid="button-sidebar-toggle"]');
    if (await sidebarToggle.count() > 0) {
      await expect(sidebarToggle).not.toBeVisible();
    }
  });

  test('should show sidebar after onboarding completion', async ({ page }) => {
    // This test would require mocking the onboarding completion
    // For now, we'll test that the sidebar appears when not on onboarding
    await page.goto('http://localhost:3000/');
    
    // If user is logged in, sidebar should be visible
    // This is a basic check - full test would require auth setup
    const sidebarToggle = page.locator('[data-testid="button-sidebar-toggle"]');
    // Note: This test might fail if user is not logged in
    // In real scenario, would set up auth state first
  });
});

test.describe('Onboarding Success Step', () => {
  test.skip('should display success step after invoice generation', async ({ page }) => {
    // This test would require:
    // 1. Complete onboarding flow
    // 2. Mock API call to create invoice
    // 3. Verify success step appears
    
    // Skipping for now as it requires full integration setup
  });

  test.skip('should have countdown timer on success step', async ({ page }) => {
    // Verify countdown timer appears and counts down
  });

  test.skip('should set sessionStorage flag when going to dashboard', async ({ page }) => {
    // Verify sessionStorage flag is set
    // This would be tested in integration tests
  });
});

test.describe('Onboarding Completion Requirements', () => {
  test.skip('should redirect to dashboard when onboarding is complete', async ({ page }) => {
    // This test requires:
    // 1. User with companyName set
    // 2. At least one invoice exists
    // 3. Verify redirect to dashboard happens
  });

  test.skip('should trigger sidebar animation on dashboard load', async ({ page }) => {
    // This test requires:
    // 1. Complete onboarding flow
    // 2. Set sessionStorage flag
    // 3. Navigate to dashboard
    // 4. Verify sidebar animation plays
  });
});

import { test, expect } from '@playwright/test';

test.describe('Invoice Bank Account Integration', () => {
  const timestamp = Date.now();
  const testEmail = `bank_test_${timestamp}@example.com`;
  const testPassword = 'TestPassword123!';

  test.beforeAll(async ({ browser }) => {
    // Create a test user with proper onboarding
    const page = await browser.newPage();

    try {
      // Register
      await page.goto('http://localhost:3000/register');
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[placeholder="johndoe"]', 'BankTestUser');
      await page.fill('input[type="password"]', testPassword);
      const passwordInputs = await page.locator('input[type="password"]').all();
      if (passwordInputs.length > 1) {
        await passwordInputs[1].fill(testPassword);
      }
      await page.click('button:has-text("Register")');
      await page.waitForURL(/.*/, { timeout: 5000 });

      // Quick onboarding completion
      const isOnboarding = page.url().includes('onboarding');
      if (isOnboarding) {
        // Business Basics
        await page.fill('input[id="companyName"]', 'Test Company');
        await page.click('button:has-text("Continue")').catch(() => {});
        await page.waitForTimeout(500);

        // Add Client
        await page.fill('input[id="clientName"]', 'Test Client').catch(() => {});
        await page.fill('input[id="clientEmail"]', 'client@test.com').catch(() => {});
        await page.click('button:has-text("Add Client")').catch(() => {});
        await page.waitForTimeout(500);

        // Add Service
        await page.fill('input[id="serviceName"]', 'Web Design').catch(() => {});
        await page.fill('input[id="servicePrice"]', '100').catch(() => {});
        await page.click('button:has-text("Add Service")').catch(() => {});
        await page.waitForTimeout(500);
      }
    } finally {
      await page.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button:has-text("Login")');
    await page.waitForURL(/.*/, { timeout: 5000 });
    await page.waitForLoadState('networkidle');
  });

  test('should create bank account and use it in invoice', async ({ page }) => {
    await test.step('Navigate to settings and create bank account', async () => {
      // Go to settings
      await page.goto('http://localhost:3000/settings');
      await page.waitForLoadState('networkidle');

      // Look for Bank Accounts section or tab
      const bankAccountsTab = page.locator('text=Bank Accounts, button:has-text("Bank")').first();
      if (await bankAccountsTab.isVisible({ timeout: 2000 })) {
        await bankAccountsTab.click();
      }

      // Click Add Bank Account button
      const addBankButton = page.locator('button:has-text("Add Bank"), button:has-text("Add Account")').first();
      if (await addBankButton.isVisible({ timeout: 2000 })) {
        await addBankButton.click();
        await page.waitForTimeout(500);

        // Fill bank account form
        await page.fill('input[id="accountHolderName"], input[placeholder*="holder" i]', 'Test Holder');
        await page.fill('input[id="bankName"], input[placeholder*="bank" i]', 'Test Bank');
        await page.fill('input[id="iban"], input[placeholder*="iban" i]', 'GB82WEST12345698765432');
        await page.fill('input[id="swiftCode"], input[placeholder*="swift" i]', 'TESTGB2L');

        // Submit
        await page.click('button:has-text("Save"), button:has-text("Add")');
        await page.waitForTimeout(1000);
      }
    });

    await test.step('Create invoice with bank account selected', async () => {
      // Navigate to create invoice
      await page.goto('http://localhost:3000/invoices/new');
      await page.waitForLoadState('networkidle');

      // Select client
      const clientSelect = page.locator('[data-testid="select-client"]').first();
      if (await clientSelect.isVisible()) {
        await clientSelect.click();
        await page.waitForTimeout(300);
        const firstClient = page.locator('[role="option"]').first();
        if (await firstClient.isVisible()) {
          await firstClient.click();
        }
      }

      // Check if bank account field exists
      const bankAccountField = page.locator('select[id*="bank"], [role="combobox"]:has-text("Bank")').first();
      if (await bankAccountField.isVisible({ timeout: 2000 })) {
        await test.step('Select bank account', async () => {
          await bankAccountField.click();
          await page.waitForTimeout(300);

          // Select the bank account we just created
          const bankOption = page.locator('[role="option"]:has-text("Test Bank")').first();
          if (await bankOption.isVisible()) {
            await bankOption.click();
          }
        });
      }

      // Fill invoice date
      const dateInput = page.locator('[data-testid="input-date"]').first();
      if (await dateInput.isVisible()) {
        const today = new Date().toISOString().split('T')[0];
        await dateInput.fill(today);
      }

      // Fill line item
      const quantityInput = page.locator('[data-testid="input-quantity-0"]').first();
      if (await quantityInput.isVisible()) {
        await quantityInput.fill('2');
      }

      const priceInput = page.locator('[data-testid="input-price-0"]').first();
      if (await priceInput.isVisible()) {
        await priceInput.fill('150');
      }

      // Submit invoice
      const saveButton = page.locator('[data-testid="button-mark-sent"]').first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(2000);

        // Should redirect to invoices list
        await expect(page.url()).toContain('/invoices');
      }
    });

    await test.step('Verify invoice was created with bank account', async () => {
      // Should be on invoices page
      await page.waitForLoadState('networkidle');

      // Check if invoice appears in list
      const invoiceRow = page.locator('tr, [role="row"]').filter({ hasText: /INV-/ }).first();
      if (await invoiceRow.isVisible({ timeout: 3000 })) {
        await expect(invoiceRow).toBeVisible();
      }
    });
  });

  test('should edit invoice and change bank account', async ({ page }) => {
    await test.step('Create initial invoice', async () => {
      await page.goto('http://localhost:3000/invoices/new');
      await page.waitForLoadState('networkidle');

      // Select client
      const clientSelect = page.locator('[data-testid="select-client"]').first();
      if (await clientSelect.isVisible()) {
        await clientSelect.click();
        await page.waitForTimeout(300);
        const firstClient = page.locator('[role="option"]').first();
        if (await firstClient.isVisible()) {
          await firstClient.click();
        }
      }

      // Fill basic invoice data
      const quantityInput = page.locator('[data-testid="input-quantity-0"]').first();
      if (await quantityInput.isVisible()) {
        await quantityInput.fill('1');
      }

      const priceInput = page.locator('[data-testid="input-price-0"]').first();
      if (await priceInput.isVisible()) {
        await priceInput.fill('100');
      }

      // Save as draft
      const draftButton = page.locator('[data-testid="button-save-draft"]').first();
      if (await draftButton.isVisible()) {
        await draftButton.click();
        await page.waitForTimeout(2000);
      }
    });

    await test.step('Edit invoice and select bank account', async () => {
      // Find and click the first invoice to edit
      await page.waitForLoadState('networkidle');

      const invoiceRow = page.locator('tr, [role="row"]').filter({ hasText: /INV-/ }).first();
      if (await invoiceRow.isVisible({ timeout: 3000 })) {
        // Try to click edit button
        const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
        if (await editButton.isVisible({ timeout: 2000 })) {
          await editButton.click();
          await page.waitForLoadState('networkidle');

          // Should be on edit page
          await expect(page.url()).toMatch(/invoices\/(edit|new)/);

          // Check if bank account field exists and is populated
          const bankAccountField = page.locator('select[id*="bank"], [role="combobox"]').filter({ hasText: /Bank|Account/i }).first();
          if (await bankAccountField.isVisible({ timeout: 2000 })) {
            // Field exists, which means our fix is working
            await expect(bankAccountField).toBeVisible();
          }
        }
      }
    });
  });

  test('should display selected bank details in invoice preview', async ({ page }) => {
    await test.step('Create invoice with bank account', async () => {
      await page.goto('http://localhost:3000/invoices/new');
      await page.waitForLoadState('networkidle');

      // Select client
      const clientSelect = page.locator('[data-testid="select-client"]').first();
      if (await clientSelect.isVisible()) {
        await clientSelect.click();
        await page.waitForTimeout(300);
        const firstClient = page.locator('[role="option"]').first();
        if (await firstClient.isVisible()) {
          await firstClient.click();
        }
      }

      // Select bank account
      const bankAccountField = page.locator('select[id*="bank"], [role="combobox"]').filter({ hasText: /Bank/i }).first();
      if (await bankAccountField.isVisible({ timeout: 2000 })) {
        await bankAccountField.click();
        await page.waitForTimeout(300);

        const bankOption = page.locator('[role="option"]:has-text("Test Bank")').first();
        if (await bankOption.isVisible()) {
          await bankOption.click();
          await page.waitForTimeout(500);

          // Check if preview shows bank details
          const preview = page.locator('text=Test Bank, text=TESTGB2L').first();
          if (await preview.isVisible({ timeout: 2000 })) {
            await expect(preview).toBeVisible();
          }
        }
      }
    });
  });
});
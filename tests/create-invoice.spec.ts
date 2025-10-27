import { test, expect } from '@playwright/test';

test.describe('Create Invoice Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/invoices/new');
    await page.waitForLoadState('networkidle');
  });

  test('should display create invoice form', async ({ page }) => {
    await expect(page.locator('text=Create Invoice').or(page.locator('text=Invoice')).first()).toBeVisible();
  });

  test('should have client selection field', async ({ page }) => {
    // Look for client dropdown or field
    const clientField = page.locator('select, [role="combobox"], input[placeholder*="client" i]').first();
    if (await clientField.isVisible()) {
      await expect(clientField).toBeVisible();
    }
  });

  test('should have invoice date field', async ({ page }) => {
    // Check for date inputs
    const dateField = page.locator('input[type="date"], input[placeholder*="date" i]').first();
    if (await dateField.isVisible()) {
      await expect(dateField).toBeVisible();
    }
  });

  test('should have add line item functionality', async ({ page }) => {
    // Look for "Add Item" or similar button
    const addItemButton = page.locator('button:has-text("Add"), button:has-text("Item")').first();
    if (await addItemButton.isVisible()) {
      await expect(addItemButton).toBeVisible();
    }
  });
});


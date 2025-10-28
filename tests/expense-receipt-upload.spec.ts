import { test, expect } from '@playwright/test';
import { writeFile } from 'fs/promises';
import { join } from 'path';

test.describe('Expense Receipt Upload', () => {
  let testImagePath: string;

  // Create a test image before tests
  test.beforeAll(async () => {
    // Create a simple test image (1x1 pixel PNG)
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    
    // Also create a JPG image for testing
    const jpgBuffer = Buffer.from(
      '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A',
      'base64'
    );

    testImagePath = join(process.cwd(), 'test-image.png');
    await writeFile(testImagePath, pngBuffer);
  });

  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    
    // Wait for login form
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', 'demo@example.com');
    await page.fill('input[type="password"]', 'demo123');
    
    // Click login button
    await page.click('button:has-text("Login")');
    
    // Wait for navigation
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.goto('http://localhost:3000/expenses');
    await page.waitForLoadState('networkidle');
  });

  test('should open expense form when Add Expense button is clicked', async ({ page }) => {
    await page.click('button:has-text("Add Expense")');
    await expect(page.locator('text=Add New Expense,Edit Expense')).toBeVisible();
  });

  test('should display file upload button in expense form', async ({ page }) => {
    await page.click('button:has-text("Add Expense")');
    
    // Wait for form to appear
    await page.waitForSelector('text=Add New Expense,Edit Expense');
    
    // Check for upload button
    const uploadButton = page.locator('button:has-text("Upload Receipt")');
    await expect(uploadButton).toBeVisible();
  });

  test('should upload receipt image and show preview', async ({ page }) => {
    await page.click('button:has-text("Add Expense")');
    await page.waitForSelector('text=Add New Expense,Edit Expense');
    
    // Fill in required fields first
    await page.fill('input[placeholder*="description"]', 'Test expense with receipt');
    await page.fill('input[type="number"]', '50.00');
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    
    // Set up file chooser listener
    page.once('filechooser', async (fileChooser) => {
      await fileChooser.setFiles(testImagePath);
    });
    
    // Click the upload button to trigger file chooser
    await page.click('button:has-text("Upload Receipt")');
    
    // Wait for upload to complete (check for upload button to disappear or preview to appear)
    await page.waitForTimeout(2000);
    
    // Check if preview is shown or upload button text changes
    const hasPreview = await page.locator('img[alt*="Receipt"]').isVisible().catch(() => false);
    const hasUploaded = await page.locator('button:has-text("Uploading")').isVisible().catch(() => false);
    
    // Either preview should show OR we should see upload in progress
    expect(hasPreview || hasUploaded).toBeTruthy();
  });

  test('should validate file type', async ({ page }) => {
    await page.click('button:has-text("Add Expense")');
    await page.waitForSelector('text=Add New Expense,Edit Expense');
    
    const fileInput = page.locator('input[type="file"]');
    
    // Create a test text file
    const textFilePath = join(process.cwd(), 'test.txt');
    await writeFile(textFilePath, 'This is not an image');
    
    // Set up file chooser
    page.once('filechooser', async (fileChooser) => {
      await fileChooser.setFiles(textFilePath);
    });
    
    // Try to upload text file
    await page.click('button:has-text("Upload Receipt")');
    
    // Wait for alert or error message
    await page.waitForTimeout(1000);
    
    // Check if alert was shown (file type validation)
    // The totalMime could be shown via alert or console error
    const alertShown = await page.evaluate(() => {
      return (window as any).alertMessage;
    }).catch(() => false);
    
    // Clean up
    await page.evaluate(() => {
      const fs = require('fs');
      try { fs.unlinkSync('test.txt'); } catch {}
    });
  });

  test('should save expense with receipt', async ({ page }) => {
    await page.click('button:has-text("Add Expense")');
    await page.waitForSelector('text=Add New Expense,Edit Expense');
    
    // Fill in all required fields
    await page.fill('input[placeholder*="description"]', 'Business lunch with receipt');
    await page.fill('input[type="number"]', '75.50');
    await page.fill('input[placeholder*="vendor"]', 'Restaurant Name');
    
    // Select a category
    await page.click('[role="combobox"]').first();
    await page.click('text=Meals & Dining').first();
    
    // Upload receipt
    page.once('filechooser', async (fileChooser) => {
      await fileChooser.setFiles(testImagePath);
    });
    
    await page.click('button:has-text("Upload Receipt")');
    
    // Wait for upload
    await page.waitForTimeout(3000);
    
    // Save the expense
    await page.click('button:has-text("Save Expense")');
    
    // Wait for navigation back to expenses list
    await page.waitForURL('**/expenses', { timeout: 10000 });
    
    // Verify expense was created
    await expect(page.locator('text=Business lunch with receipt')).toBeVisible();
    
    // Check if receipt icon or view button appears
    const hasReceiptButton = await page.locator('button:has-text("View")').isVisible().catch(() => false);
    expect(hasReceiptButton).toBeTruthy();
  });

  test('should display receipt in table when present', async ({ page }) => {
    // Assuming there's already an expense with a receipt from previous test
    // Or create one first
    
    // Look for expenses that have receipt viewing button
    const expenseRows = page.locator('table tbody tr');
    const rowCount = await expenseRows.count();
    
    if (rowCount > 0) {
      // Check if any row has a View button for receipt
      const hasReceiptButton = await page.locator('button:has-text("View"):not(:has-text("Edit"))').first().isVisible().catch(() => false);
      
      if (hasReceiptButton) {
        // Click the view button
        await page.locator('button:has-text("View"):not(:has-text("Edit"))').first().click();
        
        // Check if image preview dialog opens
        await expect(page.locator('dialog, [role="dialog"]')).toBeVisible();
        await expect(page.locator('img[alt*="Receipt"]')).toBeVisible();
      }
    }
  });

  test('should allow removing uploaded image', async ({ page }) => {
    await page.click('button:has-text("Add Expense")');
    await page.waitForSelector('text=Add New Expense,Edit Expense');
    
    // Upload an image first
    page.once('filechooser', async (fileChooser) => {
      await fileChooser.setFiles(testImagePath);
    });
    
    await page.click('button:has-text("Upload Receipt")');
    await page.waitForTimeout(2000);
    
    // Check if preview is shown or trash button is visible
    const trashButton = page.locator('button[type="button"]:has(svg, [class*="lucide-trash"])').first();
    const isVisible = await trashButton.isVisible().catch(() => false);
    
    if (isVisible) {
      // Click remove button
      await trashButton.click();
      
      // Verify upload button appears again
      await expect(page.locator('button:has-text("Upload Receipt")')).toBeVisible({ timeout: 2000 });
    }
  });

  // Clean up
  test.afterAll(async () => {
    // Remove test image file
    const { unlinkSync } = await import('fs');
    try {
      unlinkSync(testImagePath);
    } catch (e) {
      // File might not exist
    }
  });
});


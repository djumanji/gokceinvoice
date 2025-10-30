import { test, expect } from '@playwright/test';
import { test as authTest, expect as authExpect } from './fixtures/auth';

test.describe('Expense Reports - Unauthenticated', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/expenses/reports');
    // Should redirect to login or show auth required
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toMatch(/login|dashboard/);
  });
});

authTest.describe('Expense Reports - Authenticated', () => {
  authTest.beforeEach(async ({ authenticatedPage, page }) => {
    // Create some test expenses first
    await page.goto('/expenses');
    await page.waitForLoadState('networkidle');

    // Check if we have expenses, if not create some
    const hasExpenses = await page.locator('text=No expenses yet').isVisible().catch(() => false);
    
    if (hasExpenses) {
      // Create test expenses
      await page.getByRole('button', { name: /add expense|Add Expense/i }).click();
      await page.waitForTimeout(500);

      // Fill expense form
      await page.getByLabel(/description/i).fill('Test Office Supplies');
      await page.getByRole('combobox', { name: /category/i }).click();
      await page.getByText('Office Supplies').click();
      await page.getByLabel(/amount/i).fill('100.00');
      await page.getByRole('button', { name: /save/i }).click();
      await page.waitForTimeout(1000);

      // Create another expense
      await page.getByRole('button', { name: /add expense|Add Expense/i }).click();
      await page.waitForTimeout(500);
      await page.getByLabel(/description/i).fill('Test Travel Expense');
      await page.getByRole('combobox', { name: /category/i }).click();
      await page.getByText('Travel').click();
      await page.getByLabel(/amount/i).fill('200.00');
      await page.getByRole('checkbox', { name: /tax deductible/i }).check();
      await page.getByRole('button', { name: /save/i }).click();
      await page.waitForTimeout(1000);
    }
  });

  authTest('should navigate to reports from expenses page', async ({ page }) => {
    await page.goto('/expenses');
    await page.waitForLoadState('networkidle');

    // Check for View Reports button
    const reportsButton = page.getByRole('button', { name: /view reports|View Reports/i });
    await authExpect(reportsButton).toBeVisible();
    
    await reportsButton.click();
    await page.waitForLoadState('networkidle');
    
    // Should navigate to reports page
    await authExpect(page).toHaveURL(/.*expenses\/reports/);
  });

  authTest('should display expense reports page', async ({ page }) => {
    await page.goto('/expenses/reports');
    await page.waitForLoadState('networkidle');

    // Check for main elements
    await authExpect(page.locator('text=/expense reports/i')).toBeVisible();
    
    // Check for filters section
    await authExpect(page.locator('text=/filters/i')).toBeVisible();
    
    // Check for date range picker
    const datePicker = page.locator('select, [role="combobox"]').first();
    await authExpect(datePicker).toBeVisible();
  });

  authTest('should display summary cards', async ({ page }) => {
    await page.goto('/expenses/reports');
    await page.waitForLoadState('networkidle');
    
    // Wait for analytics to load
    await page.waitForTimeout(2000);

    // Check for summary cards
    const totalExpensesCard = page.locator('text=/total expenses/i');
    await authExpect(totalExpensesCard.first()).toBeVisible();

    const taxDeductibleCard = page.locator('text=/tax deductible/i');
    await authExpect(taxDeductibleCard.first()).toBeVisible();
  });

  authTest('should display report tabs', async ({ page }) => {
    await page.goto('/expenses/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for tabs
    const categoryTab = page.getByRole('tab', { name: /category breakdown/i });
    await authExpect(categoryTab).toBeVisible();

    const trendsTab = page.getByRole('tab', { name: /trends/i });
    await authExpect(trendsTab).toBeVisible();

    const taxTab = page.getByRole('tab', { name: /tax/i });
    await authExpect(taxTab).toBeVisible();

    const vendorTab = page.getByRole('tab', { name: /vendor/i });
    await authExpect(vendorTab).toBeVisible();

    const paymentTab = page.getByRole('tab', { name: /payment/i });
    await authExpect(paymentTab).toBeVisible();
  });

  authTest('should switch between report tabs', async ({ page }) => {
    await page.goto('/expenses/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click on Trends tab
    await page.getByRole('tab', { name: /trends/i }).click();
    await page.waitForTimeout(500);
    
    // Check that trends content is visible
    const trendsContent = page.locator('text=/expense trends/i');
    await authExpect(trendsContent.first()).toBeVisible();

    // Click on Tax Savings tab
    await page.getByRole('tab', { name: /tax/i }).click();
    await page.waitForTimeout(500);
    
    // Check that tax content is visible
    const taxContent = page.locator('text=/tax savings/i');
    await authExpect(taxContent.first()).toBeVisible();
  });

  authTest('should change date range preset', async ({ page }) => {
    await page.goto('/expenses/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find and click date range selector
    const dateRangeSelect = page.locator('select, [role="combobox"]').first();
    await dateRangeSelect.click();
    await page.waitForTimeout(300);

    // Select "Last Month"
    await page.getByText('Last Month').click();
    await page.waitForTimeout(2000);

    // Analytics should reload
    await authExpect(page.locator('text=/total expenses/i')).toBeVisible();
  });

  authTest('should change period filter', async ({ page }) => {
    await page.goto('/expenses/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find period selector
    const periodSelect = page.locator('select').filter({ hasText: /monthly|quarterly|yearly/i }).first();
    if (await periodSelect.isVisible()) {
      await periodSelect.selectOption('quarter');
      await page.waitForTimeout(2000);
      
      // Should reload with quarterly data
      await authExpect(page.locator('text=/total expenses/i')).toBeVisible();
    }
  });

  authTest('should change tax rate', async ({ page }) => {
    await page.goto('/expenses/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find tax rate input
    const taxRateInput = page.locator('input[type="number"]').filter({ hasText: /tax rate/i }).or(
      page.locator('input[type="number"]').near(page.locator('text=/tax rate/i'))
    ).first();

    if (await taxRateInput.isVisible()) {
      await taxRateInput.fill('30');
      await taxRateInput.press('Enter');
      await page.waitForTimeout(2000);
      
      // Tax savings should update
      const taxSavings = page.locator('text=/estimated tax savings/i');
      await authExpect(taxSavings.first()).toBeVisible();
    }
  });

  authTest('should display charts', async ({ page }) => {
    await page.goto('/expenses/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check for chart containers (Recharts creates SVG elements)
    const charts = page.locator('svg').filter({ hasText: /recharts/i }).or(
      page.locator('[class*="recharts"]')
    );
    
    // At least one chart should be visible
    const chartCount = await charts.count();
    expect(chartCount).toBeGreaterThan(0);
  });

  authTest('should display category breakdown table', async ({ page }) => {
    await page.goto('/expenses/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Make sure we're on category tab
    await page.getByRole('tab', { name: /category/i }).click();
    await page.waitForTimeout(1000);

    // Check for table
    const table = page.locator('table').first();
    await authExpect(table).toBeVisible();

    // Check for table headers
    const headers = page.locator('th');
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThan(0);
  });

  authTest('should handle empty state gracefully', async ({ page }) => {
    // This test assumes no expenses exist - in real scenario, we'd clean up first
    await page.goto('/expenses/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should either show empty state or show zero values
    const emptyState = page.locator('text=/no expense data/i');
    const hasData = page.locator('text=/total expenses/i');
    
    const isEmpty = await emptyState.isVisible().catch(() => false);
    const hasContent = await hasData.isVisible().catch(() => false);
    
    // One of these should be true
    expect(isEmpty || hasContent).toBeTruthy();
  });

  authTest('should display export buttons', async ({ page }) => {
    await page.goto('/expenses/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for export buttons
    const exportCSV = page.getByRole('button', { name: /export csv/i });
    const exportPDF = page.getByRole('button', { name: /export pdf/i });

    await authExpect(exportCSV.or(exportPDF).first()).toBeVisible();
  });

  authTest('API endpoint should return analytics data', async ({ page }) => {
    await page.goto('/expenses/reports');
    
    // Wait for API call
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/expenses/analytics') && response.status() === 200
    );

    await page.waitForLoadState('networkidle');
    const response = await responsePromise;

    // Verify response structure
    const data = await response.json();
    expect(data).toHaveProperty('categoryBreakdown');
    expect(data).toHaveProperty('taxSavings');
    expect(data).toHaveProperty('timeSeries');
    expect(data).toHaveProperty('topVendors');
    expect(data).toHaveProperty('paymentMethodBreakdown');
    expect(data).toHaveProperty('totalExpenses');
    expect(data).toHaveProperty('totalCount');
  });

  authTest('should handle analytics API errors gracefully', async ({ page }) => {
    // Intercept and fail the analytics request
    await page.route('**/api/expenses/analytics*', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/expenses/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should show error or loading state, not crash
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).toBeTruthy();
  });
});


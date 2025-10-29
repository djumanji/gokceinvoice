# Playwright Test Suite

## Running Tests

### Prerequisites
1. **Start the development server** before running tests:
   ```bash
   npm run dev
   ```
   The server should be running on `http://localhost:3000`

2. **Run all tests**:
   ```bash
   npm test
   ```

3. **Run specific test file**:
   ```bash
   npm test -- tests/onboarding-wizard.spec.ts
   ```

4. **Run tests in headed mode** (see browser):
   ```bash
   npm test -- --headed
   ```

5. **Run tests with UI mode**:
   ```bash
   npm test -- --ui
   ```

## Test Files

### Onboarding Tests
- `tests/onboarding-wizard.spec.ts` - Tests for the new staged onboarding wizard flow
  - StepBasics validation
  - StepAddClient flow
  - StepAddService flow  
  - StepReview invoice preview
  - Sidebar visibility during onboarding

### E2E Tests
- `tests/e2e-user-journey.spec.ts` - Complete user journey from registration to invoice creation

## Test Structure

Tests are organized by feature area:
- Authentication (`login.spec.ts`, `register.spec.ts`, `email-auth.spec.ts`)
- Onboarding (`onboarding-wizard.spec.ts`)
- Dashboard (`dashboard.spec.ts`)
- Invoices (`invoices.spec.ts`, `create-invoice.spec.ts`)
- Clients (`clients.spec.ts`)
- Services (`services.spec.ts`)
- Expenses (`expenses.spec.ts`, `expense-receipt-upload.spec.ts`)
- Settings (`profile-settings.spec.ts`, `settings-profile-update.spec.ts`)
- Localization (`localization.spec.ts`)

## Common Issues

### Tests fail with "Could not connect to server"
**Solution**: Make sure the dev server is running (`npm run dev`)

### Tests fail with timeout errors
**Solution**: Increase timeout in test file or ensure server is responsive

### Tests fail due to authentication
**Solution**: Some tests require authenticated users - check test setup/teardown

## Writing New Tests

1. Create test file in `tests/` directory: `tests/my-feature.spec.ts`
2. Import Playwright test utilities:
   ```typescript
   import { test, expect } from '@playwright/test';
   ```
3. Use `test.describe` to group related tests
4. Use `test.beforeEach` for setup if needed
5. Write test cases with descriptive names

Example:
```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    await page.goto('http://localhost:3000/my-feature');
    await expect(page.locator('text=Expected Text')).toBeVisible();
  });
});
```
# Playwright Best Practices Guide

This document contains best practices for writing and maintaining Playwright tests in our project.

## 📚 Table of Contents
1. [Locator Strategies](#locator-strategies)
2. [Assertions](#assertions)
3. [Test Organization](#test-organization)
4. [Page Object Model](#page-object-model)
5. [Custom Fixtures](#custom-fixtures)
6. [Debugging](#debugging)
7. [Common Pitfalls](#common-pitfalls)

---

## 🎯 Locator Strategies

### ✅ DO: Use Role-Based Locators

**Why?** Role-based locators (getByRole) match how users interact with your app and are less fragile.

```typescript
// ✅ GOOD
page.getByRole('button', { name: 'Submit' });
page.getByRole('textbox', { name: /email/i });
page.getByRole('link', { name: 'Dashboard' });

// ❌ BAD
page.locator('button.submit-btn');
page.locator('#email');
page.locator('a[href="/dashboard"]');
```

### ✅ DO: Use Test IDs for Dynamic Content

```typescript
// In your React component
<button data-testid="submit-invoice">Submit</button>

// In your test
page.getByTestId('submit-invoice').click();
```

### ✅ DO: Use Text Locators for User-Visible Content

```typescript
// ✅ GOOD
page.getByText('Welcome back!');
page.getByText(/invoice #\d+/); // Regex for dynamic bulletins

// ❌ BAD
page.locator('.welcome-message');
```

---

## ✅ Assertions

### Web-First Assertions (Auto-Wait)

**Always use Playwright's web-first assertions** - they automatically wait for conditions.

```typescript
// ✅ GOOD - Auto-waits until visible or timeout
await expect(page.getByText('Success')).toBeVisible();

// ❌ BAD - Immediately checks, no waiting
const isVisible = await page.getByText('Success').isVisible();
expect(isVisible).toBe(true);
```

### Soft Assertions

Use `expect.soft()` to continue test execution even if some assertions fail.

```typescript
// Check multiple things without stopping on first failure
await expect.soft(page.getByTestId('status')).toHaveText('Success');
await expect.soft(page.getByTestId('count')).toHaveText('10');
await expect.soft(page.getByTestId('date')).toHaveText(/2024/);

// Test continues...
await page.getByRole('button', { name: 'Next' }).click();
```

### Waiting for URLs

```typescript
// ✅ GOOD
await expect(page).toHaveURL(/.*dashboard/);

// ❌ BAD
await page.waitForURL(/.*dashboard/); // Verbose
```

---

## 📁 Test Organization

### Use `beforeEach` for Common Setup

```typescript
test.describe('Dashboard Tests', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
  });

  test('should display invoices', async () => {
    // dashboardPage is ready!
  });

  test('should filter invoices', async () => {
    // dashboardPage is ready!
  });
});
```

### Use `describe` to Group Related Tests

```typescript
test.describe('Invoice Creation', () => {
  test('should create simple invoice', async ({ page }) => {});
  test('should create invoice with items', async ({ page }) => {});
  
  test.describe('with discounts', () => {
    test('should apply percentage discount', async ({ page }) => {});
    test('should apply fixed discount', async ({ page }) => {});
  });
});
```

### Parallel vs Sequential Execution

```typescript
// Run tests in parallel (default, faster)
test.describe('independent tests', () => {
  test('test 1', async () => {});
  test('test 2', async () => {});
});

// Run tests sequentially (when order matters)
test.describe('sequential tests', () => {
  test.describe.configure({ mode: 'serial' });
  
  test('setup', async () => {});
  test('execute', async () => {});
  test('verify', async () => {});
});
```

---

## 🎨 Page Object Model

### Why Use Page Objects?

✅ **Reusability** - Write once, use everywhere  
✅ **Maintainability** - Update in one place when UI changes  
✅ **Readability** - Tests read like user stories

### Structure

```typescript
// page-objects/LoginPage.ts
export class LoginPage {
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;

  constructor(public readonly page: Page) {
    this.emailInput = this.page.getByRole('textbox', { name: /email/i });
    this.passwordInput = this.page.getByRole('textbox', { name: /password/i });
    this.loginButton = this.page.getByRole('button', { name: 'Login' });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}

// In test file
import { LoginPage } from './page-objects/LoginPage';

test('user can login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password');
});
```

---

## 🔧 Custom Fixtures

### Authentication Fixture

```typescript
// fixtures/auth.ts
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  authenticatedUser: async ({ page }, use) => {
    // Setup
    await page.goto('/login');
    await page.getByRole('textbox', { name: /email/i }).fill('test@example.com');
    await page.getByRole('textbox', { name: /password/i }).fill('password');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/.*dashboard/);
    
    await use(undefined);
    
    // Cleanup (optional)
    // await page.goto('/logout');
  },
});

// Use in test
test('create invoice', async ({ authenticatedUser, page }) => {
  // User is already logged in!
  await page.goto('/invoices/new');
});
```

---

## 🐛 Debugging

### Debug Mode

```bash
# Debug all tests
npx playwright test --debug

# Debug specific test
npx playwright test login.spec.ts:10 --debug

# Debug with UI
npx playwright test --ui
```

### Trace Viewer

Your config already has trace enabled! After a failure:

```bash
npx playwright show-report
```

This opens an interactive report with:
- Full execution trace
- DOM snapshots at each step
- Network requests
- Screenshots on failure

### Screenshot on Failure

Already configured in `playwright.config.ts`:
```typescript
screenshot: 'only-on-failure',
```

### Tips

1. **Use `--headed`** to see browser during test
2. **Add `await page.pause()`** to stop test and inspect
3. **Use `test.step()`** to group actions in report

```typescript
await test.step('Fill login form', async () => {
  await page.fill('email', 'test@example.com');
  await page.fill('password', 'test123');
});
```

---

## ⚠️ Common Pitfalls

### ❌ DON'T: Use `waitForTimeout`

```typescript
// ❌ BAD
await page.waitForTimeout(2000); // Arbitrary delay

// ✅ GOOD
await expect(page.getByText('Loading complete')).toBeVisible();
await page.waitForLoadState('networkidle');
```

### ❌ DON'T: Use Manual Waiting

```typescript
// ❌ BAD
while (await page.locator('.spinner').isVisible()) {
  await page.waitForTimeout(500);
}

// ✅ GOOD
await expect(page.locator('.spinner')).not.toBeVisible();
```

### ❌ DON'T: Use Fragile CSS Selectors

```typescript
// ❌ BAD
page.locator('div.container > form > button.btn-primary');

// ✅ GOOD
page.getByRole('button', { name: 'Submit' });
```

### ❌ DON'T: Hardcode Wait Times

```typescript
// ❌ BAD
await page.waitForTimeout(5000); // What if it takes 6 seconds?

// ✅ GOOD
await expect(page.getByText('Success')).toBeVisible({ timeout: 10000 });
```

### ❌ DON'T: Use `page.$` or `page.$$`

```typescript
// ❌ BAD
const element = await page.$('.button');

// ✅ GOOD
const element = page.locator('.button'); // or getByRole
```

---

## 🚀 Configuration Tips

Your `playwright.config.ts` is already well-configured! Here are some additions you might consider:

### 1. Tag Tests for Different Runs

```typescript
// In config
export default defineConfig({
  projects: [
    {
      name: 'flix',
      grep: /@smoke/,
    },
  ],
});

// In test
test('smoke test @smoke', async ({ page }) => {
  // Only runs with --project=smoke
});
```

### 2. Retry Flaky Tests

```typescript
export default defineConfig({
  retries: process.env.CI ? 2 : 0, // Already configured!
  retries: 2, // Or always retry
});
```

### 3. Run Tests on Multiple Browsers

```typescript
export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } }, // Add mobile!
  ],
});
```

---

## 📝 Summary

1. **Use role-based locators** (`getByRole`, `getByTestId`, `getByText`)
2. **Always use web-first assertions** with `await expect()`
3. **Organize tests** with `describe` and `beforeEach`
4. **Use Page Objects** for reusable page interactions
5. **Create custom fixtures** for common setup (like auth)
6. **Avoid timeouts** - use auto-waiting assertions
7. **Debug interactively** with `--debug` and trace viewer

---

## 🔗 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices Guide](https://playwright.dev/docs/best-practices)
- [Locators Guide](https://playwright.dev/docs/locators)
- [Assertions Guide](https://playwright.dev/docs/test-assertions)



# Automated Testing Setup

This project uses Playwright for end-to-end testing with automatic bug tracking and Linear integration.

## 🎯 Features

- ✅ Automated test suite for critical user flows
- 📝 Automatic bug report generation (Markdown)
- 🐛 Linear issue creation from failed tests
- 👀 File watcher for continuous testing
- 📸 Visual regression testing with screenshots

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Playwright Browsers

```bash
npx playwright install
```

### 3. Set Up Linear Integration (Optional)

Add to your `.env` file:

```bash
LINEAR_API_KEY=lin_api_xxxxxxxxxxxxx
LINEAR_TEAM_ID=your-team-id
```

To get your Linear API key:
1. Go to Linear Settings → API
2. Create a new API key
3. Copy the API key

To get your Team ID:
1. Go to Linear → Team Settings
2. Copy the Team ID from the URL or settings

## 📋 Available Scripts

### Run Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests and generate bug report
npm run test:bug-report

# Run tests and sync bugs to Linear
npm run test:sync-linear

# Run full test suite with report and Linear sync
npm run test:full

# Watch for file changes and auto-run tests
npm run test:watch

# View HTML test report
npm run test:report
```

## 🧪 Writing Tests

Tests are located in the `tests/` directory:

```
tests/
├── login.spec.ts          # Login page tests
├── register.spec.ts       # Registration tests
└── lottie-background.spec.ts  # Lottie animation tests
```

### Example Test

```typescript
import { test, expect } from '@playwright/test';

test('should display login form', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('text=Login to InvoiceHub')).toBeVisible();
});
```

## 📊 Bug Reports

Bug reports are automatically generated when tests fail and saved to:

- `test-results/bug-report.md` - Timestamped reports
- `test-results/latest-report.md` - Latest report

### Report Structure

```markdown
# Bug Report

## Summary
- Total Tests: 10
- Passed: 8 ✅
- Failed: 2 ❌

## Failed Tests

### Login form validation
- File: login.spec.ts
- Duration: 150ms
- Error: Timeout waiting for element

## Test Coverage
### login
- ✅ should display login form
- ❌ should validate empty form
```

## 🔗 Linear Integration

When tests fail, issues are automatically created in Linear with:

- **Title**: Test name
- **Description**: Full error details and test information
- **Status**: Open
- **Labels**: Test Failure (if configured)

### Disable Linear Sync

To run tests without syncing to Linear:

```bash
npm run test:bug-report
```

## 👀 Continuous Testing

Start the file watcher to automatically run tests when you make changes:

```bash
npm run test:watch
```

The watcher monitors:
- `client/src/**/*.tsx`
- `client/src/**/*.ts`
- `server/**/*.ts`

## 🎨 Visual Testing

Screenshots are automatically captured:
- On test failures
- For visual regression tests

Saved to: `test-results/`

## 🐛 Debugging Failed Tests

1. Check the bug report: `test-results/latest-report.md`
2. Review screenshots in `test-results/`
3. Run tests in UI mode: `npm run test:ui`
4. Run a specific test file: `npx playwright test tests/login.spec.ts`

## 📝 Best Practices

1. **Keep tests isolated** - Each test should be independent
2. **Use descriptive names** - Test names should explain what they verify
3. **Add waits appropriately** - Wait for elements to be ready
4. **Test user flows** - Focus on how real users interact with the app
5. **Clean up** - Reset state between tests if needed

## 🛠️ CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm run test:full
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
```

## 🔧 Troubleshooting

### Tests fail intermittently

- Increase timeout values
- Add explicit waits for elements
- Check for race conditions

### Linear issues not created

- Verify API key is set correctly
- Check Team ID matches your Linear workspace
- Review `test-results/latest-report.md` for details

### File watcher not working

- Make sure dev server is running
- Check file paths are correct in `scripts/watch-tests.ts`
- Restart the watcher

## 📚 Learn More

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Linear API Documentation](https://developers.linear.app/docs)

## 🎉 Success!

When all tests pass, you'll see:

```
🎉 All tests passed! No bugs detected.
```

Happy testing! 🚀


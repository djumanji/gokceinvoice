# Failed Playwright Tests - Prioritized

## Summary
- **Total Tests**: 219 tests across 3 browsers (chromium, firefox, webkit)
- **Failed Tests**: All tests in `expense-receipt-upload.spec.ts` (7 tests) + additional failures in other test files
- **Root Cause**: The test file has incorrect URL expectations that need to be fixed

---

## 🔴 **CRITICAL PRIORITY**

### 1. **Expense Receipt Upload Tests** (ALL 7 tests failing)
**File**: `tests/expense-receipt-upload.spec.ts`

**Issue**: The test is waiting for navigation to `**/dashboard` but the app redirects to `/` after login.

**Error**: 
```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
waiting for navigation to "**/dashboard" until "load"
```

**Impact**: All expense receipt upload functionality tests fail at the beforeEach setup, preventing verification of this feature.

**Tests Affected**:
1. `should open expense form when Add Expense button is clicked` (line 44)
2. `should display file upload button in expense form` (line 49)
3. `should upload receipt image and show preview` (line 60)
4. `should validate file type` (line 90)
5. `should save expense with receipt` (line 124)
6. `should display receipt in table when present` (line 161)
7. `should allow removing uploaded image` (line 184)

**Fix Required**:
- Line 39: Change `await page.waitForURL('**/dashboard', { timeout: 10000 });` to `await page.waitForURL('/', { timeout: 10000 });`
- OR change to `await page.waitForURL('**/', { timeout: 10000 });`

**Priority Justification**: 
- **Blocker**: All tests in this file fail at setup, so no functionality is being tested
- **Simple Fix**: One line change to fix 7 tests
- **High Value**: Expense receipt upload is a core feature that needs testing

---

## 🟡 **HIGH PRIORITY**

### 2. **Clients Management Tests** (Multiple failures)
**File**: `tests/clients.spec.ts`

**Failed Tests**:
- `should display clients page correctly` (line 10)
- `should open add client dialog` (line 15) - Timeout 30s
- `should be able to fill client form` (line 21) - Timeout 30s
- `should show validation errors for required fields` (line 34) - Timeout 30s

**Issue**: Tests timing out after 30 seconds, suggesting UI elements not appearing or interaction issues.

**Impact**: Client management functionality (CRUD operations) cannot be verified.

**Action Required**: Investigate why client dialog/form is not appearing or not responding to interactions.

---

### 3. **Email Authentication - Password Reset**
**File**: `tests/email-auth.spec.ts`

**Failed Tests**:
- `should display reset password page` (line 103)
- `should handle password reset complete flow` (line 236)

**Issue**: Password reset page display or navigation issues.

**Impact**: Password reset functionality cannot be verified.

**Note**: There are email sending failures in logs (Resend domain not verified), but tests are handling these appropriately in other tests.

---

### 4. **End-to-End User Journey**
**File**: `tests/e2e-user-journey.spec.ts`

**Failed Test**:
- `complete user journey from registration to invoice creation` (line 4)

**Issue**: Complete user flow failure.

**Impact**: Cannot verify the full application flow from registration to invoice creation.

---

## 🟢 **MEDIUM PRIORITY**

### 5. **Email Registration Integration Test**
**File**: `tests/email-auth.spec.ts`

**Skipped/Blocked Test**:
- `should complete full user journey: register → verify → login` (line 193)

**Issue**: Test appears to be skipped in execution.

**Impact**: Cannot verify complete email verification flow.

---

## 📊 **Overall Analysis**

### Test Categories
- ✅ **Passing**: Most basic functionality tests (dashboard, invoices display, localization, login, register forms)
- 🔴 **Blocker**: Expense receipt upload (7 tests) - Simple fix needed
- 🟡 **High Priority**: Client management CRUD, Password reset flow, E2E journey
- 🟢 **Medium Priority**: Email verification integration test

### Root Causes
1. **URL Mismatch**: Tests expect `/dashboard` but app routes to `/` (EXPENSE TESTS)
2. **Timeout Issues**: Client dialog tests timing out at 30s (likely UI element detection issues)
3. **Missing Test Data**: Some tests may need pre-existing data or better setup
4. **Email Service**: Resend domain not verified (affects email tests but handled gracefully)

---

## 🎯 **Recommended Fix Order**

### Immediate (Today)
1. **Fix expense-receipt-upload.spec.ts line 39** - Change `**/dashboard` to `**/` or `/`
   - **Effort**: 1 minute
   - **Impact**: Fixes 7 failing tests
   - **File**: `tests/expense-receipt-upload.spec.ts:39`

### Short Term (This Week)
2. **Investigate client management test timeouts**
   - Check if dialog is appearing
   - Verify selector accuracy
   - Add proper wait conditions
3. **Fix password reset page tests**
   - Verify reset password page renders correctly
   - Check navigation flow
4. **Fix E2E user journey test**
   - Debug step-by-step to find where it fails
   - May need to handle email verification differently in test

### Medium Term (Next Sprint)
5. **Verify email service configuration**
   - Domain verification on Resend
   - Update tests to handle email service availability
6. **Review and improve test stability**
   - Add more reliable selectors
   - Improve wait strategies
   - Consider test data fixtures

---

## 🔍 **Quick Commands**

### Run specific test file:
```bash
npx playwright test expense-receipt-upload.spec.ts
```

### Run in headed mode to debug:
```bash
npx playwright test expense-receipt-upload.spec.ts --headed
```

### Run with UI mode:
```bash
npx playwright test expense-receipt-upload.spec.ts --ui
```

### View HTML report:
```bash
npx playwright show-report
```

---

## 📝 **Notes**

- Most tests (212/219) are passing, which is good
- The expense receipt tests are the biggest issue by count (7 failing tests)
- Client management timeouts suggest UI interaction problems
- Email tests handle service failures gracefully but may need better mocking for local testing
- Overall test suite is in good shape with isolated failures


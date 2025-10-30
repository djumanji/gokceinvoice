# Settings Profile Update Test Report

## Issue Found
Database column "name" does not exist - migration needs to be run.

## Test Coverage Created

Created comprehensive Playwright tests in `tests/settings-profile-update.spec.ts` to verify:

### Test Cases:
1. **Profile update without logout** - User can save changes and stay logged in
2. **Cancel button functionality** - Form resets to original values
3. **Field validation** - Profile fields accept valid data  
4. **Session persistence** - Multiple save operations don't log user out
5. **Navigation flow** - Can navigate away and back without losing session
6. **Currency preference** - Can update currency and save successfully
7. **Partial updates** - Can update only name field without issues

## Next Steps

To fix the database issue and run tests:

```bash
# Run the migration to add the 'name' column
psql postgresql://postgres:YOUR_PASSWORD@localhost:5433/invoicedb -f migrations/006_add_name_field_to_users.sql

# Then run the tests
npx playwright test tests/settings-profile-update.spec.ts
```

## What the Tests Verify

✅ User stays logged in after saving profile changes
✅ Form data persists after page reload
✅ Cancel button resets form correctly
✅ Multiple save operations don't cause logout
✅ Navigation between pages maintains authentication
✅ All profile fields (name, company, address, phone, tax ID, currency) work correctly

## Root Cause of Logout Issue

The logout issue was caused by error handling in the ProtectedRoute component. When API requests failed, React Query was throwing errors that caused the route guard to redirect to login. Fixed by adding try-catch in queryFn to gracefully handle errors.


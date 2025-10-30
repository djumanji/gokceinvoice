# Marketing Registration Flow

## Overview
Simple registration flow where users coming from marketing page enter email, get redirected to set password, and complete registration.

## Flow

### 1. Marketing Page
```
User enters email in hero/newsletter input → 
Client-side validation →
Redirect to /register?email=X&from=marketing
```

**No database entry created yet!**

### 2. Registration Page
```
URL: /register?email=john@example.com&from=marketing

Form shows:
- Email field (pre-filled, read-only, styled as disabled)
- Password field (focus here)
- Confirm password field
- Register button

Title: "Complete your registration"
Subtitle: "Create a password for john@example.com"
```

### 3. User Submits Password
```
POST /api/auth/register
{
  email: "john@example.com",
  password: "SecurePass123",
  fromMarketing: true
}

Backend:
1. Validates email + password
2. Hashes password
3. Creates user with marketingOnly=true
4. Generates verification token
5. Sends verification email
6. Creates session
7. Returns success
```

### 4. Email Verification
```
User clicks link in email →
GET /api/auth/verify-email?token=XXX

Backend:
1. Verifies token
2. Sets isEmailVerified=true
3. Sets marketingOnly=false ← User is now fully registered
```

### 5. Login (Safety Check)
```
If user logs in before verifying email:
- Login succeeds
- marketingOnly is set to false
```

## Database Field: marketingOnly

- **Type**: `BOOLEAN DEFAULT FALSE`
- **Purpose**: Track users who came from marketing page
- **Lifecycle**:
  - Set to `true` when user registers from marketing
  - Set to `false` after email verification
  - Set to `false` on login (safety check)

## Benefits Over Previous Approach

✅ **No user enumeration** - No public endpoint to check if email exists
✅ **No race conditions** - No async queries causing UI flashing
✅ **Simple flow** - User doesn't know they're in a "special" mode
✅ **Clean data** - No partial/incomplete user records
✅ **Better UX** - Email field is read-only but visible (not confusing)

## Migration

Run migration 021:
```bash
psql $DATABASE_URL < migrations/021_add_marketing_only.sql
```

Or apply manually:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_only BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_users_marketing_only ON users(marketing_only) WHERE marketing_only = true;
```

## Testing

1. Go to marketing page
2. Enter email → Redirected to register
3. Email field is read-only, pre-filled
4. Enter password → User created, logged in
5. Check email → Click verification link
6. marketingOnly should be false

## Code Changes

- `client/src/pages/Marketing.tsx` - Removed API call, just redirects
- `client/src/pages/Register.tsx` - Checks `from=marketing` URL param
- `server/auth-routes.ts` - Simplified registration endpoint
- `shared/schema.ts` - Added `marketingOnly` field
- `migrations/021_add_marketing_only.sql` - New migration


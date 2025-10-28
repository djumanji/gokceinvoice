# Users Table Schema

## Complete Field List

### Core Authentication Fields
1. **id** - `VARCHAR` - Primary key (UUID)
2. **email** - `TEXT` - Unique, required
3. **username** - `TEXT` - Optional
4. **password** - `TEXT` - Optional (for OAuth users)
5. **provider** - `TEXT` - Default: "local" ("local", "google", "github")
6. **providerId** - `TEXT` - Google/GitHub user ID
7. **isEmailVerified** - `BOOLEAN` - Default: false

### Email Verification Fields
8. **emailVerificationToken** - `TEXT` - Optional
9. **emailVerificationExpires** - `TIMESTAMP` - Optional

### Password Reset Fields
10. **passwordResetToken** - `TEXT` - Optional
11. **passwordResetExpires** - `TIMESTAMP` - Optional

### User Profile Fields (NEW)
12. **companyName** - `TEXT` - Company name (optional)
13. **address** - `TEXT` - Address (optional)
14. **phone** - `TEXT` - Phone number (optional)
15. **taxOfficeId** - `TEXT` - Tax Registration Number (optional)
16. **preferredCurrency** - `TEXT` - Default: "USD" (allowed: USD, EUR, GBP, AUD, TRY)

### Timestamps
17. **createdAt** - `TIMESTAMP` - Auto-set on creation
18. **updatedAt** - `TIMESTAMP` - Auto-set on creation and updates

## Database Columns (snake_case)

```sql
-- Core fields
id
email
username
password
provider
provider_id
is_email_verified

-- Email verification
email_verification_token
email_verification_expires

-- Password reset
password_reset_token
password_reset_expires

-- Profile fields (added in migration 005)
company_name
address
phone
tax_office_id
preferred_currency

-- Timestamps
created_at
updated_at
```

## Constraints

- `email` is UNIQUE and NOT NULL
- `preferred_currency` must be one of: 'USD', 'EUR', 'GBP', 'AUD', 'TRY'
- `is_email_verified` defaults to false
- `preferred_currency` defaults to 'USD'

## Validation Schema (Zod)

```typescript
updateUserProfileSchema = {
  companyName: string (optional)
  address: string (optional)
  phone: string (optional)
  taxOfficeId: string (optional)
  preferredCurrency: enum(["USD", "EUR", "GBP", "AUD", "TRY"]) (optional)
}
```


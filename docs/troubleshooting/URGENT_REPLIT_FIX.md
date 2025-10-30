# ⚠️ URGENT: Fix Production Error

## Problem
Production is returning 500 errors on registration because the database is missing these columns:
- `email_verification_token`
- `email_verification_expires`
- `password_reset_token`
- `password_reset_expires`
- `name`
- `company_name`
- `address`
- `phone`
- `tax_office_id`

## Solution: Run Migrations in Neon Console

### Step 1: Go to Neon Console
1. Open https://console.neon.tech
2. Select your project
3. Click on **"SQL Editor"**

### Step 2: Run These Migrations

Run these SQL statements **ONE BY ONE** in the SQL Editor:

```sql
-- 1. Add email verification fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP;

-- 2. Add password reset fields  
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;

-- 3. Add user profile fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS tax_office_id TEXT;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token 
  ON users(email_verification_token) 
  WHERE email_verification_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_password_reset_token 
  ON users(password_reset_token) 
  WHERE password_reset_token IS NOT NULL;

-- 5. Create expenses table if it doesn't exist
CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL DEFAULT NOW(),
  payment_method TEXT DEFAULT 'other',
  vendor TEXT,
  is_tax_deductible BOOLEAN DEFAULT true,
  receipt TEXT,
  tags TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);

-- 6. Create bank_accounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS bank_accounts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_holder_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT,
  iban TEXT,
  swift_code TEXT,
  bank_address TEXT,
  bank_branch TEXT,
  currency TEXT DEFAULT 'USD',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_accounts_is_default 
  ON bank_accounts(user_id, is_default) 
  WHERE is_default = TRUE;
```

### Step 3: Verify

After running all the SQL, verify the columns exist:

```sql
\d users
```

You should see all the new columns listed.

### Step 4: Restart Replit

Go back to Replit and **stop and restart** your Repl.

## Quick Copy-Paste Version (Run all at once)

Copy this entire block and paste into Neon SQL Editor:

```sql
-- Add all missing columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS tax_office_id TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token) WHERE email_verification_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL DEFAULT NOW(),
  payment_method TEXT DEFAULT 'other',
  vendor TEXT,
  is_tax_deductible BOOLEAN DEFAULT true,
  receipt TEXT,
  tags TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);

-- Create bank_accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_holder_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT,
  iban TEXT,
  swift_code TEXT,
  bank_address TEXT,
  bank_branch TEXT,
  currency TEXT DEFAULT 'USD',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_accounts_is_default ON bank_accounts(user_id, is_default) WHERE is_default = TRUE;
```


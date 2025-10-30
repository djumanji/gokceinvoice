-- Migration: Add bank_accounts table
-- This migration creates a separate table for multiple bank accounts per user
-- Each bank account can have a different currency

-- Drop the bank-related columns from users table if they exist
ALTER TABLE users DROP COLUMN IF EXISTS bank_name;
ALTER TABLE users DROP COLUMN IF EXISTS account_holder_name;
ALTER TABLE users DROP COLUMN IF EXISTS account_number;
ALTER TABLE users DROP COLUMN IF EXISTS iban;
ALTER TABLE users DROP COLUMN IF EXISTS swift_code;
ALTER TABLE users DROP COLUMN IF EXISTS bank_address;
ALTER TABLE users DROP COLUMN IF EXISTS bank_branch;

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
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_is_default ON bank_accounts(user_id, is_default) WHERE is_default = true;


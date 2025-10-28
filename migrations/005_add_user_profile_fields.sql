-- Migration: Add User Profile Fields
-- Description: Adds profile fields to the users table for company information

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_office_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'USD';

-- Add check constraint to ensure preferred_currency is valid
ALTER TABLE users ADD CONSTRAINT check_preferred_currency 
  CHECK (preferred_currency IS NULL OR preferred_currency IN ('USD', 'EUR', 'GBP', 'AUD', 'TRY'));

-- Add comment to table
COMMENT ON COLUMN users.company_name IS 'Company name for the user';
COMMENT ON COLUMN users.address IS 'Company or personal address';
COMMENT ON COLUMN users.phone IS 'Contact phone number';
COMMENT ON COLUMN users.tax_office_id IS 'Tax Registration Number / Tax Office ID';
COMMENT ON COLUMN users.preferred_currency IS 'Preferred currency for invoices and financial data';


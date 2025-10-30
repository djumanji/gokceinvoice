-- Migration: Add User Profile Fields
-- Description: Adds profile fields to the users table for company information

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_office_id TEXT;

-- Add comments to columns
COMMENT ON COLUMN users.company_name IS 'Company name for the user';
COMMENT ON COLUMN users.address IS 'Company or personal address';
COMMENT ON COLUMN users.phone IS 'Contact phone number';
COMMENT ON COLUMN users.tax_office_id IS 'Tax Registration Number / Tax Office ID';


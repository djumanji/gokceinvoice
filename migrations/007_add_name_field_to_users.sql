-- Add name field to users table for profile/invoice generation
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;

-- Add comment
COMMENT ON COLUMN users.name IS 'User''s full name for profile and invoice generation';


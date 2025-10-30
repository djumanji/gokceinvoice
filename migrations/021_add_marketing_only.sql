-- Add marketing_only column to users table
-- This field tracks users who signed up from marketing page but haven't set password yet
ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_only BOOLEAN DEFAULT FALSE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_marketing_only ON users(marketing_only) WHERE marketing_only = true;


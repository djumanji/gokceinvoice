-- Migration: Add email verification and password reset fields
-- Created: 2025-01-28

-- Add email verification fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP;

-- Add password reset fields  
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token) WHERE email_verification_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;

-- Add comments
COMMENT ON COLUMN users.email_verification_token IS 'Token sent to user email for verification';
COMMENT ON COLUMN users.email_verification_expires IS 'Expiration timestamp for email verification token';
COMMENT ON COLUMN users.password_reset_token IS 'Token sent to user email for password reset';
COMMENT ON COLUMN users.password_reset_expires IS 'Expiration timestamp for password reset token';



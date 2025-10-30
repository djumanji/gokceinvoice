-- Migration: Add invite-only system
-- Adds invite tokens, waitlist, and user invite tracking

-- Add invite-related fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS available_invites INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS invited_by_user_id VARCHAR REFERENCES users(id);

-- Create invite_status enum
DO $$ BEGIN
  CREATE TYPE invite_status AS ENUM ('pending', 'used', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create invite_tokens table
CREATE TABLE IF NOT EXISTS invite_tokens (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  token TEXT UNIQUE NOT NULL,
  sender_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status invite_status DEFAULT 'pending',
  recipient_email TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP,
  expires_at TIMESTAMP
);

-- Create index on token for fast lookups
CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_sender ON invite_tokens(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_status ON invite_tokens(status);

-- Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  source TEXT
);

-- Create index on waitlist email
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);

-- Set default invites for existing users (if any)
UPDATE users SET available_invites = 1 WHERE available_invites IS NULL;

-- Migration: Add short 5-character code to invite_tokens table
-- This allows human-friendly invite codes while maintaining UUID tokens internally

-- Add code column (unique, 5 characters)
ALTER TABLE invite_tokens
ADD COLUMN IF NOT EXISTS code VARCHAR(5) UNIQUE;

-- Create index for faster code lookups
CREATE INDEX IF NOT EXISTS idx_invite_tokens_code ON invite_tokens(code);

-- Note: Existing tokens will have NULL codes. New tokens will be generated with codes.
-- Existing tokens can still be validated by their full token if needed.

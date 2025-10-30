-- =========================================================
-- PROSPECT SYSTEM MIGRATION
-- Priority: P1 - Feature Enhancement
-- Impact: Adds prospect tracking for email-only users
-- Downtime: None
-- =========================================================

-- Add is_prospect column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_prospect BOOLEAN DEFAULT FALSE;

-- Create index on is_prospect for efficient querying
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_prospect
  ON users(is_prospect)
  WHERE is_prospect = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN users.is_prospect IS 'Flag to identify users created as prospects (email-only signups)';

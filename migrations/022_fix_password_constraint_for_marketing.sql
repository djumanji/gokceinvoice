-- =========================================================
-- FIX PASSWORD CONSTRAINT FOR MARKETING USERS
-- Priority: P1 - Critical Fix
-- Impact: Allow marketing-only users to have NULL password temporarily
-- =========================================================

BEGIN;

-- Drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_password_for_local;

-- Add updated constraint that allows marketing-only users to have NULL password
-- This allows:
-- 1. OAuth users (provider != 'local') - no password required
-- 2. Local users (provider = 'local' AND marketing_only = false) - password required
-- 3. Marketing-only users (provider = 'local' AND marketing_only = true) - password can be NULL temporarily
ALTER TABLE users ADD CONSTRAINT check_password_for_local
  CHECK (provider != 'local' OR password IS NOT NULL OR marketing_only = true);

COMMIT;

-- =========================================================
-- VALIDATION QUERY
-- =========================================================

-- Check for users with invalid data
-- This should return no rows after the fix
SELECT id, email, provider, password IS NOT NULL as has_password, 
       marketing_only, provider_id IS NOT NULL as has_provider_id
FROM users
WHERE (provider = 'local' AND password IS NULL AND marketing_only = false)
   OR (provider != 'local' AND provider_id IS NULL);


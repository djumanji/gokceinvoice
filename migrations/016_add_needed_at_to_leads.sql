-- Migration: Add needed_at timestamp to leads table
-- Adds the needed_at field to capture when service is required

-- ============================================================================
-- ADD needed_at COLUMN TO LEADS TABLE
-- ============================================================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS needed_at TIMESTAMP NULL;

-- ============================================================================
-- ADD INDEX FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_leads_needed_at ON leads(needed_at);

-- ============================================================================
-- HOUSEKEEPING
-- ============================================================================

-- Backfill: none required for MVP. Existing rows will have NULLs for new field.

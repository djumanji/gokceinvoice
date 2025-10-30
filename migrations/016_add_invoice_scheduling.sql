-- =========================================================
-- INVOICE SCHEDULING MIGRATION
-- Priority: P1 - Feature Enhancement
-- Impact: Adds scheduled invoice functionality
-- Downtime: None
-- =========================================================

-- Add scheduled_date column to invoices table
ALTER TABLE invoices ADD COLUMN scheduled_date TIMESTAMP;

-- Create index on scheduled_date for efficient querying of upcoming scheduled invoices
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_scheduled_date
  ON invoices(scheduled_date)
  WHERE scheduled_date IS NOT NULL;

-- Update the status check constraint to include 'scheduled'
-- First drop the existing constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'check_invoice_status_valid'
    AND table_name = 'invoices'
  ) THEN
    ALTER TABLE invoices DROP CONSTRAINT check_invoice_status_valid;
  END IF;
END $$;

-- Add the updated status constraint
ALTER TABLE invoices ADD CONSTRAINT check_invoice_status_valid
  CHECK (status IN ('draft', 'scheduled', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled', 'refunded'));

-- Add validation constraint to ensure scheduled_date is in the future when status is 'scheduled'
ALTER TABLE invoices ADD CONSTRAINT check_scheduled_date_future
  CHECK (
    (status != 'scheduled' AND scheduled_date IS NULL) OR
    (status = 'scheduled' AND scheduled_date IS NOT NULL AND scheduled_date > CURRENT_TIMESTAMP)
  );

-- Add validation to ensure scheduled_date is not in the past when provided
ALTER TABLE invoices ADD CONSTRAINT check_scheduled_date_not_past
  CHECK (scheduled_date IS NULL OR scheduled_date > CURRENT_TIMESTAMP - INTERVAL '1 hour');

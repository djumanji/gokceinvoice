-- Migration: Add bank_account_id to invoices
-- Description: Add foreign key reference to bank_accounts table

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS bank_account_id VARCHAR REFERENCES bank_accounts(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_invoices_bank_account_id ON invoices(bank_account_id) WHERE bank_account_id IS NOT NULL;


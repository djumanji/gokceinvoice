-- =========================================================
-- RECURRING INVOICES MIGRATION
-- Priority: P1 - Feature Enhancement
-- Impact: Adds recurring invoice functionality
-- Downtime: None
-- =========================================================

-- Create recurring_invoices table
CREATE TABLE IF NOT EXISTS recurring_invoices (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id VARCHAR NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  bank_account_id VARCHAR REFERENCES bank_accounts(id) ON DELETE SET NULL,
  template_name VARCHAR(255) NOT NULL,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  next_generation_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create recurring_invoice_items table
CREATE TABLE IF NOT EXISTS recurring_invoice_items (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  recurring_invoice_id VARCHAR NOT NULL REFERENCES recurring_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

-- Add recurring_invoice_id column to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS recurring_invoice_id VARCHAR REFERENCES recurring_invoices(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_user ON recurring_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_client ON recurring_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_next_generation ON recurring_invoices(next_generation_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_recurring_invoice_items_recurring ON recurring_invoice_items(recurring_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_recurring ON invoices(recurring_invoice_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_recurring_invoice_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_recurring_invoices_updated_at ON recurring_invoices;
CREATE TRIGGER update_recurring_invoices_updated_at
  BEFORE UPDATE ON recurring_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_recurring_invoice_updated_at();

-- Add payments table and payment tracking to invoices
-- This enables recording payments received for invoices

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id VARCHAR NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  payment_date TIMESTAMP NOT NULL DEFAULT NOW(),
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'debit_card', 'check', 'paypal', 'stripe', 'other')),
  transaction_id VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add payment tracking fields to invoices table
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2) DEFAULT 0 NOT NULL CHECK (amount_paid >= 0),
ADD COLUMN IF NOT EXISTS paid_date TIMESTAMP;

-- Create index for querying payments by invoice
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);

-- Create index for payment date queries
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);

-- Add comment explaining the payment flow
COMMENT ON TABLE payments IS 'Records individual payments received for invoices. Multiple payments can be recorded per invoice for partial payments.';
COMMENT ON COLUMN invoices.amount_paid IS 'Total amount paid towards this invoice (sum of all payments)';
COMMENT ON COLUMN invoices.paid_date IS 'Date when invoice was fully paid (when amount_paid >= total)';

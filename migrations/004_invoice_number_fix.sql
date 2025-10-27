-- =========================================================
-- FIX INVOICE NUMBER RACE CONDITION
-- Priority: P0 - Critical Data Integrity Issue
-- Impact: Prevents duplicate invoice numbers under concurrent creation
-- Downtime: Minimal
-- =========================================================

-- PROBLEM: Current implementation reads max invoice number then inserts
-- Under concurrent requests, two transactions can read the same number
-- and create duplicate invoice numbers

-- SOLUTION: Use PostgreSQL sequences per user with advisory locks
-- or use a safer atomic pattern

BEGIN;

-- =========================================================
-- OPTION 1: USER-SPECIFIC SEQUENCES (Recommended)
-- =========================================================

-- Create a table to track per-user invoice sequences
CREATE TABLE IF NOT EXISTS invoice_sequences (
  user_id VARCHAR NOT NULL PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_invoice_sequences_user_id ON invoice_sequences(user_id);

-- Function to get next invoice number atomically
CREATE OR REPLACE FUNCTION get_next_invoice_number(p_user_id VARCHAR)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  invoice_num TEXT;
BEGIN
  -- Insert or update atomically using INSERT ... ON CONFLICT
  INSERT INTO invoice_sequences (user_id, last_number)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_number = invoice_sequences.last_number + 1,
    updated_at = NOW()
  RETURNING last_number INTO next_num;

  -- Format the invoice number
  invoice_num := 'INV-' || LPAD(next_num::TEXT, 6, '0');

  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- OPTION 2: ADVISORY LOCKS (Alternative for existing data)
-- =========================================================

-- Function using advisory locks (if you prefer not to add a new table)
CREATE OR REPLACE FUNCTION get_next_invoice_number_with_lock(p_user_id VARCHAR)
RETURNS TEXT AS $$
DECLARE
  lock_id BIGINT;
  last_num INTEGER;
  next_num INTEGER;
  invoice_num TEXT;
BEGIN
  -- Generate a unique lock ID from user_id (hash to bigint)
  lock_id := ABS(HASHTEXT(p_user_id));

  -- Acquire advisory lock for this user
  PERFORM pg_advisory_xact_lock(lock_id);

  -- Get the last invoice number for this user
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(invoice_number FROM 'INV-(\d+)') AS INTEGER)),
    0
  )
  INTO last_num
  FROM invoices
  WHERE user_id = p_user_id;

  -- Calculate next number
  next_num := last_num + 1;

  -- Format the invoice number
  invoice_num := 'INV-' || LPAD(next_num::TEXT, 6, '0');

  -- Lock is automatically released at transaction end
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- INITIALIZE SEQUENCES FOR EXISTING USERS
-- =========================================================

-- Populate invoice_sequences with current max numbers
INSERT INTO invoice_sequences (user_id, last_number)
SELECT
  user_id,
  COALESCE(
    MAX(CAST(SUBSTRING(invoice_number FROM 'INV-(\d+)') AS INTEGER)),
    0
  ) as last_number
FROM invoices
WHERE user_id IS NOT NULL
GROUP BY user_id
ON CONFLICT (user_id) DO NOTHING;

-- =========================================================
-- TRIGGER TO AUTO-INCREMENT ON INVOICE INSERT
-- =========================================================

-- Optional: Automatically generate invoice number if not provided
CREATE OR REPLACE FUNCTION auto_generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := get_next_invoice_number(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_invoice_number();

COMMIT;

-- =========================================================
-- USAGE IN APPLICATION CODE
-- =========================================================

-- TypeScript/Node.js example for postgres-storage.ts:
/*
async getNextInvoiceNumber(userId: string): Promise<string> {
  // Use the function instead of querying and incrementing
  const result = await this.db.execute(
    sql`SELECT get_next_invoice_number(${userId}) as invoice_number`
  );
  return result.rows[0].invoice_number;
}
*/

-- =========================================================
-- TESTING THE FIX
-- =========================================================

-- Test 1: Sequential number generation
-- SELECT get_next_invoice_number('test-user-1'); -- Returns INV-000001
-- SELECT get_next_invoice_number('test-user-1'); -- Returns INV-000002
-- SELECT get_next_invoice_number('test-user-1'); -- Returns INV-000003

-- Test 2: Concurrent requests (simulate with multiple connections)
-- Connection 1: SELECT get_next_invoice_number('test-user-1');
-- Connection 2: SELECT get_next_invoice_number('test-user-1');
-- Should return different numbers (no duplicates)

-- Test 3: Verify no duplicates in production
-- SELECT invoice_number, COUNT(*)
-- FROM invoices
-- GROUP BY invoice_number
-- HAVING COUNT(*) > 1;
-- Should return no rows

-- =========================================================
-- ROLLBACK PLAN
-- =========================================================

-- If issues occur, rollback with:
-- DROP TRIGGER IF EXISTS trigger_auto_invoice_number ON invoices;
-- DROP FUNCTION IF EXISTS auto_generate_invoice_number();
-- DROP FUNCTION IF EXISTS get_next_invoice_number(VARCHAR);
-- DROP FUNCTION IF EXISTS get_next_invoice_number_with_lock(VARCHAR);
-- DROP TABLE IF EXISTS invoice_sequences;

-- =========================================================
-- MONITORING
-- =========================================================

-- Query to check invoice number distribution
SELECT
  user_id,
  COUNT(*) as invoice_count,
  MIN(invoice_number) as first_invoice,
  MAX(invoice_number) as last_invoice
FROM invoices
GROUP BY user_id
ORDER BY invoice_count DESC;

-- Query to detect gaps in invoice numbers (potential issue)
WITH numbered_invoices AS (
  SELECT
    user_id,
    CAST(SUBSTRING(invoice_number FROM 'INV-(\d+)') AS INTEGER) as num,
    invoice_number
  FROM invoices
  WHERE invoice_number LIKE 'INV-%'
),
expected_sequences AS (
  SELECT
    user_id,
    GENERATE_SERIES(
      MIN(num),
      MAX(num)
    ) as expected_num
  FROM numbered_invoices
  GROUP BY user_id
)
SELECT
  e.user_id,
  e.expected_num,
  'INV-' || LPAD(e.expected_num::TEXT, 6, '0') as missing_invoice_number
FROM expected_sequences e
LEFT JOIN numbered_invoices n
  ON e.user_id = n.user_id
  AND e.expected_num = n.num
WHERE n.num IS NULL
ORDER BY e.user_id, e.expected_num;

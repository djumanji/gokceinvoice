-- =========================================================
-- DATA INTEGRITY CONSTRAINTS MIGRATION
-- Priority: P1 - High Priority
-- Impact: Prevent data corruption, enforce business rules
-- Downtime: Minimal (validation on existing data)
-- =========================================================

-- IMPORTANT: Before running this migration:
-- 1. Backup your database
-- 2. Verify no existing data violates these constraints
-- 3. Clean up any invalid data first
-- 4. Test on staging environment

BEGIN;

-- =========================================================
-- USERS TABLE CONSTRAINTS
-- =========================================================

-- Ensure local users have passwords
ALTER TABLE users ADD CONSTRAINT check_password_for_local
  CHECK (provider != 'local' OR password IS NOT NULL);

-- Ensure OAuth users have provider IDs
ALTER TABLE users ADD CONSTRAINT check_provider_id_for_oauth
  CHECK (provider = 'local' OR provider_id IS NOT NULL);

-- Email format validation (basic)
ALTER TABLE users ADD CONSTRAINT check_email_format
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- =========================================================
-- CLIENTS TABLE CONSTRAINTS
-- =========================================================

-- Payment terms must be reasonable (1-365 days)
ALTER TABLE clients ADD CONSTRAINT check_payment_terms_range
  CHECK (payment_terms > 0 AND payment_terms <= 365);

-- Currency must be 3-letter ISO code
ALTER TABLE clients ADD CONSTRAINT check_currency_iso_format
  CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$');

-- Email format validation
ALTER TABLE clients ADD CONSTRAINT check_client_email_format
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- Website URL format validation (if provided)
ALTER TABLE clients ADD CONSTRAINT check_website_url_format
  CHECK (website IS NULL OR website ~ '^https?://');

-- =========================================================
-- INVOICES TABLE CONSTRAINTS
-- =========================================================

-- Tax rate must be between 0 and 100
ALTER TABLE invoices ADD CONSTRAINT check_tax_rate_range
  CHECK (tax_rate >= 0 AND tax_rate <= 100);

-- All monetary amounts must be non-negative
ALTER TABLE invoices ADD CONSTRAINT check_positive_amounts
  CHECK (subtotal >= 0 AND tax >= 0 AND total >= 0);

-- Total must equal subtotal + tax (within rounding tolerance)
ALTER TABLE invoices ADD CONSTRAINT check_total_calculation
  CHECK (ABS(total - (subtotal + tax)) < 0.01);

-- Tax must equal subtotal * taxRate / 100 (within rounding tolerance)
ALTER TABLE invoices ADD CONSTRAINT check_tax_calculation
  CHECK (ABS(tax - (subtotal * tax_rate / 100)) < 0.01);

-- Invoice date cannot be in the far future (more than 1 year ahead)
ALTER TABLE invoices ADD CONSTRAINT check_invoice_date_reasonable
  CHECK (date <= CURRENT_TIMESTAMP + INTERVAL '1 year');

-- Status must be one of the valid values
ALTER TABLE invoices ADD CONSTRAINT check_invoice_status_valid
  CHECK (status IN ('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled', 'refunded'));

-- =========================================================
-- LINE ITEMS TABLE CONSTRAINTS
-- =========================================================

-- Quantity must be positive
ALTER TABLE line_items ADD CONSTRAINT check_quantity_positive
  CHECK (quantity > 0);

-- Price must be non-negative
ALTER TABLE line_items ADD CONSTRAINT check_price_non_negative
  CHECK (price >= 0);

-- Amount must equal quantity * price (within rounding tolerance)
ALTER TABLE line_items ADD CONSTRAINT check_amount_calculation
  CHECK (ABS(amount - (quantity * price)) < 0.01);

-- Description cannot be empty
ALTER TABLE line_items ADD CONSTRAINT check_description_not_empty
  CHECK (LENGTH(TRIM(description)) > 0);

-- =========================================================
-- SERVICES TABLE CONSTRAINTS
-- =========================================================

-- Price must be non-negative
ALTER TABLE services ADD CONSTRAINT check_service_price_non_negative
  CHECK (price >= 0);

-- Name cannot be empty
ALTER TABLE services ADD CONSTRAINT check_service_name_not_empty
  CHECK (LENGTH(TRIM(name)) > 0);

-- Unit must be one of valid values
ALTER TABLE services ADD CONSTRAINT check_service_unit_valid
  CHECK (unit IN ('item', 'hour', 'day', 'week', 'month', 'year', 'unit', 'service'));

COMMIT;

-- =========================================================
-- VALIDATION QUERIES
-- =========================================================

-- Check for users with invalid data
SELECT id, email, provider, password IS NOT NULL as has_password, provider_id IS NOT NULL as has_provider_id
FROM users
WHERE (provider = 'local' AND password IS NULL)
   OR (provider != 'local' AND provider_id IS NULL);

-- Check for clients with invalid payment terms
SELECT id, name, payment_terms
FROM clients
WHERE payment_terms <= 0 OR payment_terms > 365;

-- Check for invoices with calculation mismatches
SELECT id, invoice_number, subtotal, tax, tax_rate, total,
       (subtotal + tax) as calculated_total,
       ABS(total - (subtotal + tax)) as total_diff,
       ABS(tax - (subtotal * tax_rate / 100)) as tax_diff
FROM invoices
WHERE ABS(total - (subtotal + tax)) >= 0.01
   OR ABS(tax - (subtotal * tax_rate / 100)) >= 0.01;

-- Check for line items with calculation mismatches
SELECT id, description, quantity, price, amount,
       (quantity * price) as calculated_amount,
       ABS(amount - (quantity * price)) as diff
FROM line_items
WHERE ABS(amount - (quantity * price)) >= 0.01;

-- Check for invalid invoice statuses
SELECT id, invoice_number, status
FROM invoices
WHERE status NOT IN ('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled', 'refunded');

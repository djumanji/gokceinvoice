-- =========================================================
-- ROW-LEVEL SECURITY (RLS) MIGRATION
-- Priority: P0 - Critical Security Issue
-- Impact: Database-level multi-tenant isolation
-- Downtime: None
-- =========================================================

-- IMPORTANT: This provides defense-in-depth security
-- Application-level filtering is still required but this adds
-- database-level enforcement to prevent security breaches

-- WARNING: After enabling RLS, all queries must set the
-- current user context using: SET LOCAL app.user_id = 'user-uuid';

BEGIN;

-- =========================================================
-- ENABLE ROW-LEVEL SECURITY ON ALL TENANT TABLES
-- =========================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Users table doesn't need RLS as it's not multi-tenant
-- Each user can only see their own record via session management

-- =========================================================
-- CLIENTS TABLE POLICIES
-- =========================================================

-- SELECT: Users can only see their own clients
CREATE POLICY clients_select_policy ON clients
  FOR SELECT
  USING (user_id::text = current_setting('app.user_id', true));

-- INSERT: Users can only create clients for themselves
CREATE POLICY clients_insert_policy ON clients
  FOR INSERT
  WITH CHECK (user_id::text = current_setting('app.user_id', true));

-- UPDATE: Users can only update their own clients
CREATE POLICY clients_update_policy ON clients
  FOR UPDATE
  USING (user_id::text = current_setting('app.user_id', true))
  WITH CHECK (user_id::text = current_setting('app.user_id', true));

-- DELETE: Users can only delete their own clients
CREATE POLICY clients_delete_policy ON clients
  FOR DELETE
  USING (user_id::text = current_setting('app.user_id', true));

-- =========================================================
-- INVOICES TABLE POLICIES
-- =========================================================

-- SELECT: Users can only see their own invoices
CREATE POLICY invoices_select_policy ON invoices
  FOR SELECT
  USING (user_id::text = current_setting('app.user_id', true));

-- INSERT: Users can only create invoices for themselves
-- AND the client must belong to the same user (prevents cross-tenant data leak)
CREATE POLICY invoices_insert_policy ON invoices
  FOR INSERT
  WITH CHECK (
    user_id::text = current_setting('app.user_id', true)
    AND client_id IN (
      SELECT id FROM clients WHERE user_id::text = current_setting('app.user_id', true)
    )
  );

-- UPDATE: Users can only update their own invoices
-- AND cannot change to a client that doesn't belong to them
CREATE POLICY invoices_update_policy ON invoices
  FOR UPDATE
  USING (user_id::text = current_setting('app.user_id', true))
  WITH CHECK (
    user_id::text = current_setting('app.user_id', true)
    AND client_id IN (
      SELECT id FROM clients WHERE user_id::text = current_setting('app.user_id', true)
    )
  );

-- DELETE: Users can only delete their own invoices
CREATE POLICY invoices_delete_policy ON invoices
  FOR DELETE
  USING (user_id::text = current_setting('app.user_id', true));

-- =========================================================
-- LINE ITEMS TABLE POLICIES
-- =========================================================
-- Line items are secured indirectly through invoice ownership

-- SELECT: Users can only see line items for their own invoices
CREATE POLICY line_items_select_policy ON line_items
  FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE user_id::text = current_setting('app.user_id', true)
    )
  );

-- INSERT: Users can only create line items for their own invoices
CREATE POLICY line_items_insert_policy ON line_items
  FOR INSERT
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE user_id::text = current_setting('app.user_id', true)
    )
  );

-- UPDATE: Users can only update line items for their own invoices
CREATE POLICY line_items_update_policy ON line_items
  FOR UPDATE
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE user_id::text = current_setting('app.user_id', true)
    )
  )
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE user_id::text = current_setting('app.user_id', true)
    )
  );

-- DELETE: Users can only delete line items for their own invoices
CREATE POLICY line_items_delete_policy ON line_items
  FOR DELETE
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE user_id::text = current_setting('app.user_id', true)
    )
  );

-- =========================================================
-- SERVICES TABLE POLICIES
-- =========================================================

-- SELECT: Users can only see their own services
CREATE POLICY services_select_policy ON services
  FOR SELECT
  USING (user_id::text = current_setting('app.user_id', true));

-- INSERT: Users can only create services for themselves
CREATE POLICY services_insert_policy ON services
  FOR INSERT
  WITH CHECK (user_id::text = current_setting('app.user_id', true));

-- UPDATE: Users can only update their own services
CREATE POLICY services_update_policy ON services
  FOR UPDATE
  USING (user_id::text = current_setting('app.user_id', true))
  WITH CHECK (user_id::text = current_setting('app.user_id', true));

-- DELETE: Users can only delete their own services
CREATE POLICY services_delete_policy ON services
  FOR DELETE
  USING (user_id::text = current_setting('app.user_id', true));

COMMIT;

-- =========================================================
-- TESTING RLS POLICIES
-- =========================================================

-- Test 1: Create two test users
-- INSERT INTO users (id, email, password) VALUES
--   ('test-user-1', 'user1@test.com', 'hash1'),
--   ('test-user-2', 'user2@test.com', 'hash2');

-- Test 2: Set context to user 1 and create a client
-- SET LOCAL app.user_id = 'test-user-1';
-- INSERT INTO clients (user_id, name, email) VALUES
--   ('test-user-1', 'User 1 Client', 'client1@test.com');

-- Test 3: Try to see clients as user 2 (should return empty)
-- SET LOCAL app.user_id = 'test-user-2';
-- SELECT * FROM clients; -- Should return no rows

-- Test 4: Reset context
-- RESET app.user_id;

-- =========================================================
-- HELPER FUNCTION FOR APPLICATION CODE
-- =========================================================

-- Create a helper function to execute queries with user context
CREATE OR REPLACE FUNCTION execute_as_user(user_uuid TEXT, query TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('SET LOCAL app.user_id = %L', user_uuid);
  EXECUTE query;
  RESET app.user_id;
END;
$$ LANGUAGE plpgsql;

-- Usage in application:
-- BEGIN;
-- SET LOCAL app.user_id = 'user-uuid-here';
-- -- Execute queries
-- COMMIT;

-- =========================================================
-- PERFORMANCE NOTE
-- =========================================================
-- RLS policies add a WHERE clause to every query
-- The indexes created in 001_critical_indexes.sql
-- ensure these additional filters are performant

-- =========================================================
-- DISABLING RLS (for superuser/admin operations)
-- =========================================================
-- If you need to bypass RLS for administrative tasks:
-- SET ROLE postgres; -- or another superuser
-- Or grant BYPASSRLS attribute to specific roles

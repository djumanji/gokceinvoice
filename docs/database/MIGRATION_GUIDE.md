# Database Migration Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the database optimizations identified in the assessment. Follow the phases in order to ensure safe deployment.

---

## Prerequisites

### Before You Begin

1. **Backup Your Database**
   ```bash
   # Using pg_dump
   pg_dump -h localhost -U postgres -d invoicedb > backup_$(date +%Y%m%d_%H%M%S).sql

   # Or using pg_basebackup
   pg_basebackup -h localhost -D /backup/base/$(date +%Y%m%d) -F tar -z -P
   ```

2. **Set Up Staging Environment**
   - Create a copy of production database
   - Test all migrations on staging first
   - Verify application functionality after each migration

3. **Check Database Connection**
   ```bash
   psql $DATABASE_URL -c "SELECT version();"
   ```

4. **Install Required Tools**
   ```bash
   npm install -g drizzle-kit
   npm install drizzle-orm postgres
   ```

---

## Phase 1: Critical Performance Fixes (Week 1)

**Estimated Time**: 2-4 hours
**Downtime**: None
**Risk Level**: Low

### Step 1.1: Apply Index Migrations

```bash
# Run the critical indexes migration
psql $DATABASE_URL -f migrations/001_critical_indexes.sql

# Verify indexes were created
psql $DATABASE_URL -c "
SELECT
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
"
```

**Expected Output**: 15-20 new indexes
**Index Size**: ~50-200MB depending on data volume
**Creation Time**: 5-30 minutes with CONCURRENTLY

### Step 1.2: Verify Query Performance

```bash
# Enable query timing
psql $DATABASE_URL -c "
SET track_activity_query_size = 8192;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
"

# Benchmark before and after
# Test: Get all invoices for a user (should be <5ms with index)
psql $DATABASE_URL -c "
EXPLAIN ANALYZE
SELECT * FROM invoices WHERE user_id = 'test-user-id';
"
```

**Success Criteria**:
- Query execution time reduced by 90%+
- Index scans instead of sequential scans
- No errors or warnings

### Step 1.3: Fix Invoice Number Race Condition

```bash
# Apply invoice number fix
psql $DATABASE_URL -f migrations/004_invoice_number_fix.sql

# Test the function
psql $DATABASE_URL -c "
SELECT get_next_invoice_number('test-user-id');
SELECT get_next_invoice_number('test-user-id');
SELECT get_next_invoice_number('test-user-id');
"
```

**Expected Output**: INV-000001, INV-000002, INV-000003

### Step 1.4: Update Application Code

Update `server/postgres-storage.ts`:

```typescript
// OLD CODE (vulnerable to race condition)
async getNextInvoiceNumber(userId: string): Promise<string> {
  const result = await this.db
    .select()
    .from(invoices)
    .where(eq(invoices.userId, userId))
    .orderBy(desc(invoices.invoiceNumber))
    .limit(1);

  if (result[0]) {
    const match = result[0].invoiceNumber.match(/INV-(\d+)/);
    const lastNum = match ? parseInt(match[1]) : 0;
    const nextNum = (lastNum + 1).toString().padStart(6, "0");
    return `INV-${nextNum}`;
  }

  return "INV-000001";
}

// NEW CODE (atomic and safe)
async getNextInvoiceNumber(userId: string): Promise<string> {
  const result = await this.db.execute(
    sql`SELECT get_next_invoice_number(${userId}) as invoice_number`
  );
  return result.rows[0].invoice_number;
}
```

### Step 1.5: Deploy and Monitor

```bash
# Deploy application changes
npm run build
npm run start

# Monitor for errors
tail -f /var/log/app.log

# Check for duplicate invoice numbers
psql $DATABASE_URL -c "
SELECT invoice_number, COUNT(*)
FROM invoices
GROUP BY invoice_number
HAVING COUNT(*) > 1;
"
```

**Success Criteria**: No duplicate invoice numbers after 24 hours

---

## Phase 2: Data Integrity (Week 2)

**Estimated Time**: 4-6 hours
**Downtime**: Minimal
**Risk Level**: Medium

### Step 2.1: Validate Existing Data

Before applying constraints, ensure no existing data violates them:

```bash
# Run validation queries from the migration
psql $DATABASE_URL -f migrations/002_data_integrity_constraints.sql --single-transaction
```

### Step 2.2: Clean Up Invalid Data

If validation finds issues:

```sql
-- Example: Fix invoices with calculation mismatches
UPDATE invoices
SET tax = subtotal * tax_rate / 100
WHERE ABS(tax - (subtotal * tax_rate / 100)) >= 0.01;

UPDATE invoices
SET total = subtotal + tax
WHERE ABS(total - (subtotal + tax)) >= 0.01;
```

### Step 2.3: Apply Constraints

```bash
# Apply all constraints
psql $DATABASE_URL -f migrations/002_data_integrity_constraints.sql

# Verify constraints are active
psql $DATABASE_URL -c "
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name, tc.constraint_name;
"
```

### Step 2.4: Test Application

Run comprehensive tests:

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# Try to create invalid data (should fail)
curl -X POST http://localhost:5000/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "test-client",
    "lineItems": [{
      "description": "Test",
      "quantity": -1,  // Should fail: quantity must be positive
      "price": 100
    }]
  }'
```

**Success Criteria**: All tests pass, invalid data is rejected

---

## Phase 3: Row-Level Security (Week 2-3)

**Estimated Time**: 6-8 hours
**Downtime**: None
**Risk Level**: Medium

### Step 3.1: Apply RLS Policies

```bash
# Apply RLS migration
psql $DATABASE_URL -f migrations/003_row_level_security.sql
```

### Step 3.2: Update Application Code

Update `server/postgres-storage.ts` to set user context:

```typescript
// Add this helper method
private async withUserContext<T>(
  userId: string,
  callback: () => Promise<T>
): Promise<T> {
  // Set user context for RLS
  await this.db.execute(sql`SET LOCAL app.user_id = ${userId}`);

  try {
    return await callback();
  } finally {
    // Reset context
    await this.db.execute(sql`RESET app.user_id`);
  }
}

// Update all methods to use it
async getClients(userId: string): Promise<Client[]> {
  return this.withUserContext(userId, async () => {
    return await this.db.select().from(clients).where(eq(clients.userId, userId));
  });
}
```

**Alternative**: Use transactions for automatic reset:

```typescript
async getClients(userId: string): Promise<Client[]> {
  return await this.db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL app.user_id = ${userId}`);
    return await tx.select().from(clients).where(eq(clients.userId, userId));
  });
}
```

### Step 3.3: Test Multi-Tenant Isolation

```bash
# Create test script
cat > test_rls.sql << 'EOF'
-- Create two test users
INSERT INTO users (id, email, password) VALUES
  ('test-user-1', 'user1@test.com', 'hash1'),
  ('test-user-2', 'user2@test.com', 'hash2');

-- Create clients for user 1
SET LOCAL app.user_id = 'test-user-1';
INSERT INTO clients (user_id, name, email) VALUES
  ('test-user-1', 'User 1 Client', 'client1@test.com');

-- Try to see clients as user 2 (should be empty)
SET LOCAL app.user_id = 'test-user-2';
SELECT COUNT(*) as should_be_zero FROM clients;

-- Try to modify user 1's client as user 2 (should fail)
UPDATE clients SET name = 'Hacked' WHERE user_id = 'test-user-1';
SELECT COUNT(*) as should_still_be_original FROM clients WHERE name = 'User 1 Client';

-- Cleanup
RESET app.user_id;
DELETE FROM users WHERE id IN ('test-user-1', 'test-user-2');
EOF

# Run test
psql $DATABASE_URL -f test_rls.sql
```

**Success Criteria**: User 2 cannot see or modify user 1's data

---

## Phase 4: Schema Enhancements (Week 4-6)

**Estimated Time**: 16-24 hours
**Downtime**: Minimal
**Risk Level**: Medium

### Step 4.1: Add Due Date and Payment Tracking

```sql
-- Add due_date column to invoices
ALTER TABLE invoices ADD COLUMN due_date DATE;

-- Populate due_date for existing invoices
UPDATE invoices i
SET due_date = (i.date::date + (
  SELECT COALESCE(c.payment_terms, 30)
  FROM clients c
  WHERE c.id = i.client_id
))
WHERE due_date IS NULL;

-- Add amount_paid column
ALTER TABLE invoices ADD COLUMN amount_paid DECIMAL(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN paid_date TIMESTAMP;
```

### Step 4.2: Create Payments Table

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  payment_date TIMESTAMP NOT NULL DEFAULT NOW(),
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  transaction_id VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_date ON payments(payment_date DESC);
```

### Step 4.3: Add Auto-Status Update Trigger

```sql
CREATE OR REPLACE FUNCTION update_invoice_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update amount_paid from payments
  SELECT COALESCE(SUM(amount), 0)
  INTO NEW.amount_paid
  FROM payments
  WHERE invoice_id = NEW.id
    AND payment_status = 'completed';

  -- Update status based on payment
  IF NEW.amount_paid >= NEW.total THEN
    NEW.status := 'paid';
    NEW.paid_date := NOW();
  ELSIF NEW.amount_paid > 0 THEN
    NEW.status := 'partial';
  ELSIF NEW.due_date < CURRENT_DATE AND NEW.status IN ('sent', 'viewed') THEN
    NEW.status := 'overdue';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_status
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_status();
```

### Step 4.4: Update Drizzle Schema

Update `shared/schema.ts`:

```typescript
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id, { onDelete: 'restrict' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").notNull().defaultNow(),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"),
  transactionId: varchar("transaction_id", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Update invoices table
export const invoices = pgTable("invoices", {
  // ... existing fields ...
  dueDate: date("due_date"),
  paidDate: timestamp("paid_date"),
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).default("0"),
});
```

---

## Phase 5: Monitoring Setup (Week 7-8)

### Step 5.1: Install pg_stat_statements

```sql
-- Add to postgresql.conf
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.track = all
pg_stat_statements.max = 10000

-- Restart PostgreSQL
sudo systemctl restart postgresql

-- Enable extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

### Step 5.2: Set Up Query Monitoring

Create monitoring script:

```bash
#!/bin/bash
# File: monitor_db.sh

echo "=== Slow Queries (>100ms) ==="
psql $DATABASE_URL -c "
SELECT
  substring(query, 1, 100) as query_preview,
  calls,
  ROUND(mean_exec_time::numeric, 2) as avg_ms,
  ROUND(max_exec_time::numeric, 2) as max_ms,
  ROUND(total_exec_time::numeric / 1000, 2) as total_seconds
FROM pg_stat_statements
WHERE mean_exec_time > 100
  AND query NOT LIKE '%pg_stat%'
ORDER BY mean_exec_time DESC
LIMIT 10;
"

echo ""
echo "=== Table Sizes ==="
psql $DATABASE_URL -c "
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

echo ""
echo "=== Index Usage ==="
psql $DATABASE_URL -c "
SELECT
  tablename,
  indexname,
  idx_scan as times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC
LIMIT 10;
"
```

### Step 5.3: Set Up Grafana Dashboard

1. Install Prometheus and postgres_exporter
2. Configure Grafana datasource
3. Import PostgreSQL dashboard template
4. Set up alerts for:
   - Query time > 1000ms
   - Connection count > 80%
   - Table bloat > 30%
   - Replication lag > 1000ms

---

## Rollback Procedures

### Rollback Phase 1 (Indexes)

```sql
-- Drop all indexes (safe, can be recreated)
DROP INDEX CONCURRENTLY IF EXISTS idx_clients_user_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_invoices_user_id;
-- ... (drop all created indexes)
```

### Rollback Phase 2 (Constraints)

```sql
-- Drop constraints (may prevent valid data from being modified)
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_password_for_local;
ALTER TABLE clients DROP CONSTRAINT IF EXISTS check_payment_terms_range;
-- ... (drop all created constraints)
```

### Rollback Phase 3 (RLS)

```sql
-- Disable RLS (removes security layer)
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE line_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;

-- Drop policies
DROP POLICY IF EXISTS clients_select_policy ON clients;
-- ... (drop all policies)
```

---

## Performance Benchmarks

### Expected Improvements

| Operation | Before | After | Improvement |
|-----------|--------|-------|-------------|
| Get 1000 invoices | 500ms | 5ms | 100x |
| Get line items | 100ms | 2ms | 50x |
| Generate invoice number | 200ms | 20ms | 10x |
| Filter by status | 600ms | 3ms | 200x |
| Client search | 300ms | 10ms | 30x |

### Database Size Impact

| Component | Before | After | Change |
|-----------|--------|-------|--------|
| Table data | 100MB | 100MB | 0% |
| Indexes | 10MB | 60MB | +50MB |
| Total | 110MB | 160MB | +45% |

**Note**: Index overhead is offset by 100x query performance improvement

---

## Maintenance Schedule

### Daily
- Monitor slow query log
- Check for duplicate invoice numbers
- Verify RLS policy effectiveness

### Weekly
- VACUUM ANALYZE all tables
- Review index usage statistics
- Check table/index bloat

### Monthly
- REINDEX CONCURRENTLY high-traffic tables
- Review and optimize slow queries
- Update statistics manually if needed
- Test backup restoration

### Quarterly
- Review and remove unused indexes
- Partition large tables if needed
- Update PostgreSQL version
- Review and optimize RLS policies

---

## Support and Troubleshooting

### Common Issues

1. **Index creation fails**
   - Check disk space
   - Verify no long-running transactions
   - Use CONCURRENTLY to avoid locks

2. **Constraints fail validation**
   - Run validation queries first
   - Clean up invalid data before applying constraints

3. **RLS breaks application**
   - Ensure app.user_id is set before queries
   - Check transaction boundaries

4. **Performance degrades**
   - Run ANALYZE on affected tables
   - Check for table/index bloat
   - Review query plans with EXPLAIN ANALYZE

### Getting Help

- **Database Assessment**: `DATABASE_ASSESSMENT.md`
- **Migration Scripts**: `migrations/` directory
- **Drizzle Docs**: https://orm.drizzle.team/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

## Checklist

- [ ] Phase 1: Critical indexes applied
- [ ] Phase 1: Invoice number fix deployed
- [ ] Phase 1: Performance verified (90%+ improvement)
- [ ] Phase 2: Data validation completed
- [ ] Phase 2: Constraints applied
- [ ] Phase 2: Application tests pass
- [ ] Phase 3: RLS policies applied
- [ ] Phase 3: Multi-tenant isolation verified
- [ ] Phase 3: Application updated for RLS
- [ ] Phase 4: Schema enhancements completed
- [ ] Phase 4: Payments table created
- [ ] Phase 4: Drizzle schema updated
- [ ] Phase 5: Monitoring setup
- [ ] Phase 5: Grafana dashboard configured
- [ ] Backup procedures tested
- [ ] Documentation updated
- [ ] Team trained on new features

---

**Last Updated**: 2025-10-27
**Maintained By**: Database Team

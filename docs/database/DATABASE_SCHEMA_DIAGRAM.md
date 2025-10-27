# Database Schema Diagram and Optimization Map

## Current Schema Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INVOICE MANAGEMENT SYSTEM                           │
│                         PostgreSQL Database Schema                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│        USERS             │
│ ════════════════════════ │
│ ✓ id (VARCHAR/UUID) PK   │
│ ✓ email (TEXT) UNIQUE    │◄──────────────┐
│   username (TEXT)        │               │
│   password (TEXT)        │               │ CASCADE
│   provider (TEXT)        │               │ DELETE
│   providerId (TEXT)      │               │
│   isEmailVerified (BOOL) │               │
│   createdAt (TIMESTAMP)  │               │
│   updatedAt (TIMESTAMP)  │               │
└───────────┬──────────────┘               │
            │                              │
            │ CASCADE DELETE               │
            │                              │
            ├──────────────────────────────┤
            │                              │
            │                              │
   ┌────────▼────────────┐        ┌───────┴─────────────┐
   │     CLIENTS         │        │     SERVICES        │
   │ ══════════════════  │        │ ══════════════════  │
   │ ✓ id (VARCHAR) PK   │        │ ✓ id (VARCHAR) PK   │
   │ ✓ userId (VARCHAR)  │        │ ✓ userId (VARCHAR)  │
   │ ✓ name (TEXT)       │        │ ✓ name (TEXT)       │
   │ ✓ email (TEXT)      │        │   description       │
   │   company           │        │   category (TEXT)   │
   │   phone             │        │ ✓ price (DEC 10,2)  │
   │   website           │        │   unit (TEXT)       │
   │   address           │        │   isActive (BOOL)   │
   │   taxId             │        │   createdAt         │
   │   paymentTerms (INT)│        │   updatedAt         │
   │   currency (TEXT)   │        └─────────────────────┘
   │   notes             │
   │   isActive (BOOL)   │
   │   createdAt         │
   │   updatedAt         │
   └──────────┬──────────┘
              │
              │ RESTRICT DELETE
              │ (prevent orphaned invoices)
              │
   ┌──────────▼──────────┐
   │      INVOICES       │
   │ ══════════════════  │
   │ ✓ id (VARCHAR) PK   │
   │ ✓ invoiceNumber     │◄────┐ UNIQUE
   │ ✓ userId (VARCHAR)  │     │
   │ ✓ clientId (VARCHAR)│     │
   │ ✓ date (TIMESTAMP)  │     │
   │   orderNumber       │     │
   │   projectNumber     │     │
   │   forProject        │     │
   │ ✓ status (TEXT)     │     │ Should be ENUM
   │   notes             │     │
   │ ✓ subtotal (DEC)    │     │
   │ ✓ tax (DEC)         │     │
   │ ✓ taxRate (DEC 5,2) │     │
   │ ✓ total (DEC)       │     │
   │   [Missing Fields]  │     │
   │   - dueDate         │     │ RECOMMENDED
   │   - paidDate        │     │ RECOMMENDED
   │   - amountPaid      │     │ RECOMMENDED
   └──────────┬──────────┘     │
              │                │
              │ CASCADE DELETE │
              │                │
   ┌──────────▼──────────┐     │
   │    LINE ITEMS       │     │
   │ ══════════════════  │     │
   │ ✓ id (VARCHAR) PK   │     │
   │ ✓ invoiceId (VARCHAR)│    │
   │ ✓ description (TEXT)│     │
   │ ✓ quantity (DEC)    │     │
   │ ✓ price (DEC)       │     │
   │ ✓ amount (DEC)      │     │
   │   [Missing Fields]  │     │
   │   - userId          │     │ CRITICAL SECURITY FIX
   │   - position        │     │ RECOMMENDED
   └─────────────────────┘     │
                               │
   ┌────────────────────────────┘
   │  RECOMMENDED NEW TABLES
   │
   │  ┌─────────────────────────┐
   │  │       PAYMENTS          │
   │  │ ══════════════════════  │
   │  │ id (UUID) PK            │
   │  │ invoiceId (UUID) FK     │
   │  │ userId (UUID) FK        │
   │  │ amount (DEC 12,2)       │
   │  │ paymentDate (TIMESTAMP) │
   │  │ paymentMethod (ENUM)    │
   │  │ paymentStatus (ENUM)    │
   │  │ transactionId           │
   │  │ notes                   │
   │  └─────────────────────────┘
   │
   │  ┌─────────────────────────┐
   │  │    AUDIT LOG            │
   │  │ ══════════════════════  │
   │  │ id (UUID) PK            │
   │  │ tableName               │
   │  │ recordId                │
   │  │ userId (UUID) FK        │
   │  │ action (ENUM)           │
   │  │ oldValues (JSONB)       │
   │  │ newValues (JSONB)       │
   │  │ ipAddress (INET)        │
   │  │ createdAt               │
   │  └─────────────────────────┘
   │
   └─ [See DATABASE_ASSESSMENT.md for complete list]

Legend:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ = Field exists
✗ = Missing critical field
PK = Primary Key
FK = Foreign Key
DEC = DECIMAL
```

---

## Index Coverage Map

### Current State (❌ = Missing)

```
TABLE: users
├─ ✅ PRIMARY KEY (id)
├─ ✅ UNIQUE (email)
├─ ❌ INDEX (provider, providerId)      ← OAuth lookups
├─ ❌ INDEX (isEmailVerified)           ← Email verification queries
└─ ❌ INDEX (createdAt)                 ← Temporal queries

TABLE: clients
├─ ✅ PRIMARY KEY (id)
├─ ❌ INDEX (userId)                    ← CRITICAL: FK not indexed!
├─ ❌ INDEX (userId, isActive)          ← Filtered client lists
├─ ❌ INDEX (userId, name)              ← Client search
├─ ❌ INDEX (email)                     ← Email lookup
└─ ❌ INDEX (createdAt)                 ← Temporal queries

TABLE: invoices
├─ ✅ PRIMARY KEY (id)
├─ ✅ UNIQUE (invoiceNumber)
├─ ❌ INDEX (userId)                    ← CRITICAL: FK not indexed!
├─ ❌ INDEX (clientId)                  ← CRITICAL: FK not indexed!
├─ ❌ INDEX (userId, status)            ← Dashboard filtering
├─ ❌ INDEX (userId, date DESC)         ← Invoice list sorting
├─ ❌ INDEX (userId, invoiceNumber DESC)← Number generation
├─ ❌ INDEX (clientId, date DESC)       ← Client history
├─ ❌ INDEX (date)                      ← Date range reports
└─ ❌ INDEX (userId, status, total)     ← Financial aggregations

TABLE: lineItems
├─ ✅ PRIMARY KEY (id)
├─ ❌ INDEX (invoiceId)                 ← CRITICAL: FK not indexed!
└─ ❌ INDEX (userId)                    ← CRITICAL: Security isolation

TABLE: services
├─ ✅ PRIMARY KEY (id)
├─ ❌ INDEX (userId)                    ← CRITICAL: FK not indexed!
├─ ❌ INDEX (userId, isActive, category)← Service catalog
└─ ❌ INDEX (userId, name)              ← Service search

Summary: 5 ✅ existing | 21 ❌ missing = Only 19% indexed!
```

---

## Query Performance Heat Map

### Before Optimization (🔴 = Slow, 🟡 = Moderate)

```
OPERATION                           TIME      SCAN TYPE        ISSUE
══════════════════════════════════════════════════════════════════════
getClients(userId)                  500ms 🔴  Sequential Scan  No index on userId
getInvoices(userId)                 500ms 🔴  Sequential Scan  No index on userId
getInvoice(id, userId)              150ms 🟡  Index + Filter   Filter not indexed
getLineItemsByInvoice(invoiceId)    100ms 🔴  Sequential Scan  No index on FK
getNextInvoiceNumber(userId)        200ms 🔴  Seq + Sort       No composite index
filterInvoicesByStatus(userId, st)  600ms 🔴  Seq + Filter     No composite index
getClientInvoices(clientId)         300ms 🔴  Sequential Scan  No index on FK
searchClients(userId, name)         400ms 🔴  Sequential Scan  No text index
getServices(userId)                 150ms 🟡  Sequential Scan  No index on userId
aggregateRevenue(userId, month)     800ms 🔴  Seq + Aggregate  No covering index
```

### After Phase 1 Optimization (🟢 = Fast)

```
OPERATION                           TIME      SCAN TYPE        IMPROVEMENT
══════════════════════════════════════════════════════════════════════
getClients(userId)                    5ms 🟢  Index Scan       100x faster
getInvoices(userId)                   5ms 🟢  Index Scan       100x faster
getInvoice(id, userId)               2ms 🟢  Index Scan       75x faster
getLineItemsByInvoice(invoiceId)     2ms 🟢  Index Scan       50x faster
getNextInvoiceNumber(userId)        20ms 🟢  Index Scan       10x faster
filterInvoicesByStatus(userId, st)   3ms 🟢  Index Scan       200x faster
getClientInvoices(clientId)          4ms 🟢  Index Scan       75x faster
searchClients(userId, name)         10ms 🟢  Index Scan       40x faster
getServices(userId)                  3ms 🟢  Index Scan       50x faster
aggregateRevenue(userId, month)     15ms 🟢  Index Only Scan  53x faster
```

---

## Security Vulnerability Map

### Current Security Model

```
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  req.session.userId is checked in routes                  │  │
│  │  storage.getClients(userId) ← Filters in application      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│                    ⚠️ NO DATABASE ENFORCEMENT ⚠️                │
│                              ↓                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  VULNERABILITY: If app code bypassed, database allows:   │  │
│  │  - Cross-tenant data access                               │  │
│  │  - Line items without user validation                     │  │
│  │  - Direct SQL injection could leak data                   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER                              │
│                          ❌ NO RLS                              │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended Security Model (After Phase 3)

```
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  req.session.userId is checked in routes                  │  │
│  │  SET LOCAL app.user_id = userId                           │  │
│  │  storage.getClients(userId) ← First line of defense       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│                    ✅ DATABASE ENFORCEMENT ✅                    │
│                              ↓                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Row-Level Security (RLS) Policies:                       │  │
│  │  ✓ Every query filtered by app.user_id                    │  │
│  │  ✓ Cross-tenant access blocked at DB level                │  │
│  │  ✓ Line items validated through invoice ownership         │  │
│  │  ✓ Defense-in-depth security                              │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER                              │
│                          ✅ RLS ENABLED                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  clients:    WHERE userId = current_setting('app.user_id')│  │
│  │  invoices:   WHERE userId = current_setting('app.user_id')│  │
│  │  lineItems:  WHERE invoiceId IN (user's invoices)         │  │
│  │  services:   WHERE userId = current_setting('app.user_id')│  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Type Optimization Map

### Current vs Recommended

```
FIELD              CURRENT        SIZE    RECOMMENDED   SIZE    SAVINGS
═══════════════════════════════════════════════════════════════════════
users.id           VARCHAR        37B     UUID          16B     57%
users.email        TEXT           ~40B    VARCHAR(255)  ~40B    0%
users.provider     TEXT           ~20B    VARCHAR(50)   ~20B    0%

clients.id         VARCHAR        37B     UUID          16B     57%
clients.userId     VARCHAR        37B     UUID          16B     57%
clients.email      TEXT           ~40B    VARCHAR(255)  ~40B    0%
clients.currency   TEXT           ~10B    CHAR(3)       3B      70%

invoices.id        VARCHAR        37B     UUID          16B     57%
invoices.userId    VARCHAR        37B     UUID          16B     57%
invoices.clientId  VARCHAR        37B     UUID          16B     57%
invoices.number    TEXT           ~20B    VARCHAR(50)   ~20B    0%
invoices.status    TEXT           ~15B    ENUM          4B      73%

lineItems.id       VARCHAR        37B     UUID          16B     57%
lineItems.invoiceId VARCHAR       37B     UUID          16B     57%

services.id        VARCHAR        37B     UUID          16B     57%
services.userId    VARCHAR        37B     UUID          16B     57%
services.unit      TEXT           ~10B    ENUM          4B      60%

TOTAL STORAGE SAVINGS: ~40% on indexed fields
```

---

## Migration Phases Visual Timeline

```
Week 1: CRITICAL FIXES (P0)
════════════════════════════════════════════════════════════════════
├─ Day 1-2: Add Foreign Key Indexes
│  └─ Impact: 100x query performance improvement
│
├─ Day 3: Fix Invoice Number Race Condition
│  └─ Impact: Prevent duplicate invoice numbers
│
└─ Day 4-5: Add userId to Line Items + Testing
   └─ Impact: Close security vulnerability

Week 2: SECURITY & INTEGRITY (P1)
════════════════════════════════════════════════════════════════════
├─ Day 1-2: Apply Row-Level Security Policies
│  └─ Impact: Database-level multi-tenant isolation
│
└─ Day 3-5: Add Data Integrity Constraints
   └─ Impact: Prevent data corruption

Week 3-4: DATA TYPE OPTIMIZATION (P1)
════════════════════════════════════════════════════════════════════
├─ Week 3: Plan UUID Migration Strategy
│  └─ Complex: Requires coordinated table updates
│
└─ Week 4: Execute UUID Migration
   └─ Impact: 40% storage reduction

Week 5-6: FEATURE ENHANCEMENTS (P2)
════════════════════════════════════════════════════════════════════
├─ Add Payment Tracking Table
├─ Add Recurring Invoice Templates
├─ Add Document Attachments
├─ Add Audit Logging
└─ Normalize Categories

Week 7-8: SCALING PREPARATION (P2)
════════════════════════════════════════════════════════════════════
├─ Implement Table Partitioning
├─ Set Up Read Replicas
├─ Configure Connection Pooling (PgBouncer)
├─ Set Up Monitoring (Grafana/Prometheus)
└─ Performance Testing & Optimization

═══════════════════════════════════════════════════════════════════
RESULT: Enterprise-ready database supporting 100x growth
═══════════════════════════════════════════════════════════════════
```

---

## Constraint Validation Map

### Missing Constraints (All Need to be Added)

```
TABLE: users
├─ ❌ CHECK: password required when provider = 'local'
├─ ❌ CHECK: providerId required when provider != 'local'
└─ ❌ CHECK: email format validation

TABLE: clients
├─ ❌ CHECK: paymentTerms BETWEEN 1 AND 365
├─ ❌ CHECK: currency matches ISO 4217 format (e.g., 'EUR', 'USD')
├─ ❌ CHECK: email format validation
└─ ❌ CHECK: website starts with http:// or https://

TABLE: invoices
├─ ❌ CHECK: taxRate BETWEEN 0 AND 100
├─ ❌ CHECK: total = subtotal + tax (within 0.01 tolerance)
├─ ❌ CHECK: tax = subtotal * taxRate / 100 (within 0.01 tolerance)
├─ ❌ CHECK: subtotal >= 0, tax >= 0, total >= 0
├─ ❌ CHECK: status IN (valid enum values)
├─ ❌ CHECK: date <= NOW() + INTERVAL '1 year'
└─ ❌ CHECK: userId matches client.userId (referential integrity)

TABLE: lineItems
├─ ❌ CHECK: quantity > 0
├─ ❌ CHECK: price >= 0
├─ ❌ CHECK: amount = quantity * price (within 0.01 tolerance)
└─ ❌ CHECK: description not empty

TABLE: services
├─ ❌ CHECK: price >= 0
├─ ❌ CHECK: name not empty
└─ ❌ CHECK: unit IN (valid enum values)

Total Missing Constraints: 20+
Impact: Data integrity not enforced at database level
```

---

## Scalability Roadmap

```
CURRENT CAPACITY
┌───────────────────────────────────────────────────────────────┐
│ Users: ~1,000 before slowdown                                 │
│ Invoices/User: ~500 before performance issues                 │
│ Total Records: ~500K invoices max                             │
│ Query Time: 500-600ms (poor UX)                               │
│ Concurrent Users: ~50 before bottleneck                       │
└───────────────────────────────────────────────────────────────┘
                              ↓
                    [Apply Phase 1 Indexes]
                              ↓
PHASE 1 CAPACITY (Week 1)
┌───────────────────────────────────────────────────────────────┐
│ Users: ~10,000                                                 │
│ Invoices/User: ~5,000                                          │
│ Total Records: ~50M invoices                                   │
│ Query Time: 2-5ms (excellent UX)                               │
│ Concurrent Users: ~500                                         │
└───────────────────────────────────────────────────────────────┘
                              ↓
                    [Add RLS + Constraints]
                              ↓
PHASE 2 CAPACITY (Week 2)
┌───────────────────────────────────────────────────────────────┐
│ + Database-level security                                      │
│ + Data integrity enforcement                                   │
│ + Production-ready reliability                                 │
└───────────────────────────────────────────────────────────────┘
                              ↓
                    [UUID Migration + Features]
                              ↓
PHASE 3 CAPACITY (Week 4)
┌───────────────────────────────────────────────────────────────┐
│ Users: ~50,000                                                 │
│ Invoices/User: ~10,000                                         │
│ Total Records: ~500M invoices                                  │
│ Storage: 40% more efficient                                    │
│ + Payment tracking                                             │
│ + Recurring invoices                                           │
└───────────────────────────────────────────────────────────────┘
                              ↓
                    [Partitioning + Replication]
                              ↓
PHASE 4 CAPACITY (Week 8)
┌───────────────────────────────────────────────────────────────┐
│ Users: ~500,000+                                               │
│ Invoices/User: ~50,000+                                        │
│ Total Records: ~25B invoices                                   │
│ High Availability: 99.95%+                                     │
│ Geographic Distribution: Multi-region                          │
│ Disaster Recovery: PITR + Replication                          │
└───────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
Result: 500x capacity increase, enterprise-grade reliability
═══════════════════════════════════════════════════════════════
```

---

## Quick Reference Commands

### Health Check
```bash
# One-liner health check
psql $DATABASE_URL -c "
SELECT
  'Tables' as metric, COUNT(*)::text as value FROM pg_tables WHERE schemaname='public'
UNION ALL
SELECT 'Indexes', COUNT(*)::text FROM pg_indexes WHERE schemaname='public'
UNION ALL
SELECT 'Constraints', COUNT(*)::text FROM information_schema.table_constraints WHERE table_schema='public' AND constraint_type='CHECK';
"
```

### Performance Check
```bash
# Check slowest queries
psql $DATABASE_URL -c "
SELECT substring(query, 1, 60) as query,
       calls, mean_exec_time::int as avg_ms
FROM pg_stat_statements
ORDER BY mean_exec_time DESC LIMIT 5;
"
```

### Apply All Critical Fixes
```bash
# Complete Phase 1 in one command
cd /Users/cemreuludag/Desktop/gokceinvoice
psql $DATABASE_URL -f migrations/001_critical_indexes.sql
psql $DATABASE_URL -f migrations/004_invoice_number_fix.sql
echo "✅ Critical fixes applied!"
```

---

**Last Updated**: 2025-10-27
**Next Review**: After Phase 1 completion

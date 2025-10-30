# Leads Management System - Database Updates

This document outlines all database changes needed for the Leads Management System MVP.

## Summary

- **1 table extension**: `users` table (adds 10 contractor-specific columns)
- **8 new tables**: categories, leads, bids, messages, strike_logs, ban_appeals, conversions, contractor_metrics
- **Migration file**: `migrations/013_add_leads_system.sql`

---

## Database Changes

### 1. Users Table Extension

**Action**: Add contractor-specific fields to existing `users` table

**New Columns**:
- `service_area_zip_codes` (TEXT) - JSON array of zip codes contractor serves
- `contractor_categories` (TEXT) - JSON array of category IDs contractor works in
- `profile_rating` (DECIMAL(3,2)) - Rating from 0.00 to 5.00 (default: 0.00)
- `response_rate` (DECIMAL(3,2)) - Conversion rate percentage (default: 0.00)
- `strike_count` (INT) - Number of non-response strikes (default: 0)
- `is_bidding_banned` (BOOLEAN) - Whether contractor is banned from bidding (default: FALSE)
- `subscription_tier` (VARCHAR(50)) - Subscription level: 'starter', 'pro', 'enterprise' (nullable, future)
- `subscription_renewal_date` (DATE) - Next subscription renewal date (nullable)
- `lead_discount_multiplier` (DECIMAL(3,2)) - Discount based on rating (default: 1.00)
- `is_contractor` (BOOLEAN) - Flag to identify contractors (default: FALSE)

**New Indexes**:
- `idx_users_is_contractor` - Filter contractors
- `idx_users_is_bidding_banned` - Filter banned contractors (partial index)

**Impact**: Low risk - all new columns are nullable (except defaults) or have safe defaults

---

### 2. Categories Table (NEW)

**Purpose**: Service categories (plumbing, electrical, HVAC, etc.)

**Columns**:
- `id` (UUID, PK)
- `slug` (VARCHAR(50), UNIQUE) - URL-friendly identifier
- `display_name` (VARCHAR(100)) - Human-readable name
- `description` (TEXT, nullable)
- `created_at` (TIMESTAMP)

**Indexes**:
- `idx_categories_slug` - Fast lookup by slug

---

### 3. Leads Table (NEW)

**Purpose**: Customer leads available for bidding

**Columns**:
- `id` (UUID, PK)
- `category_id` (UUID, FK → categories)
- `title` (VARCHAR(255))
- `description` (TEXT)
- `customer_name` (VARCHAR(255))
- `customer_email` (VARCHAR(255))
- `customer_phone` (VARCHAR(20))
- `customer_zip_code` (VARCHAR(10))
- `budget_min` (DECIMAL(10,2), nullable)
- `budget_max` (DECIMAL(10,2), nullable)
- `urgency_level` (VARCHAR(20)) - 'low', 'medium', 'high', 'urgent'
- `service_area_radius_km` (INT, nullable)
- `lead_source` (VARCHAR(50)) - 'google_local_services', 'facebook_leads', etc.
- `base_lead_cost` (DECIMAL(10,2)) - Platform's base cost
- `status` (VARCHAR(50)) - See status values below
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP, auto-updated)
- `bidding_closes_at` (TIMESTAMP, nullable) - When bidding window closes
- `metadata` (JSONB, nullable) - Source-specific data
- `is_qualified` (BOOLEAN, default: FALSE)

**Status Values**:
- `CREATED` - Lead ingested, awaiting bid period
- `ACTIVE` - Open for bidding
- `BIDDING_CLOSED` - Bidding ended, top 3 identified
- `PENDING_RESPONSE_1/2/3` - Contractor N has active 2-hour response window
- `CONTACTED` - At least one contractor sent message (conversion)
- `EXPIRED` - All 3 contractors failed to respond
- `ARCHIVED` - Lead older than 30 days or manually archived

**Indexes**:
- `idx_leads_status` - Filter by status
- `idx_leads_category` - Filter by category
- `idx_leads_created_at` - Sort by creation date
- `idx_leads_bidding_closes` - Find leads closing soon (partial index)
- `idx_leads_urgency` - Filter by urgency

---

### 4. Bids Table (NEW)

**Purpose**: Contractor bids on leads

**Columns**:
- `id` (UUID, PK)
- `lead_id` (UUID, FK → leads, CASCADE DELETE)
- `contractor_id` (UUID, FK → users, CASCADE DELETE)
- `bid_multiplier` (DECIMAL(3,2)) - 0.5 to 2.0 (50% to 200% of base)
- `final_bid_amount` (DECIMAL(10,2)) - Calculated: base * multiplier * discount
- `bid_rank` (INT, nullable) - 1, 2, or 3 (top 3 only)
- `bid_placed_at` (TIMESTAMP)
- `status` (VARCHAR(50)) - 'ACTIVE', 'WON', 'LOST', 'EXPIRED'
- `response_window_starts_at` (TIMESTAMP, nullable) - When contractor gets 2-hour window
- `response_window_ends_at` (TIMESTAMP, nullable) - 2 hours after starts_at
- `responded_at` (TIMESTAMP, nullable) - When contractor sends first message
- `strike_applied` (BOOLEAN, default: FALSE)
- `created_at` (TIMESTAMP)

**Constraints**:
- `bid_multiplier` must be between 0.5 and 2.0
- `bid_rank` must be 1, 2, or 3 (if set)
- Unique constraint: one bid per contractor per lead

**Indexes**:
- `idx_bids_lead` - Find all bids for a lead
- `idx_bids_contractor` - Find all bids by a contractor
- `idx_bids_status` - Filter by status
- `idx_bids_response_window` - Find bids with expiring windows (partial index)
- `idx_bids_lead_contractor` - Unique constraint + fast lookup

---

### 5. Messages Table (NEW)

**Purpose**: Platform messaging for lead communication

**Columns**:
- `id` (UUID, PK)
- `lead_id` (UUID, FK → leads, CASCADE DELETE)
- `sender_id` (UUID, FK → users, CASCADE DELETE) - Contractor
- `recipient_id` (UUID, FK → users, nullable) - Future: customer or other contractor
- `message_text` (TEXT) - Max 5000 characters
- `sent_at` (TIMESTAMP)
- `is_read` (BOOLEAN, default: FALSE)
- `read_at` (TIMESTAMP, nullable)
- `created_at` (TIMESTAMP)

**Constraints**:
- `message_text` max length: 5000 characters

**Indexes**:
- `idx_messages_lead` - Get all messages for a lead
- `idx_messages_sender` - Get all messages sent by contractor
- `idx_messages_sent_at` - Sort by time sent
- `idx_messages_recipient` - Get messages for recipient (partial index)

---

### 6. Strike Logs Table (NEW)

**Purpose**: Audit trail for non-responses

**Columns**:
- `id` (UUID, PK)
- `contractor_id` (UUID, FK → users, CASCADE DELETE)
- `lead_id` (UUID, FK → leads, CASCADE DELETE)
- `bid_id` (UUID, FK → bids, CASCADE DELETE)
- `strike_reason` (VARCHAR(100), nullable) - e.g., 'response_window_expired'
- `strike_count_after` (INT) - Strike count after this strike
- `ban_triggered` (BOOLEAN, default: FALSE)
- `created_at` (TIMESTAMP)

**Constraints**:
- `strike_count_after` must be >= 0

**Indexes**:
- `idx_strike_logs_contractor` - Get all strikes for a contractor
- `idx_strike_logs_created_at` - Sort by date
- `idx_strike_logs_bid` - Link to specific bid

---

### 7. Ban Appeals Table (NEW)

**Purpose**: Appeals for bidding bans

**Columns**:
- `id` (UUID, PK)
- `contractor_id` (UUID, FK → users, CASCADE DELETE)
- `appeal_reason` (TEXT) - Min 10, max 1000 characters
- `status` (VARCHAR(50)) - 'PENDING', 'APPROVED', 'REJECTED'
- `reviewed_by_id` (UUID, FK → users, nullable) - Admin user (future)
- `reviewed_at` (TIMESTAMP, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP, auto-updated)

**Constraints**:
- `appeal_reason` length: 10-1000 characters

**Indexes**:
- `idx_ban_appeals_contractor` - Find appeals by contractor
- `idx_ban_appeals_status` - Filter by status

---

### 8. Conversions Table (NEW)

**Purpose**: Track lead conversions (contact events)

**Columns**:
- `id` (UUID, PK)
- `lead_id` (UUID, FK → leads, CASCADE DELETE)
- `contractor_id` (UUID, FK → users, CASCADE DELETE)
- `conversion_type` (VARCHAR(50)) - 'contacted', 'booked', 'paid' (default: 'contacted')
- `converted_at` (TIMESTAMP)
- `created_at` (TIMESTAMP)

**Indexes**:
- `idx_conversions_lead` - Find conversions for a lead
- `idx_conversions_contractor` - Find conversions by contractor
- `idx_conversions_converted_at` - Sort by conversion date

---

### 9. Contractor Metrics Table (NEW)

**Purpose**: Denormalized analytics for performance

**Columns**:
- `id` (UUID, PK)
- `contractor_id` (UUID, FK → users, UNIQUE, CASCADE DELETE)
- `total_bids_placed` (INT, default: 0)
- `total_leads_won` (INT, default: 0)
- `total_leads_contacted` (INT, default: 0)
- `contact_rate` (DECIMAL(3,2), default: 0.00) - Contacts / Wins
- `avg_time_to_contact_minutes` (INT, nullable)
- `total_spent` (DECIMAL(12,2), default: 0.00)
- `roi` (DECIMAL(5,2), nullable) - Return on ad spend (future)
- `updated_at` (TIMESTAMP, auto-updated)

**Constraints**:
- `contact_rate` must be between 0.00 and 1.00

**Indexes**:
- `idx_contractor_metrics_contact_rate` - Sort by contact rate (top performers)

---

## Migration Instructions

### Step 1: Backup Database
```bash
pg_dump $DATABASE_URL > backup_before_leads_migration_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Run Migration
```bash
psql $DATABASE_URL -f migrations/013_add_leads_system.sql
```

### Step 3: Verify Migration
```sql
-- Check users table has new columns
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN (
  'is_contractor', 'strike_count', 'is_bidding_banned', 
  'profile_rating', 'response_rate'
);

-- Verify all tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'categories', 'leads', 'bids', 'messages', 
  'strike_logs', 'ban_appeals', 'conversions', 'contractor_metrics'
);

-- Check indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%leads%' OR indexname LIKE 'idx_%bids%'
ORDER BY tablename, indexname;
```

---

## Post-Migration: Seed Categories (Optional)

After migration, you may want to seed some default categories:

```sql
INSERT INTO categories (slug, display_name, description) VALUES
  ('plumbing', 'Plumbing', 'Plumbing services including repairs, installations, and maintenance'),
  ('electrical', 'Electrical', 'Electrical work including wiring, installations, and repairs'),
  ('hvac', 'HVAC', 'Heating, ventilation, and air conditioning services'),
  ('roofing', 'Roofing', 'Roof repairs, installations, and maintenance'),
  ('painting', 'Painting', 'Interior and exterior painting services'),
  ('carpentry', 'Carpentry', 'Woodworking and carpentry services'),
  ('landscaping', 'Landscaping', 'Landscape design and maintenance services'),
  ('flooring', 'Flooring', 'Floor installation, repairs, and refinishing'),
  ('general-contracting', 'General Contracting', 'General construction and contracting services'),
  ('other', 'Other', 'Other services');
```

---

## Rollback Plan

If you need to rollback the migration:

```sql
-- Drop triggers first
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
DROP TRIGGER IF EXISTS update_ban_appeals_updated_at ON ban_appeals;
DROP TRIGGER IF EXISTS update_contractor_metrics_updated_at ON contractor_metrics;

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS contractor_metrics CASCADE;
DROP TABLE IF EXISTS conversions CASCADE;
DROP TABLE IF EXISTS ban_appeals CASCADE;
DROP TABLE IF EXISTS strike_logs CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS bids CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Remove columns from users table
ALTER TABLE users DROP COLUMN IF EXISTS service_area_zip_codes;
ALTER TABLE users DROP COLUMN IF EXISTS contractor_categories;
ALTER TABLE users DROP COLUMN IF EXISTS profile_rating;
ALTER TABLE users DROP COLUMN IF EXISTS response_rate;
ALTER TABLE users DROP COLUMN IF EXISTS strike_count;
ALTER TABLE users DROP COLUMN IF EXISTS is_bidding_banned;
ALTER TABLE users DROP COLUMN IF EXISTS subscription_tier;
ALTER TABLE users DROP COLUMN IF EXISTS subscription_renewal_date;
ALTER TABLE users DROP COLUMN IF EXISTS lead_discount_multiplier;
ALTER TABLE users DROP COLUMN IF EXISTS is_contractor;
```

---

## Migration Notes

### Safe Operations
- ✅ All new columns have safe defaults or are nullable
- ✅ All tables use `IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`
- ✅ Foreign keys have appropriate CASCADE/SET NULL policies
- ✅ CHECK constraints ensure data integrity

### Considerations
- ⚠️ JSON fields (`service_area_zip_codes`, `contractor_categories`) - GIN indexes commented out (requires extension)
- ⚠️ `metadata` JSONB field in leads table for flexible data storage
- ⚠️ Timestamps use triggers for auto-update (standard PostgreSQL pattern)

### Performance
- All foreign keys have indexes
- Partial indexes for filtered queries (banned contractors, active bids)
- Indexes optimized for common query patterns (status, category, dates)

### Data Integrity
- CHECK constraints on bid multipliers (0.5-2.0)
- CHECK constraints on status values
- UNIQUE constraint: one bid per contractor per lead
- Foreign key constraints maintain referential integrity


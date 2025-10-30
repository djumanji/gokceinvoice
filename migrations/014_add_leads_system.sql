-- Migration: Add Leads Management System
-- Extends users table for contractors and creates all leads-related tables

-- ============================================================================
-- 1. EXTEND USERS TABLE WITH CONTRACTOR FIELDS
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS service_area_zip_codes TEXT; -- JSON array of zip codes
ALTER TABLE users ADD COLUMN IF NOT EXISTS contractor_categories TEXT; -- JSON array of category IDs
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_rating DECIMAL(3,2) DEFAULT 0.00; -- 0.00 to 5.00
ALTER TABLE users ADD COLUMN IF NOT EXISTS response_rate DECIMAL(3,2) DEFAULT 0.00; -- Conversion %
ALTER TABLE users ADD COLUMN IF NOT EXISTS strike_count INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_bidding_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50); -- 'starter', 'pro', 'enterprise' (future)
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_renewal_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lead_discount_multiplier DECIMAL(3,2) DEFAULT 1.00; -- Based on rating
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_contractor BOOLEAN DEFAULT FALSE; -- Flag to identify contractors

-- Indexes for contractor fields
CREATE INDEX IF NOT EXISTS idx_users_is_contractor ON users(is_contractor);
CREATE INDEX IF NOT EXISTS idx_users_is_bidding_banned ON users(is_bidding_banned) WHERE is_contractor = TRUE;
-- Note: GIN indexes for JSON fields will be created below after extension check

-- ============================================================================
-- 2. CREATE CATEGORIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- ============================================================================
-- 3. CREATE LEADS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_zip_code VARCHAR(10) NOT NULL,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  urgency_level VARCHAR(20) CHECK (urgency_level IN ('low', 'medium', 'high', 'urgent')),
  service_area_radius_km INT, -- Radius from customer zip
  lead_source VARCHAR(50) NOT NULL, -- 'google_local_services', 'facebook_leads', etc.
  base_lead_cost DECIMAL(10,2) NOT NULL CHECK (base_lead_cost >= 0), -- Platform's cost before multiplier
  status VARCHAR(50) DEFAULT 'CREATED' CHECK (status IN (
    'CREATED', 'ACTIVE', 'BIDDING_CLOSED', 'PENDING_RESPONSE_1', 
    'PENDING_RESPONSE_2', 'PENDING_RESPONSE_3', 'CONTACTED', 'EXPIRED', 'ARCHIVED'
  )),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  bidding_closes_at TIMESTAMP, -- 30 min after creation
  metadata JSONB, -- Source-specific data, qualification scores
  is_qualified BOOLEAN DEFAULT FALSE -- Has passed all qualification rules
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_category ON leads(category_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_bidding_closes ON leads(bidding_closes_at) 
  WHERE status IN ('CREATED', 'ACTIVE');
CREATE INDEX IF NOT EXISTS idx_leads_urgency ON leads(urgency_level);

-- ============================================================================
-- 4. CREATE BIDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bid_multiplier DECIMAL(3,2) NOT NULL CHECK (bid_multiplier >= 0.5 AND bid_multiplier <= 2.0),
  final_bid_amount DECIMAL(10,2) NOT NULL CHECK (final_bid_amount >= 0),
  bid_rank INT CHECK (bid_rank IN (1, 2, 3)), -- 1, 2, or 3 (top 3 only)
  bid_placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'WON', 'LOST', 'EXPIRED')),
  response_window_starts_at TIMESTAMP,
  response_window_ends_at TIMESTAMP,
  responded_at TIMESTAMP,
  strike_applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bids_lead ON bids(lead_id);
CREATE INDEX IF NOT EXISTS idx_bids_contractor ON bids(contractor_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status);
CREATE INDEX IF NOT EXISTS idx_bids_response_window ON bids(response_window_ends_at) 
  WHERE status = 'ACTIVE';
CREATE UNIQUE INDEX IF NOT EXISTS idx_bids_lead_contractor ON bids(lead_id, contractor_id);

-- ============================================================================
-- 5. CREATE MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL if recipient is customer (future feature)
  message_text TEXT NOT NULL CHECK (char_length(message_text) <= 5000),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_lead ON messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id) WHERE recipient_id IS NOT NULL;

-- ============================================================================
-- 6. CREATE STRIKE LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS strike_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  bid_id UUID NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
  strike_reason VARCHAR(100), -- 'response_window_expired'
  strike_count_after INT NOT NULL CHECK (strike_count_after >= 0),
  ban_triggered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_strike_logs_contractor ON strike_logs(contractor_id);
CREATE INDEX IF NOT EXISTS idx_strike_logs_created_at ON strike_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_strike_logs_bid ON strike_logs(bid_id);

-- ============================================================================
-- 7. CREATE BAN APPEALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ban_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appeal_reason TEXT NOT NULL CHECK (char_length(appeal_reason) >= 10 AND char_length(appeal_reason) <= 1000),
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_by_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Admin user (future)
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ban_appeals_contractor ON ban_appeals(contractor_id);
CREATE INDEX IF NOT EXISTS idx_ban_appeals_status ON ban_appeals(status);

-- ============================================================================
-- 8. CREATE CONVERSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversion_type VARCHAR(50) DEFAULT 'contacted' CHECK (conversion_type IN ('contacted', 'booked', 'paid')),
  converted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conversions_lead ON conversions(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversions_contractor ON conversions(contractor_id);
CREATE INDEX IF NOT EXISTS idx_conversions_converted_at ON conversions(converted_at DESC);

-- ============================================================================
-- 9. CREATE CONTRACTOR METRICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS contractor_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_bids_placed INT DEFAULT 0 CHECK (total_bids_placed >= 0),
  total_leads_won INT DEFAULT 0 CHECK (total_leads_won >= 0),
  total_leads_contacted INT DEFAULT 0 CHECK (total_leads_contacted >= 0),
  contact_rate DECIMAL(3,2) DEFAULT 0.00 CHECK (contact_rate >= 0.00 AND contact_rate <= 1.00),
  avg_time_to_contact_minutes INT CHECK (avg_time_to_contact_minutes >= 0),
  total_spent DECIMAL(12,2) DEFAULT 0.00 CHECK (total_spent >= 0),
  roi DECIMAL(5,2), -- Return on ad spend (future, can be negative)
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contractor_metrics_contact_rate ON contractor_metrics(contact_rate DESC);

-- ============================================================================
-- 10. ADD GIN INDEXES FOR JSON FIELDS (if pg_trgm extension exists)
-- ============================================================================

-- Check if we can use GIN indexes for JSONB/JSON fields
-- These require careful handling as they may fail if extension not available
-- Commenting out for now - can be enabled if pg_trgm or btree_gin extension is available

-- CREATE INDEX IF NOT EXISTS idx_users_contractor_categories ON users USING GIN (contractor_categories) WHERE is_contractor = TRUE;
-- CREATE INDEX IF NOT EXISTS idx_users_service_area ON users USING GIN (service_area_zip_codes) WHERE is_contractor = TRUE;
-- CREATE INDEX IF NOT EXISTS idx_leads_metadata ON leads USING GIN (metadata) WHERE metadata IS NOT NULL;

-- ============================================================================
-- 11. CREATE UPDATE TRIGGER FOR updated_at TIMESTAMPS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to leads table
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to ban_appeals table
DROP TRIGGER IF EXISTS update_ban_appeals_updated_at ON ban_appeals;
CREATE TRIGGER update_ban_appeals_updated_at
  BEFORE UPDATE ON ban_appeals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to contractor_metrics table
DROP TRIGGER IF EXISTS update_contractor_metrics_updated_at ON contractor_metrics;
CREATE TRIGGER update_contractor_metrics_updated_at
  BEFORE UPDATE ON contractor_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. All UUIDs use gen_random_uuid() for primary keys
-- 2. Foreign keys have appropriate CASCADE/SET NULL/RESTRICT policies
-- 3. CHECK constraints ensure data integrity (bid multipliers, status values, etc.)
-- 4. Indexes are optimized for common query patterns
-- 5. JSONB fields are available for flexible metadata storage
-- 6. GIN indexes for JSON fields are commented out - enable if extension available
-- 7. All timestamps use CURRENT_TIMESTAMP with automatic update triggers
-- ============================================================================


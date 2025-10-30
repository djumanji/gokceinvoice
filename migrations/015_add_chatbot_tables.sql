-- Migration: Chatbot Sessions, Messages, Knowledge + Lead extensions
-- Adds chatbot tables and extends leads with source/session fields

-- ============================================================================
-- 1) CHATBOT TABLES
-- ============================================================================

-- Enum for chatbot phase (soft-enforced via CHECK as VARCHAR for portability)
-- Using VARCHAR with CHECK instead of pg enum to keep migrations simple

CREATE TABLE IF NOT EXISTS chatbot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- External identifier exposed to client
  session_id VARCHAR(64) UNIQUE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  -- phase: category|description|structured|confirmation|completed
  phase VARCHAR(32) NOT NULL DEFAULT 'description' CHECK (
    phase IN ('category','description','structured','confirmation','completed')
  ),
  extracted_fields JSONB,
  user_message_count INT NOT NULL DEFAULT 0 CHECK (user_message_count >= 0),
  assistant_message_count INT NOT NULL DEFAULT 0 CHECK (assistant_message_count >= 0),
  last_error_code VARCHAR(64),
  last_error_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_created_at ON chatbot_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_expires_at ON chatbot_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_category ON chatbot_sessions(category_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_phase ON chatbot_sessions(phase);

CREATE TABLE IF NOT EXISTS chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chatbot_sessions(id) ON DELETE CASCADE,
  role VARCHAR(16) NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  tokens_used INT CHECK (tokens_used IS NULL OR tokens_used >= 0),
  extracted_fields JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chatbot_messages_session ON chatbot_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_created_at ON chatbot_messages(created_at);

-- Knowledge table for category-specific prompt aids
CREATE TABLE IF NOT EXISTS category_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID UNIQUE NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  qualification_questions JSONB,
  common_pain_points JSONB,
  budget_hints JSONB,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_category_knowledge_category ON category_knowledge(category_id);

-- Trigger to auto-update updated_at on category_knowledge
CREATE OR REPLACE FUNCTION update_updated_at_column_ck()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS update_category_knowledge_updated_at ON category_knowledge;
CREATE TRIGGER update_category_knowledge_updated_at
  BEFORE UPDATE ON category_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column_ck();

-- ============================================================================
-- 2) EXTEND LEADS WITH SOURCE/SESSION/CHATBOT FIELDS
-- ============================================================================

-- Ensure lead_source allows 'chatbot' (already VARCHAR with no strict enum); just document usage
ALTER TABLE leads ADD COLUMN IF NOT EXISTS chatbot_session_id UUID REFERENCES chatbot_sessions(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS extraction_confidence DECIMAL(4,3) CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS original_conversation JSONB;

CREATE INDEX IF NOT EXISTS idx_leads_chatbot_session ON leads(chatbot_session_id);

-- Optional JSONB index (commented due to extension requirements)
-- CREATE INDEX IF NOT EXISTS idx_leads_original_conversation ON leads USING GIN (original_conversation);

-- ============================================================================
-- 3) HOUSEKEEPING
-- ============================================================================

-- Backfill: none required for MVP. Existing rows will have NULLs for new fields.


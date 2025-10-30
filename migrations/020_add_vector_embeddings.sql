-- Migration: Add vector embeddings to chatbot_messages
-- Enables semantic search using HuggingFace embeddings + pgvector

-- ============================================================================
-- 1) ENABLE PGVECTOR EXTENSION
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- 2) ADD EMBEDDING COLUMN TO CHATBOT_MESSAGES
-- ============================================================================

-- Add embedding column (384 dimensions for HuggingFace all-MiniLM-L6-v2)
ALTER TABLE chatbot_messages 
ADD COLUMN IF NOT EXISTS embedding vector(384);

-- Make embedding nullable (existing messages won't have embeddings initially)
-- We'll backfill embeddings for existing messages if needed

-- ============================================================================
-- 3) CREATE INDEX FOR FAST SIMILARITY SEARCH
-- ============================================================================

-- IVFFlat index for cosine similarity search
-- Lists parameter: 100 is good for < 1M vectors
-- Adjust based on your data size:
--   - < 100K vectors: lists = 10
--   - 100K - 1M vectors: lists = 100
--   - > 1M vectors: lists = 1000

CREATE INDEX IF NOT EXISTS idx_chatbot_messages_embedding 
ON chatbot_messages 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100)
WHERE embedding IS NOT NULL;

-- ============================================================================
-- 4) BACKFILL EMBEDDINGS (OPTIONAL)
-- ============================================================================

-- Note: This is a placeholder. You'll need to run a script to backfill
-- embeddings for existing messages using the HuggingFace API.
-- See: scripts/backfill-embeddings.ts

-- Example query to find messages without embeddings:
-- SELECT id, content FROM chatbot_messages WHERE embedding IS NULL LIMIT 100;

-- ============================================================================
-- 5) HELPER FUNCTIONS (OPTIONAL)
-- ============================================================================

-- Function to find similar messages using cosine similarity
-- This can be called from your application code
CREATE OR REPLACE FUNCTION find_similar_messages(
  query_embedding vector(384),
  similarity_threshold float DEFAULT 0.7,
  result_limit int DEFAULT 5,
  exclude_session_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  session_id uuid,
  role varchar,
  content text,
  similarity float,
  created_at timestamp
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id,
    cm.session_id,
    cm.role::varchar,
    cm.content,
    1 - (cm.embedding <=> query_embedding) as similarity,
    cm.created_at
  FROM chatbot_messages cm
  WHERE cm.embedding IS NOT NULL
    AND cm.role = 'user'
    AND (exclude_session_id IS NULL OR cm.session_id != exclude_session_id)
    AND (1 - (cm.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY cm.embedding <=> query_embedding
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- NOTES
-- ============================================================================

-- Vector dimensions:
--   - HuggingFace all-MiniLM-L6-v2: 384 dimensions
--   - HuggingFace all-mpnet-base-v2: 768 dimensions
--   - OpenAI text-embedding-3-small: 1536 dimensions
--
-- If you change models, you'll need to:
--   1. Drop the embedding column
--   2. Recreate with new dimensions
--   3. Regenerate all embeddings

-- Similarity operators:
--   - <=> : Cosine distance (lower = more similar)
--   - <-> : Euclidean distance
--   - <#> : Negative inner product
--
-- Similarity score = 1 - distance
--   - 1.0 = identical
--   - 0.8+ = very similar
--   - 0.5-0.8 = somewhat similar
--   - <0.5 = not similar





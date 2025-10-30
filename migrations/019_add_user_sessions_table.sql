-- Migration: Add user_sessions table for PostgreSQL session storage
-- This table is used by connect-pg-simple to store Express sessions

CREATE TABLE IF NOT EXISTS user_sessions (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);

-- Index on expire column for efficient cleanup of expired sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_expire ON user_sessions(expire);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO PUBLIC;

-- Add comment for documentation
COMMENT ON TABLE user_sessions IS 'Session storage table for connect-pg-simple. Managed automatically by express-session middleware.';

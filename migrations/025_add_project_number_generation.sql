-- =========================================================
-- ADD PROJECT NUMBER GENERATION
-- Priority: P1 - Feature Enhancement
-- Impact: Auto-generates unique project numbers per user
-- Downtime: None
-- =========================================================

BEGIN;

-- Add project_number column to projects table if it doesn't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_number TEXT;

-- Create index for project_number lookups
CREATE INDEX IF NOT EXISTS idx_projects_project_number ON projects(project_number) WHERE project_number IS NOT NULL;

-- Create a table to track per-user project sequences
CREATE TABLE IF NOT EXISTS project_sequences (
  user_id VARCHAR NOT NULL PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_project_sequences_user_id ON project_sequences(user_id);

-- Function to get next project number atomically
CREATE OR REPLACE FUNCTION get_next_project_number(p_user_id VARCHAR)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  project_num TEXT;
BEGIN
  -- Insert or update atomically using INSERT ... ON CONFLICT
  INSERT INTO project_sequences (user_id, last_number)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_number = project_sequences.last_number + 1,
    updated_at = NOW()
  RETURNING last_number INTO next_num;

  -- Format the project number
  project_num := 'PRJ-' || LPAD(next_num::TEXT, 6, '0');

  RETURN project_num;
END;
$$ LANGUAGE plpgsql;

-- Initialize sequences for existing users based on their projects
-- First, we need to get user_id from clients table
INSERT INTO project_sequences (user_id, last_number)
SELECT
  c.user_id,
  COALESCE(
    MAX(CAST(SUBSTRING(p.project_number FROM 'PRJ-(\d+)') AS INTEGER)),
    0
  ) as last_number
FROM projects p
INNER JOIN clients c ON p.client_id = c.id
WHERE p.project_number IS NOT NULL
  AND p.project_number LIKE 'PRJ-%'
  AND c.user_id IS NOT NULL
GROUP BY c.user_id
ON CONFLICT (user_id) DO NOTHING;

-- Trigger to auto-generate project number if not provided
CREATE OR REPLACE FUNCTION auto_generate_project_number()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id VARCHAR;
BEGIN
  -- Only generate if project_number is not provided
  IF NEW.project_number IS NULL OR NEW.project_number = '' THEN
    -- Get user_id from the client
    SELECT c.user_id INTO v_user_id
    FROM clients c
    WHERE c.id = NEW.client_id;
    
    -- Generate project number if we have a user_id
    IF v_user_id IS NOT NULL THEN
      NEW.project_number := get_next_project_number(v_user_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_auto_project_number ON projects;
CREATE TRIGGER trigger_auto_project_number
  BEFORE INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_project_number();

COMMIT;


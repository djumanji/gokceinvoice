-- Migration: Add projects table for client projects
-- Created: 2025-01-27

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id_active ON projects(client_id, is_active) WHERE is_active = true;

-- Add comments for documentation
COMMENT ON TABLE projects IS 'Stores projects associated with clients';
COMMENT ON COLUMN projects.client_id IS 'Foreign key to clients table';
COMMENT ON COLUMN projects.name IS 'Project name';
COMMENT ON COLUMN projects.is_active IS 'Whether the project is currently active';


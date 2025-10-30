-- Add industry enum type
DO $$ BEGIN
  CREATE TYPE industry AS ENUM (
    'technology',
    'consulting',
    'marketing',
    'design',
    'finance',
    'healthcare',
    'education',
    'legal',
    'real-estate',
    'construction',
    'manufacturing',
    'retail',
    'hospitality',
    'transportation',
    'media',
    'nonprofit',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add industry column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS industry TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users.industry IS 'Industry/business category';

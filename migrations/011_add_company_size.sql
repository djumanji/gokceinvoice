-- Add company_size enum type
DO $$ BEGIN
  CREATE TYPE company_size AS ENUM ('solo', '2-10', '11-50', '51-200', '201-500', '500+');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add company_size column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_size TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users.company_size IS 'Company size category: solo, 2-10, 11-50, 51-200, 201-500, or 500+ employees';

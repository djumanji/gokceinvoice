-- Add company_logo column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_logo TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users.company_logo IS 'URL to company logo stored in S3';

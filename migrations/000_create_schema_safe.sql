-- Safe base schema migration - only creates tables if they don't exist
-- Run this in Replit Shell: psql $DATABASE_URL -f migrations/000_create_schema_safe.sql

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  username TEXT,
  password TEXT,
  provider TEXT DEFAULT 'local',
  provider_id TEXT,
  is_email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  tax_id TEXT,
  payment_terms INTEGER DEFAULT 30,
  currency TEXT DEFAULT 'EUR',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  client_id VARCHAR NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  date TIMESTAMP NOT NULL DEFAULT NOW(),
  order_number TEXT,
  project_number TEXT,
  for_project TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL DEFAULT '0',
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT '0',
  total DECIMAL(10, 2) NOT NULL
);

-- Create line_items table
CREATE TABLE IF NOT EXISTS line_items (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id VARCHAR NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price DECIMAL(10, 2) NOT NULL,
  unit TEXT DEFAULT 'item',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL DEFAULT NOW(),
  payment_method TEXT DEFAULT 'other',
  vendor TEXT,
  is_tax_deductible BOOLEAN DEFAULT true,
  receipt TEXT,
  tags TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add basic indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_line_items_invoice_id ON line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);


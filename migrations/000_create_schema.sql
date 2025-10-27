-- Create all database tables for Invoice Management System
-- Run this FIRST before running other migrations

-- Drop existing tables if they exist (for clean slate)
DROP TABLE IF EXISTS line_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
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
CREATE TABLE clients (
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
CREATE TABLE invoices (
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
CREATE TABLE line_items (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id VARCHAR NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL
);

-- Create services table
CREATE TABLE services (
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
CREATE TABLE expenses (
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

-- Add basic indexes
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_line_items_invoice_id ON line_items(invoice_id);
CREATE INDEX idx_services_user_id ON services(user_id);
CREATE INDEX idx_expenses_user_id ON expenses(user_id);


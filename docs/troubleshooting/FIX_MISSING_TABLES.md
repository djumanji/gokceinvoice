# 🔧 Fix: "relation users does not exist"

## The Problem ✅

Your error shows: `relation "users" does not exist`

**This means:** Your Neon database is connected ✅ but tables haven't been created yet ❌

## 🚀 Quick Fix (2 minutes)

### Option 1: Using Neon Web Console (Easiest) ⭐

1. **Go to:** [console.neon.tech](https://console.neon.tech)
2. **Sign in**
3. **Click** your project: `neondb`
4. **Click** "SQL Editor" (left sidebar)
5. **Open** the file: `migrations/000_create_schema.sql`
6. **Copy ALL the SQL** from that file
7. **Paste** into Neon SQL Editor
8. **Click** "Run"
9. **Done!** ✅

### Option 2: Using Replit Shell

```bash
# Set your database URL (or it's already in Secrets)
export DATABASE_URL="postgresql://neondb_owner:npg_WaRBsYr2vlQ7@ep-twilight-term-aek6kh9e.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Run the schema creation
psql $DATABASE_URL -f migrations/000_create_schema.sql
```

### Option 3: One Big Copy-Paste

Copy this SQL and paste into Neon SQL Editor:

```sql
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

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_line_items_invoice_id ON line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
```

---

## ✅ After Running SQL

1. **Restart your Repl** (Stop → Run)
2. **Try registering** at: https://invoice-track-flow-djumanji.replit.app/register
3. **Should work now!** 🎉

---

## 🔍 Verify Tables Were Created

In Neon SQL Editor, run:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

Should show:
- users ✅
- clients ✅
- invoices ✅
- line_items ✅
- services ✅
- expenses ✅

---

## 📝 Summary

**Problem:** Tables don't exist  
**Solution:** Run SQL to create tables  
**Time:** 2 minutes  
**Result:** Registration works! ✅

**Just copy the SQL above and run it in Neon Console!**


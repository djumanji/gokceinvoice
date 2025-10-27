# ⚡ Quick Migration Guide - 2 Minutes

## The Problem
Your Neon database exists, but tables haven't been created yet.

## 🎯 Solution: Run Migrations

### Option 1: Use Neon Web Console (Easiest - No Setup) ⭐

1. **Go to:** [console.neon.tech](https://console.neon.tech)
2. **Sign in** with your Neon account
3. **Click** your project: `neondb`
4. **Click** "SQL Editor" (left sidebar)
5. **Copy & paste** this SQL and click "Run":

```sql
-- First migration
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    -- Paste the contents of migrations/001_critical_indexes.sql here
    -- Just open that file and copy all the SQL
    RAISE NOTICE 'You need to copy the SQL from migrations/001_critical_indexes.sql';
  END IF;
END $$;
```

**Easier way:** Just open `migrations/001_critical_indexes.sql` file, copy ALL the SQL, paste into Neon SQL Editor, and click "Run"

Repeat for:
- `migrations/001_critical_indexes.sql`
- `migrations/002_data_integrity_constraints.sql`
- `migrations/004_invoice_number_fix.sql`

### Option 2: Use Replit Shell

**In Replit Shell, run:**

```bash
# Run all migrations at once
bash migrations/run-all.sh
```

**Or manually:**

```bash
# Set your database URL
export DATABASE_URL="postgresql://neondb_owner:npg_WaRBsYr2vlQ7@ep-twilight-term-aek6kh9e.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Run migrations
psql $DATABASE_URL -f migrations/001_critical_indexes.sql
psql $DATABASE_URL -f migrations/002_data_integrity_constraints.sql
psql $DATABASE_URL -f migrations/004_invoice_number_fix.sql
```

### Option 3: If psql Not Available in Replit

**Use node-fetch or curl to send SQL:**

1. Go to Neon Console SQL Editor
2. Manually copy/paste each migration file
3. Click "Run" for each one

## ✅ Verify It Worked

After running migrations, check tables exist:

```bash
# In Neon Console SQL Editor, run:
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

Should show:
- users
- clients  
- invoices
- line_items
- services
- expenses
- invoice_sequences

## 🚀 Then:

1. Restart your Repl
2. Try registering: https://invoice-track-flow-djumanji.replit.app/register
3. **It should work!** ✅

## 📝 Quick Checklist

- [ ] Go to Neon Console SQL Editor
- [ ] Copy migration SQL files
- [ ] Paste and Run in Neon
- [ ] Restart Repl
- [ ] Try registration
- [ ] Success! 🎉

---

**Total time: 2-5 minutes**


# 🚀 Neon Database Setup

## Your Current Setup

✅ **Neon Database:** Already configured  
✅ **Connection:** `ep-twilight-term-aek6kh9e.c-2.us-east-2.aws.neon.tech`  
✅ **Database:** `neondb`  

## ⚠️ The Preventive: Tables Not Created Yet

Your Neon database exists, but the tables haven't been created yet!

## ✅ Fix: Run Migrations

### Option 1: Using Neon Web Console (Easiest)

1. Go to [console.neon.tech](https://console.neon.tech)
2. Sign in
3. Open your `neondb` project
4. Click **"SQL Editor"** (left sidebar)
5. Copy and paste the contents of `migrations/001_critical_indexes.sql`
6. Click **"Run"**
7. Then paste `migrations/002_data_integrity_constraints.sql` and run
8. Then paste `migrations/003_row_level_security.sql` and run
9. Finally paste `migrations/004_invoice_number_fix.sql` and run

### Option 2: Using psql from Replit Shell

In your Replit Shell, run:

```bash
# Connect to Neon database
psql "postgresql://neondb_owner:npg_WaRBsYr2vlQ7@ep-twilight-term-aek6kh9e.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require" -f migrations/001_critical_indexes.sql

psql "postgresql://neondb_owner:npg_WaRBsYr2vlQ7@ep-twilight-term-aek6kh9e.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require" -f migrations/002_data_integrity_constraints.sql

psql "postgresql://neondb_owner:npg_WaRBsYr2vlQ7@ep-twilight-term-aek6kh9e.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require" -f migrations/004_invoice_number_fix.sql
```

### Option 3: Using Environment Variable

If DATABASE_URL is already set in Replit Secrets:

```bash
# Just run with the environment variable
psql $DATABASE_URL -f migrations/001_critical_indexes.sql
psql $DATABASE_URL -f migrations/002_data_integrity_constraints.sql  
psql $DATABASE_URL -f migrations/004_invoice_number_fix.sql
```

## 🔍 Verify Setup

Check if tables exist:

```bash
# In Replit Shell
psql $DATABASE_URL -c "\dt"

# Should show:
# users, clients, invoices, line_items, services, expenses, invoice_sequences
```

## ⚡ Quick Command (All at Once)

If `DATABASE_URL` is set in Replit Secrets:

```bash
psql $DATABASE_URL -f migrations/001_critical_indexes.sql && \
psql $DATABASE_URL -f migrations/002_data_integrity_constraints.sql && \
psql $DATABASE_URL -f migrations/004_invoice_number_fix.sql && \
echo "✅ Migrations complete!"
```

## 🎯 After Running Migrations

1. Restart your Repl
2. Try registering a user
3. It should work! ✅

---

## 📝 Summary

**Problem:** Database URL is valid, but tables don't exist  
**Solution:** Run the migration SQL files to create tables  
**Time:** 2 minutes  
**Result:** Registration will work! 🎉

---

## 🆘 Troubleshooting

**"psql: command not found"?**
- Install psql: `npm install -g pg` won't help
- Use Neon Web Console instead (Option 1)

**Connection refused?**
- Check your Neon project is active
- Verify password in connection string

**Tables already exist?**
- Migrations will error (that's OK)
- Your database is already set up!


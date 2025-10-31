# Replit Deployment Guide

## Step-by-Step Deployment Instructions

### Step 1: Pull Latest Main

```bash
git pull origin main
```

### Step 2: Run Migrations

The migration script has been updated to use the **safe schema** that won't drop existing tables. Run:

```bash
bash migrations/run-all.sh
```

**If you get errors about tables not existing:**

The safe schema creates base tables. If migrations fail because tables don't exist, run the base schema first:

```bash
# Option 1: Run just the safe schema first
psql $DATABASE_URL -f migrations/000_create_schema_safe.sql

# Then run all migrations
bash migrations/run-all.sh
```

**If psql is not installed in Replit:**

1. Install PostgreSQL client:
```bash
apt-get update && apt-get install -y postgresql-client
```

2. Or use Neon Web Console:
   - Go to https://console.neon.tech
   - Open SQL Editor
   - Copy/paste migration files one by one

**Manual Migration Order (if script fails):**

1. `000_create_schema_safe.sql` - Creates base tables
2. `001_critical_indexes.sql` - Adds indexes
3. `002_data_integrity_constraints.sql` - Adds constraints
4. `004_invoice_number_fix.sql` - Creates invoice number sequence
5. `005_add_user_profile_fields.sql` - Adds profile fields
6. `006_email_verification_and_reset.sql` - Email verification
7. `007_add_name_field_to_users.sql` - Name field
8. `008_add_bank_accounts_table.sql` - Bank accounts
9. `009_add_bank_account_id_to_invoices.sql` - Links invoices to bank accounts
10. `010_add_company_logo.sql` - Company logo
11. `011_add_projects_table.sql` - Projects
12. `012_add_company_size.sql` - Company size
13. `013_add_industry.sql` - Industry
14. `014_add_leads_system.sql` - Leads
15. `015_add_chatbot_tables.sql` - Chatbot
16. `016_add_needed_at_to_leads.sql` - Leads needed_at
17. `017_add_invoice_scheduling.sql` - Invoice scheduling
18. `018_add_prospect_system.sql` - Prospects
19. `018_add_recurring_invoices.sql` - **Recurring invoices**
20. `019_add_user_sessions_table.sql` - Sessions
21. `020_add_vector_embeddings.sql` - Vector embeddings (pgvector)
22. `021_add_marketing_only.sql` - Marketing users
23. `022_fix_password_constraint_for_marketing.sql` - Password fix
24. `023_add_invite_system.sql` - Invite system
25. `023_add_payments_table.sql` - **Payments system**
26. `024_add_admin_field.sql` - Admin user support
27. `024_add_invite_code.sql` - Invite codes
28. `025_add_project_number_generation.sql` - Project number sequences
29. `026_add_messages_system.sql` - Messaging system

### Step 3: Verify Database Setup

Check that tables exist:

```bash
psql $DATABASE_URL -c "\dt"
```

You should see tables like:
- users
- clients
- invoices
- line_items
- payments
- recurring_invoices
- bank_accounts
- etc.

### Step 4: Set Environment Variables

In Replit Secrets (🔒 icon), ensure these are set:

**Required:**
- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `SESSION_SECRET` - Generate with: `openssl rand -base64 32`

**Optional (for full functionality):**
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - OAuth
- `AWS_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_S3_BUCKET_NAME` - File uploads
- `RESEND_API_KEY` - Email sending
- `VITE_ENABLE_POSTHOG` - Set to `true` to enable PostHog analytics
- `VITE_POSTHOG_KEY` - PostHog Project API Key (starts with `phc_`)
- `VITE_POSTHOG_HOST` - PostHog host (default: `https://us.i.posthog.com`)

### Step 5: Build and Deploy

```bash
# Build the application
npm run build

# Start the production server
npm start
```

Or just click **Run** in Replit - it should auto-detect and run `npm start`.

### Step 6: Verify Deployment

1. Check console logs for any errors
2. Visit your Replit URL
3. Try registering a new user
4. Verify database connection works

## Troubleshooting

### "Tables not initialized" Error

**Cause:** The base schema wasn't run first.

**Solution:**
```bash
# Run base schema first
psql $DATABASE_URL -f migrations/000_create_schema_safe.sql

# Then run all migrations
bash migrations/run-all.sh
```

### Migration Fails Partway Through

**Solution:** The script continues on errors. Check which migration failed and run it manually:

```bash
psql $DATABASE_URL -f migrations/XXXX_migration_name.sql
```

### "psql: command not found"

**Solution:** Install PostgreSQL client:
```bash
apt-get update && apt-get install -y postgresql-client
```

### Database Connection Issues

**Check:**
1. `DATABASE_URL` is set in Secrets
2. Connection string format: `postgresql://user:pass@host:port/dbname`
3. Database is accessible (check Neon dashboard)

### Application Won't Start

**Check:**
1. `npm run build` succeeded
2. `SESSION_SECRET` is set
3. `DATABASE_URL` is set
4. Check console logs for errors

## Quick Reference

```bash
# Full deployment sequence
git pull origin main
bash migrations/run-all.sh
npm run build
npm start
```

## Need Help?

- Check migration logs in Replit console
- Verify database connection: `psql $DATABASE_URL -c "SELECT version();"`
- Check table count: `psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';"`


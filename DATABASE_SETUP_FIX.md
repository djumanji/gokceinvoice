# Database Setup Fix

## Issue
When trying to create a prospect on the marketing landing page, you're getting this error:
```
PostgresError: relation "users" does not exist
```

This happens because the database tables haven't been created yet.

## Solution

**Important:** You need to run migrations **in Replit** (where your app is deployed), not locally.

### Quick Answer

**Do you need to make changes locally first?**
- **Code changes**: Already done (improved error handling in `server/auth-routes.ts`). You can commit/push these if you want, but it's optional.
- **Database migrations**: **MUST be run in Replit** - where your database is located.

### Workflow

1. **Optional**: Commit and push the code changes (improved error handling)
   - These changes are already in your codebase
   - You can commit/push them if you want better error messages

2. **Required**: Run migrations in Replit (where your database is)
   - Open your Replit project
   - Set `DATABASE_URL` in Secrets (if not already set)
   - Run the migration script in Replit Shell

### Step 1: Set DATABASE_URL

**If you're using Neon (recommended):**
1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project or select existing one
3. Copy your connection string (looks like: `postgresql://user:password@host/database`)
4. Set it as an environment variable:

```bash
export DATABASE_URL="your-neon-connection-string"
```

**If you're using Docker:**
```bash
export DATABASE_URL="postgresql://postgres:password@localhost:5432/invoice_db"
```

### Step 2: Install Dependencies (if needed)

Before running migrations, make sure packages are installed:

```bash
npm install
```

This installs:
- `tsx` (for TypeScript execution)
- `postgres` (for database connection)
- All other project dependencies

**Note:** If you're using the bash script (`migrations/run-all.sh`), you'll also need `psql` (PostgreSQL client). Replit usually has this pre-installed, but if not, the TypeScript script (`npm run db:setup`) is recommended instead.

### Step 3: Run Database Migrations IN REPLIT

**In Replit Shell, run one of these:**

**Option A: Run TypeScript script directly (recommended)**
```bash
tsx setup-database.ts
```

**Option B: Using bash script**
```bash
bash migrations/run-all.sh
```

**Option C: Run migrations manually with psql**
```bash
# First, create the base schema (creates all tables)
psql $DATABASE_URL -f migrations/000_create_schema.sql

# Then run all other migrations
psql $DATABASE_URL -f migrations/001_critical_indexes.sql
psql $DATABASE_URL -f migrations/002_data_integrity_constraints.sql
psql $DATABASE_URL -f migrations/003_row_level_security.sql
psql $DATABASE_URL -f migrations/004_invoice_number_fix.sql
psql $DATABASE_URL -f migrations/005_add_user_profile_fields.sql
psql $DATABASE_URL -f migrations/005_email_verification_and_reset.sql
psql $DATABASE_URL -f migrations/006_add_name_field_to_users.sql
psql $DATABASE_URL -f migrations/007_add_bank_accounts_table.sql
psql $DATABASE_URL -f migrations/008_add_bank_account_id_to_invoices.sql
psql $DATABASE_URL -f migrations/009_add_company_logo.sql
psql $DATABASE_URL -f migrations/010_add_projects_table.sql
psql $DATABASE_URL -f migrations/011_add_company_size.sql
psql $DATABASE_URL -f migrations/012_add_industry.sql
psql $DATABASE_URL -f migrations/013_add_leads_system.sql
psql $DATABASE_URL -f migrations/014_add_chatbot_tables.sql
psql $DATABASE_URL -f migrations/015_add_needed_at_to_leads.sql
psql $DATABASE_URL -f migrations/016_add_invoice_scheduling.sql
psql $DATABASE_URL -f migrations/017_add_prospect_system.sql
```

**Note:** All migrations must be run **in Replit**, not locally. The database connection (`DATABASE_URL`) points to your Replit database.

### Step 3: Verify Setup

Check that tables were created:
```bash
psql $DATABASE_URL -c "\dt"
```

You should see tables like: `users`, `clients`, `invoices`, `line_items`, etc.

### Step 4: Test

Try creating a prospect again on the marketing landing page. It should work now!

## Troubleshooting

**Error: "DATABASE_URL is not set"**
- Make sure you've exported the environment variable in your terminal
- Or set it in your `.env` file (create one if it doesn't exist)
- Or set it in Replit Secrets

**Error: "connection refused"**
- Check that your database is running
- Verify your connection string is correct
- Check firewall/network settings

**Error: "psql: command not found"**
- Install PostgreSQL client tools
- Or use the TypeScript setup script: `npm run db:setup`
- Or use the Neon web console SQL editor

## After Setup

Once migrations are complete, the error should be resolved and you can:
- Create prospects on the marketing page
- Register new users
- Use all features of the application


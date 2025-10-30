#!/bin/bash

# Run all database migrations for Neon/PostgreSQL
# Usage: bash migrations/run-all.sh

set -e  # Exit on error

echo "🚀 Running Database Migrations..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL is not set"
    echo "Please set it in Replit Secrets or as environment variable"
    exit 1
fi

echo "✅ DATABASE_URL found"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql is not installed"
    echo "Please install PostgreSQL client or use Neon Web Console"
    echo ""
    echo "Alternative: Go to https://console.neon.tech"
    echo "Open SQL Editor and copy/paste migration files"
    exit 1
fi

# Test connection
echo "📡 Testing database connection..."
if ! psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
    echo "❌ Failed to connect to database"
    echo "Please check your DATABASE_URL"
    exit 1
fi
echo "✅ Connection successful"
echo ""

# Run migrations
# Start with the base schema that creates all tables
# NOTE: Use 000_create_schema_safe.sql for production (uses IF NOT EXISTS)
#       Use 000_create_schema.sql for fresh installs (destructive with DROP TABLE)
echo "📊 Running migration: 000_create_schema.sql (BASE SCHEMA)"
if psql "$DATABASE_URL" -f migrations/000_create_schema.sql; then
    echo "✅ Base schema created - all tables created"
else
    echo "⚠️  Base schema may already exist - continuing..."
fi
echo ""

echo "📊 Running migration: 001_critical_indexes.sql"
if psql "$DATABASE_URL" -f migrations/001_critical_indexes.sql; then
    echo "✅ Critical indexes created"
else
    echo "⚠️  Some indexes may already exist - continuing..."
fi
echo ""

echo "📊 Running migration: 002_data_integrity_constraints.sql"
if psql "$DATABASE_URL" -f migrations/002_data_integrity_constraints.sql; then
    echo "✅ Data integrity constraints added"
else
    echo "⚠️  Some constraints may already exist - continuing..."
fi
echo ""

echo "📊 Running migration: 003_row_level_security.sql"
if psql "$DATABASE_URL" -f migrations/003_row_level_security.sql; then
    echo "✅ Row level security enabled"
else
    echo "⚠️  RLS may already be configured - continuing..."
fi
echo ""

echo "📊 Running migration: 004_invoice_number_fix.sql"
if psql "$DATABASE_URL" -f migrations/004_invoice_number_fix.sql; then
    echo "✅ Invoice number sequence created"
else
    echo "⚠️  Invoice sequences may already exist - continuing..."
fi
echo ""

echo "📊 Running migration: 005_add_user_profile_fields.sql"
if psql "$DATABASE_URL" -f migrations/005_add_user_profile_fields.sql; then
    echo "✅ User profile fields added"
else
    echo "⚠️  Profile fields may already exist - continuing..."
fi
echo ""

echo "📊 Running migration: 006_email_verification_and_reset.sql"
if psql "$DATABASE_URL" -f migrations/006_email_verification_and_reset.sql; then
    echo "✅ Email verification and password reset fields added"
else
    echo "⚠️  Email verification fields may already exist - continuing..."
fi
echo ""

echo "📊 Running migration: 007_add_name_field_to_users.sql"
if psql "$DATABASE_URL" -f migrations/007_add_name_field_to_users.sql; then
    echo "✅ Name field added to users"
else
    echo "⚠️  Name field may already exist - continuing..."
fi
echo ""

echo "📊 Running migration: 008_add_bank_accounts_table.sql"
if psql "$DATABASE_URL" -f migrations/008_add_bank_accounts_table.sql; then
    echo "✅ Bank accounts table created"
else
    echo "⚠️  Bank accounts table may already exist - continuing..."
fi
echo ""

echo "📊 Running migration: 009_add_bank_account_id_to_invoices.sql"
if psql "$DATABASE_URL" -f migrations/009_add_bank_account_id_to_invoices.sql; then
    echo "✅ Bank account ID column added to invoices"
else
    echo "⚠️  Bank account ID column may already exist - continuing..."
fi
echo ""

echo "📊 Running migration: 010_add_company_logo.sql"
if psql "$DATABASE_URL" -f migrations/010_add_company_logo.sql; then
    echo "✅ Company logo column added to users"
else
    echo "⚠️  Company logo column may already exist - continuing..."
fi
echo ""

echo "📊 Running migration: 011_add_projects_table.sql"
if psql "$DATABASE_URL" -f migrations/011_add_projects_table.sql; then
    echo "✅ Projects table created"
else
    echo "⚠️  Projects table may already exist - continuing..."
fi
echo ""

echo "📊 Running migration: 012_add_company_size.sql"
if psql "$DATABASE_URL" -f migrations/012_add_company_size.sql; then
    echo "✅ Company size column added"
else
    echo "⚠️  Company size column may already exist - continuing..."
fi
echo ""

echo "📊 Running migration: 013_add_industry.sql"
if psql "$DATABASE_URL" -f migrations/013_add_industry.sql; then
    echo "✅ Industry column added"
else
    echo "⚠️  Industry column may already exist - continuing..."
fi
echo ""

echo "📊 Running migration: 014_add_leads_system.sql"
if psql "$DATABASE_URL" -f migrations/014_add_leads_system.sql; then
    echo "✅ Leads system created"
else
    echo "⚠️  Leads system may already exist - continuing..."
fi
echo ""

echo "📊 Running migration: 015_add_chatbot_tables.sql"
if psql "$DATABASE_URL" -f migrations/015_add_chatbot_tables.sql; then
    echo "✅ Chatbot tables created"
else
    echo "⚠️  Chatbot tables may already exist - continuing..."
fi
echo ""

echo "📊 Running migration: 016_add_needed_at_to_leads.sql"
if psql "$DATABASE_URL" -f migrations/016_add_needed_at_to_leads.sql; then
    echo "✅ Needed at column added to leads"
else
    echo "⚠️  Needed at column may already exist - continuing..."
fi
echo ""

echo "📊 Running migration: 017_add_invoice_scheduling.sql"
if psql "$DATABASE_URL" -f migrations/017_add_invoice_scheduling.sql; then
    echo "✅ Invoice scheduling added"
else
    echo "⚠️  Invoice scheduling may already exist - continuing..."
fi
echo ""

echo "📊 Running migration: 018_add_prospect_system.sql"
if psql "$DATABASE_URL" -f migrations/018_add_prospect_system.sql; then
    echo "✅ Prospect system added"
else
    echo "⚠️  Prospect system may already exist - continuing..."
fi
echo ""

echo "📊 Running migration: 019_add_user_sessions_table.sql"
if psql "$DATABASE_URL" -f migrations/019_add_user_sessions_table.sql; then
    echo "✅ User sessions table created for persistent session storage"
else
    echo "⚠️  User sessions table may already exist - continuing..."
fi
echo ""

# Verify tables exist
echo "🔍 Verifying tables..."
TABLE_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';" 2>/dev/null || echo "0")
echo "   Tables found: $TABLE_COUNT"

# List tables
echo ""
echo "📋 Database tables:"
psql "$DATABASE_URL" -c "\dt" 2>/dev/null || echo "Could not list tables"

echo ""
echo "🎉 Migrations complete!"
echo ""
echo "Next steps:"
echo "1. Restart your Repl"
echo "2. Try registering a user"
echo "3. It should work now! ✅"


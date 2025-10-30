#!/bin/bash

# Run Neon Migrations Script
# ⚠️  NOTE: This script is for personal Neon account setup (alternative)
# ⚠️  Current Setup: Using Replit's Neon integration (migrations run via migrations/run-all.sh)
# ⚠️  Use this script only if you want to run migrations on personal Neon databases
#
# This script helps run migrations on Neon databases using connection strings
# Usage: ./scripts/run-neon-migrations.sh [dev-connection-string] [prod-connection-string]

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${BLUE}Neon Database Migration Runner${NC}"
echo ""
echo -e "${YELLOW}⚠️  NOTE: This script is for PERSONAL Neon accounts${NC}"
echo -e "${YELLOW}    Current setup uses Replit's Neon integration${NC}"
echo -e "${YELLOW}    For Replit Neon, use: bash migrations/run-all.sh${NC}"
echo ""
echo -e "${BLUE}Use this script only if migrating to personal Neon account${NC}"
echo ""

DEV_URL="${1:-$DATABASE_URL}"
PROD_URL="${2:-$DATABASE_URL_PROD}"

if [ -z "$DEV_URL" ]; then
    echo -e "${RED}❌ Dev connection string required${NC}"
    echo "Usage: $0 [dev-url] [prod-url]"
    echo "   Or set DATABASE_URL and DATABASE_URL_PROD environment variables"
    exit 1
fi

run_migration() {
    local url=$1
    local migration_file=$2
    local branch_name=$3
    
    echo -e "${BLUE}Running $migration_file on $branch_name...${NC}"
    
    if command -v psql &> /dev/null; then
        if psql "$url" -f "$migration_file" 2>&1 | grep -v "already exists\|does not exist\|duplicate\|relation.*already exists"; then
            echo -e "${GREEN}✅ $migration_file completed${NC}"
        else
            echo -e "${YELLOW}⚠️  $migration_file had some warnings (may already be applied)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  psql not found. Skipping $migration_file${NC}"
        echo "   Install PostgreSQL client or use Neon Console SQL Editor"
    fi
    echo ""
}

# Run migrations on dev branch
if [ -n "$DEV_URL" ]; then
    echo -e "${CYAN}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║   Running Migrations on DEV Branch      ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════╝${NC}"
    echo ""
    
    # Note: Migration 000 already done via MCP
    # Migration 001 uses CONCURRENTLY - needs special handling
    echo -e "${YELLOW}Skipping 001_critical_indexes.sql (use Neon Console for CONCURRENTLY)${NC}"
    echo ""
    
    run_migration "$DEV_URL" "migrations/002_data_integrity_constraints.sql" "dev"
    run_migration "$DEV_URL" "migrations/003_row_level_security.sql" "dev"
    run_migration "$DEV_URL" "migrations/004_invoice_number_fix.sql" "dev"
    run_migration "$DEV_URL" "migrations/005_add_user_profile_fields.sql" "dev"
    run_migration "$DEV_URL" "migrations/006_email_verification_and_reset.sql" "dev"
    run_migration "$DEV_URL" "migrations/007_add_name_field_to_users.sql" "dev"
    run_migration "$DEV_URL" "migrations/008_add_bank_accounts_table.sql" "dev"
    run_migration "$DEV_URL" "migrations/009_add_bank_account_id_to_invoices.sql" "dev"
    run_migration "$DEV_URL" "migrations/010_add_company_logo.sql" "dev"
    run_migration "$DEV_URL" "migrations/011_add_projects_table.sql" "dev"
    run_migration "$DEV_URL" "migrations/012_add_company_size.sql" "dev"
    run_migration "$DEV_URL" "migrations/013_add_industry.sql" "dev"
    run_migration "$DEV_URL" "migrations/014_add_leads_system.sql" "dev"
    run_migration "$DEV_URL" "migrations/015_add_chatbot_tables.sql" "dev"
    run_migration "$DEV_URL" "migrations/016_add_needed_at_to_leads.sql" "dev"
    run_migration "$DEV_URL" "migrations/017_add_invoice_scheduling.sql" "dev"
    run_migration "$DEV_URL" "migrations/018_add_prospect_system.sql" "dev"
    run_migration "$DEV_URL" "migrations/019_add_user_sessions_table.sql" "dev"
    
    echo -e "${GREEN}✅ Dev migrations complete!${NC}"
    echo ""
fi

# Run migrations on prod branch
if [ -n "$PROD_URL" ]; then
    echo -e "${CYAN}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║   Running Migrations on PROD Branch     ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════╝${NC}"
    echo ""
    
    # Note: Migration 000 already done via MCP
    echo -e "${YELLOW}Skipping 001_critical_indexes.sql (use Neon Console for CONCURRENTLY)${NC}"
    echo ""
    
    run_migration "$PROD_URL" "migrations/002_data_integrity_constraints.sql" "prod"
    run_migration "$PROD_URL" "migrations/003_row_level_security.sql" "prod"
    run_migration "$PROD_URL" "migrations/004_invoice_number_fix.sql" "prod"
    run_migration "$PROD_URL" "migrations/005_add_user_profile_fields.sql" "prod"
    run_migration "$PROD_URL" "migrations/006_email_verification_and_reset.sql" "prod"
    run_migration "$PROD_URL" "migrations/007_add_name_field_to_users.sql" "prod"
    run_migration "$PROD_URL" "migrations/008_add_bank_accounts_table.sql" "prod"
    run_migration "$PROD_URL" "migrations/009_add_bank_account_id_to_invoices.sql" "prod"
    run_migration "$PROD_URL" "migrations/010_add_company_logo.sql" "prod"
    run_migration "$PROD_URL" "migrations/011_add_projects_table.sql" "prod"
    run_migration "$PROD_URL" "migrations/012_add_company_size.sql" "prod"
    run_migration "$PROD_URL" "migrations/013_add_industry.sql" "prod"
    run_migration "$PROD_URL" "migrations/014_add_leads_system.sql" "prod"
    run_migration "$PROD_URL" "migrations/015_add_chatbot_tables.sql" "prod"
    run_migration "$PROD_URL" "migrations/016_add_needed_at_to_leads.sql" "prod"
    run_migration "$PROD_URL" "migrations/017_add_invoice_scheduling.sql" "prod"
    run_migration "$PROD_URL" "migrations/018_add_prospect_system.sql" "prod"
    run_migration "$PROD_URL" "migrations/019_add_user_sessions_table.sql" "prod"
    
    echo -e "${GREEN}✅ Prod migrations complete!${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠️  Production URL not provided. Skipping prod migrations.${NC}"
fi

echo ""
echo -e "${GREEN}🎉 All migrations completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Run migration 001_critical_indexes.sql manually via Neon Console"
echo "   (uses CONCURRENTLY which requires special handling)"
echo "2. Configure Replit Secrets using: bash scripts/configure-replit-neon.sh"
echo "3. Test your application"
echo ""


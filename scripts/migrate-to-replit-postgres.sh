#!/bin/bash

# Neon to Replit PostgreSQL Migration Script
# This script helps migrate your database from Neon to Replit's built-in PostgreSQL

set -e  # Exit on any error

echo "🚀 Neon to Replit PostgreSQL Migration Script"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required environment variables are set
check_env_vars() {
    echo -e "${BLUE}Checking environment variables...${NC}"

    if [ -z "$NEON_DATABASE_URL" ]; then
        echo -e "${RED}❌ NEON_DATABASE_URL is not set${NC}"
        echo "Please set NEON_DATABASE_URL to your current Neon database connection string"
        echo "Example: export NEON_DATABASE_URL='postgresql://user:password@host/database'"
        exit 1
    fi

    if [ -z "$DATABASE_URL" ]; then
        echo -e "${RED}❌ DATABASE_URL is not set${NC}"
        echo "Please make sure you're running this in Replit (DATABASE_URL should be auto-set)"
        exit 1
    fi

    echo -e "${GREEN}✅ Environment variables are set${NC}"
    echo ""
}

# Test database connections
test_connections() {
    echo -e "${BLUE}Testing database connections...${NC}"

    echo "Testing Neon connection..."
    if psql "$NEON_DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Neon database connection successful${NC}"
    else
        echo -e "${RED}❌ Failed to connect to Neon database${NC}"
        exit 1
    fi

    echo "Testing Replit PostgreSQL connection..."
    if psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Replit PostgreSQL connection successful${NC}"
    else
        echo -e "${RED}❌ Failed to connect to Replit PostgreSQL${NC}"
        exit 1
    fi

    echo ""
}

# Get database sizes
check_database_sizes() {
    echo -e "${BLUE}Checking database sizes...${NC}"

    echo "Neon database size:"
    NEON_SIZE=$(psql "$NEON_DATABASE_URL" -tAc "SELECT pg_size_pretty(pg_database_size(current_database()));")
    echo -e "${YELLOW}  $NEON_SIZE${NC}"

    echo "Replit database size:"
    REPLIT_SIZE=$(psql "$DATABASE_URL" -tAc "SELECT pg_size_pretty(pg_database_size(current_database()));")
    echo -e "${YELLOW}  $REPLIT_SIZE${NC}"

    echo ""
}

# Create backup of Neon database
create_backup() {
    echo -e "${BLUE}Creating backup of Neon database...${NC}"

    BACKUP_FILE="neon_backup_$(date +%Y%m%d_%H%M%S).sql"

    echo "Creating backup file: $BACKUP_FILE"
    if pg_dump "$NEON_DATABASE_URL" --no-owner --no-privileges --clean --if-exists > "$BACKUP_FILE"; then
        echo -e "${GREEN}✅ Backup created successfully: $BACKUP_FILE${NC}"
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo -e "${YELLOW}  Backup size: $BACKUP_SIZE${NC}"
    else
        echo -e "${RED}❌ Failed to create backup${NC}"
        exit 1
    fi

    echo ""
}

# Apply migrations to Replit database
apply_migrations() {
    echo -e "${BLUE}Applying database migrations to Replit PostgreSQL...${NC}"

    # Run the migration script
    if bash migrations/run-all.sh; then
        echo -e "${GREEN}✅ Migrations applied successfully${NC}"
    else
        echo -e "${RED}❌ Failed to apply migrations${NC}"
        exit 1
    fi

    echo ""
}

# Import data from backup
import_data() {
    echo -e "${BLUE}Importing data from Neon backup...${NC}"

    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}❌ Backup file not found: $BACKUP_FILE${NC}"
        exit 1
    fi

    echo "Importing data into Replit PostgreSQL..."
    echo -e "${YELLOW}⚠️  This may take some time depending on your data size...${NC}"

    # Import the data
    if psql "$DATABASE_URL" < "$BACKUP_FILE" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Data import completed successfully${NC}"
    else
        echo -e "${RED}❌ Data import failed${NC}"
        echo -e "${YELLOW}Note: Some errors may be expected (e.g., duplicate key violations)${NC}"
        echo "Please check the logs above for any critical errors"
    fi

    echo ""
}

# Verify migration
verify_migration() {
    echo -e "${BLUE}Verifying migration...${NC}"

    # Compare table counts
    NEON_TABLES=$(psql "$NEON_DATABASE_URL" -tAc "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';")
    REPLIT_TABLES=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';")

    echo "Tables - Neon: $NEON_TABLES, Replit: $REPLIT_TABLES"

    # Check key tables
    TABLES_TO_CHECK=("users" "invoices" "clients" "expenses")

    for table in "${TABLES_TO_CHECK[@]}"; do
        NEON_COUNT=$(psql "$NEON_DATABASE_URL" -tAc "SELECT COUNT(*) FROM $table;" 2>/dev/null || echo "0")
        REPLIT_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM $table;" 2>/dev/null || echo "0")
        echo "$table - Neon: $NEON_COUNT, Replit: $REPLIT_COUNT"
    done

    echo ""
}

# Clean up
cleanup() {
    echo -e "${BLUE}Cleaning up...${NC}"

    if [ -f "$BACKUP_FILE" ]; then
        echo "Keeping backup file: $BACKUP_FILE"
        echo -e "${YELLOW}⚠️  Remember to securely delete this file after verifying the migration${NC}"
    fi

    echo ""
}

# Main migration process
main() {
    echo "This script will help you migrate from Neon to Replit PostgreSQL."
    echo -e "${YELLOW}⚠️  IMPORTANT: This process will overwrite data in your Replit database${NC}"
    echo ""

    read -p "Do you want to continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Migration cancelled."
        exit 0
    fi

    check_env_vars
    test_connections
    check_database_sizes
    create_backup
    apply_migrations
    import_data
    verify_migration
    cleanup

    echo -e "${GREEN}🎉 Migration completed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Test your application thoroughly"
    echo "2. Update your environment variables to use DATABASE_URL only"
    echo "3. Remove NEON_DATABASE_URL from your secrets"
    echo "4. Securely delete the backup file: $BACKUP_FILE"
    echo ""
    echo -e "${YELLOW}⚠️  Don't forget to update your DNS and application URLs if needed${NC}"
}

# Run main function
main "$@"

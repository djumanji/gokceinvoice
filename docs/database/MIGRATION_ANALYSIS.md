# Migration Analysis & Optimization Report

## Issues Found

### 1. **Duplicate Migration Numbers**
- ❌ `005_add_user_profile_fields.sql` and `005_email_verification_and_reset.sql` both use `005`
- ✅ Solution: Renumber the second one to `006` and adjust subsequent migrations

### 2. **Duplicate Base Schemas**
- `000_create_schema.sql` - Destructive (DROP TABLE)
- `000_create_schema_safe.sql` - Safe (CREATE IF NOT EXISTS)
- ✅ Recommendation: Use safe version for production, keep destructive for fresh installs

### 3. **Index Duplication**
- `000_create_schema.sql` creates basic indexes
- `001_critical_indexes.sql` creates same indexes with CONCURRENTLY
- ✅ Solution: Remove indexes from 000, let 001 handle all indexes

### 4. **Schema Mismatches**
- `005_add_user_profile_fields.sql` adds `preferred_currency` but it's NOT in `schema.ts`
- `016_add_invoice_scheduling.sql` adds `scheduled_date` but it's already in base schema
- ✅ Solution: Remove `preferred_currency` from 005, ensure `scheduled_date` is in base schema

### 5. **Enum Type Usage**
- `011_add_company_size.sql` creates enum but uses TEXT column
- `012_add_industry.sql` creates enum but uses TEXT column
- ✅ Solution: Either use enums properly or remove enum creation

### 6. **Missing IF NOT EXISTS**
- Some migrations don't use `IF NOT EXISTS` consistently
- ✅ Solution: Add `IF NOT EXISTS` to all CREATE statements

### 7. **CONCURRENTLY Usage**
- `001_critical_indexes.sql` uses CONCURRENTLY (good)
- `016_add_invoice_scheduling.sql` uses CONCURRENTLY (good)
- `017_add_prospect_system.sql` uses CONCURRENTLY (good)
- But some migrations don't use it when they should
- ✅ Solution: Use CONCURRENTLY for all index creation in production migrations

## Optimization Plan

### Phase 1: Fix Numbering
1. Rename `005_email_verification_and_reset.sql` → `006_email_verification_and_reset.sql`
2. Renumber subsequent migrations accordingly

### Phase 2: Consolidate Base Schema
1. Update `000_create_schema.sql` to include all fields from schema.ts
2. Add `scheduled_date` to invoices table in base schema
3. Remove duplicate indexes from base schema

### Phase 3: Clean Up Migrations
1. Remove `preferred_currency` from `005_add_user_profile_fields.sql`
2. Remove duplicate `scheduled_date` addition from `016_add_invoice_scheduling.sql`
3. Ensure all migrations use `IF NOT EXISTS`

### Phase 4: Optimize Indexes
1. Consolidate all index creation in `001_critical_indexes.sql`
2. Remove basic indexes from `000_create_schema.sql`
3. Ensure all use `CONCURRENTLY IF NOT EXISTS`

## Migration Order (Corrected)

1. `000_create_schema.sql` OR `000_create_schema_safe.sql` - Base tables
2. `001_critical_indexes.sql` - All indexes
3. `002_data_integrity_constraints.sql` - Constraints
4. `003_row_level_security.sql` - RLS (if using)
5. `004_invoice_number_fix.sql` - Invoice sequences
6. `005_add_user_profile_fields.sql` - Profile fields (without preferred_currency)
7. `006_email_verification_and_reset.sql` - Email verification (renumbered)
8. `007_add_name_field_to_users.sql` - Name field
9. `008_add_bank_accounts_table.sql` - Bank accounts
10. `009_add_bank_account_id_to_invoices.sql` - Bank account FK
11. `010_add_company_logo.sql` - Company logo
12. `011_add_projects_table.sql` - Projects
13. `012_add_company_size.sql` - Company size
14. `013_add_industry.sql` - Industry
15. `014_add_leads_system.sql` - Leads system
16. `015_add_chatbot_tables.sql` - Chatbot
17. `016_add_needed_at_to_leads.sql` - Needed at
18. `017_add_invoice_scheduling.sql` - Invoice scheduling (skip scheduled_date if already exists)
19. `018_add_prospect_system.sql` - Prospects
20. `019_add_user_sessions_table.sql` - Sessions (renumbered from 018)

## Recommendations

### High Priority
1. ✅ Fix duplicate numbering immediately
2. ✅ Remove `preferred_currency` from migration 005
3. ✅ Consolidate index creation

### Medium Priority
4. ✅ Ensure all migrations are idempotent (IF NOT EXISTS)
5. ✅ Add proper error handling comments
6. ✅ Document dependencies between migrations

### Low Priority
7. Consider using enum types properly or remove enum creation
8. Consider migration tracking table for production
9. Add rollback scripts for critical migrations


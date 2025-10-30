#!/usr/bin/env tsx
/**
 * Database Setup Script for Neon in Replit
 * 
 * This script runs all migrations to set up your database.
 * Run it with: npm run tsx setup-database.ts
 * Or: tsx setup-database.ts
 */

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL is not set');
  console.log('');
  console.log('Please set your Neon database URL in Replit Secrets:');
  console.log('1. Go to Replit Secrets (🔒 icon in sidebar)');
  console.log('2. Add: DATABASE_URL = your-neon-connection-string');
  console.log('');
  process.exit(1);
}

// Validate DATABASE_URL format
if (DATABASE_URL.length < 20 || !DATABASE_URL.includes('postgres')) {
  console.error('❌ Invalid DATABASE_URL format');
  console.log('It should look like: postgresql://user:password@host/database');
  process.exit(1);
}

const migrations = [
  '000_create_schema.sql',
  '001_critical_indexes.sql',
  '002_data_integrity_constraints.sql',
  '003_row_level_security.sql',
  '004_invoice_number_fix.sql',
  '005_add_user_profile_fields.sql',
  '006_email_verification_and_reset.sql',
  '007_add_name_field_to_users.sql',
  '008_add_bank_accounts_table.sql',
  '009_add_bank_account_id_to_invoices.sql',
  '010_add_company_logo.sql',
  '011_add_projects_table.sql',
  '012_add_company_size.sql',
  '013_add_industry.sql',
  '014_add_leads_system.sql',
  '015_add_chatbot_tables.sql',
  '016_add_needed_at_to_leads.sql',
  '017_add_invoice_scheduling.sql',
  '018_add_prospect_system.sql',
  '019_add_user_sessions_table.sql',
];

async function setupDatabase() {
  console.log('🚀 Setting up Neon Database for First Launch...');
  console.log('================================================');
  console.log('');

  let db: postgres.Sql;
  
  try {
    db = postgres(DATABASE_URL);
    
    // Test connection
    console.log('📡 Testing database connection...');
    await db`SELECT version()`;
    console.log('✅ Successfully connected to Neon database');
    console.log('');

    // Check existing tables
    const existingTables = await db`
      SELECT COUNT(*) as count 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `;
    
    const tableCount = Number(existingTables[0]?.count || 0);
    
    if (tableCount > 0) {
      console.log(`⚠️  Warning: Database already has ${tableCount} table(s)`);
      console.log('');
      console.log('Running migrations anyway (will skip if tables/columns already exist)...');
      console.log('');
    }

    // Run migrations
    console.log(`📊 Running ${migrations.length} migrations...`);
    console.log('');

    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      const step = i + 1;
      
      try {
        const sql = readFileSync(join(process.cwd(), 'migrations', migration), 'utf-8');
        
        // Split by semicolons and execute each statement
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));
        
        for (const statement of statements) {
          try {
            await db.unsafe(statement);
          } catch (error: any) {
            // Ignore "already exists" errors
            if (!error.message?.includes('already exists') && 
                !error.message?.includes('duplicate') &&
                !error.message?.includes('already defined')) {
              throw error;
            }
          }
        }
        
        console.log(`   ✅ [${step}/${migrations.length}] ${migration}`);
      } catch (error: any) {
        console.log(`   ⚠️  [${step}/${migrations.length}] ${migration} - ${error.message}`);
        // Continue with next migration
      }
    }

    console.log('');
    console.log('🔍 Verifying setup...');
    console.log('');

    // Verify tables exist
    const tables = await db`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    console.log(`📋 Created ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`   ✓ ${table.tablename}`);
    });

    console.log('');
    console.log('================================================');
    console.log('🎉 Database setup complete!');
    console.log('');
    console.log('Your database is now ready to use!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart your Repl (or click Run)');
    console.log('2. Try registering a new user account');
    console.log('3. Start creating invoices!');
    console.log('');
    console.log('✅ Setup complete!');

    await db.end();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Please check:');
    console.error('1. Your DATABASE_URL is correct');
    console.error('2. Your Neon database is accessible');
    console.error('3. You have proper permissions');
    process.exit(1);
  }
}

setupDatabase().catch(console.error);


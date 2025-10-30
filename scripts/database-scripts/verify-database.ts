#!/usr/bin/env tsx
/**
 * Quick database verification script
 * Run with: npm run tsx verify-database.ts
 * Or: tsx verify-database.ts
 */

import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL is not set');
  process.exit(1);
}

async function verifyDatabase() {
  console.log('🔍 Verifying Neon Database Setup...');
  console.log('');
  
  let db: postgres.Sql;
  
  try {
    db = postgres(DATABASE_URL);
    
    // Test connection
    console.log('📡 Testing connection...');
    await db`SELECT version()`;
    console.log('✅ Connected successfully');
    console.log('');
    
    // Check tables
    console.log('📊 Checking tables...');
    const tables = await db`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    
    if (tables.length === 0) {
      console.log('❌ No tables found!');
      console.log('');
      console.log('Please run: npm run db:setup');
      process.exit(1);
    }
    
    console.log(`✅ Found ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`   ✓ ${table.tablename}`);
    });
    console.log('');
    
    // Check for critical tables
    const criticalTables = ['users', 'clients', 'invoices', 'line_items'];
    const tableNames = tables.map(t => t.tablename);
    const missingTables = criticalTables.filter(t => !tableNames.includes(t));
    
    if (missingTables.length > 0) {
      console.log('⚠️  Missing critical tables:');
      missingTables.forEach(t => console.log(`   - ${t}`));
      console.log('');
      console.log('Please run: npm run db:setup');
      process.exit(1);
    }
    
    // Check for enums
    console.log('📋 Checking enums...');
    const enums = await db`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e'
      ORDER BY typname
    `;
    
    if (enums.length > 0) {
      console.log(`✅ Found ${enums.length} enums:`);
      enums.forEach(e => console.log(`   ✓ ${e.typname}`));
    }
    console.log('');
    
    // Check for indexes
    console.log('📑 Checking indexes...');
    const indexes = await db`
      SELECT COUNT(*) as count 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `;
    console.log(`✅ Found ${indexes[0].count} indexes`);
    console.log('');
    
    await db.end();
    
    console.log('========================================');
    console.log('🎉 Database is properly configured!');
    console.log('');
    console.log('Your Neon database is ready to use.');
    console.log('You can now start using the application.');
    console.log('');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Please check:');
    console.error('1. DATABASE_URL is set correctly');
    console.error('2. Your Neon database is accessible');
    console.error('3. Run: npm run db:setup');
    process.exit(1);
  }
}

verifyDatabase().catch(console.error);


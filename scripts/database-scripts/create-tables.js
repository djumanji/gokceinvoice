import postgres from 'postgres';
import { readFileSync } from 'fs';

const DATABASE_URL = process.env.DATABASE_URL || process.argv[2];

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL not set');
  console.log('Usage: node create-tables.js <database-url>');
  process.exit(1);
}

console.log('🚀 Creating database tables...\n');

try {
  const db = postgres(DATABASE_URL);
  
  // Read and execute the schema SQL
  const sql = readFileSync('migrations/000_create_schema.sql', 'utf-8');
  await db.unsafe(sql);
  
  console.log('✅ All tables created successfully!\n');
  
  // Verify tables exist
  const tables = await db`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
  `;
  
  console.log('📋 Created tables:');
  tables.forEach(table => console.log(`   ✓ ${table.tablename}`));
  console.log('');
  console.log('🎉 Database setup complete!');
  
  await db.end();
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Details:', error);
  process.exit(1);
}


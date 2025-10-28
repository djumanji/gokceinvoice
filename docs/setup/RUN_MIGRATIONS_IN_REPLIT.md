# 🚀 Create Database Tables in Replit (No Neon Console Needed)

## Method 1: Using psql (If Available) ✅

### In Replit Shell:

```bash
# Set the database URL
export DATABASE_URL="postgresql://neondb_owner:npg_WaRBsYr2vlQ7@ep-twilight-term-aek6kh9e.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Run the schema creation
psql $DATABASE_URL -f migrations/000_create_schema.sql
```

**If psql is not installed**, continue to Method 2.

---

## Method 2: Using Node.js Script (Always Works) ⭐

I'll create a script that runs the migrations using Node.js (which is already in Replit):

### Step 1: In Replit Shell, run this command:

```bash
cat > run-migrations.js << 'EOF'
import postgres from 'postgres';
import { readFileSync } from 'fs';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_WaRBsYr2vlQ7@ep-twilight-term-aek6kh9e.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

console.log('🚀 Running database migrations...\n');

try {
  const sql = postgres(DATABASE_URL);
  
  // Read the schema file
  const schemaSQL = readFileSync('migrations/000_create_schema.sql', 'utf-8');
  
  // Execute the SQL
  await sql.unsafe(schemaSQL);
  
  console.log('✅ Tables created successfully!\n');
  
  // Verify tables exist
  const tables = await sql`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public';
  `;
  
  console.log('📋 Tables in database:');
  tables.forEach(table => console.log(`  - ${table.tablename}`));
  
  await sql.end();
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
EOF

# Run the migration script
node run-migrations.js
```

**This will create all tables!** ✅

---

## Method 3: Quick One-Liner (Copy-Paste)

Just paste this entire block into Replit Shell:

```bash
node -e "
import('postgres').then(async ({ default: postgres }) => {
  import('fs').then(async ({ readFileSync }) => {
    const db = postgres(process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_WaRBsYr2vlQ7@ep-twilight-term-aek6kh9e.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require');
    const sql = readFileSync('migrations/000_create_schema.sql', 'utf-8');
    await db.unsafe(sql);
    const tables = await db\`SELECT tablename FROM pg_tables WHERE schemaname = 'public'\`;
    console.log('✅ Created tables:', tables.map(t => t.tablename).join(', '));
    await db.end();
  });
});
"
```

---

## Method 4: Direct SQL Execution (Simplest) ⭐⭐⭐

### In Replit Shell:

```bash
node -e "
(async () => {
  const postgres = (await import('postgres')).default;
  const { readFileSync } = await import('fs');
  
  console.log('🚀 Creating database tables...\n');
  
  const db = postgres(process.env.DATABASE_URL);
  
  try {
    const sql = readFileSync('migrations/000_create_schema.sql', 'utf-8');
    await db.unsafe(sql);
    console.log('✅ All tables created successfully!\n');
    
    const tables = await db\`SELECT tablename FROM pg_tables WHERE schemaname = 'public'\`;
    console.log('📋 Tables:');
    tables.forEach(t => console.log(\`   ✓ \${t.tablename}\`));
    
    await db.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await db.end();
  }
})();
"
```

---

## 🎯 Recommended: Method 4

**Just copy-paste the entire block from Method 4 into Replit Shell and press Enter!**

It will:
1. ✅ Connect to your Neon database
2. ✅ Read the SQL file
3. ✅ Create all tables
4. ✅ Show you what was created
5. ✅ Close connection

---

## ✅ After Running

1. **Check the output** - should show all tables created
2. **Restart your Repl** (Stop → Run)
3. **Try registering** - should work now! 🎉

---

## 🆘 Troubleshooting

**"Cannot find module 'postgres'"**
- Make sure you ran `npm install` in Replit

**"File not found"**
- Make sure you're in the project root
- Check the file exists: `ls migrations/000_create_schema.sql`

**Connection timeout**
- Check DATABASE_URL is correct
- Make sure Neon database is active

---

## 📝 Summary

**Copy Method 4** → Paste in Replit Shell → Press Enter → Done! ✅

No need to leave Replit or use Neon console!


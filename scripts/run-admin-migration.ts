import "../server/config/env";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function runMigration() {
  try {
    console.log("Running migration: Add is_admin column to users table...");
    
    // Add is_admin column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false NOT NULL;
    `);
    
    console.log("✅ Added is_admin column");
    
    // Create index for admin queries
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = true;
    `);
    
    console.log("✅ Created index for admin queries");
    console.log("✅ Migration completed successfully!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error running migration:", error);
    process.exit(1);
  }
}

runMigration();


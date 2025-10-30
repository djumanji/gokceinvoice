import "../server/config/env";
import postgres from "postgres";
import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = postgres(connectionString, { max: 1 });

  try {
    console.log("Running project number generation migration...");
    
    const migrationSQL = readFileSync(
      join(__dirname, "../migrations/025_add_project_number_generation.sql"),
      "utf-8"
    );
    
    // Execute the entire migration as one transaction block
    await sql.begin(async (tx) => {
      await tx.unsafe(migrationSQL);
    });

    console.log("✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error running migration:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();


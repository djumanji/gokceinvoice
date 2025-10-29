import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use standard postgres driver for better performance with local PostgreSQL
// This works with both Replit's local PostgreSQL and remote databases
const client = postgres(process.env.DATABASE_URL, {
  max: 10, // Connection pool size
  idle_timeout: 20, // Close idle connections after 20s
  connect_timeout: 10, // Connection timeout in seconds
});

export const db = drizzle(client, { schema });

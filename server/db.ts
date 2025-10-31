import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Environment-based database selection
// Current Setup: Uses Replit's Neon integration (DATABASE_URL set automatically)
// Optional: Supports separate dev/prod databases if DATABASE_URL_PROD is configured
//
// - Development: uses DATABASE_URL (Replit Neon or dev branch)
// - Production: uses DATABASE_URL_PROD (prod branch) or falls back to DATABASE_URL
//
// Note: Replit's Neon integration automatically sets DATABASE_URL.
// For personal Neon account with dev/prod branches, configure DATABASE_URL_PROD.
function getDatabaseUrl(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // In production, prefer DATABASE_URL_PROD if available
  if (isProduction && process.env.DATABASE_URL_PROD) {
    return process.env.DATABASE_URL_PROD;
  }
  
  // Otherwise use DATABASE_URL (Replit Neon or dev branch)
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const databaseUrl = getDatabaseUrl();

// Log which database is being used (only in development for security)
if (process.env.NODE_ENV === 'development') {
  const dbInfo = process.env.DATABASE_URL_PROD && databaseUrl === process.env.DATABASE_URL_PROD
    ? 'production database' 
    : 'development database';
  console.log(`📊 Using ${dbInfo} for database connection`);
}

// Use standard postgres driver for better performance
// This works with both Replit's local PostgreSQL and remote databases (Neon, etc.)
const client = postgres(databaseUrl, {
  max: 10, // Connection pool size
  idle_timeout: 20, // Close idle connections after 20s
  connect_timeout: 10, // Connection timeout in seconds
});

export const db = drizzle(client, { schema });
export const pg = client; // Export raw postgres client for complex queries

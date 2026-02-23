import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

// DEMO MODE: allow boot without a DB.
// Routes should fall back to in-memory storage when db is null.
export const pool = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL }) : null;

export const db = pool ? drizzle(pool, { schema }) : null;

if (!DATABASE_URL) {
  console.warn("[db] DATABASE_URL not set — running in DEMO mode (no DB).");
}

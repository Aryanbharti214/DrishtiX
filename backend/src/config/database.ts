import pg from "pg";

import { env } from "./env.js";

const { Pool } = pg;

export const db = new Pool({
  connectionString: env.DATABASE_URL,
});

db.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});

export async function checkDatabaseConnection() {
  const result = await db.query(
    "SELECT NOW() AS current_time"
  );

  return result.rows[0];
}
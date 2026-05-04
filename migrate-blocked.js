import { db } from './lib/db/index.js';
import { sql } from 'drizzle-orm';

async function main() {
  console.log("Creating blocked_users table...");
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS blocked_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      identifier TEXT NOT NULL UNIQUE,
      note TEXT,
      blocked_at TEXT DEFAULT (CURRENT_TIMESTAMP)
    );
  `);

  console.log("Done adding blocked_users!");
}

main().catch(console.error);

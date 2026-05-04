import { db } from './lib/db/index.js';
import { sql } from 'drizzle-orm';

async function main() {
  console.log("Creating orders table...");
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      number TEXT NOT NULL,
      address TEXT NOT NULL,
      shipping TEXT,
      shipping_cost REAL,
      total_value REAL,
      status TEXT DEFAULT 'Processing',
      phone_call_status TEXT DEFAULT 'Pending',
      items TEXT,
      currency TEXT DEFAULT 'BDT',
      post_id TEXT,
      post_type TEXT,
      client_info TEXT,
      marketing TEXT,
      date TEXT DEFAULT (CURRENT_TIMESTAMP),
      sms_status TEXT DEFAULT 'Pending',
      note TEXT
    );
  `);
  
  console.log("Creating partial_orders table...");
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS partial_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL UNIQUE,
      name TEXT,
      number TEXT,
      address TEXT,
      shipping TEXT,
      shipping_cost REAL,
      total_value REAL,
      items TEXT,
      currency TEXT,
      post_id TEXT,
      post_type TEXT,
      client_info TEXT,
      marketing TEXT,
      local_time TEXT,
      date TEXT DEFAULT (CURRENT_TIMESTAMP)
    );
  `);

  console.log("Done!");
}

main().catch(console.error);

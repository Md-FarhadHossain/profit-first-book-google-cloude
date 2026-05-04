import { db } from './lib/db/index.js';
import { sql } from 'drizzle-orm';

async function main() {
  console.log("Adding district and thana columns to orders table...");
  try {
    await db.run(sql`ALTER TABLE orders ADD COLUMN district TEXT;`);
    console.log("Added district to orders");
  } catch(e) { console.log(e.message); }
  
  try {
    await db.run(sql`ALTER TABLE orders ADD COLUMN thana TEXT;`);
    console.log("Added thana to orders");
  } catch(e) { console.log(e.message); }

  console.log("Adding district and thana columns to partial_orders table...");
  try {
    await db.run(sql`ALTER TABLE partial_orders ADD COLUMN district TEXT;`);
    console.log("Added district to partial_orders");
  } catch(e) { console.log(e.message); }
  
  try {
    await db.run(sql`ALTER TABLE partial_orders ADD COLUMN thana TEXT;`);
    console.log("Added thana to partial_orders");
  } catch(e) { console.log(e.message); }

  console.log("Done!");
}

main().catch(console.error);

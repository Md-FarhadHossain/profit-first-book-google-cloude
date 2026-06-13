import fs from 'fs';
import path from 'path';

const envConfig = fs.readFileSync('.env', 'utf-8');
envConfig.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    process.env[key.trim()] = values.join('=').trim().replace(/(^"|"$|^\r|\r$)/g, '');
  }
});

import { sql } from 'drizzle-orm';

async function main() {
  const { db } = await import('./lib/db/index.js');
  console.log("Adding tracking columns to sessions table...");
  try {
    await db.run(sql`ALTER TABLE sessions ADD COLUMN added_to_cart INTEGER DEFAULT 0;`);
    console.log("Added added_to_cart to sessions");
  } catch(e) { console.log("Notice: " + e.message) }
  
  try {
    await db.run(sql`ALTER TABLE sessions ADD COLUMN initiated_checkout INTEGER DEFAULT 0;`);
    console.log("Added initiated_checkout to sessions");
  } catch(e) { console.log("Notice: " + e.message) }

  console.log("Done!");
  process.exit(0);
}

main().catch(console.error);

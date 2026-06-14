import fs from 'fs';
const env = fs.readFileSync('.env', 'utf8');
env.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length) {
    process.env[key.trim()] = values.join('=').trim().replace(/^['"]|['"]$/g, '');
  }
});

async function main() {
  console.log("Adding courier_note column to orders table...");
  const { db } = await import('./lib/db/index.js');
  const { sql } = await import('drizzle-orm');
  try {
    await db.run(sql`ALTER TABLE orders ADD COLUMN courier_note TEXT;`);
    console.log("Successfully added courier_note column!");
  } catch (err) {
    if (err.message.includes("duplicate column name")) {
      console.log("Column already exists. Skipping.");
    } else {
      console.error("Error:", err);
    }
  }
}

main().catch(console.error);

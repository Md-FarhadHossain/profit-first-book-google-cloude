import fs from 'fs';
import { createClient } from '@libsql/client';

const envText = fs.readFileSync('.env', 'utf-8');
envText.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...val] = line.split('=');
    process.env[key.trim()] = val.join('=').trim().replace(/\"/g, '').replace(/\r/g, '');
  }
});

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function run() {
  const res = await client.execute("PRAGMA table_info('orders');");
  console.log('Columns in orders table:');
  console.log(res.rows.map(r => r.name).join(', '));
}

run().catch(console.error);

import { createClient } from '@libsql/client';

// --- CONFIG ---
const TURSO_DATABASE_URL = 'libsql://profit-first-test-farhadix.aws-ap-south-1.turso.io';
const TURSO_AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzIzMDI5MzQsImlkIjoiZmY5YjA3NzAtYzJmYy00ZmY3LTgyZTktNjI1Y2ExNTRkY2U2IiwicmlkIjoiYjA0ZGIwZTMtODc4MS00OWM0LTg0ZmQtY2NkY2FiYzE3YzRiIn0.jYrhAewlQReASsgbx4XfX-eTDr37rD_mqjNrBlbqTw_FDMiJEK5SnsTAZPlslrbc0llRYDVKlacZl0dGf_EnCg';
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

// The cutoff: orders updated BEFORE our fix was pushed (Apr 6, 2026 UTC)
// We only fix records created before the webhook fix was deployed.
const FIX_CUTOFF_ISO = '2026-04-06T00:00:00.000Z';

const client = createClient({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN });

function subtractSixHours(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString; // leave unparseable values alone
  return new Date(d.getTime() - SIX_HOURS_MS).toISOString();
}

async function run() {
  console.log('🔌 Connecting to Turso database...');

  // Fetch all orders that have at least one timestamp field set
  const result = await client.execute(
    `SELECT id, order_id, shipped_at, delivered_at, returned_at
     FROM orders
     WHERE (shipped_at IS NOT NULL OR delivered_at IS NOT NULL OR returned_at IS NOT NULL)
     AND updated_at < '${FIX_CUTOFF_ISO}'`
  );

  const rows = result.rows;
  console.log(`\n📦 Found ${rows.length} orders to fix.\n`);

  if (rows.length === 0) {
    console.log('✅ Nothing to fix! All timestamps already look correct.');
    await client.close();
    return;
  }

  // Preview first 3 orders before/after
  console.log('--- PREVIEW (first 3 orders) ---');
  for (const row of rows.slice(0, 3)) {
    console.log(`Order ${row.order_id}:`);
    if (row.shipped_at)   console.log(`  shippedAt:   ${row.shipped_at} → ${subtractSixHours(row.shipped_at)}`);
    if (row.delivered_at) console.log(`  deliveredAt: ${row.delivered_at} → ${subtractSixHours(row.delivered_at)}`);
    if (row.returned_at)  console.log(`  returnedAt:  ${row.returned_at} → ${subtractSixHours(row.returned_at)}`);
  }
  console.log('--- END PREVIEW ---\n');

  console.log('🔧 Applying fixes...');
  let fixed = 0;

  for (const row of rows) {
    const newShippedAt   = subtractSixHours(row.shipped_at);
    const newDeliveredAt = subtractSixHours(row.delivered_at);
    const newReturnedAt  = subtractSixHours(row.returned_at);

    await client.execute({
      sql: `UPDATE orders SET shipped_at = ?, delivered_at = ?, returned_at = ? WHERE id = ?`,
      args: [newShippedAt, newDeliveredAt, newReturnedAt, row.id]
    });

    fixed++;
    if (fixed % 10 === 0) process.stdout.write(`  ...fixed ${fixed}/${rows.length}\r`);
  }

  console.log(`\n✅ Done! Fixed ${fixed} orders successfully.`);
  await client.close();
}

run().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

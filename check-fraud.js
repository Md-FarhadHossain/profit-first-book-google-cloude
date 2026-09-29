const { sql } = require('@vercel/postgres');
require('dotenv').config();

async function check() {
  const result = await sql.query("SELECT phone, data FROM steadfast_history WHERE (data->>'total_reports')::int > 0 LIMIT 1");
  console.log(JSON.stringify(result.rows, null, 2));
}
check();

const { sql } = require('@vercel/postgres');
require('dotenv').config();

async function check() {
  const result = await sql.query("SELECT data FROM steadfast_history WHERE phone = '01761486554'");
  console.log(JSON.stringify(result.rows[0], null, 2));
}
check();

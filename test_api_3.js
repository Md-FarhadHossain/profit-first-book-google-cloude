import { db } from './lib/db/index.js';
import { orders } from './lib/db/schema.js';
import { isNotNull, eq } from 'drizzle-orm';

async function test() {
  const orderList = await db.select().from(orders).where(isNotNull(orders.courierNote)).limit(5);
  console.log(`Found ${orderList.length} orders with courierNote`);
  for (const o of orderList) {
    console.log(`Order ${o.orderId} - Note: ${o.courierNote}`);
  }
  process.exit(0);
}

test().catch(err => { console.error(err); process.exit(1); });

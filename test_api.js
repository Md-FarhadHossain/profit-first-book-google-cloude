import { db } from './lib/db/index.js';
import { orders } from './lib/db/schema.js';
import { isNotNull } from 'drizzle-orm';
import fetch from 'node-fetch'; // or use native fetch if node 18+

async function test() {
  const orderList = await db.select().from(orders).where(isNotNull(orders.consignmentId)).limit(1);
  if (orderList.length === 0) {
    console.log('No order found with a consignment ID.');
    process.exit(1);
  }

  const order = orderList[0];
  const cid = order.consignmentId;
  const trackingCode = order.trackingCode;
  console.log('Checking CID:', cid, 'Tracking:', trackingCode);

  const apiKey = process.env.STEADFAST_API_KEY;
  const secretKey = process.env.STEADFAST_SECRET_KEY;

  if(!apiKey) { console.log('No API key found in env.'); process.exit(1); }

  const response = await fetch(`https://portal.packzy.com/api/v1/status_by_cid/${cid}`, {
    method: 'GET',
    headers: {
      'Api-Key': apiKey,
      'Secret-Key': secretKey,
      'Content-Type': 'application/json'
    }
  });

  const json = await response.json();
  console.log(JSON.stringify(json, null, 2));
  process.exit(0);
}

test().catch(err => { console.error(err); process.exit(1); });

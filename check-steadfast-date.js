import { db } from './lib/db/index.js';
import { orders } from './lib/db/schema.js';
import { eq, and } from 'drizzle-orm';

const STEADFAST_API_URL = 'https://portal.packzy.com/api/v1';

async function checkConsignmentDate() {
  try {
    const toCheck = await db.select().from(orders).where(
      and(
        eq(orders.status, 'Shipped'),
        eq(orders.courierStatus, 'pending')
      )
    ).limit(1);
    
    if (toCheck.length === 0) {
      console.log("No orders found.");
      return;
    }
    const order = toCheck[0];
    console.log(`Checking order ${order.orderId} with CID ${order.consignmentId}`);

    const apiKey = process.env.STEADFAST_API_KEY;
    const secretKey = process.env.STEADFAST_SECRET_KEY;

    const response = await fetch(`${STEADFAST_API_URL}/status_by_cid/${order.consignmentId}`, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'Secret-Key': secretKey,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log("Steadfast response payload:");
    console.log(result);
    
  } catch (error) {
    console.error('Check failed:', error);
  } finally {
    process.exit(0);
  }
}

checkConsignmentDate();

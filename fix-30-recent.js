import { db } from './lib/db/index.js';
import { orders } from './lib/db/schema.js';
import { eq, and, desc } from 'drizzle-orm';

async function checkRecent() {
  try {
    const toUpdate = await db.select().from(orders).where(
      and(
        eq(orders.status, 'Shipped'),
        eq(orders.courierStatus, 'pending')
      )
    ).orderBy(desc(orders.id)).limit(30);
    
    // We will update these 30 to 'In Review'
    for (const order of toUpdate) {
       await db.update(orders)
          .set({ status: 'In Review' })
          .where(eq(orders.id, order.id));
    }
    console.log(`Successfully migrated the ${toUpdate.length} most recent orders to 'In Review'.`);
    
  } catch (error) {
    console.error('Check failed:', error);
  } finally {
    process.exit(0);
  }
}

checkRecent();

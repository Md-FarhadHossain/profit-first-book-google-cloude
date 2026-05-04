import { db } from './lib/db/index.js';
import { orders } from './lib/db/schema.js';
import { eq, and } from 'drizzle-orm';

async function migrate() {
  try {
    console.log("Starting migration to fix 'Shipped' parcels with 'pending' Steadfast status...");
    
    // Find how many to update first (optional, but good for logging)
    const toUpdate = await db.select().from(orders).where(
      and(
        eq(orders.status, 'Shipped'),
        eq(orders.courierStatus, 'pending')
      )
    );
    
    console.log(`Found ${toUpdate.length} orders to migrate back to 'In Review'`);
    
    if (toUpdate.length > 0) {
      const result = await db.update(orders)
        .set({ status: 'In Review' })
        .where(
          and(
            eq(orders.status, 'Shipped'),
            eq(orders.courierStatus, 'pending')
          )
        )
        .returning({ updatedId: orders.id, orderId: orders.orderId });
        
      console.log(`Successfully migrated ${result.length} orders.`);
      console.log('Migrated Order IDs:', result.map(r => r.orderId).join(', '));
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();

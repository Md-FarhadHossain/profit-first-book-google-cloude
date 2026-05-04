import { db } from './lib/db/index.js';
import { orders } from './lib/db/schema.js';
import { eq, and } from 'drizzle-orm';

async function revertOlder() {
  try {
    const toUpdate = await db.select().from(orders).where(
      and(
        eq(orders.status, 'In Review'),
        eq(orders.courierStatus, 'pending')
      )
    );
    
    // Convert current time to string for matching. Today is March 10, 2026.
    // The dates are in "YYYY-MM-DD HH:MM:SS" or similar format.
    // Anything not starting with "2026-03-10" or "2026-03-09" depending on time zone or what was meant by "today" 
    // user said "today... like 30 to 31, 32 to 35 something like that"
    
    const todayPrefix = "2026-03-10";
    
    const olderOrders = toUpdate.filter(o => !o.date?.startsWith(todayPrefix));
    const todayOrders = toUpdate.filter(o => o.date?.startsWith(todayPrefix));
    
    console.log(`Found ${todayOrders.length} orders from today (${todayPrefix}). These will stay 'In Review'.`);
    console.log(`Found ${olderOrders.length} older orders. Reverting these back to 'Shipped'.`);
    
    if (olderOrders.length > 0) {
      const idsToRevert = olderOrders.map(o => o.id);
      
      // We will revert them back to "Shipped" one by one or in a batch
      // For simplicity, do a loop to avoid Drizzle inArray limits
      let count = 0;
      for (const order of olderOrders) {
         await db.update(orders)
            .set({ status: 'Shipped' })
            .where(eq(orders.id, order.id));
         count++;
      }
      console.log(`Successfully reverted ${count} older orders back to 'Shipped'.`);
    } else {
      console.log('No older orders found to revert.');
    }
    
  } catch (error) {
    console.error('Revert failed:', error);
  } finally {
    process.exit(0);
  }
}

revertOlder();

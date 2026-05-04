import { db } from './lib/db/index.js';
import { orders } from './lib/db/schema.js';
import { eq, and } from 'drizzle-orm';

async function checkDates() {
  try {
    const toUpdate = await db.select().from(orders).where(
      and(
        eq(orders.status, 'Shipped'),
        eq(orders.courierStatus, 'pending')
      )
    );
    
    // summarize by date (YYYY-MM-DD)
    const countsByDate = {};
    toUpdate.forEach(o => {
        let dStr = 'unknown';
        if (o.date) {
            dStr = o.date.split(' ')[0];
            if(o.date.includes('T')) {
               dStr = o.date.split('T')[0];
            }
        }
        
        countsByDate[dStr] = (countsByDate[dStr] || 0) + 1;
    });
    
    console.log("Counts of Shipped/pending by date created:");
    console.log(countsByDate);
    
  } catch (error) {
    console.error('Check failed:', error);
  } finally {
    process.exit(0);
  }
}

checkDates();

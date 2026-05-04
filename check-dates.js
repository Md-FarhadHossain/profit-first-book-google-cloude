import { db } from './lib/db/index.js';
import { orders } from './lib/db/schema.js';
import { eq, and } from 'drizzle-orm';

async function checkDates() {
  try {
    const toUpdate = await db.select().from(orders).where(
      and(
        eq(orders.status, 'In Review'),
        eq(orders.courierStatus, 'pending')
      )
    );
    
    // summarize by date (YYYY-MM-DD)
    const countsByDate = {};
    toUpdate.forEach(o => {
        const d = o.date ? o.date.split(' ')[0] : 'unknown'; // assuming YYYY-MM-DD HH:MM:SS or ISO
        // also check if 'T' is there
        let dStr = d;
        if(o.date?.includes('T')) {
           dStr = o.date.split('T')[0];
        }
        
        countsByDate[dStr] = (countsByDate[dStr] || 0) + 1;
    });
    
    console.log("Counts of In Review/pending by date created:");
    console.log(countsByDate);
    
  } catch (error) {
    console.error('Check failed:', error);
  } finally {
    process.exit(0);
  }
}

checkDates();

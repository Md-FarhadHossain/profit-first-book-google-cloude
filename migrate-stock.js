import { db } from './lib/db/index.js';
import { stocks, stockHistory } from './lib/db/schema.js';

async function migrateStock() {
  try {
    const existingStocks = await db.select().from(stocks);
    if (existingStocks.length > 0) {
      console.log('Existing stocks:', existingStocks);
      const baseline = existingStocks[0].quantity;
      
      const history = await db.select().from(stockHistory);
      if (history.length === 0) {
        await db.insert(stockHistory).values({
          amount: baseline,
          date: new Date().toISOString()
        });
        console.log(`Migrated baseline stock of ${baseline} to stock_history.`);
      } else {
        console.log('Stock history already exists. Skipping migration.');
      }
    } else {
      console.log('No existing stock found in stocks table.');
    }
  } catch (err) {
    console.error(err);
  }
}

migrateStock();

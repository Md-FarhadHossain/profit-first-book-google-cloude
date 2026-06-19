import { db } from './lib/db/index.js';
import { stockHistory } from './lib/db/schema.js';

async function clear() {
  await db.delete(stockHistory);
  console.log('Cleared stock history');
}
clear();

'use server';

import { db } from '../../lib/db/index.js';
import { stocks, stockHistory, orders } from '../../lib/db/schema.js';
import { eq, inArray, desc } from 'drizzle-orm';

// Get the stock history (all additions)
export async function getStockHistory() {
  try {
    const history = await db.select().from(stockHistory).orderBy(desc(stockHistory.date));
    return history;
  } catch (error) {
    console.error('Failed to get stock history:', error);
    throw new Error('Could not fetch stock history.');
  }
}

// Add a new stock entry
export async function addStockHistory(amount) {
  try {
    await db.insert(stockHistory).values({
      amount: amount,
      date: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Failed to add stock history:', error);
    throw new Error('Could not add stock history.');
  }
}

// Delete a stock entry
export async function deleteStockHistory(id) {
  try {
    await db.delete(stockHistory).where(eq(stockHistory.id, id));
    return true;
  } catch (error) {
    console.error('Failed to delete stock history:', error);
    throw new Error('Could not delete stock history.');
  }
}

// Calculate Available Stock dynamically
export async function getStock(productName = 'Book') {
  try {
    // 1. Calculate Total Added Stock and find the Baseline Date
    // The baseline date is the very first time stock was added.
    const history = await db.select().from(stockHistory).orderBy(stockHistory.date);
    if (history.length === 0) {
      return 0; // No stock added yet
    }
    
    const baselineDate = history[0].date;
    const totalAdded = history.reduce((sum, item) => sum + item.amount, 0);

    // 2. Calculate Total Shipped + Delivered Quantities
    // A book "leaves" the office if it's Shipped or Delivered.
    const outOfOfficeOrders = await db.select().from(orders).where(
      inArray(orders.status, ['Shipped', 'Delivered'])
    );

    let totalOutQuantity = 0;
    outOfOfficeOrders.forEach(order => {
      // Determine when the book left the office. 
      // If shippedAt is available, use it. Otherwise use deliveredAt or updatedAt.
      const leftOfficeAt = order.shippedAt || order.deliveredAt || order.updatedAt;
      
      // Only deduct if the order left the office AFTER the very first stock was counted
      // (Orders shipped before the baseline were already gone and shouldn't be deducted from the new count)
      if (leftOfficeAt && new Date(leftOfficeAt) >= new Date(baselineDate)) {
        let orderQuantity = 0;
        if (order.items && Array.isArray(order.items)) {
          orderQuantity = order.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0);
        }
        if (orderQuantity === 0) orderQuantity = 1;
        totalOutQuantity += orderQuantity;
      }
    });

    // 3. Available Stock
    return totalAdded - totalOutQuantity;
  } catch (error) {
    console.error('Failed to calculate available stock:', error);
    throw new Error('Could not calculate stock.');
  }
}

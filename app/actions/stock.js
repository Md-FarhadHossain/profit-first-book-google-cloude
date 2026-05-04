'use server';

import { db } from '../../lib/db/index.js';
import { stocks } from '../../lib/db/schema.js';
import { eq } from 'drizzle-orm';

// Fetch the current stock for a given product name
export async function getStock(productName = 'Book') {
  try {
    const result = await db.select().from(stocks).where(eq(stocks.name, productName)).limit(1);
    
    // If stock doesn't exist, we should initialize it.
    if (result.length === 0) {
      await initializeStock(productName, 1000);
      return 1000;
    }
    
    return result[0].quantity;
  } catch (error) {
    console.error('Failed to get stock:', error);
    throw new Error('Could not fetch stock data.');
  }
}

// Update stock completely (set to a specific value)
export async function setStock(productName = 'Book', newQuantity) {
  try {
    await db.update(stocks)
      .set({ quantity: newQuantity, updatedAt: new Date().toISOString() })
      .where(eq(stocks.name, productName));
    return true;
  } catch (error) {
    console.error('Failed to set stock:', error);
    throw new Error('Could not update stock data.');
  }
}

// Ensure at least the product exists with an initial quantity
export async function initializeStock(productName = 'Book', initialQuantity = 1000) {
  try {
    const result = await db.select().from(stocks).where(eq(stocks.name, productName)).limit(1);
    if (result.length === 0) {
      await db.insert(stocks).values({
        name: productName,
        quantity: initialQuantity
      });
    }
    return true;
  } catch (error) {
    console.error('Failed to initialize stock:', error);
    throw new Error('Could not initialize stock.');
  }
}

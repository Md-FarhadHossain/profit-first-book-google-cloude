'use server';

import { db } from '../../lib/db/index.js';
import { orders } from '../../lib/db/schema.js';
import { eq, ne } from 'drizzle-orm';

export async function getFinancialStats() {
  try {
    // Fetch only delivered orders for realized revenue (exclude Fake orders)
    const deliveredOrders = await db.select().from(orders).where(eq(orders.status, 'Delivered'));

    let totalRevenue = 0;
    let totalShippingRevenue = 0;
    let totalDeliveredQuantity = 0;

    deliveredOrders.forEach(order => {
      const orderValue = order.totalValue || 0;
      const shippingCost = order.shippingCost || 0;

      // Revenue is the full totalValue (product price + shipping)
      totalRevenue += orderValue;
      // Shipping portion of revenue (to allow net product revenue calc on frontend)
      totalShippingRevenue += shippingCost;

      // Count actual book units from items array
      // items is stored as JSON: [{ quantity: N, item_name: "...", price: ... }, ...]
      let orderQuantity = 0;
      if (order.items && Array.isArray(order.items)) {
        orderQuantity = order.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0);
      }
      // Fallback: if items is empty/null, treat as 1 unit per order
      if (orderQuantity === 0) orderQuantity = 1;

      totalDeliveredQuantity += orderQuantity;
    });

    // Net product revenue = total revenue minus shipping (what you actually earned on books)
    const totalProductRevenue = totalRevenue - totalShippingRevenue;

    return {
      success: true,
      totalRevenue,           // Full collected amount (product + shipping)
      totalProductRevenue,    // Revenue from books only (shipping stripped out)
      totalShippingRevenue,   // Shipping revenue collected (already in courier expense)
      totalDeliveredQuantity, // Accurate book unit count (respects multi-qty orders)
      totalDeliveredOrders: deliveredOrders.length, // Raw order count for reference
    };
  } catch (error) {
    console.error('Failed to get financial stats:', error);
    return {
      success: false,
      totalRevenue: 0,
      totalProductRevenue: 0,
      totalShippingRevenue: 0,
      totalDeliveredQuantity: 0,
      totalDeliveredOrders: 0,
    };
  }
}

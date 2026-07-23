'use server';

import { db } from '../../lib/db/index.js';
import { orders } from '../../lib/db/schema.js';
import { sql } from 'drizzle-orm';

export async function getParcelPerformance() {
  try {
    const result = await db.select({
      orderDate: sql`DATE(substr(${orders.date}, 1, 10))`.mapWith(String).as('orderDate'),
      
      totalOrders: sql`CAST(SUM(1) AS INTEGER)`.mapWith(Number).as('totalOrders'),
      
      shipped: sql`CAST(SUM(CASE WHEN ${orders.status} IN ('Shipped', 'Delivered', 'Returned') OR ${orders.courierStatus} IN ('in_transit', 'delivered', 'returned', 'partial_delivered') THEN 1 ELSE 0 END) AS INTEGER)`.mapWith(Number).as('shipped'),
      
      delivered: sql`CAST(SUM(CASE WHEN ${orders.status} = 'Delivered' OR ${orders.courierStatus} IN ('delivered', 'partial_delivered') THEN 1 ELSE 0 END) AS INTEGER)`.mapWith(Number).as('delivered'),
      
      returned: sql`CAST(SUM(CASE WHEN 
        (${orders.status} = 'Returned' OR ${orders.courierStatus} = 'returned')
        AND NOT (${orders.status} = 'Delivered' OR ${orders.courierStatus} IN ('delivered', 'partial_delivered'))
        THEN 1 ELSE 0 END) AS INTEGER)`.mapWith(Number).as('returned'),
      
      canceled: sql`CAST(SUM(CASE WHEN 
        (${orders.status} = 'Cancelled' OR ${orders.courierStatus} = 'cancelled')
        AND NOT (${orders.status} = 'Delivered' OR ${orders.courierStatus} IN ('delivered', 'partial_delivered'))
        AND NOT (${orders.status} = 'Returned' OR ${orders.courierStatus} = 'returned')
        THEN 1 ELSE 0 END) AS INTEGER)`.mapWith(Number).as('canceled'),
        
      pending: sql`CAST(SUM(CASE WHEN 
        NOT (${orders.status} = 'Delivered' OR ${orders.courierStatus} IN ('delivered', 'partial_delivered'))
        AND NOT (${orders.status} = 'Returned' OR ${orders.courierStatus} = 'returned')
        AND NOT (${orders.status} = 'Cancelled' OR ${orders.courierStatus} = 'cancelled')
        THEN 1 ELSE 0 END) AS INTEGER)`.mapWith(Number).as('pending'),
    })
    .from(orders)
    .where(sql`${orders.status} NOT IN ('Fake', 'Duplicate', 'Abandoned') AND ${orders.date} IS NOT NULL`)
    .groupBy(sql`DATE(substr(${orders.date}, 1, 10))`)
    .orderBy(sql`DATE(substr(${orders.date}, 1, 10)) DESC`);

    return result;
  } catch (error) {
    console.error("Failed to fetch parcel performance:", error);
    return [];
  }
}

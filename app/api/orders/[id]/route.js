import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, stocks } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function PATCH(request, props) {
  const params = await props.params;
  try {
    const id = params.id;
    const { status } = await request.json();
    
    if (status) {
      // 1. Fetch the current order to check and avoid duplicate deductions
      // You may want to prevent decrementing if it's already "Delivered" 
      // or incrementing if already "Returned" in the future, 
      // but for now we follow the simple state transition:
      const [existingOrder] = await db.select().from(orders).where(eq(orders.id, Number(id)));
      
      if (!existingOrder) {
         return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
      }

      const oldStatus = existingOrder.status;

      // 2. Default Book stock interaction mapped to the specific state shifts
      // If it changed TO Shipped from something else
      if (status === 'Shipped' && oldStatus !== 'Shipped') {
        await db.update(stocks)
          .set({ quantity: sql`${stocks.quantity} - 1` })
          .where(eq(stocks.name, 'Book'));
      }
      // If it changed TO Returned from something else
      else if (status === 'Returned' && oldStatus !== 'Returned') {
         await db.update(stocks)
          .set({ quantity: sql`${stocks.quantity} + 1` })
          .where(eq(stocks.name, 'Book'));
      }
      // If it changed TO Cancelled from something else
      else if (status === 'Cancelled' && oldStatus !== 'Cancelled' && (oldStatus === 'Shipped' || oldStatus === 'Delivered')) {
         await db.update(stocks)
          .set({ quantity: sql`${stocks.quantity} + 1` })
          .where(eq(stocks.name, 'Book'));
      }

      // 3. Update the actual order status + timestamp
      const now = new Date().toISOString();
      const updateFields = { status, updatedAt: now };
      if (status === 'Shipped' && !existingOrder.shippedAt) updateFields.shippedAt = now;
      if (status === 'Delivered' && !existingOrder.deliveredAt) updateFields.deliveredAt = now;
      if (status === 'Returned' && !existingOrder.returnedAt) updateFields.returnedAt = now;
      await db.update(orders).set(updateFields).where(eq(orders.id, Number(id)));
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Order Update Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

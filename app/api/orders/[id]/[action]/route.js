import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, partialOrders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(request, props) {
  const params = await props.params;
  try {
    const { id, action } = params;
    
    // For move-to-abandoned, no body is typically needed
    let body = {};
    if (action !== "move-to-abandoned") {
      body = await request.json();
    }
    
    if (action === "call-status") {
      await db.update(orders).set({ phoneCallStatus: body.callStatus }).where(eq(orders.id, Number(id)));
    } else if (action === "shipping-method") {
      await db.update(orders).set({ shipping: body.shippingMethod, shippingCost: body.shippingCost }).where(eq(orders.id, Number(id)));
    } else if (action === "price") {
      await db.update(orders).set({ totalValue: body.totalValue }).where(eq(orders.id, Number(id)));
    } else if (action === "note") {
      await db.update(orders).set({ note: body.note }).where(eq(orders.id, Number(id)));
    } else if (action === "customer-info") {
      await db.update(orders).set({ name: body.name, number: body.phone }).where(eq(orders.id, Number(id)));
    } else if (action === "location") {
      await db.update(orders).set({ address: body.address, district: body.district, thana: body.thana }).where(eq(orders.id, Number(id)));
    } else if (action === "move-to-abandoned") {
      const [order] = await db.select().from(orders).where(eq(orders.id, Number(id)));
      if (order) {
        // Upsert to partial_orders
        await db.insert(partialOrders).values({
          deviceId: order.clientInfo?.deviceId || `migrated-${order.id}`,
          name: order.name,
          number: order.number,
          address: order.address,
          shipping: order.shipping,
          shippingCost: order.shippingCost,
          totalValue: order.totalValue,
          items: order.items,
          currency: order.currency,
          postId: order.postId,
          postType: order.postType,
          clientInfo: order.clientInfo,
          marketing: order.marketing,
          date: new Date().toISOString()
        }).onConflictDoUpdate({
          target: partialOrders.deviceId,
          set: {
            name: order.name,
            number: order.number,
            address: order.address,
            shipping: order.shipping,
            totalValue: order.totalValue,
            items: order.items,
            date: new Date().toISOString()
          }
        });
        
        await db.delete(orders).where(eq(orders.id, Number(id)));
      }
    } else {
      return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Order Action Error (${params.action}):`, error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

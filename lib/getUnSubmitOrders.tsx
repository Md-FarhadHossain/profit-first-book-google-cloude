"use server";
import { db } from '@/lib/db';
import { partialOrders } from '@/lib/db/schema';

export default async function getUnSubmitOrders() {
  try {
    let allPartialOrders = await db.select().from(partialOrders);
    allPartialOrders.sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime());
    
    return {
      success: true,
      data: allPartialOrders.map(o => {
        const info = (o.clientInfo as any) || {};
        return {
        _id: o.id.toString(),
        deviceId: o.deviceId,
        name: o.name,
        number: o.number,
        address: o.address,
        shipping: o.shipping,
        shippingCost: o.shippingCost,
        totalValue: o.totalValue,
        ip: info.ip || "",
        userAgent: info.userAgent || "",
        items: o.items,
        localTime: o.localTime,
        date: o.date
      };
      })
    };
  } catch(e) {
    console.error(e);
    return { success: false, data: [] };
  }
}

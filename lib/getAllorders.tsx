"use server";
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';

export default async function getAllOrders() {
  try {
    let allOrders = await db.select().from(orders);
    allOrders.sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime());
    
    return allOrders.map(o => {
      const info = (o.clientInfo as any) || {};
      return {
      id: o.id.toString(),
      orderId: o.orderId,
      customer: { name: o.name, phone: o.number },
      address: o.address,
      shippingMethod: o.shipping,
      shippingCost: o.shippingCost,
      totalValue: o.totalValue,
      ip: info.ip || "",
      userAgent: info.userAgent || "",
      status: o.status,
      callStatus: o.phoneCallStatus || "Pending",
      smsStatus: o.smsStatus,
      note: o.note,
      district: o.district,
      thana: o.thana,
      date: (o.date && !o.date.includes('Z') && !o.date.includes('+')) ? o.date.replace(' ', 'T') + 'Z' : o.date,
      createdAt: (o.date && !o.date.includes('Z') && !o.date.includes('+')) ? o.date.replace(' ', 'T') + 'Z' : o.date,
      updatedAt: (o.updatedAt && !o.updatedAt.includes('Z') && !o.updatedAt.includes('+')) ? o.updatedAt.replace(' ', 'T') + 'Z' : o.updatedAt,
      shippedAt: (o.shippedAt && !o.shippedAt.includes('Z') && !o.shippedAt.includes('+')) ? o.shippedAt.replace(' ', 'T') + 'Z' : o.shippedAt,
      deliveredAt: (o.deliveredAt && !o.deliveredAt.includes('Z') && !o.deliveredAt.includes('+')) ? o.deliveredAt.replace(' ', 'T') + 'Z' : o.deliveredAt,
      returnedAt: (o.returnedAt && !o.returnedAt.includes('Z') && !o.returnedAt.includes('+')) ? o.returnedAt.replace(' ', 'T') + 'Z' : o.returnedAt
    };
    });
  } catch(e) {
    console.error(e);
    return [];
  }
}

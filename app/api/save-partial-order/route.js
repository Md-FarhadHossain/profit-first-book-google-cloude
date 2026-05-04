import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { partialOrders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const data = await request.json();
    
    if (!data.deviceId) {
      return NextResponse.json({ success: false, error: 'DeviceId is required' }, { status: 400 });
    }
    
    await db.insert(partialOrders).values({
      deviceId: data.deviceId,
      name: data.name,
      number: data.number,
      address: data.address,
      shipping: data.shipping,
      shippingCost: data.shippingCost,
      totalValue: data.totalValue,
      items: data.items,
      currency: data.currency,
      postId: data.postId,
      postType: data.postType,
      clientInfo: data.clientInfo,
      marketing: data.marketing,
      localTime: data.localTime
    }).onConflictDoUpdate({
      target: partialOrders.deviceId,
      set: {
        name: data.name,
        number: data.number,
        address: data.address,
        shipping: data.shipping,
        shippingCost: data.shippingCost,
        totalValue: data.totalValue,
        items: data.items,
        clientInfo: data.clientInfo,
        marketing: data.marketing,
        localTime: data.localTime,
        date: new Date().toISOString()
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Partial Order Creation Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    let allPartialOrders = await db.select().from(partialOrders);
    
    allPartialOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const mappedOrders = allPartialOrders.map(o => ({
      _id: o.id.toString(),
      deviceId: o.deviceId,
      name: o.name,
      number: o.number,
      address: o.address,
      shipping: o.shipping,
      shippingCost: o.shippingCost,
      totalValue: o.totalValue,
      clientInfo: o.clientInfo || {},
      marketing: o.marketing || {},
      userAgent: o.clientInfo?.userAgent || "",
      items: o.items || [],
      localTime: o.localTime,
      createdAt: (o.date && !o.date.includes('Z') && !o.date.includes('+')) ? o.date.replace(' ', 'T') + 'Z' : o.date,
      date: (o.date && !o.date.includes('Z') && !o.date.includes('+')) ? o.date.replace(' ', 'T') + 'Z' : o.date
    }));
    
    return NextResponse.json({ success: true, data: mappedOrders });
  } catch (error) {
    console.error("Fetch Partial Orders Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

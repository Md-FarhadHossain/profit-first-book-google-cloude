import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

function getClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

export async function POST(request) {
  try {
    const data = await request.json();

    const orderId = `ORD-M-${Math.floor(1000 + Math.random() * 9000)}`;

    const name    = data.customerDetails?.firstName || data.name || '';
    const number  = data.customerDetails?.phone     || data.number || '';
    const address = data.customerDetails?.address   || data.address || '';
    const shipping     = data.shippingInfo?.title || data.shipping || 'Inside Dhaka';
    const shippingCost = Number(data.shippingInfo?.cost ?? data.shippingCost ?? 60);
    const productPrice = Number(data.productPrice || data.product?.price || data.totalValue || 0);
    const totalValue   = productPrice + shippingCost;
    const note         = data.note || '';
    const marketing    = JSON.stringify({ utm_source: 'manual' });

    const client = getClient();

    const result = await client.execute({
      sql: `INSERT INTO orders (
        order_id, name, number, address, shipping, shipping_cost, total_value,
        status, phone_call_status, currency, marketing, note, sms_status, courier_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id, order_id`,
      args: [
        orderId,
        name,
        number,
        address,
        shipping,
        shippingCost,
        totalValue,
        'Processing',
        'Pending',
        'BDT',
        marketing,
        note,
        'Pending',
        'pending'
      ]
    });

    const row = result.rows[0];

    return NextResponse.json({
      success: true,
      orderId: row.order_id,
    });
  } catch (error) {
    console.error('Manual Order Creation Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

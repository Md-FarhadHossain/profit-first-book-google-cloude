// app/api/ship-steadfast/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { order } = body;

    // 1. Validate Data
    if (!order) return NextResponse.json({ error: "No order data provided" }, { status: 400 });

    // 2. Map your Dashboard Data to Steadfast format
    const steadfastPayload = {
      invoice: order.orderId, // Using your orderId as invoice
      recipient_name: order.customer.name,
      recipient_phone: order.customer.phone,
      recipient_address: order.address,
      cod_amount: Number(order.totalValue),
      note: order.note || "Handle with care",
    };

    // 3. Send to Steadfast
    const response = await fetch(`${process.env.STEADFAST_BASE_URL}/create_order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': process.env.STEADFAST_API_KEY,
        'Secret-Key': process.env.STEADFAST_SECRET_KEY,
      },
      body: JSON.stringify(steadfastPayload),
    });

    const result = await response.json();

    // 4. Handle Response
    if (result.status === 200) {
      // OPTIONAL: Update your database here to save the consignment_id and tracking_code
      // await updateOrderInDatabase(order.id, result.consignment);
      
      return NextResponse.json({ success: true, data: result.consignment });
    } else {
      return NextResponse.json({ success: false, error: result });
    }

  } catch (error) {
    console.error("Steadfast Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
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
    const productPrice = Number(data.productPrice || data.product?.price || data.totalValue || 490);
    const totalValue   = productPrice + shippingCost;
    const note         = data.note || '';
    const marketing    = JSON.stringify({ utm_source: 'manual' });

    // New fields for Facebook advanced matching
    const district = data.district || '';
    const thana    = data.thana    || '';
    const zip      = data.zip      || '';
    const gender   = data.gender   || '';

    const client = getClient();

    const result = await client.execute({
      sql: `INSERT INTO orders (
        order_id, name, number, address, shipping, shipping_cost, total_value,
        status, phone_call_status, currency, marketing, note, sms_status,
        courier_status, district, thana, gender
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        'pending',
        district || null,
        thana    || null,
        gender   || null,
      ]
    });

    const row = result.rows[0];

    // CAPI Event for Manual Orders (Advanced Matching with location + gender)
    try {
      const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
      const accessToken = process.env.FB_ACCESS_TOKEN;

      if (pixelId && accessToken) {
        const crypto = require('crypto');
        const hashFn = (val) => val ? crypto.createHash('sha256').update(val.trim().toLowerCase()).digest('hex') : undefined;

        let phoneRaw = number?.replace(/[^0-9]/g, '');
        if (phoneRaw && !phoneRaw.startsWith('88')) {
           phoneRaw = '88' + phoneRaw;
        }

        // Build enriched user_data with all advanced matching signals
        const user_data = {
          ph: hashFn(phoneRaw),
          fn: name ? hashFn(name.split(' ')[0]) : undefined,
          ln: name && name.includes(' ') ? hashFn(name.split(' ').slice(1).join(' ')) : undefined,
          country: hashFn('bd'),
        };

        // Location signals — Facebook field names: st=state/district, ct=city/thana, zp=zip
        if (district) user_data.st = hashFn(district);
        if (thana)    user_data.ct = hashFn(thana);
        if (zip)      user_data.zp = hashFn(zip);

        // Gender signal: 'm' or 'f'
        if (gender === 'm' || gender === 'f') user_data.ge = hashFn(gender);

        const capiPayload = {
          data: [
            {
              event_name: 'Purchase',
              event_time: Math.floor(Date.now() / 1000),
              action_source: 'system_generated',
              event_id: row.order_id,
              user_data,
              custom_data: {
                currency: 'BDT',
                value: totalValue || 0,
                content_type: 'product',
              }
            }
          ]
        };

        const fbGraphUrl = `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`;

        // Post asynchronously without blocking
        fetch(fbGraphUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(capiPayload),
        }).catch(err => console.error("Manual CAPI fetch error:", err));
      }
    } catch (e) {
      console.error("Failed to send Manual CAPI event", e);
    }

    return NextResponse.json({
      success: true,
      orderId: row.order_id,
    });
  } catch (error) {
    console.error('Manual Order Creation Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

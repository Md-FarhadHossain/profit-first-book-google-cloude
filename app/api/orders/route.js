import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, partialOrders } from '@/lib/db/schema';
import { eq, or, and, not, inArray } from 'drizzle-orm';
import { sendConfirmationSMS } from '@/lib/smsProvider';

export async function POST(request) {
  try {
    const data = await request.json();
    
    // ======== DUPLICATE ORDER PREVENTION ========
    if (data.number) {
      const existingActiveOrder = await db.select()
        .from(orders)
        .where(
          and(
            eq(orders.number, data.number),
            not(inArray(orders.status, ['Delivered', 'Cancelled', 'Returned', 'Abandoned', 'Fake']))
          )
        )
        .limit(1);

      if (existingActiveOrder.length > 0) {
        return NextResponse.json({ 
          success: false, 
          reason: "active_order_exists",
          message: "An active order already exists for this phone number." 
        }, { status: 409 });
      }
    }
    // ============================================

    const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    
    // ======== AI GENDER DETECTION ========
    let predictedGender = 'unknown';
    if (data.name && process.env.GROQ_API_KEY) {
      try {
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-oss-120b",
            messages: [{
              role: "user",
              content: `What is the typical gender for the Bangladeshi name '${data.name}'? Reply with ONLY 'm' for male, 'f' for female, or 'unknown'. Do not include any other text.`
            }],
            temperature: 0.1,
            max_completion_tokens: 10
          })
        });
        
        if (groqResponse.ok) {
          const groqData = await groqResponse.json();
          const reply = groqData.choices[0]?.message?.content?.trim().toLowerCase();
          if (reply === 'm' || reply === 'f') {
            predictedGender = reply;
          }
        } else {
          console.error("Groq API error response:", await groqResponse.text());
        }
      } catch (err) {
        console.error("Groq API fetch error:", err);
      }
    }
    // =====================================
    
    const inserted = await db.insert(orders).values({
      orderId,
      name: data.name,
      number: data.number,
      address: data.address,
      shipping: data.shipping,
      shippingCost: data.shippingCost,
      totalValue: data.totalValue,
      status: data.status || "Processing",
      phoneCallStatus: data.phoneCallStatus || "Pending",
      items: data.items,
      currency: data.currency || "BDT",
      postId: data.postId,
      postType: data.postType,
      clientInfo: data.clientInfo,
      marketing: data.marketing,
      gender: predictedGender
    }).returning({ id: orders.id, orderId: orders.orderId, gender: orders.gender });
    
    try {
      if (inserted[0]?.orderId) {
        await sendConfirmationSMS(data.number, data.name, inserted[0].orderId);
      }
    } catch (smsError) {
      console.error("SMS Failed:", smsError);
    }

    // Cleanup the abandoned cart (partial_orders) directly linking to this submission
    try {
      const deviceId = data.deviceId || data.clientInfo?.deviceId;
      if (deviceId && data.number) {
        await db.delete(partialOrders).where(
          or(
            eq(partialOrders.deviceId, deviceId),
            eq(partialOrders.number, data.number)
          )
        );
      } else if (data.number) {
        await db.delete(partialOrders).where(eq(partialOrders.number, data.number));
      } else if (deviceId) {
        await db.delete(partialOrders).where(eq(partialOrders.deviceId, deviceId));
      }
    } catch (cleanupError) {
      console.error("Failed to cleanup partial order:", cleanupError);
    }
    // CAPI Recovery Event
    if (data.isRecoveredOrder && inserted[0]?.orderId) {
      try {
        const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
        const accessToken = process.env.FB_ACCESS_TOKEN;
        
        if (pixelId && accessToken) {
          const crypto = require('crypto');
          const hashFn = (val) => val ? crypto.createHash('sha256').update(val.trim().toLowerCase()).digest('hex') : undefined;

          // Normalize phone number (assuming BD country code)
          let phoneRaw = data.number?.replace(/[^0-9]/g, '');
          if (phoneRaw && !phoneRaw.startsWith('88')) {
             phoneRaw = '88' + phoneRaw;
          }
          
          let userFbp, userFbc, userIp, userAgent;
          
          if (data.clientInfo) {
              userIp = data.clientInfo.ip;
              userAgent = data.clientInfo.userAgent || data.userAgent;
              userFbp = data.clientInfo.fbp;
              userFbc = data.clientInfo.fbc;
          }

          const capiPayload = {
            data: [
              {
                event_name: 'Purchase',
                event_time: Math.floor(Date.now() / 1000),
                action_source: 'website',
                event_source_url: 'https://profit-first-book.com/',
                event_id: inserted[0].orderId,
                user_data: {
                  ph: hashFn(phoneRaw),
                  fn: data.name ? hashFn(data.name.split(' ')[0]) : undefined,
                  client_ip_address: userIp,
                  client_user_agent: userAgent,
                  fbp: userFbp,
                  fbc: userFbc,
                },
                custom_data: {
                  currency: data.currency || 'BDT',
                  value: Number(data.totalValue) || (490 + Number(data.shippingCost || 60)),
                  content_type: 'product',
                  contents: data.items?.map(i => ({ id: i.postId || i.item_id || 'unknown', quantity: 1 })) || []
                }
              }
            ]
          };

          const fbGraphUrl = `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`;
          
          await fetch(fbGraphUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(capiPayload),
          });
        }
      } catch (e) {
        console.error("Failed to send recovered CAPI event", e);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      orderId: inserted[0].orderId, 
      insertedId: inserted[0].id,
      gender: inserted[0].gender
    });
  } catch (error) {
    console.error("Order Creation Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    let allOrders = await db.select().from(orders);
    
    // Sort oldest to newest to compute order occurrence
    allOrders.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const phoneCounts = {};
    const orderOccurrences = {};

    allOrders.forEach(o => {
      let phone = o.number?.trim() || "N/A";
      if (phone !== "N/A") {
        // basic normalization: remove non-digits
        phone = phone.replace(/\D/g, '');
        if (phone.startsWith('880')) phone = phone.substring(2);
        
        phoneCounts[phone] = (phoneCounts[phone] || 0) + 1;
        orderOccurrences[o.id] = phoneCounts[phone];
      } else {
        orderOccurrences[o.id] = 1;
      }
    });

    // Reverse sort so newest first
    allOrders.sort((a, b) => new Date(b.date) - new Date(a.date));

    const mappedOrders = allOrders.map(o => ({
      id: o.id.toString(),
      orderId: o.orderId,
      customer: { name: o.name, phone: o.number },
      address: o.address,
      district: o.district || "",
      thana: o.thana || "",
      shippingMethod: o.shipping,
      shippingCost: o.shippingCost,
      totalValue: o.totalValue,
      ip: o.clientInfo?.ip || "",
      userAgent: o.clientInfo?.userAgent || "",
      deviceId: o.clientInfo?.deviceId || "",
      status: o.status,
      callStatus: o.phoneCallStatus || "Pending",
      smsStatus: o.smsStatus,
      note: o.note,
      gender: o.gender,
      trackingCode: o.trackingCode || null,
      consignmentId: o.consignmentId || null,
      courierStatus: o.courierStatus || "pending",
      date: (o.date && !o.date.includes('Z') && !o.date.includes('+')) ? o.date.replace(' ', 'T') + 'Z' : o.date,
      shippedAt: o.shippedAt || null,
      deliveredAt: o.deliveredAt || null,
      returnedAt: o.returnedAt || null,
      courierNote: o.courierNote || null,
      scheduledDate: o.scheduledDate || null,
      historicalOrderCount: orderOccurrences[o.id] || 1
    }));
    
    return NextResponse.json(mappedOrders);
  } catch (error) {
    console.error("Fetch Orders Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

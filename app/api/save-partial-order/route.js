import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { partialOrders, steadfastHistory } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { parseAddress } from '@/lib/addressParser';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const data = await request.json();
    
    if (!data.deviceId) {
      return NextResponse.json({ success: false, error: 'DeviceId is required' }, { status: 400 });
    }
    
    const parsedLocation = parseAddress(data.address);
    
    // ======== AI GENDER DETECTION ========
    let predictedGender = data.gender || '';
    
    // Check existing order to avoid calling API if name hasn't changed
    let existingName = null;
    const existing = await db.select({ name: partialOrders.name, gender: partialOrders.gender }).from(partialOrders).where(eq(partialOrders.deviceId, data.deviceId)).limit(1);
    if (existing.length > 0) {
      existingName = existing[0].name;
      if (!predictedGender) {
        predictedGender = existing[0].gender || '';
      }
    }
    
    if (data.name && data.name !== existingName && process.env.GROQ_API_KEY) {
      try {
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{
              role: "user",
              content: `What is the typical gender for the Bangladeshi name '${data.name}'? Reply with ONLY 'm' for male, 'f' for female, or 'unknown'. Do not include any other text.`
            }],
            temperature: 0.1,
            max_tokens: 10
          })
        });
        
        if (groqResponse.ok) {
          const groqData = await groqResponse.json();
          const reply = groqData.choices[0]?.message?.content?.trim().toLowerCase();
          if (reply === 'm' || reply === 'f') {
            predictedGender = reply;
          } else {
             predictedGender = 'unknown';
          }
        }
      } catch (err) {
        console.error("Groq API fetch error (Partial Order):", err);
      }
    }
    // =====================================
    
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
      localTime: data.localTime,
      gender: predictedGender,
      district: parsedLocation.district,
      thana: parsedLocation.thana
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
        gender: predictedGender,
        district: parsedLocation.district,
        thana: parsedLocation.thana,
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
    
    const phoneNumbers = new Set();
    allPartialOrders.forEach(o => {
      if (o.number) {
        let cleanPhone = o.number.trim().replace(/[-\s]/g, '');
        const match = cleanPhone.match(/(01[3-9]\d{8})/);
        if (match) phoneNumbers.add(match[1]);
      }
    });

    const phoneArr = Array.from(phoneNumbers);
    let sfMap = {};
    if (phoneArr.length > 0) {
      const chunkSize = 100;
      for (let i = 0; i < phoneArr.length; i += chunkSize) {
        const chunk = phoneArr.slice(i, i + chunkSize);
        const sfData = await db.select().from(steadfastHistory).where(inArray(steadfastHistory.phone, chunk));
        sfData.forEach(row => {
          sfMap[row.phone] = row.data;
        });
      }
    }

    allPartialOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const mappedOrders = allPartialOrders.map(o => {
      let sfInfo = null;
      if (o.number) {
        let cleanPhone = o.number.trim().replace(/[-\s]/g, '');
        const match = cleanPhone.match(/(01[3-9]\d{8})/);
        if (match && sfMap[match[1]]) {
          const j = sfMap[match[1]];
          const total = j.total_parcels ?? j.parcel_count ?? j.total_reports ?? 0;
          const delivered = j.total_delivered ?? j.delivered_count ?? 0;
          const cancelled = j.total_cancelled ?? j.return_count ?? 0;
          const rate = j.delivery_ratio !== undefined ? j.delivery_ratio : (total > 0 ? Math.round((delivered / total) * 100) : null);
          const cancelRate = j.cancellation_ratio !== undefined ? j.cancellation_ratio : (total > 0 ? Math.round((cancelled / total) * 100) : null);
          sfInfo = { rate, total, delivered, cancelled, cancelRate, raw: j };
        }
      }

      return {
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
        status: o.status,
        phoneCallStatus: o.phoneCallStatus,
        gender: o.gender,
        district: o.district || "",
        thana: o.thana || "",
        createdAt: (o.date && !o.date.includes('Z') && !o.date.includes('+')) ? o.date.replace(' ', 'T') + 'Z' : o.date,
        date: (o.date && !o.date.includes('Z') && !o.date.includes('+')) ? o.date.replace(' ', 'T') + 'Z' : o.date,
        sfData: sfInfo
      };
    });
    
    return NextResponse.json({ success: true, data: mappedOrders });
  } catch (error) {
    console.error("Fetch Partial Orders Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

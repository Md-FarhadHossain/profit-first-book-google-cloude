import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { eventName, eventId, userData = {}, customData = {} } = body;

    // Build the CAPI payload
    const capiPayload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: req.headers.get('referer') || '',
          event_id: eventId, // Critical for deduplication
          user_data: {
            ...userData, // Make sure emails, phone, etc., are hashed
            
            // FBC and FBP MUST NOT BE HASHED per Facebook specifications
            fbc: userData.fbc,
            fbp: userData.fbp,
            
            client_ip_address: req.headers.get('x-forwarded-for')?.split(',')[0],
            client_user_agent: req.headers.get('user-agent'),
          },
          custom_data: customData,
        },
      ],
    };

    const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
    const accessToken = process.env.FB_ACCESS_TOKEN;

    const fbGraphUrl = `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`;

    // Post to Facebook CAPI
    const fbRes = await fetch(fbGraphUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(capiPayload),
    });

    const result = await fbRes.json();
    
    if (!fbRes.ok) {
       throw new Error(JSON.stringify(result));
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("CAPI API Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Hash function using native crypto
const hashData = (data: string | null | undefined): string | undefined => {
  if (!data) return undefined;
  const cleanData = data.trim().toLowerCase();
  if (cleanData.length === 0) return undefined;
  return crypto.createHash('sha256').update(cleanData).digest('hex');
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventName, eventSourceUrl, userData = {}, customData = {}, eventId, _prehashed = false } = body;

    // Get client IP
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    // --- IP GEOLOCATION: resolve real city & state from client IP ---
    let geoCity: string | undefined;
    let geoState: string | undefined;
    if (clientIp && clientIp !== '127.0.0.1' && clientIp !== '::1') {
      try {
        // ipapi.co: server-to-server (no CORS issues), free tier 1000 req/day
        const geoRes = await fetch(`https://ipapi.co/${clientIp}/json/`, {
          headers: { 'User-Agent': 'NextJS-CAPI/1.0' },
        });
        if (geoRes.ok) {
          const geo = await geoRes.json();
          if (geo.city) geoCity = geo.city.toLowerCase();
          if (geo.region) geoState = geo.region.toLowerCase();
        }
      } catch (_) {
        // Geo lookup failed silently — don't block the tracking event
      }
    }

    // Build user_data: if client pre-hashed PII fields, pass them through directly.
    // Otherwise, hash them here on the server (fallback for non-browser callers).
    const buildUserField = (val: string | undefined) =>
      _prehashed ? val : hashData(val);

    // Build the CAPI payload
    const capiPayload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: eventSourceUrl,
          event_id: eventId,
          user_data: {
            client_ip_address: userData.client_ip_address || clientIp,
            client_user_agent: userData.client_user_agent || userAgent,
            em:         buildUserField(userData.em),
            ph:         buildUserField(userData.ph),
            fn:         buildUserField(userData.fn),
            ln:         buildUserField(userData.ln),
            // Geo signals: from client hash OR from IP geolocation (server-resolved)
            country:    userData.country ?? (geoCity ? hashData('bd') : hashData('bd')),
            ...(geoCity  ? { ct: hashData(geoCity)  } : userData.ct  ? { ct: userData.ct  } : {}),
            ...(geoState ? { st: hashData(geoState) } : userData.st  ? { st: userData.st  } : {}),
            ...(userData.zp ? { zp: buildUserField(userData.zp) } : {}),
            // Not hashed — sent raw per Facebook spec
            fbc: userData.fbc,
            fbp: userData.fbp,
            ...(userData.external_id ? { external_id: buildUserField(userData.external_id) } : {}),
          },
          custom_data: {
            ...customData,
            ...(eventName === 'Purchase' ? { delivery_category: customData.delivery_category || 'home_delivery' } : {}),
          },
        },
      ],
      ...(process.env.FACEBOOK_TEST_EVENT_CODE ? { test_event_code: process.env.FACEBOOK_TEST_EVENT_CODE } : {})
    };

    const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID || process.env.FB_PIXEL_ID;
    const accessToken = process.env.FB_ACCESS_TOKEN;

    // Diagnostic logging — shows up in Railway logs
    console.log('[CAPI] eventName:', eventName);
    console.log('[CAPI] pixelId:', pixelId ? `${pixelId.substring(0, 6)}...` : 'MISSING');
    console.log('[CAPI] accessToken:', accessToken ? `${accessToken.substring(0, 8)}...` : 'MISSING');
    console.log('[CAPI] geoCity:', geoCity || 'not resolved');
    console.log('[CAPI] geoState:', geoState || 'not resolved');

    if (!pixelId || !accessToken) {
      console.error("[CAPI] FATAL: FB_PIXEL_ID or FB_ACCESS_TOKEN missing. CAPI event not sent.");
      return NextResponse.json({ success: false, message: "Server CAPI tokens not configured" }, { status: 500 });
    }

    const fbGraphUrl = `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`;

    // Post securely to Facebook
    const fbRes = await fetch(fbGraphUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(capiPayload),
    });

    if (!fbRes.ok) {
        const errText = await fbRes.text();
        throw new Error(`Facebook CAPI Error: ${fbRes.status} ${errText}`);
    }

    const result = await fbRes.json();
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("CAPI API Target Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

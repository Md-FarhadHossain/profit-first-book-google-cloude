// app/api/ip/route.js
import { NextResponse } from 'next/server';
// ⛔️ Notice the 'next/headers' import is gone

/**
 * @param {import('next/server').NextRequest} request
 */
export async function GET(request) {
  try {
    // ✅ This is the correct way to get headers in a route handler
    const headersList = request.headers;

    // ... (rest of your code is perfect)
    const cfIpv6 = headersList.get('cf-connecting-ipv6');
    const cfIp = headersList.get('cf-connecting-ip');
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const requestIp = request.ip;

    const ip = cfIpv6 || cfIp || realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : requestIp) || '127.0.0.1';

    return NextResponse.json({ ip });
    
  } catch (error) {
    console.error("IP API Error:", error);
    return NextResponse.json({ ip: '0.0.0.0' }, { status: 500 });
  }
}
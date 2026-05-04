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
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const requestIp = request.ip;

    const ip = forwardedFor
      ? forwardedFor.split(',')[0].trim()
      : realIp || requestIp || '127.0.0.1';

    return NextResponse.json({ ip });
    
  } catch (error) {
    console.error("IP API Error:", error);
    return NextResponse.json({ ip: '0.0.0.0' }, { status: 500 });
  }
}
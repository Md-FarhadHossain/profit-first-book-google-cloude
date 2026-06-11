import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { steadfastHistory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone');

  if (!phone) {
    return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
  }

  // Retrieve keys from env variables (server-side)
  const apiKey = process.env.STEADFAST_API_KEY;
  const secretKey = process.env.STEADFAST_SECRET_KEY;

  if (!apiKey || !secretKey) {
    return NextResponse.json({ error: 'Steadfast API Key and Secret Key are required in environment variables.' }, { status: 500 });
  }

  // Extract 11 digits starting with 01 from anywhere in the string
  // This handles prefixes like +88, 0088, 88, or mistaken extra digits/characters.
  let cleanPhone = phone.trim().replace(/[-\s]/g, '');
  const match = cleanPhone.match(/(01[3-9]\d{8})/);

  if (!match) {
    return NextResponse.json({ 
      error: 'Invalid Bangladeshi phone number. Could not find 11 digits starting with 01.' 
    }, { status: 400 });
  }

  cleanPhone = match[1];

  // 1. CHECK DATABASE CACHE FIRST
  try {
    const cached = await db.select().from(steadfastHistory).where(eq(steadfastHistory.phone, cleanPhone)).limit(1);
    if (cached && cached.length > 0) {
      return NextResponse.json(cached[0].data, { headers: { 'X-Cache': 'HIT' } });
    }
  } catch (dbErr) {
    console.error('Error checking steadfast cache:', dbErr);
  }

  const urls = [
    `https://portal.steadfast.com.bd/api/v1/fraud_check/${cleanPhone}`,
    `https://portal.packzy.com/api/v1/fraud_check/${cleanPhone}`
  ];

  let lastError = null;
  let successResponse = null;

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Api-Key': apiKey,
          'Secret-Key': secretKey,
          'Content-Type': 'application/json'
        },
        // Adding a short timeout to prevent hanging, Next.js fetch API can use AbortController if needed
        // but default is usually fine for serverless.
      });

      if (!response.ok) {
        const errText = await response.text();
        let errJson;
        try { errJson = JSON.parse(errText); } catch (e) {}
        
        const errMsg = errJson?.message || errJson?.error || `Steadfast API returned status ${response.status}`;
        lastError = { status: response.status, message: errMsg };
        
        if (response.status >= 400 && response.status < 500) {
          break; // Client error, don't retry
        }
        continue;
      }

      successResponse = await response.json();
      break; 
    } catch (error) {
      lastError = { status: 500, message: error.message };
    }
  }

  if (successResponse) {
    // 2. SAVE TO DATABASE CACHE
    try {
      await db.insert(steadfastHistory).values({
        phone: cleanPhone,
        data: successResponse,
      }).onConflictDoUpdate({
        target: steadfastHistory.phone,
        set: { data: successResponse, updatedAt: new Date().toISOString() }
      });
    } catch (dbErr) {
      console.error('Error saving steadfast cache:', dbErr);
    }
    return NextResponse.json(successResponse);
  } else {
    const isDnsError = lastError.message.includes('ENOTFOUND') || lastError.message.includes('EAI_AGAIN') || lastError.message.includes('fetch failed');
    const displayMsg = isDnsError 
      ? 'Failed to resolve Steadfast API domains. Please verify your internet connection or check your API keys.'
      : lastError.message;
    return NextResponse.json({ error: displayMsg }, { status: lastError.status || 500 });
  }
}

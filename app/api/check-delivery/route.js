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

  // ?refresh=true → bypass DB cache and fetch fresh from Steadfast (manual override only)
  const forceRefresh = searchParams.get('refresh') === 'true';

  // ─────────────────────────────────────────────────────────────────
  // STEP 1: CHECK DATABASE — if data exists, return it IMMEDIATELY.
  //
  // This is a PERMANENT cache: once a phone number's data is saved,
  // we NEVER call the Steadfast API again for it. The API is called
  // exactly ONE time per phone number, ever.
  //
  // Use ?refresh=true only when you explicitly need updated data.
  // ─────────────────────────────────────────────────────────────────
  if (!forceRefresh) {
    try {
      const cached = await db
        .select()
        .from(steadfastHistory)
        .where(eq(steadfastHistory.phone, cleanPhone))
        .limit(1);

      if (cached && cached.length > 0) {
        // Data exists in DB → return instantly, no API call at all.
        console.log(`[SF Cache] PERMANENT HIT for ${cleanPhone} — serving from DB, no API call.`);
        return NextResponse.json(cached[0].data, { headers: { 'X-Cache': 'HIT' } });
      }
    } catch (dbErr) {
      console.error('[SF Cache] DB read error:', dbErr);
      // Fall through to live API if DB fails
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // STEP 2: FIRST TIME — call Steadfast API (only happens once ever)
  // ─────────────────────────────────────────────────────────────────
  console.log(`[SF Cache] MISS for ${cleanPhone} — calling Steadfast API for the first (and last) time.`);

  const urls = [
    `https://portal.packzy.com/api/v1/fraud_check/score/${cleanPhone}`,
    `https://portal.steadfast.com.bd/api/v1/fraud_check/score/${cleanPhone}`
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
      });

      if (!response.ok) {
        const errText = await response.text();
        let errJson;
        try { errJson = JSON.parse(errText); } catch (e) {}

        const errMsg = errJson?.message || errJson?.error || `Steadfast API returned status ${response.status}`;
        lastError = { status: response.status, message: errMsg };

        if (response.status >= 400 && response.status < 500) {
          break; // Client error — don't retry with second URL
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
    // ─────────────────────────────────────────────────────────────
    // STEP 3: SAVE TO DATABASE PERMANENTLY
    // This phone number will NEVER hit the API again after this.
    // ─────────────────────────────────────────────────────────────
    try {
      const nowIso = new Date().toISOString();
      await db.insert(steadfastHistory).values({
        phone: cleanPhone,
        data: successResponse,
        updatedAt: nowIso,
      }).onConflictDoUpdate({
        target: steadfastHistory.phone,
        set: { data: successResponse, updatedAt: nowIso }
      });
      console.log(`[SF Cache] SAVED permanently for ${cleanPhone}.`);
    } catch (dbErr) {
      console.error('[SF Cache] DB save error:', dbErr);
    }

    return NextResponse.json(successResponse);
  } else {
    const isDnsError = lastError?.message?.includes('ENOTFOUND') || lastError?.message?.includes('EAI_AGAIN') || lastError?.message?.includes('fetch failed');
    const displayMsg = isDnsError
      ? 'Failed to resolve Steadfast API domains. Please verify your internet connection or check your API keys.'
      : (lastError?.message || 'Unknown error');
    return NextResponse.json({ error: displayMsg }, { status: lastError?.status || 500 });
  }
}

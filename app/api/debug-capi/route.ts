import { NextResponse } from 'next/server';

// ⚠️ DIAGNOSTIC ONLY — Remove this route after fixing your deployment.
// Visit: https://your-railway-domain.com/api/debug-capi to check env health.
export async function GET() {
  const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID || process.env.FB_PIXEL_ID;
  const accessToken = process.env.FB_ACCESS_TOKEN;

  const status = {
    pixelId_present: !!pixelId,
    pixelId_preview: pixelId ? `${pixelId.substring(0, 5)}...` : 'MISSING ❌',
    accessToken_present: !!accessToken,
    accessToken_preview: accessToken ? `${accessToken.substring(0, 10)}...` : 'MISSING ❌',
    NODE_ENV: process.env.NODE_ENV,
  };

  // Optionally test if the token is still valid by calling FB Graph
  let tokenValid = null;
  if (pixelId && accessToken) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${pixelId}?fields=id&access_token=${accessToken}`
      );
      const data = await res.json();
      tokenValid = res.ok ? '✅ Token valid' : `❌ FB Error: ${JSON.stringify(data.error?.message)}`;
    } catch (e: any) {
      tokenValid = `❌ Fetch failed: ${e.message}`;
    }
  } else {
    tokenValid = '⚠️ Cannot test — pixelId or accessToken missing';
  }

  return NextResponse.json({ status, tokenValid }, { status: 200 });
}

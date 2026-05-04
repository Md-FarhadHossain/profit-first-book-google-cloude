"use client";

import React, { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { setFbcCookie } from "@/utils/fbParams";

// Hardcoded as fallback — NEXT_PUBLIC_ vars must exist at BUILD time in Next.js
const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || "2362496434235791";

function PixelTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Capture fbclid from URL and store as _fbc cookie
    const fbclid = searchParams.get("fbclid");
    if (fbclid) {
      setFbcCookie(fbclid);
    }

    // Fire PageView on route changes
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "PageView");
    }
  }, [pathname, searchParams]);

  return null;
}

export default function FacebookPixel() {
  return (
    <>
      {/* Standard Meta Pixel Base Code */}
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FB_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />

      {/* Track route changes in SPA navigation */}
      <Suspense fallback={null}>
        <PixelTracker />
      </Suspense>
    </>
  );
}

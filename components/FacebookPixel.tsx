"use client";

import React, { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { setFbcCookie } from "@/utils/fbParams";
import { trackPageView } from "@/lib/fbEvents";

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

    // Helper to read cookies
    const getCookie = (name: string): string | undefined => {
      if (typeof document === 'undefined') return undefined;
      const v = `; ${document.cookie}`;
      const parts = v.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return undefined;
    };

    // Build best-available userData for PageView CAPI
    const pageViewUserData: Record<string, any> = { country: 'bd' };
    pageViewUserData.fbc = getCookie('_fbc') || localStorage.getItem('_fbc_constructed') || undefined;
    pageViewUserData.fbp = getCookie('_fbp') || localStorage.getItem('_fbp_backup') || undefined;
    pageViewUserData.client_user_agent = navigator.userAgent;
    pageViewUserData.external_id = localStorage.getItem('device_id') || undefined;

    // PII from returning visitors (stored after their first order)
    const savedPhone = localStorage.getItem('billing_phone');
    if (savedPhone) {
      let ph = savedPhone.trim().replace(/\s+/g, '').replace(/-/g, '');
      if (ph.startsWith('01') && ph.length === 11) ph = '880' + ph;
      else if (ph.startsWith('+')) ph = ph.replace('+', '');
      pageViewUserData.ph = ph;
    }
    const savedName = localStorage.getItem('billing_name');
    if (savedName) {
      const np = savedName.trim().split(' ');
      if (np.length > 0) pageViewUserData.fn = np[0].toLowerCase();
      if (np.length > 1) pageViewUserData.ln = np.slice(1).join(' ').toLowerCase();
    }

    // Fire browser pixel PageView
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "PageView");
    }

    // Fire server-side CAPI PageView (adds IP + geo on server)
    trackPageView(pageViewUserData);
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

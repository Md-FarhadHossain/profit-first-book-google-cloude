"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { trackPurchase, trackCustomEvent } from "@/lib/fbEvents";

function ThankYouContent() {
  const searchParams = useSearchParams();

  // ── Confetti from both sides using canvas-confetti ────────────────────────
  useEffect(() => {
    let confetti;

    const fire = async () => {
      const mod = await import("canvas-confetti");
      confetti = mod.default;

      const colors = [
        "#ff4d6d", "#ff6b35", "#ffd166", "#06d6a0",
        "#a855f7", "#f72585", "#4cc9f0", "#f9c74f", "#90be6d",
      ];

      const shared = {
        particleCount: 80,
        spread: 70,
        colors,
        ticks: 200,
        gravity: 1.1,
        scalar: 1.1,
        shapes: ["square", "circle"],
      };

      // First burst
      confetti({ ...shared, origin: { x: 0, y: 0.6 }, angle: 60 });
      confetti({ ...shared, origin: { x: 1, y: 0.6 }, angle: 120 });

      // Second burst after 400ms
      setTimeout(() => {
        confetti({ ...shared, particleCount: 60, origin: { x: 0, y: 0.5 }, angle: 55 });
        confetti({ ...shared, particleCount: 60, origin: { x: 1, y: 0.5 }, angle: 125 });
      }, 400);

      // Third burst after 800ms
      setTimeout(() => {
        confetti({ ...shared, particleCount: 40, origin: { x: 0, y: 0.65 }, angle: 65 });
        confetti({ ...shared, particleCount: 40, origin: { x: 1, y: 0.65 }, angle: 115 });
      }, 800);
    };

    fire();
  }, []);
  // ─────────────────────────────────────────────────────────────────────────


  useEffect(() => {
    // --- Get all data from URL parameters ---
    const orderId = searchParams.get("orderId");
    const total = searchParams.get("total");
    const shippingCost = searchParams.get("shippingCost");
    const currency = searchParams.get("currency");
    const productId = searchParams.get("productId");
    const productName = searchParams.get("productName");
    const categoryName = searchParams.get("categoryName");
    const price = searchParams.get("price");
    const quantity = searchParams.get("quantity");

      // --- Prevent duplicate tracking on page reload ---
      const trackedOrders = JSON.parse(localStorage.getItem('tracked_orders') || '[]');
      
      // FIX: Require an actual order ID to prevent ghost conversions from bots or direct visits
      if (!orderId) {
        console.log("No order ID found. Skipping purchase tracking.");
        return;
      }

      if (trackedOrders.includes(orderId)) {
        console.log("Purchase already tracked for order ID:", orderId);
        return; // Skip tracking if already fired
      }

      // Mark order as tracked IMMEDIATELY to prevent React StrictMode race conditions
      trackedOrders.push(orderId);
      localStorage.setItem('tracked_orders', JSON.stringify(trackedOrders));

      const totalValue = parseFloat(total || "0");
      const shippingValue = parseFloat(shippingCost || "0");
      const itemPrice = parseFloat(price || "0");
      const itemQuantity = parseInt(quantity || "1", 10);

      // Attempt to retrieve saved user data for Advanced Matching
      let userData = {};
      try {
        const savedPhone = localStorage.getItem("billing_phone");
        const savedName = localStorage.getItem("billing_name");
        
        // Phone number — normalize Bangladesh numbers
        if (savedPhone) {
          let ph = savedPhone.trim().replace(/\s+/g, '');
          // Normalize BD number: 01XXXXXXXXX → 8801XXXXXXXXX
          if (ph.startsWith('01') && ph.length === 11) ph = '880' + ph;
          else if (ph.startsWith('+')) ph = ph.replace('+', '');
          userData.ph = ph;
        }

        // Name split into first/last
        if (savedName) {
           const nameParts = savedName.trim().split(" ");
           if (nameParts.length > 0) userData.fn = nameParts[0].toLowerCase();
           if (nameParts.length > 1) userData.ln = nameParts.slice(1).join(" ").toLowerCase();
        }

        // Country — always Bangladesh (city/state resolved from IP on server)
        userData.country = 'bd';

        // External ID — use orderId for cross-device matching
        userData.external_id = orderId;

        // Facebook Click ID and Browser ID from cookies (critical for match quality)
        const getCookie = (name) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop().split(';').shift();
          return undefined;
        };
        userData.fbc = getCookie('_fbc') || localStorage.getItem('_fbc_constructed');
        userData.fbp = getCookie('_fbp') || localStorage.getItem('_fbp_backup');

        // Client IP from state (already fetched at page load)
        userData.client_ip_address = undefined; // will be filled by server from headers
        userData.client_user_agent = navigator.userAgent;
        
      } catch(e) {}

      // --- LTV, Profit Margin, and Customer Status ---
      let purchaseCount = parseInt(localStorage.getItem('purchase_count') || "0");
      const isNewCustomer = purchaseCount === 0; // If purchaseCount is 0 before this purchase, it's a new customer
      
      // Basic static LTV projection rule: Repeat buyers often spend ~2.5x more over a year
      const predictedLtv = isNewCustomer ? totalValue * 1.5 : totalValue * 2.5;

      trackPurchase(
        [productId], 
        productName, 
        totalValue, 
        currency || "BDT", 
        itemQuantity, 
        orderId,
        {
          average_order: totalValue,
          category_name: categoryName,
          coupon_used: "No",
          predicted_ltv: predictedLtv, 
          new_customer: isNewCustomer,
          shipping: shippingValue,
          shipping_cost: shippingValue,
          delivery_category: 'home_delivery', // Required for EMQ boost
          tax: 0,
          total: totalValue,
          transactions_count: 1,
        },
        userData
      );

      console.log("✅ Cloudflare Worker + Browser Pixel Purchase events fired with LTV, Profit & Advanced Matching!");

      // Custom Post-Purchase Events (Pushed to CAPI)
      purchaseCount += 1; // Increment for the current purchase
      localStorage.setItem('purchase_count', purchaseCount.toString());

      if (purchaseCount === 1) { // Now purchaseCount reflects the current state after this purchase
          trackCustomEvent('FirstTimeBuyer', totalValue, currency || "BDT");
      } else {
          trackCustomEvent('ReturningCustomer', totalValue, currency || "BDT");
          
          if (purchaseCount >= 3) { trackCustomEvent('FrequentShopper', totalValue, currency || "BDT"); }
          if (purchaseCount >= 5) { trackCustomEvent('VIPClient', totalValue, currency || "BDT"); }
      }

      if (totalValue >= 900) {
          trackCustomEvent('BigWhale', totalValue, currency || "BDT");
      }
  }, [searchParams]);

  // --- Data for displaying on the page ---
  const displayOrderId = searchParams.get("orderId");
  const displayTotal = searchParams.get("total");

  // Replace with your actual Facebook group URL
  const FACEBOOK_GROUP_URL = "https://www.facebook.com/groups/facebook.uddokta";

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
        {/* Success Icon */}
        <div className="mb-6 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-20 w-20 bg-green-100 rounded-full animate-ping opacity-20"></div>
          </div>
          <svg
            className="mx-auto h-16 w-16 text-green-500 relative z-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Thank You Message */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          অর্ডার সফল হয়েছে! 🎉
        </h1>

        <p className="text-lg text-gray-600 mb-6 text-center">
          খুব শীঘ্রই আপনাকে কল করে অর্ডারটি কনফার্ম করা হবে
        </p>

        {/* Order Details */}
        <div className="space-y-3 mb-2">
          {/* {displayOrderId && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">অর্ডার নম্বর</p>
              <p className="text-2xl font-bold text-gray-800">#{displayOrderId}</p>
            </div>
          )} */}

          {displayTotal && (
            <div className="bg-linear-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <p className=" text-gray-500 mb-1">মোট মূল্য</p>
              <p className="text-2xl font-bold text-green-600">
                {displayTotal}৳
              </p>
            </div>
          )}
        </div>

        {/* Delivery Info */}
        <div className="bg-blue-50 rounded-xl p-4 mb-2 border border-blue-100">
          <p className="text-gray-700 font-medium mb-3 text-center">
            আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✅</span>
              <span>ক্যাশ অন ডেলিভারি</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✅</span>
              <span>২-৩ কর্মদিবসে ডেলিভারি</span>
            </div>
          </div>
        </div>

        {/* Facebook Community Section - NEW */}
        <div className="bg-linear-to-r from-blue-600 to-blue-700 rounded-xl p-6 mb-2 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <pattern
                id="pattern"
                x="0"
                y="0"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="20" cy="20" r="2" fill="white" />
              </pattern>
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="url(#pattern)"
              />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-center mb-3">
              {/* Facebook Icon */}
              <svg
                className="w-10 h-10"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-center mb-2">
              আমাদের কমিউনিটিতে যোগ দিন! 🌟
            </h3>

            <p className="text-blue-100 text-center text- mb-4">
              বিশেষ অফার, টিপস এবং আপডেট পেতে আমাদের Facebook কমিউনিটির সদস্য হন
            </p>

            <a
              href={FACEBOOK_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-white text-blue-600 font-bold py-3 px-6 rounded-lg hover:bg-blue-50 transition-all duration-300 text-center shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                কমিউনিটিতে যুক্ত হন
              </span>
            </a>
          </div>
        </div>

        {/* Home Button */}
        <a
          href="/"
          className="block w-full bg-gray-800 text-white font-medium py-3 px-6 rounded-lg hover:bg-gray-900 transition-colors text-center"
        >
          হোম পেজে ফিরে যান
        </a>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}

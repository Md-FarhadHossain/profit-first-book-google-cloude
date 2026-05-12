"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { XCircle, MessageCircle, Facebook } from "lucide-react"; 
import { trackViewContent, trackAddToCart, trackInitiateCheckout, trackCustomEvent } from "@/lib/fbEvents";

// --- FAKE 404 COMPONENT (The Trap) ---
// This mimics a standard "Page Not Found" to fool the scammer


// --- HELPER: GENERATE OR GET DEVICE ID ---
const getDeviceId = () => {
  if (typeof window !== "undefined") {
    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
      deviceId = "dev_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem("device_id", deviceId);
    }
    return deviceId;
  }
  return "unknown";
};

const PRODUCT_PRICE = 550;
const PRODUCT_ID = "973";
const PRODUCT_NAME = "Profit First for F-Commerce";
const PRODUCT_CATEGORY = "Books";
const CURRENCY = "BDT";
const POST_ID = 913;
const POST_TYPE = "product";
const API_URL = "/api"; 

const HeroSection = () => {
  // --- STATE FOR BANNING ---
  // --- STATE FOR BANNING - REMOVED ---
  // const [isBanned, setIsBanned] = useState(false);
  // const [isCheckingBan, setIsCheckingBan] = useState(true);
  const [shipping, setShipping] = useState("outside-dhaka");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutStarted, setCheckoutStarted] = useState(false);
  
  const [formData, setFormData] = useState({ name: "", number: "", address: "" });
  const [clientInfo, setClientInfo] = useState({ ip: null, userAgent: null });
  const [marketingData, setMarketingData] = useState({
    utm_source: "direct", utm_medium: "none", utm_campaign: "none", referrer: "direct", landing_page: "",
  });
  const [behaviorData, setBehaviorData] = useState({
    visit_count: 1, device_id: "", first_visit_date: "",
  });
  
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const sectionRef = useRef(null);
  const hasAddedToCart = useRef(false);

  // --- COOKIE HELPER (client-side) ---
  const getClientCookie = (name) => {
    if (typeof document === 'undefined') return undefined;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return undefined;
  };

  // --- HELPER FOR CURRENT ADVANCED PARAMETERS ---
  const getAdvancedMatchingData = () => {
      let ud = {
         country: "bd", // Country is always Bangladesh
         // ct and st are resolved from IP geolocation on the server
      };
      
      // Phone: formData first (just typed), then localStorage (returning visitors from past purchases)
      // This means scroll/video events on returning visitors will carry hashed phone → higher EMQ
      const rawPhone = formData.number || localStorage.getItem("billing_phone");
      if (rawPhone) {
        let ph = rawPhone.trim().replace(/\s+/g, '').replace(/-/g, '');
        if (ph.startsWith('01') && ph.length === 11) ph = '880' + ph;
        else if (ph.startsWith('+')) ph = ph.replace('+', '');
        ud.ph = ph;
      }
      
      // Name: formData first, then localStorage — same rationale (returning visitors)
      const n = formData.name || localStorage.getItem("billing_name");
      if (n) {
         const np = n.trim().split(" ");
         if (np.length > 0) ud.fn = np[0].toLowerCase();
         if (np.length > 1) ud.ln = np.slice(1).join(" ").toLowerCase();
      }

      // Client IP (fetched at page load)
      if (clientInfo.ip) ud.client_ip_address = clientInfo.ip;

      // User Agent — always send
      if (typeof navigator !== 'undefined') ud.client_user_agent = navigator.userAgent;

      // External ID: device_id for cross-device matching
      const deviceId = behaviorData.device_id || localStorage.getItem('device_id');
      if (deviceId) ud.external_id = deviceId;

      // fbc: Facebook Click ID — cookie first, then constructed from fbclid param, then localStorage
      const fbcCookie = getClientCookie('_fbc');
      const fbcConstructed = localStorage.getItem('_fbc_constructed');
      ud.fbc = fbcCookie || fbcConstructed || undefined;

      // fbp: Facebook Browser ID — cookie first, then localStorage backup
      const fbpCookie = getClientCookie('_fbp');
      const fbpBackup = localStorage.getItem('_fbp_backup');
      ud.fbp = fbpCookie || fbpBackup || undefined;

      return ud;
  };

  // --- 1. INITIAL LOAD: IP FETCH & BAN CHECK ---
  useEffect(() => {
    const performChecks = async () => {
        try {
            // A. Fetch IP
            let ip = "0.0.0.0";
            try {
                const ipRes = await fetch("/api/ip"); // Or use 'https://api.ipify.org?format=json' if /api/ip is missing
                const ipData = await ipRes.json();
                ip = ipData.ip;
            } catch (e) { 
                console.error("IP Fetch Error", e); 
            }

            // B. Get Device ID
            const deviceId = getDeviceId();
            const ua = navigator.userAgent;

            // C. CRITICAL: CHECK IF BANNED - REMOVED
            // const banRes = await fetch(`${API_URL}/check-ban-status?ip=${ip}&deviceId=${deviceId}`);
            // const banData = await banRes.json();
            // if (banData.banned) { ... }

            // D. If not banned, continue setting up tracking
            setClientInfo({ ip, userAgent: ua });
            
            // Setup Analytics
            const params = new URLSearchParams(window.location.search);

            // --- FBC CONSTRUCTION FROM fbclid URL PARAM ---
            // Mirrors exactly what Facebook's Parameter Builder SDK does:
            // Format: fb.{version}.{timestamp}.{fbclid}
            const fbclid = params.get('fbclid');
            if (fbclid) {
              const now = Date.now();
              const constructedFbc = `fb.1.${now}.${fbclid}`;
              // Backup in localStorage
              localStorage.setItem('_fbc_constructed', constructedFbc);
              // ALSO set as a real browser cookie — this is what Facebook CAPI checks first!
              // 90 days expiry (matches Facebook's own pixel behavior)
              const expiryDate = new Date(now + 90 * 24 * 60 * 60 * 1000).toUTCString();
              document.cookie = `_fbc=${constructedFbc}; path=/; expires=${expiryDate}; SameSite=Lax`;
            }

            // --- FBP BACKUP in localStorage for Safari/iOS ITP ---
            const fbpCookieVal = `; ${document.cookie}`.split(`; _fbp=`)[1]?.split(';')[0];
            if (fbpCookieVal) localStorage.setItem('_fbp_backup', fbpCookieVal);

            // Store landing page with fbclid for future use
            localStorage.setItem('landing_page', window.location.href);
            setMarketingData({
                utm_source: params.get("utm_source") || "direct",
                utm_medium: params.get("utm_medium") || "none",
                utm_campaign: params.get("utm_campaign") || "none",
                referrer: document.referrer || "direct",
                landing_page: window.location.href,
            });

            let visits = parseInt(localStorage.getItem("visit_count") || "0") + 1;
            localStorage.setItem("visit_count", visits.toString());

            let firstVisit = localStorage.getItem("first_visit_date");
            if (!firstVisit) {
                firstVisit = new Date().toISOString();
                localStorage.setItem("first_visit_date", firstVisit);
            }

            setBehaviorData({
                visit_count: visits,
                device_id: deviceId, 
                first_visit_date: firstVisit
            });

            // Cloudflare Worker + Browser Pixel Events
            // Build userData inline — React state (clientInfo.ip) hasn't updated yet at this point
            const viewContentUserData = {
              country: 'bd',
              client_ip_address: ip,
              client_user_agent: ua,
              external_id: deviceId,
              fbc: getClientCookie('_fbc') || localStorage.getItem('_fbc_constructed') || undefined,
              fbp: getClientCookie('_fbp') || localStorage.getItem('_fbp_backup') || undefined,
            };
            trackViewContent([PRODUCT_ID], PRODUCT_NAME, PRODUCT_PRICE, CURRENCY, viewContentUserData);

        } catch (error) {
            console.error("Initialization Error", error);
        } finally {
            // setIsCheckingBan(false);
        }
    };

    performChecks();
  }, []);

  // --- SCROLL & TIME ENGAGEMENT TRACKING ---
  useEffect(() => {
    // 25 Seconds on page
    const timer = setTimeout(() => {
        trackCustomEvent("25_sec_onpage", PRODUCT_PRICE, CURRENCY, {
             category_name: PRODUCT_CATEGORY,
             content_name: PRODUCT_NAME,
             content_type: "product",
             content_ids: [PRODUCT_ID],
             post_id: POST_ID.toString(),
             post_type: POST_TYPE,
             tags: ["f-commerce", "book"]
        }, getAdvancedMatchingData());
    }, 25000);

    // Scroll depth
    const handleScroll = () => {
      // Calculate scroll percentage
      const scrollHeight = Math.max(
        document.body.scrollHeight, document.documentElement.scrollHeight,
        document.body.offsetHeight, document.documentElement.offsetHeight,
        document.body.clientHeight, document.documentElement.clientHeight
      ) - window.innerHeight;
      
      const scrollPercent = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
      
      if (scrollPercent >= 50 && !window.hasScrolled50) {
        window.hasScrolled50 = true;
        trackCustomEvent("scroll_50", PRODUCT_PRICE, CURRENCY, {
             category_name: PRODUCT_CATEGORY,
             content_name: PRODUCT_NAME,
             content_type: "product",
             content_ids: [PRODUCT_ID],
             post_id: POST_ID.toString(),
             post_type: POST_TYPE,
             tags: ["f-commerce", "book"]
        }, getAdvancedMatchingData());
      }
      
      if (scrollPercent >= 90 && !window.hasScrolled90) {
        window.hasScrolled90 = true;
        trackCustomEvent("scroll_90", PRODUCT_PRICE, CURRENCY, {
             category_name: PRODUCT_CATEGORY,
             content_name: PRODUCT_NAME,
             content_type: "product",
             content_ids: [PRODUCT_ID],
             post_id: POST_ID.toString(),
             post_type: POST_TYPE,
             tags: ["f-commerce", "book"]
        }, getAdvancedMatchingData());
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
       clearTimeout(timer);
       window.removeEventListener("scroll", handleScroll);
    };
  }, [formData]);

  // --- ABANDONED CART LOGIC ---
  useEffect(() => {
    // Basic guard: don't save if empty or missing device ID
    if ((!formData.name && !formData.number && !formData.address) || !behaviorData.device_id || !clientInfo.ip) return;

    const autoSaveTimer = setTimeout(async () => {
        const shippingCost = shipping === "outside-dhaka" ? 99.0 : 60.0;
        const totalValue = PRODUCT_PRICE + shippingCost;
        
        const partialData = {
            deviceId: behaviorData.device_id,
            name: formData.name,
            number: formData.number,
            address: formData.address,
            shipping: shipping === "outside-dhaka" ? "ঢাকার বাহিরে" : "ঢাকার ভিতরে",
            shippingCost: shippingCost,
            totalValue: totalValue,
            items: [{ item_id: PRODUCT_ID, item_name: PRODUCT_NAME, price: PRODUCT_PRICE, item_category: PRODUCT_CATEGORY, quantity: 1 }],
            currency: CURRENCY,
            postId: POST_ID.toString(),
            postType: POST_TYPE,
            clientInfo: clientInfo,
            marketing: marketingData,
            localTime: new Date().toLocaleString()
        };

        try {
            await fetch(`/api/save-partial-order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(partialData)
            });
        } catch (error) {
            console.error("Partial Save Error:", error);
        }
    }, 1000); 

    return () => clearTimeout(autoSaveTimer);
  }, [formData, shipping, behaviorData.device_id, clientInfo, marketingData]);

  // --- ADD TO CART TRACKING ---
  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAddedToCart.current) {
            trackAddToCart([PRODUCT_ID], PRODUCT_NAME, PRODUCT_PRICE, CURRENCY, {
              category_name: PRODUCT_CATEGORY,
              tags: ["f-commerce", "book"],
            }, getAdvancedMatchingData());
            hasAddedToCart.current = true;
          }
        });
      },
      { threshold: 0.5 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [clientInfo]);

  const handleBeginCheckout = () => {
    if (!checkoutStarted) {
      trackInitiateCheckout([PRODUCT_ID], PRODUCT_NAME, PRODUCT_PRICE, CURRENCY, 1, {
         category_name: PRODUCT_CATEGORY,
         tags: ["f-commerce", "book"],
         subtotal: PRODUCT_PRICE
      }, getAdvancedMatchingData());
      
      setCheckoutStarted(true);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") setFormData(prev => ({ ...prev, name: value }));
    if (name === "billing_phone") {
      // Allow only numbers and the + sign
      const sanitizedValue = value.replace(/[^0-9+]/g, '');
      setFormData(prev => ({ ...prev, number: sanitizedValue }));
    }
    if (name === "billing_address_1") setFormData(prev => ({ ...prev, address: value }));
  };

  const handleOrder = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const name = formData.name;
      const number = formData.number.trim();
      const address = formData.address;
      const shippingCost = shipping === "outside-dhaka" ? 99.0 : 60.0;
      const totalValue = PRODUCT_PRICE + shippingCost;
      const currentDeviceId = behaviorData.device_id || localStorage.getItem("device_id") || "unknown";

      const orderData = {
        name, number, address,
        shipping: shipping === "outside-dhaka" ? "ঢাকার বাহিরে" : "ঢাকার ভিতরে",
        shippingCost, totalValue,
        status: "Processing", phoneCallStatus: "Pending",
        items: [{ item_id: PRODUCT_ID, item_name: PRODUCT_NAME, price: PRODUCT_PRICE, item_category: PRODUCT_CATEGORY, quantity: 1 }],
        currency: CURRENCY, postId: POST_ID.toString(), postType: POST_TYPE,
        clientInfo: { 
            ip: clientInfo.ip, 
            userAgent: clientInfo.userAgent,
            deviceId: currentDeviceId,
            visitCount: behaviorData.visit_count,
            firstVisit: behaviorData.first_visit_date 
        },
        marketing: marketingData,
      };

      const response = await fetch(`/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      // if (response.status === 403) { setIsBanned(true); return; }

      if (response.status === 409 || result.reason === "active_order_exists") {
        setShowDuplicateModal(true);
        setIsSubmitting(false);
        return;
      }

      if (!response.ok || !result.success) throw new Error(result.message);

      // Save billing details for Advanced Matching on the Thank You page
      try {
        localStorage.setItem("billing_name", name);
        localStorage.setItem("billing_phone", number);
      } catch (e) {}

      // --- SEND CONFIRMATION SMS ---
      // Removed redundant client-side trigger as SMS is sent by backend in /api/orders

      const params = new URLSearchParams({
        orderId: result.orderId.toString(),
        total: totalValue.toString(),
        shippingCost: shippingCost.toString(),
        currency: CURRENCY,
        productId: PRODUCT_ID,
        productName: PRODUCT_NAME,
        categoryName: PRODUCT_CATEGORY,
        price: PRODUCT_PRICE.toString(),
        quantity: "1",
      });

      window.location.href = `/thank-you?${params.toString()}`;
    } catch (error) {
      console.error("❌ Error placing order:", error);
      alert("Order Failed: " + error.message);
    } finally {
        if(showDuplicateModal) setIsSubmitting(false);
    }
  };
  
  const calculatedTotal = PRODUCT_PRICE + (shipping === "outside-dhaka" ? 99 : 60);

  // --- RENDER LOGIC: THE TRAP ---
  // --- RENDER LOGIC: THE TRAP - REMOVED ---
  // if (isCheckingBan) { return ... }
  // if (isBanned) { return <Fake404 />; }

  // --- NORMAL WEBSITE RENDER ---
  return (
    <section id="order" name="order" ref={sectionRef} className="bg-gray-100 px-2 shadow-2xl border relative">
      
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-center relative animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setShowDuplicateModal(false)}
              className="absolute right-4 top-4 text-gray-500 hover:text-red-500"
            >
              <XCircle size={28} />
            </button>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
                <MessageCircle size={32} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              আপনার একটি অর্ডার ইতিমধ্যে প্রসেসিং এ আছে!
            </h2>
            <p className="text-gray-600 mb-6">
              আপনি যদি ভুলে ভুল তথ্য দিয়ে থাকেন বা তথ্য পরিবর্তন করতে চান, দয়া করে নতুন অর্ডার না করে আমাদের সাথে সরাসরি যোগাযোগ করুন।
            </p>
            <div className="space-y-3">
              <a 
                href="https://wa.me/8801931692180"
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all"
              >
                <MessageCircle size={20} />
                WhatsApp এ মেসেজ দিন
              </a>
              <a 
                href="https://www.facebook.com/fb.uddokta" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
              >
                <Facebook size={20} />
                Facebook এ মেসেজ দিন
              </a>
            </div>
            <button 
              onClick={() => setShowDuplicateModal(false)}
              className="mt-4 text-sm text-gray-400 hover:text-gray-600 underline"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      <div className="bg-white px-2 py-8">
        <h1 className="text-4xl text-center mb-8 font-bold">
          বইটি অর্ডার করতে নিচের ফর্মটি পূরণ করুন
        </h1>
        <form onSubmit={handleOrder} className="grid gap-4 max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              className="py-6"
              placeholder="Name (আপনার নাম)"
              name="name"
              required
              type="text"
              value={formData.name}  
              onChange={handleInputChange} 
              onFocus={handleBeginCheckout}
              disabled={isSubmitting}
              // Added autoComplete="name" so browser knows this is a name field
              autoComplete="name"
            />
            <Input
              placeholder="Number (মোবাইল নম্বর)"
              name="billing_phone"
              required
              type="tel"
              pattern="[0-9+]+"
              title="Please enter a valid phone number (only numbers and + sign allowed)"
              minLength={11}
              maxLength={16}
              className="py-6"
              value={formData.number} 
              onChange={handleInputChange} 
              onFocus={handleBeginCheckout}
              disabled={isSubmitting}
              autoComplete="tel"
            />
          </div>
          <Input
            className="py-6"
            placeholder="Address (সম্পূর্ণ ঠিকানা)"
            name="billing_address_1"
            required
            type="text"
            value={formData.address} 
            onChange={handleInputChange} 
            onFocus={handleBeginCheckout}
            disabled={isSubmitting}
            // CHANGED: "billing_address_1" -> "street-address" for proper autofill
            autoComplete="street-address"
            id="billing_address_1"
          />
          <div className="w-full">
            <h2 className="text-2xl font-semibold mb-4">Delivery (ডেলিভারি চার্জ)</h2>
            <RadioGroup
              value={shipping}
              onValueChange={setShipping}
              className="gap-3"
              disabled={isSubmitting}
            >
              <Label
                htmlFor="outside-dhaka"
                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer text-xl transition-all hover:bg-green-50/50 ${
                  shipping === "outside-dhaka" 
                    ? "bg-green-50 border-green-500 shadow-sm ring-1 ring-green-500" 
                    : "border-gray-200 bg-white"
                } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem 
                    value="outside-dhaka" 
                    id="outside-dhaka" 
                    disabled={isSubmitting} 
                    className="h-6 w-6 border-2 data-[state=checked]:border-green-600 data-[state=checked]:text-green-600"
                  />
                  <span className="text-2xl font-medium">ঢাকার বাহিরে:</span>
                </div>
                <span className="font-bold text-gray-700">99.00৳</span>
              </Label>
              <Label
                htmlFor="inside-dhaka"
                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer text-xl transition-all hover:bg-green-50/50 ${
                  shipping === "inside-dhaka" 
                    ? "bg-green-50 border-green-500 shadow-sm ring-1 ring-green-500" 
                    : "border-gray-200 bg-white"
                } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem 
                    value="inside-dhaka" 
                    id="inside-dhaka" 
                    disabled={isSubmitting} 
                    className="h-6 w-6 border-2 data-[state=checked]:border-green-600 data-[state=checked]:text-green-600"
                  />
                  <span className="text-2xl font-medium">ঢাকার ভিতরে:</span>
                </div>
                <span className="font-bold text-gray-700">60.00৳</span>
              </Label>
            </RadioGroup>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border">
             <div className="flex justify-between items-center mb-2">
              <span className="text-lg">বই মূল্য:</span>
              <span className="text-lg font-medium">{PRODUCT_PRICE}৳</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg">ডেলিভারি চার্জ:</span>
              <span className="text-lg font-medium">
                {shipping === "outside-dhaka" ? "99" : "60"}৳
              </span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">মোট:</span>
                <span className="text-xl font-bold text-green-600">
                  {calculatedTotal}৳
                </span>
              </div>
            </div>
          </div>
          <Button
            className="w-full py-6 text-2xl font-bold"
            type="submit"
            disabled={isSubmitting || !clientInfo.ip}
          >
            {isSubmitting ? "অর্ডার প্রসেসিং..." : `অর্ডার করুন ${calculatedTotal}৳`}
          </Button>
        </form>
        <div className="text-center mt-6 text-gray-600">
          <p>✅ ক্যাশ অন ডেলিভারি সুবিধা</p>
          <p>✅ সারাদেশে হোম ডেলিভারি</p>
        </div>
      </div>
    </section>
  );
};
export default HeroSection;
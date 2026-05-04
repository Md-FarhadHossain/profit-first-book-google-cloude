// cloudflare/worker.js
export default {
    async fetch(request, env, ctx) {
      // Handle CORS preflight
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }
  
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }
  
      try {
        const payload = await request.json();
        const clientIp = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
        const userAgent = request.headers.get("User-Agent") || "";
  
        // Enrich the userData payload with IP and UserAgent captured directly by the worker
        if (payload.data && Array.isArray(payload.data) && payload.data.length > 0) {
          payload.data[0].user_data = payload.data[0].user_data || {};
          if (!payload.data[0].user_data.client_ip_address) {
            payload.data[0].user_data.client_ip_address = clientIp;
          }
          if (!payload.data[0].user_data.client_user_agent) {
             payload.data[0].user_data.client_user_agent = userAgent;
          }
        }
  
        const fbPixelId = payload.pixel_id || env.FB_PIXEL_ID;
        const fbAccessToken = payload.access_token || env.FB_ACCESS_TOKEN;
        const testEventCode = payload.test_event_code || env.TEST_EVENT_CODE;
  
        if (!fbPixelId || !fbAccessToken) {
          return new Response(
            JSON.stringify({ error: "Missing Pixel ID or Access Token" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
  
        // Optional debugging
        if (testEventCode) {
           payload.test_event_code = testEventCode;
        }
  
        // Remove pixel_id and access_token from the payload if they were sent in body,
        // since Facebook CAPI expects them in the URL or they aren't standard data fields.
        delete payload.pixel_id;
        delete payload.access_token;
  
        const fbApiUrl = `https://graph.facebook.com/v18.0/${fbPixelId}/events?access_token=${fbAccessToken}`;
  
        const fbResponse = await fetch(fbApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
  
        const fbResult = await fbResponse.json();
  
        return new Response(JSON.stringify(fbResult), {
          status: fbResponse.status,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
        });
      }
    },
  };

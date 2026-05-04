import { NextResponse } from 'next/server';
// Node.js এর বিল্ট-ইন ক্রিপ্টো মডিউল ইম্পোর্ট করা হচ্ছে
import crypto from 'crypto';
import { sendConfirmationSMS } from '@/lib/smsProvider';

// --- SHA-256 Hashing Helper Function ---
// এই ফাংশনটি যেকোনো টেক্সটকে হ্যাশ করে দেবে
function sha256(data) {
  // যদি ডেটা খালি থাকে (যেমন last_name), তাহলে খালি স্ট্রিং রিটার্ন করবে
  if (!data) {
    return '';
  }
  // ডেটাকে স্ট্রিং-এ রূপান্তর করে হ্যাশ তৈরি করা হচ্ছে
  return crypto.createHash('sha256').update(data.toString().trim().toLowerCase()).digest('hex');
}

export async function POST(request) {
  try {
    const { product, customerDetails, shippingInfo } = await request.json();

    // === Hashing User Data ===
    // ফ্রন্টএন্ড থেকে পাওয়া সাধারণ টেক্সটকে এখানে হ্যাশ করা হচ্ছে
    const firstNameHash = sha256(customerDetails.firstName);
    const lastNameHash = sha256(customerDetails.lastName);
    const emailHash = sha256(customerDetails.email);
    const phoneHash = sha256(customerDetails.phone);

    // --- Demo Order Generation (অপরিবর্তিত) ---
    const orderNumber = Math.floor(1000 + Math.random() * 9000);
    const orderKey = `wc_order_${Math.random().toString(36).substring(2, 15)}`;
    const total = product.price + shippingInfo.cost;

    // --- Final Order Data Object (হ্যাশ ভ্যালু সহ) ---
    const finalOrderData = {
      attributes: {
        date: new Date().toISOString(),
        order_number: orderNumber,
        order_key: orderKey,
        payment_method: "cod",
        payment_method_title: "ক্যাশ অন ডেলিভারি",
        shipping_method: shippingInfo.title,
        status: "processing",
        coupons: ""
      },
      totals: {
        currency: "BDT",
        shipping_total: shippingInfo.cost,
        total: total,
        subtotal: product.price,
      },
      customer: {
        billing: {
          first_name: customerDetails.firstName,
          first_name_hash: firstNameHash, // <== নতুন হ্যাশ ভ্যালু যুক্ত করা হয়েছে

          last_name: customerDetails.lastName,
          last_name_hash: lastNameHash,   // <== নতুন হ্যাশ ভ্যালু যুক্ত করা হয়েছে
          
          address_1: customerDetails.address,
          city: customerDetails.city,
          state: customerDetails.state,
          postcode: customerDetails.postCode,
          country: customerDetails.country,
          
          email: customerDetails.email,
          email_hash: emailHash,           // <== নতুন হ্যাশ ভ্যালু যুক্ত করা হয়েছে

          phone: customerDetails.phone,
          phone_hash: phoneHash,           // <== নতুন হ্যাশ ভ্যালু যুক্ত করা হয়েছে
        }
      },
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          sku: product.id,
          price: product.price,
          item_category: product.category,
          quantity: 1,
          google_business_vertical: "retail",
          stockstatus: "instock",
        }
      ]
    };

    // --- SMS Trigger ---
    // Send confirmation SMS asynchronously
    // We don't await this to ensure the API response is fast, or we can await if critical. 
    // Given it's a confirmation, fire-and-forget or awaiting is fine. Here we await to log the result safely.
    try {
        const smsResult = await sendConfirmationSMS(customerDetails.phone, customerDetails.firstName, orderNumber);
        console.log("SMS Triggered:", smsResult);
    } catch (smsError) {
        console.error("SMS Trigger Failed:", smsError);
    }

    return NextResponse.json({ success: true, orderData: finalOrderData });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
export async function sendConfirmationSMS(phoneNumber, customerName, orderId) {
  // Configuration
  const API_KEY = "C400027369390bbd6a4b88.82076860";
  const SENDER_ID = "8809612443871"; // Valid tested Sender ID or User's Approved ID
  const BASE_URL = "https://msg.mram.com.bd/smsapi";

  // 1. Normalize and Validate Phone Number
  const validNumber = normalizePhoneNumber(phoneNumber);
  
  if (!validNumber) {
    console.warn(`Skipping SMS for Order ${orderId}: Invalid phone number format (${phoneNumber})`);
    return null;
  }

  // 1. Format the message
  // const rawMessage = `Dear ${customerName}, thanks for your order #${orderId}. Your order has been confirmed!`;
  const rawMessage = `ধন্যবাদ!
"প্রফিট ফাস্ট ফর-এফ কমার্স" বইটির অর্ডার কনফার্ম করা হয়েছে✅`;
  
  // 2. Construct URL with parameters
  // API URL Structure: https://msg.mram.com.bd/smsapi?api_key=(APIKEY)&type=text&contacts=(NUMBER)&senderid=(Approved Sender ID)&msg=(Message Content)
  const url = new URL(BASE_URL);
  url.searchParams.append("api_key", process.env.SMS_API_KEY || API_KEY);
  url.searchParams.append("type", "text");
  url.searchParams.append("contacts", validNumber); // Use the normalized number
  url.searchParams.append("senderid", process.env.SMS_SENDER_ID || SENDER_ID);
  url.searchParams.append("msg", rawMessage);

  try {
    const response = await fetch(url.toString(), {
      method: "POST", 
    });

    const result = await response.text();
    console.log(`SMS Sent for Order ${orderId}. Result: ${result}`);
    return result;
  } catch (error) {
    console.error("Failed to send SMS:", error);
    return null;
  }
}

/**
 * Extracts a valid Bangladeshi mobile number from a messy string.
 * Looks for the pattern: 01[3-9] followed by 8 digits (Total 11 digits).
 * Examples:
 * "01711-223344" -> "01711223344"
 * "+8801711223344" -> "01711223344"
 * "0901711223344" -> "01711223344"
 * "(019) 11223344" -> "01911223344"
 */
function normalizePhoneNumber(input) {
  if (!input) return null;
  
  // Remove all non-digit characters
  const digitsOnly = input.toString().replace(/\D/g, "");

  // match 01 followed by 3-9 and then 8 digits
  const match = digitsOnly.match(/(01[3-9]\d{8})/);

  if (match) {
    return match[0]; // Returns the 11 digit number, e.g., "01711223344"
  }
  
  return null;
}

const API_URL = "https://profit-first-server.vercel.app";

async function testOrder() {
  const orderData = {
    name: "Test Debugger",
    number: "01711223344",
    address: "Debug Address",
    shipping: "ঢাকার বাহিরে",
    shippingCost: 99,
    totalValue: 589,
    status: "Processing",
    phoneCallStatus: "Pending",
    items: [],
    currency: "BDT",
    postId: "913",
    postType: "product",
    clientInfo: { 
        ip: "127.0.0.1", 
        userAgent: "DebugScript"
    },
    marketing: {}
  };

  try {
    console.log("Sending Test Order...");
    const response = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });

    const result = await response.json();
    console.log("Response Status:", response.status);
    console.log("Response Body:", JSON.stringify(result, null, 2));
    
    // Check possible ID fields
    console.log("Possible IDs:");
    console.log("result.orderId:", result.orderId);
    console.log("result.id:", result.id);
    console.log("result._id:", result._id);
    console.log("result.insertedId:", result.insertedId);

  } catch (error) {
    console.error("Test Failed:", error);
  }
}

testOrder();

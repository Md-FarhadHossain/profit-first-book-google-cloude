'use server';

import { db } from '../../lib/db/index.js';
import { orders } from '../../lib/db/schema.js';
import { eq, inArray } from 'drizzle-orm';

const STEADFAST_API_URL = 'https://portal.packzy.com/api/v1';

export async function sendToSteadfast(orderId) {
  try {
    // 1. Fetch the order details from the database
    const orderData = await db.select().from(orders).where(eq(orders.orderId, orderId)).limit(1);
    
    if (!orderData || orderData.length === 0) {
      return { success: false, message: 'Order not found in the database.' };
    }
    
    const order = orderData[0];
    
    // 2. Prevent re-sending if it already has a consignment ID
    if (order.consignmentId) {
      return { success: false, message: 'This order has already been sent to Steadfast.' };
    }

    // 3. Prepare Payload
    const apiKey = process.env.STEADFAST_API_KEY;
    const secretKey = process.env.STEADFAST_SECRET_KEY;
    
    if (!apiKey || !secretKey) {
        return { success: false, message: 'Server Configuration Error: Steadfast API keys missing in environment.' };
    }

    // Determine the COD amount. Usually totalValue.
    // Assuming if the order is already Paid, COD might be 0, but for now we'll pass totalValue.
    const codAmount = order.totalValue || 0;
    
    // Fall back through all possible locations for Name and Phone
    const customerPhone = order.number || (order.clientInfo && order.clientInfo.phone) || (order.customer && order.customer.phone) || '';
    const customerName = order.name || (order.clientInfo && order.clientInfo.name) || (order.customer && order.customer.name) || 'N/A';
    
    const payload = {
      invoice: order.orderId,
      recipient_name: customerName,
      recipient_phone: customerPhone,
      recipient_address: order.address || 'N/A',
      cod_amount: codAmount,
      note: order.note || ''
    };

    // 4. Send to Steadfast API
    const response = await fetch(`${STEADFAST_API_URL}/create_order`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Secret-Key': secretKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    // 5. Handle Response
    if (result.status === 200 && result.consignment) {
      // Success. Update local DB with consignment and tracking
      await db.update(orders)
        .set({
          consignmentId: result.consignment.consignment_id.toString(),
          trackingCode: result.consignment.tracking_code,
          courierStatus: result.consignment.status || 'pending',
          status: 'In Review' // Automatically move internal status to In Review
        })
        .where(eq(orders.orderId, orderId));

      return { 
        success: true, 
        message: 'Order successfully sent to Steadfast Courier!',
        trackingCode: result.consignment.tracking_code,
        consignmentId: result.consignment.consignment_id.toString()
      };
    } else {
       // API returned an error structure
       console.log('Steadfast Failed Payload:', result);
       
       let errorMsg = result.message || 'Error communicating with Steadfast API.';
       if (result.errors) {
           errorMsg += ' Details: ' + JSON.stringify(result.errors);
       }
       return { success: false, message: errorMsg };
    }

  } catch (error) {
    console.error('Steadfast Integration Error:', error);
    return { success: false, message: 'Internal Server Error while communicating with courier.' };
  }
}

export async function sendBulkToSteadfast(orderIds) {
  try {
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return { success: false, message: 'No orders provided for bulk send.' };
    }

    if (orderIds.length > 500) {
      return { success: false, message: 'Maximum 500 items are allowed per bulk request.' };
    }

    // 1. Fetch the order details
    const ordersData = await db.select().from(orders).where(inArray(orders.orderId, orderIds));

    if (!ordersData || ordersData.length === 0) {
      return { success: false, message: 'Orders not found in the database.' };
    }

    // 2. Filter out orders that already have a consignment ID
    const pendingOrders = ordersData.filter(o => !o.consignmentId);

    if (pendingOrders.length === 0) {
      return { success: false, message: 'All selected orders have already been sent to Steadfast.' };
    }

    // 3. Prepare Payload Data Array
    const apiKey = process.env.STEADFAST_API_KEY;
    const secretKey = process.env.STEADFAST_SECRET_KEY;

    if (!apiKey || !secretKey) {
      return { success: false, message: 'Server Configuration Error: Steadfast API keys missing.' };
    }

    const payloadData = pendingOrders.map(order => {
      const codAmount = order.totalValue || 0;
      const customerPhone = order.number || (order.clientInfo && order.clientInfo.phone) || (order.customer && order.customer.phone) || '';
      const customerName = order.name || (order.clientInfo && order.clientInfo.name) || (order.customer && order.customer.name) || 'N/A';
      return {
        invoice: order.orderId,
        recipient_name: customerName,
        recipient_address: order.address || 'N/A',
        recipient_phone: customerPhone,
        cod_amount: codAmount,
        note: order.note || ''
      };
    });

    // We stringify the array inside the data property because the Steadfast Laravel API
    // expects 'data' to be a JSON encoded string, not a direct array inside the JSON payload.
    const payload = { data: JSON.stringify(payloadData) };

    // 4. Send to Steadfast Bulk API
    const response = await fetch(`${STEADFAST_API_URL}/create_order/bulk-order`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Secret-Key': secretKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const results = await response.json();

    // The bulk endpoint returns an array of objects
    // However, if there's a top-level error (e.g., authentication, generic issue)
    // it will return a single object, e.g. { status: 400, message: "..." }
    let resultsArray = results;
    
    // Check if the API returned an object rather than an array payload
    if (!Array.isArray(results)) {
       // If it's the expected wrapper format like { data: [...] } (which is sometimes undocumented structure)
       if (results.data && Array.isArray(results.data)) {
           resultsArray = results.data;
       } 
       // Or if it's an error response like {status: 401, message: "Unauthorized"}
       else if (results.status && results.message) {
           console.log('Steadfast Bulk API Error:', results);
           return { success: false, message: results.message };
       } 
       // Completely unknown format
       else {
           console.log('Steadfast Bulk Failed Payload:', results);
           return { success: false, message: 'Invalid response format from Steadfast API.' };
       }
    }

    // 5. Handle Response & Update Local DB
    let successCount = 0;
    let errorCount = 0;
    const successfulUpdates = [];
    const failedInvoices = [];

    // Identify successes to update the database
    for (const res of resultsArray) {
      if (res.status === 'success' && res.consignment_id) {
        successCount++;
        successfulUpdates.push({
          orderId: res.invoice,
          consignmentId: res.consignment_id.toString(),
          trackingCode: res.tracking_code
        });
      } else {
        errorCount++;
        failedInvoices.push(res.invoice);
      }
    }

    // Update the database for successful orders
    // Depending on Drizzle ORM capabilities we might need to update in a loop or build a specialized query.
    // Given the potentially large number, we'll iterate with individual await calls map for now for safety.
    await Promise.all(successfulUpdates.map(async (update) => {
       await db.update(orders)
          .set({
              consignmentId: update.consignmentId,
              trackingCode: update.trackingCode,
              courierStatus: 'pending', // Bulk response does not yield initial status string in success object
              status: 'In Review'
          })
          .where(eq(orders.orderId, update.orderId));
    }));

    return {
      success: successCount > 0,
      message: `Processed ${successCount + errorCount} orders. Success: ${successCount}, Failed: ${errorCount}. ${failedInvoices.length > 0 ? 'Failed invoices: ' + failedInvoices.join(', ') : ''}`,
      successCount,
      errorCount,
      successfulUpdates
    };

  } catch (error) {
    console.error('Steadfast Bulk Integration Error:', error);
    return { success: false, message: 'Internal Server Error while communicating with courier in bulk.' };
  }
}

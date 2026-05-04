'use server';

import { db } from '@/lib/db';
import { orders, stocks } from '@/lib/db/schema';
import { eq, inArray, and, isNotNull, not, sql } from 'drizzle-orm';

const STEADFAST_API_URL = 'https://portal.packzy.com/api/v1';

// Helper to map steadfast status to internal
const mapSteadfastStatus = (steadfastStatus) => {
  if (!steadfastStatus) return null;
  const lowerStatus = steadfastStatus.toLowerCase();

  switch (lowerStatus) {
    case 'in_review':
      return 'In Review';
    case 'pending':
    case 'shipped':
    case 'in_transit':
    case 'out_for_delivery':
    case 'hold':
      return 'Shipped';
    case 'delivered':
    case 'partial_delivered':
    case 'delivered_approval_pending':
    case 'partial_delivered_approval_pending':
      return 'Delivered';
    case 'cancelled':
    case 'cancelled_approval_pending':
    case 'returned':
      return 'Returned';
    default:
      return null;
  }
};

export async function syncActiveCouriers() {
  try {
    const apiKey = process.env.STEADFAST_API_KEY;
    const secretKey = process.env.STEADFAST_SECRET_KEY;

    if (!apiKey || !secretKey) {
      return { success: false, message: 'Steadfast API keys missing in environment.' };
    }

    // 1. Fetch orders that have a consignment ID but are not yet in a final state
    // Final states: Delivered, Cancelled, Returned, Abandoned
    const activeOrders = await db.select()
      .from(orders)
      .where(
        and(
          isNotNull(orders.consignmentId),
          not(inArray(orders.status, ['Delivered', 'Cancelled', 'Returned', 'Abandoned', 'Fake']))
        )
      );

    if (activeOrders.length === 0) {
      return { success: true, message: 'No active orders require synchronization.', updated: 0 };
    }

    let updatedCount = 0;
    let revertedCount = 0;
    const errors = [];

    // 2. Loop through each active order and check steadfast status
    // We do this sequentially to respect rate limits, but for many orders we might need bulk if they provide one
    for (const order of activeOrders) {
      try {
        const response = await fetch(`${STEADFAST_API_URL}/status_by_cid/${order.consignmentId}`, {
          method: 'GET',
          headers: {
            'Api-Key': apiKey,
            'Secret-Key': secretKey,
          }
        });

        // Safely parse response — Steadfast returns plain-text "Unauthorized Access"
        // (HTTP 401) for unknown/deleted consignment IDs instead of a proper JSON 404.
        const text = await response.text();
        let result = null;
        try { result = JSON.parse(text); } catch (_) { result = null; }

        // 3a. Handle Deleted/Not Found Orders
        // Steadfast returns plain-text "Unauthorized Access" (HTTP 401) for CIDs that
        // don't exist or don't belong to this account — result will be null (non-JSON).
        // It also returns JSON status:400 for validation errors (e.g. non-numeric CID).
        const isNonJsonResponse = result === null; // plain-text body, always a bad/missing CID
        const isJsonNotFound = result !== null && (
          response.status === 404 ||
          result.status === 400 ||
          (result.status === 'error' && result.message?.toLowerCase().includes('not found'))
        );
        if (isNonJsonResponse || isJsonNotFound) {
          await db.update(orders)
            .set({
              consignmentId: null,      // Remove tracking linkage
              trackingCode: null,
              courierStatus: 'pending',
              status: 'Processing'       // Revert back so it can be re-sent
            })
            .where(eq(orders.id, order.id));
            
          revertedCount++;
          continue;
        }

        // 3b. Handle Valid Status Updates
        if (result.status === 200 && result.delivery_status) {
          const newSysStatus = mapSteadfastStatus(result.delivery_status);
          
          if (newSysStatus && newSysStatus !== order.status) {
            const oldStatus = order.status;

            // Stock adjustment logic
            if (newSysStatus === 'Shipped' && oldStatus !== 'Shipped') {
              await db.update(stocks)
                .set({ quantity: sql`${stocks.quantity} - 1` })
                .where(eq(stocks.name, 'Book'));
            } else if (newSysStatus === 'Returned' && oldStatus !== 'Returned') {
              await db.update(stocks)
                .set({ quantity: sql`${stocks.quantity} + 1` })
                .where(eq(stocks.name, 'Book'));
            } else if (newSysStatus === 'Cancelled' && oldStatus !== 'Cancelled' && (oldStatus === 'Shipped' || oldStatus === 'Delivered')) {
              await db.update(stocks)
                .set({ quantity: sql`${stocks.quantity} + 1` })
                .where(eq(stocks.name, 'Book'));
            }

            // Use Steadfast's own timestamp if available, so even a late manual sync
            // records the accurate date the event actually happened.
            let eventTimeIso = new Date().toISOString();
            if (result.updated_at) {
              const parsed = new Date(result.updated_at);
              if (!isNaN(parsed.getTime())) eventTimeIso = parsed.toISOString();
            }
            await db.update(orders)
              .set({
                status: newSysStatus,
                courierStatus: result.delivery_status,
                ...(newSysStatus === 'Shipped' && !order.shippedAt ? { shippedAt: eventTimeIso } : {}),
                ...(newSysStatus === 'Delivered' && !order.deliveredAt ? { deliveredAt: eventTimeIso } : {}),
                ...(newSysStatus === 'Returned' && !order.returnedAt ? { returnedAt: eventTimeIso } : {}),
                updatedAt: eventTimeIso
              })
              .where(eq(orders.id, order.id));
              
            updatedCount++;
          }
        } else {
            console.warn(`Unrecognized payload for CID ${order.consignmentId}:`, result);
        }

      } catch (err) {
        console.error(`Error syncing CID ${order.consignmentId}:`, err);
        errors.push({ cid: order.consignmentId, msg: err.message });
      }
    }

    let resultMessage = `Sync complete. ${updatedCount} orders updated.`;
    if (revertedCount > 0) resultMessage += ` ${revertedCount} deleted orders reverted to Processing.`;
    if (errors.length > 0) {
      resultMessage += ` Failed to check ${errors.length} orders.`;
      // Append the first error message to help with debugging
      resultMessage += ` Error details: ${errors[0].msg}`;
    }

    return { 
      success: true, 
      message: resultMessage, 
      updated: updatedCount, 
      reverted: revertedCount 
    };

  } catch (error) {
    console.error('Steadfast Sync Error:', error);
    return { success: false, message: 'Internal server error during courier sync.' };
  }
}

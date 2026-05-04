import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, stocks } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

// Helper function to map steadfast status to internal dashboard status.
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

export async function POST(request) {
  try {
    // 1. Verify the Bearer token from the Authorization header
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    // Steadfast sends "Bearer {your_api_key}" per their webhook documentation.
    const expectedToken = process.env.STEADFAST_API_KEY;

    if (!expectedToken || token !== expectedToken) {
      console.warn('Steadfast Webhook: Unauthorized request - invalid or missing token. Received:', token?.slice(0, 8) + '...');
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse the incoming webhook payload sent from Steadfast
    const payload = await request.json();
    const { notification_type, consignment_id, status, delivery_status, updated_at, tracking_message } = payload;

    // tracking_update payloads have no "status" field — acknowledge and exit early
    if (notification_type === 'tracking_update') {
      console.log(`Steadfast Webhook: tracking_update for consignment ${consignment_id} — "${tracking_message}"`);
      return NextResponse.json({ status: 'success', message: 'Webhook received successfully.' }, { status: 200 });
    }

    // For delivery_status, status is required
    const steadfastStatus = status || delivery_status;
    if (!consignment_id || !steadfastStatus) {
      console.error('Steadfast Webhook: Missing required fields', payload);
      return NextResponse.json({ status: 'error', message: 'Missing consignment_id or status.' }, { status: 400 });
    }

    // 2. Map the Courier Status to our Internal Store Status
    const dbStatus = mapSteadfastStatus(steadfastStatus);

    if (dbStatus) {
      const [existingOrder] = await db.select().from(orders).where(eq(orders.consignmentId, consignment_id.toString()));

      if (existingOrder) {
        const oldStatus = existingOrder.status;

        // Stock adjustment logic
        if (dbStatus === 'Shipped' && oldStatus !== 'Shipped') {
          await db.update(stocks)
            .set({ quantity: sql`${stocks.quantity} - 1` })
            .where(eq(stocks.name, 'Book'));
        } else if (dbStatus === 'Returned' && oldStatus !== 'Returned') {
          await db.update(stocks)
            .set({ quantity: sql`${stocks.quantity} + 1` })
            .where(eq(stocks.name, 'Book'));
        } else if (dbStatus === 'Cancelled' && oldStatus !== 'Cancelled' && (oldStatus === 'Shipped' || oldStatus === 'Delivered')) {
          await db.update(stocks)
            .set({ quantity: sql`${stocks.quantity} + 1` })
            .where(eq(stocks.name, 'Book'));
        }

        // Use Steadfast's exact timestamp if provided, otherwise fall back to now
        let eventTimeIso = new Date().toISOString();
        if (updated_at) {
          let timeStr = updated_at.trim();
          
          // Replace ' ' with 'T' for robust ISO parsing
          if (timeStr.includes(' ') && !timeStr.includes('T')) {
            timeStr = timeStr.replace(' ', 'T');
          }
          
          // If no timezone is specified (checking after character 10 to avoid matching date hyphens),
          // append +06:00 to assume Bangladesh Standard Time
          if (!timeStr.endsWith('Z') && !timeStr.includes('+', 10) && !timeStr.includes('-', 10)) {
            timeStr += '+06:00';
          }
          
          const parsed = new Date(timeStr);
          if (!isNaN(parsed.getTime())) {
            eventTimeIso = parsed.toISOString();
          }
        }

        // Prepare fields to update
        const updateFields = {
          status: dbStatus,
          courierStatus: steadfastStatus,
          updatedAt: eventTimeIso
        };

        if (dbStatus === 'Shipped' && !existingOrder.shippedAt) updateFields.shippedAt = eventTimeIso;
        if (dbStatus === 'Delivered' && !existingOrder.deliveredAt) updateFields.deliveredAt = eventTimeIso;
        if (dbStatus === 'Returned' && !existingOrder.returnedAt) updateFields.returnedAt = eventTimeIso;

        // 3. Update the matching order in the database
        const updateResult = await db
          .update(orders)
          .set(updateFields)
          .where(eq(orders.id, existingOrder.id))
          .returning({ id: orders.id, orderId: orders.orderId });

        if (updateResult.length > 0) {
          console.log(`Steadfast Webhook: Order ${updateResult[0].orderId} updated to ${dbStatus} (event time: ${eventTimeIso})`);
        }
      } else {
        console.log(`Steadfast Webhook: Consignment ID ${consignment_id} not found in database.`);
      }
    } else {
      console.log(`Steadfast Webhook: Received unrecognized status '${steadfastStatus}', no mapped update performed.`);
    }

    // 4. Always return a 200 OK so Steadfast knows we received it
    return NextResponse.json({ status: 'success', message: 'Webhook received successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Steadfast Webhook Error:', error);
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}

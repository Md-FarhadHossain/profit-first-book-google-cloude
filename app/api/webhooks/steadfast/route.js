import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, stocks } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';

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
    // 1. Read raw body and verify X-Signature
    const rawBody = await request.text();
    const expectedToken = process.env.STEADFAST_API_KEY || process.env.STEADFAST_TOKEN || '';
    
    if (expectedToken) {
      const signature = request.headers.get('x-signature') || '';
      
      if (signature) {
        const expectedSignature = crypto.createHmac('sha256', expectedToken).update(rawBody).digest('hex');
        if (signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
          console.error('Steadfast Webhook: Signature verification failed.');
          return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
        }
      } else {
        // Fallback: If no signature but token is in headers (legacy/debug)
        const authHeader = request.headers.get('authorization') || '';
        const reqToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        if (reqToken !== expectedToken) {
          console.warn('Steadfast Webhook: No signature found, and bearer token mismatch.');
        }
      }
    }

    // 2. Parse the verified payload
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      console.error('Steadfast Webhook: Failed to parse JSON body');
      return NextResponse.json({ status: 'error', message: 'Invalid JSON body' }, { status: 400 });
    }
    
    console.log('Steadfast Webhook Payload:', JSON.stringify(payload));
    const { notification_type, consignment_id, status, delivery_status, updated_at, tracking_message } = payload;

    // tracking_update payloads have no "status" field — acknowledge and exit early
    if (notification_type === 'tracking_update') {
      console.log(`Steadfast Webhook: tracking_update for consignment ${consignment_id} — "${tracking_message}"`);
      if (tracking_message && consignment_id) {
        const [existingOrder] = await db.select().from(orders).where(eq(orders.consignmentId, consignment_id.toString()));
        if (existingOrder) {
          let existingNotes = [];
          if (existingOrder.courierNote) {
            try { existingNotes = JSON.parse(existingOrder.courierNote); } 
            catch (e) { existingNotes = [{ message: existingOrder.courierNote, date: existingOrder.updatedAt || new Date().toISOString() }]; }
          }
          // Only add if it's not a duplicate of the last message
          if (existingNotes.length === 0 || existingNotes[existingNotes.length - 1].message !== tracking_message) {
            existingNotes.push({ message: tracking_message, date: new Date().toISOString() });
            await db.update(orders)
              .set({ courierNote: JSON.stringify(existingNotes), updatedAt: new Date().toISOString() })
              .where(eq(orders.consignmentId, consignment_id.toString()));
          }
        }
      }
      return NextResponse.json({ status: 'success', message: 'Tracking update received.' }, { status: 200 });
    }

    // Acknowledge other non-status event types safely (cancel_request, return_request, user_update, etc.)
    if (notification_type && notification_type !== 'delivery_status') {
      console.log(`Steadfast Webhook: Acknowledging unsupported event type '${notification_type}'`);
      return NextResponse.json({ status: 'success', message: 'Event acknowledged.' }, { status: 200 });
    }

    // For delivery_status, status is required
    const steadfastStatus = status || delivery_status;
    if (!consignment_id || !steadfastStatus) {
      console.error('Steadfast Webhook: Missing required fields for delivery_status', payload);
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

        const updateFields = {
          status: dbStatus,
          courierStatus: steadfastStatus,
          updatedAt: eventTimeIso
        };

        if (tracking_message) {
          let existingNotes = [];
          if (existingOrder.courierNote) {
            try { existingNotes = JSON.parse(existingOrder.courierNote); } 
            catch (e) { existingNotes = [{ message: existingOrder.courierNote, date: existingOrder.updatedAt || new Date().toISOString() }]; }
          }
          if (existingNotes.length === 0 || existingNotes[existingNotes.length - 1].message !== tracking_message) {
            existingNotes.push({ message: tracking_message, date: eventTimeIso });
            updateFields.courierNote = JSON.stringify(existingNotes);
          }
        }

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

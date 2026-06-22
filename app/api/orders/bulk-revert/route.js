import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

/**
 * POST /api/orders/bulk-revert
 * Body: { orderIds: number[] }  — the DB row IDs (integer) of "In Review" orders to revert.
 * Resets each order to:
 *   - status: "Processing"
 *   - consignmentId: null
 *   - trackingCode: null
 *   - courierStatus: "pending"
 *   - updatedAt: now
 */
export async function POST(request) {
  try {
    const { orderIds } = await request.json();

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No order IDs provided.' },
        { status: 400 }
      );
    }

    const numericIds = orderIds.map(Number).filter(Boolean);

    await db
      .update(orders)
      .set({
        status: 'Processing',
        consignmentId: null,
        trackingCode: null,
        courierStatus: 'pending',
        updatedAt: new Date().toISOString(),
      })
      .where(inArray(orders.id, numericIds));

    return NextResponse.json({ success: true, reverted: numericIds.length });
  } catch (error) {
    console.error('Bulk Revert Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

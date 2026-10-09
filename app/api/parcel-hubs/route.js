import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq, and, notInArray } from 'drizzle-orm';

// Courier statuses that mean the parcel is effectively done — not in transit anymore
const TERMINAL_COURIER_STATUSES = [
  'delivered',
  'partial_delivered',
  'delivered_approval_pending',
  'partial_delivered_approval_pending',
  'cancelled',
  'cancelled_approval_pending',
  'returned',
];

export async function GET() {
  try {
    // Fetch orders with status 'Shipped' but whose courierStatus is NOT already terminal.
    // This is the safety net: even if the local `status` field wasn't updated yet by a sync,
    // we exclude parcels that Steadfast has already marked as delivered/returned/cancelled.
    const shippedOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.status, 'Shipped'),
          notInArray(orders.courierStatus, TERMINAL_COURIER_STATUSES)
        )
      );

    // Group by district
    const districtMap = {};

    for (const order of shippedOrders) {
      const districtKey = order.district || '__unknown__';

      if (!districtMap[districtKey]) {
        districtMap[districtKey] = {
          name: order.district || 'Unknown District',
          isUnknown: !order.district,
          count: 0,
          totalCOD: 0,
          statusBreakdown: {},
          parcels: [],
        };
      }

      const group = districtMap[districtKey];
      group.count++;
      group.totalCOD += order.totalValue || 0;

      // Tally courier status breakdown
      const cStatus = order.courierStatus || 'pending';
      group.statusBreakdown[cStatus] = (group.statusBreakdown[cStatus] || 0) + 1;

      group.parcels.push({
        orderId: order.orderId,
        name: order.name,
        number: order.number,
        address: order.address,
        district: order.district || null,
        thana: order.thana || null,
        totalValue: order.totalValue || 0,
        courierStatus: order.courierStatus || 'pending',
        consignmentId: order.consignmentId || null,
        trackingCode: order.trackingCode || null,
        shippedAt: order.shippedAt || order.updatedAt || order.date || null,
        note: order.note || null,
        courierNote: order.courierNote || null,
      });
    }

    // Convert map to sorted array: busiest districts first, unknown always last
    const districts = Object.values(districtMap).sort((a, b) => {
      if (a.isUnknown) return 1;
      if (b.isUnknown) return -1;
      return b.count - a.count;
    });

    // Sort parcels within each district: pending/hold first, then by shippedAt desc
    const statusOrder = { hold: 0, in_review: 1, pending: 2, delivered_to_courier: 3, partial_delivered: 4, cancelled: 5 };
    for (const dist of districts) {
      dist.parcels.sort((a, b) => {
        const aPriority = statusOrder[a.courierStatus] ?? 99;
        const bPriority = statusOrder[b.courierStatus] ?? 99;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return new Date(b.shippedAt || 0) - new Date(a.shippedAt || 0);
      });
    }

    const totalParcels = shippedOrders.length;
    const totalCOD = shippedOrders.reduce((sum, o) => sum + (o.totalValue || 0), 0);

    return NextResponse.json({
      success: true,
      totalParcels,
      totalCOD,
      totalDistricts: districts.filter(d => !d.isUnknown).length,
      districts,
    });
  } catch (error) {
    console.error('Parcel Hubs API Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

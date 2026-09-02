import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { partialOrders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(request, props) {
  const params = await props.params;
  try {
    const id = params.id;
    await db.delete(partialOrders).where(eq(partialOrders.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Partial Order Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
export async function PATCH(request, props) {
  const params = await props.params;
  try {
    const id = params.id;
    const body = await request.json();

    const updateData = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.callStatus !== undefined) updateData.phoneCallStatus = body.callStatus;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.number !== undefined) updateData.number = body.number;
    if (body.phone !== undefined) updateData.number = body.phone;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.gender !== undefined) updateData.gender = body.gender;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, message: 'No fields to update' }, { status: 400 });
    }

    await db.update(partialOrders)
      .set(updateData)
      .where(eq(partialOrders.id, Number(id)));

    return NextResponse.json({ success: true, ...updateData });
  } catch (error) {
    console.error("Update Partial Order Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

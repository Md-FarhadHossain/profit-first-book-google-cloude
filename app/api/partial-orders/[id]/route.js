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

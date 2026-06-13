import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import { and, eq, gte, lte } from "drizzle-orm";

export async function POST(req) {
  try {
    const { deviceId } = await req.json();

    if (!deviceId) {
      return NextResponse.json({ error: "Device ID is required" }, { status: 400 });
    }

    // Check if a session for this deviceId already exists today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existingSession = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.deviceId, deviceId),
          gte(sessions.date, startOfDay.toISOString()),
          lte(sessions.date, endOfDay.toISOString())
        )
      )
      .limit(1);

    // If no session today for this device, insert it
    if (existingSession.length === 0) {
      await db.insert(sessions).values({
        deviceId: deviceId,
      });
      return NextResponse.json({ success: true, message: "Session tracked" }, { status: 201 });
    }

    return NextResponse.json({ success: true, message: "Session already tracked today" }, { status: 200 });
  } catch (error) {
    console.error("Error tracking session:", error);
    return NextResponse.json({ error: "Failed to track session" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { deviceId, action } = await req.json();

    if (!deviceId || !action) {
      return NextResponse.json({ error: "Device ID and action are required" }, { status: 400 });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existingSession = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.deviceId, deviceId),
          gte(sessions.date, startOfDay.toISOString()),
          lte(sessions.date, endOfDay.toISOString())
        )
      )
      .limit(1);

    if (existingSession.length > 0) {
      let updateData = {};
      if (action === 'add_to_cart') updateData.addedToCart = true;
      if (action === 'initiate_checkout') updateData.initiatedCheckout = true;

      if (Object.keys(updateData).length > 0) {
        await db.update(sessions)
          .set(updateData)
          .where(eq(sessions.id, existingSession[0].id));
      }
      return NextResponse.json({ success: true, message: `Session updated with ${action}` }, { status: 200 });
    } else {
      // If no session exists for today, we can create one with the action
      let insertData = { deviceId: deviceId };
      if (action === 'add_to_cart') insertData.addedToCart = true;
      if (action === 'initiate_checkout') insertData.initiatedCheckout = true;

      await db.insert(sessions).values(insertData);
      return NextResponse.json({ success: true, message: `Session created and tracked ${action}` }, { status: 201 });
    }
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}

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

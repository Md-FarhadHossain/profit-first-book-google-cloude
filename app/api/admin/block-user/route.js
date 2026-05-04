import { db } from '@/lib/db';
import { blockedUsers } from '@/lib/db/schema';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { identifier, note } = body;
    
    if (!identifier) {
      return NextResponse.json({ message: "Identifier is required" }, { status: 400 });
    }

    await db.insert(blockedUsers).values({
      identifier,
      note,
    });

    return NextResponse.json({ message: "User blocked successfully" });
  } catch (error) {
    console.error("Error blocking user:", error);
    // Check for unique constraint violation in sqlite (usually contains UNIQUE)
    if (error.message && error.message.includes('UNIQUE')) {
      return NextResponse.json({ message: "Identifier is already blocked" }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to block user" }, { status: 500 });
  }
}

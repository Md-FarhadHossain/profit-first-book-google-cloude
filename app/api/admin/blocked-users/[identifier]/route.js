import { db } from '@/lib/db';
import { blockedUsers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function DELETE(req, { params }) {
  try {
    const { identifier } = await params;
    const decodedIdentifier = decodeURIComponent(identifier);

    if (!decodedIdentifier) {
      return NextResponse.json({ message: "Identifier is required" }, { status: 400 });
    }

    await db.delete(blockedUsers).where(eq(blockedUsers.identifier, decodedIdentifier));

    return NextResponse.json({ message: "User unblocked successfully" });
  } catch (error) {
    console.error("Error unblocking user:", error);
    return NextResponse.json({ message: "Failed to unblock user" }, { status: 500 });
  }
}

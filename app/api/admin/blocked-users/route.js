import { db } from '@/lib/db';
import { blockedUsers } from '@/lib/db/schema';
import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await db.select().from(blockedUsers).orderBy(desc(blockedUsers.blockedAt));
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error getting blocked users:", error);
    return NextResponse.json({ message: "Failed to fetch blocked users" }, { status: 500 });
  }
}

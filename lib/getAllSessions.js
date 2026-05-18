"use server";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export default async function getAllSessions() {
  try {
    const allSessions = await db
      .select()
      .from(sessions)
      .orderBy(desc(sessions.date));

    return allSessions;
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
}

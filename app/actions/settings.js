'use server';

import { db } from '../../lib/db/index.js';
import { settings } from '../../lib/db/schema.js';
import { eq } from 'drizzle-orm';

export async function getSetting(key) {
  try {
    const records = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    if (records.length > 0) {
      return { success: true, value: records[0].value };
    }
    return { success: true, value: null }; // Not found but not an error
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return { success: false, message: 'Failed to retrieve setting.' };
  }
}

export async function setSetting(key, value) {
  if (!key || value === undefined) {
      return { success: false, message: 'Invalid key or value provided.' };
  }
  try {
    const existing = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    
    if (existing.length > 0) {
      await db.update(settings)
        .set({ value: value.toString() })
        .where(eq(settings.key, key));
    } else {
      await db.insert(settings).values({
        key,
        value: value.toString()
      });
    }
    return { success: true };
  } catch (error) {
    console.error(`Error saving setting ${key}:`, error);
    return { success: false, message: 'Failed to save setting.' };
  }
}

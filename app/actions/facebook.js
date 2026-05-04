'use server';

import { db } from '../../lib/db/index.js';
import { facebookCosts } from '../../lib/db/schema.js';
import { desc, eq } from 'drizzle-orm';

// Add a new Facebook Cost
export async function addFacebookCost(dollars, bdtRate) {
  try {
    const totalBdt = dollars * bdtRate;
    
    await db.insert(facebookCosts).values({
      dollars,
      bdtRate,
      totalBdt
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to add Facebook cost:', error);
    return { success: false, error: 'Could not add Facebook cost.' };
  }
}

// Fetch all Facebook Costs, ordered by most recent first
export async function getFacebookCosts() {
  try {
    const result = await db.select()
      .from(facebookCosts)
      .orderBy(desc(facebookCosts.id));
    return result;
  } catch (error) {
    console.error('Failed to get Facebook costs:', error);
    throw new Error('Could not fetch Facebook costs data.');
  }
}

// Optional: Delete a Facebook cost in case of a mistake
export async function deleteFacebookCost(id) {
  try {
    await db.delete(facebookCosts).where(eq(facebookCosts.id, id));
    return { success: true };
  } catch (error) {
    console.error('Failed to delete Facebook cost:', error);
    return { success: false, error: 'Could not delete Facebook cost.' };
  }
}

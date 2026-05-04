'use server';

import { db } from '../../lib/db/index.js';
import { expenses } from '../../lib/db/schema.js';
import { desc, eq } from 'drizzle-orm';

// Add a new expense
export async function addExpense(amount, category, customCategory = '', note = '') {
  try {
    await db.insert(expenses).values({
      amount,
      category,
      customCategory,
      note
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to add expense:', error);
    return { success: false, error: 'Could not add expense.' };
  }
}

// Fetch all expenses, ordered by most recent first
export async function getExpenses() {
  try {
    const result = await db.select()
      .from(expenses)
      .orderBy(desc(expenses.id)); // ordering by ID or date descending
    return result;
  } catch (error) {
    console.error('Failed to get expenses:', error);
    throw new Error('Could not fetch expenses data.');
  }
}

// Optional: Delete an expense in case of a mistake
export async function deleteExpense(id) {
  try {
    await db.delete(expenses).where(eq(expenses.id, id));
    return { success: true };
  } catch (error) {
    console.error('Failed to delete expense:', error);
    return { success: false, error: 'Could not delete expense.' };
  }
}

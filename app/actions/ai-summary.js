'use server';

import { db } from '@/lib/db/index.js';
import { settings } from '@/lib/db/schema.js';
import { eq } from 'drizzle-orm';
import getAllOrders from '@/lib/getAllorders';
import getAllSessions from '@/lib/getAllSessions';
import { getExpenses } from '@/app/actions/expenses';
import { isToday, isYesterday, isThisWeek, isThisMonth, subWeeks, subMonths, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const CACHE_KEY = 'ai_analytics_summary_v2';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function getAiSummary() {
  try {
    // 1. Check cache
    const existing = await db.select().from(settings).where(eq(settings.key, CACHE_KEY)).limit(1);
    
    if (existing.length > 0) {
      const updatedAtStr = existing[0].updatedAt; // e.g. "2023-10-01 12:00:00"
      
      // Handle the sqlite default string format (which might be "YYYY-MM-DD HH:MM:SS" or ISO)
      // We will parse it. If it doesn't end with 'Z', we append 'Z' for UTC if stored as UTC, 
      // but CURRENT_TIMESTAMP in SQLite is UTC by default.
      let updateTime = 0;
      if (updatedAtStr) {
         const cleanStr = updatedAtStr.includes('Z') ? updatedAtStr : updatedAtStr.replace(' ', 'T') + 'Z';
         updateTime = new Date(cleanStr).getTime();
      }

      if (Date.now() - updateTime < CACHE_DURATION_MS) {
        return { success: true, cached: true, summary: existing[0].value };
      }
    }

    // 2. Data is stale or doesn't exist, generate a new one
    // Fetch all data
    const [orders, sessions, expenses] = await Promise.all([
      getAllOrders(),
      getAllSessions(),
      getExpenses()
    ]);

    // Helpers to check dates
    const now = new Date();
    const lastWeekStart = startOfWeek(subWeeks(now, 1));
    const lastWeekEnd = endOfWeek(subWeeks(now, 1));
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // Aggregation objects
    const metrics = {
      today: { orders: 0, revenue: 0, expenses: 0, sessions: 0 },
      yesterday: { orders: 0, revenue: 0, expenses: 0, sessions: 0 },
      thisWeek: { orders: 0, revenue: 0, expenses: 0, sessions: 0 },
      lastWeek: { orders: 0, revenue: 0, expenses: 0, sessions: 0 },
      thisMonth: { orders: 0, revenue: 0, expenses: 0, sessions: 0 },
      lastMonth: { orders: 0, revenue: 0, expenses: 0, sessions: 0 },
    };

    // Process Orders
    orders.forEach(order => {
      const d = order.date ? new Date(order.date) : null;
      if (!d || isNaN(d.getTime())) return;
      
      const val = parseFloat(order.totalValue) || 0;
      // Exclude cancelled/returned if necessary, but we'll include all for raw metrics
      if (order.status === 'Returned' || order.status === 'Cancelled') return; 

      if (isToday(d)) { metrics.today.orders++; metrics.today.revenue += val; }
      if (isYesterday(d)) { metrics.yesterday.orders++; metrics.yesterday.revenue += val; }
      if (isThisWeek(d)) { metrics.thisWeek.orders++; metrics.thisWeek.revenue += val; }
      if (isWithinInterval(d, { start: lastWeekStart, end: lastWeekEnd })) { metrics.lastWeek.orders++; metrics.lastWeek.revenue += val; }
      if (isThisMonth(d)) { metrics.thisMonth.orders++; metrics.thisMonth.revenue += val; }
      if (isWithinInterval(d, { start: lastMonthStart, end: lastMonthEnd })) { metrics.lastMonth.orders++; metrics.lastMonth.revenue += val; }
    });

    // Process Sessions
    sessions.forEach(session => {
      const d = session.date ? new Date(session.date + (session.date.includes('Z') ? '' : 'Z')) : null;
      if (!d || isNaN(d.getTime())) return;

      if (isToday(d)) { metrics.today.sessions++; }
      if (isYesterday(d)) { metrics.yesterday.sessions++; }
      if (isThisWeek(d)) { metrics.thisWeek.sessions++; }
      if (isWithinInterval(d, { start: lastWeekStart, end: lastWeekEnd })) { metrics.lastWeek.sessions++; }
      if (isThisMonth(d)) { metrics.thisMonth.sessions++; }
      if (isWithinInterval(d, { start: lastMonthStart, end: lastMonthEnd })) { metrics.lastMonth.sessions++; }
    });

    // Process Expenses
    expenses.forEach(expense => {
      const d = expense.date ? new Date(expense.date + (expense.date.includes('Z') ? '' : 'Z')) : null;
      if (!d || isNaN(d.getTime())) return;
      const val = parseFloat(expense.amount) || 0;

      if (isToday(d)) { metrics.today.expenses += val; }
      if (isYesterday(d)) { metrics.yesterday.expenses += val; }
      if (isThisWeek(d)) { metrics.thisWeek.expenses += val; }
      if (isWithinInterval(d, { start: lastWeekStart, end: lastWeekEnd })) { metrics.lastWeek.expenses += val; }
      if (isThisMonth(d)) { metrics.thisMonth.expenses += val; }
      if (isWithinInterval(d, { start: lastMonthStart, end: lastMonthEnd })) { metrics.lastMonth.expenses += val; }
    });

    // Calculate Conversion Rates
    const calcConv = (o, s) => s > 0 ? ((o / s) * 100).toFixed(2) + '%' : '0%';
    
    const finalData = {
      today: { ...metrics.today, conversionRate: calcConv(metrics.today.orders, metrics.today.sessions) },
      yesterday: { ...metrics.yesterday, conversionRate: calcConv(metrics.yesterday.orders, metrics.yesterday.sessions) },
      thisWeek: { ...metrics.thisWeek, conversionRate: calcConv(metrics.thisWeek.orders, metrics.thisWeek.sessions) },
      lastWeek: { ...metrics.lastWeek, conversionRate: calcConv(metrics.lastWeek.orders, metrics.lastWeek.sessions) },
      thisMonth: { ...metrics.thisMonth, conversionRate: calcConv(metrics.thisMonth.orders, metrics.thisMonth.sessions) },
      lastMonth: { ...metrics.lastMonth, conversionRate: calcConv(metrics.lastMonth.orders, metrics.lastMonth.sessions) }
    };

    // 3. Prompt Groq
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      throw new Error("GROQ_API_KEY is not configured.");
    }

    const prompt = `You are an Executive Business Analyst, not a statistician.
Your job is to explain business performance exactly like a senior e-commerce consultant preparing a report for the CEO.

Rules:
1. Never compare incomplete time periods with completed ones. If today is still ongoing, state that it is in progress and estimate end-of-day performance if possible.
2. Do not simply repeat metrics. Explain what changed and why. Connect related metrics instead of listing them independently.
3. Prioritize insights over numbers. Focus on the 3-5 most important findings. Ignore insignificant changes.
4. Group information into:
   • Executive Summary (Under 200 words)
   • Key Insights
   • Positive Signals
   • Risks
   • Recommended Actions
   • Forecast (when possible)
5. Highlight anomalies automatically (sudden traffic drops, conversion spikes, unusual patterns).
6. Never assume missing data is good news.
7. Use natural business language. Explain relationships instead of saying "orders decreased".
8. Focus on actionable recommendations, not generic advice.
9. Mention only meaningful comparisons: Last 7 Days vs Previous 7 Days, Month-to-Date vs Same Period Last Month.
10. Use plain English suitable for a CEO. Avoid excessive percentages unless they add value.
11. Always explain the business impact of each major trend.
12. End with a one-sentence overall business assessment (Excellent / Healthy / Needs Attention / Critical) and briefly explain why.
13. Format the response as raw text, maybe with simple markdown like bolding or bullet points, but NO complex markdown or markdown code blocks (e.g., do not output \`\`\`markdown).

Data:
${JSON.stringify(finalData, null, 2)}
`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 1,
        max_completion_tokens: 2048,
        top_p: 1,
        reasoning_effort: 'medium'
      })
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      throw new Error(`Groq API Error: ${errText}`);
    }

    const data = await groqResponse.json();
    let aiSummary = data.choices[0].message.content;

    // 4. Save to DB
    // Since settings update needs 'updatedAt', but settings.js doesn't update it explicitly, we will update it by passing raw sql or updating the row.
    // Wait, in schema.js, `updatedAt: text('updated_at').default(sql\`(CURRENT_TIMESTAMP)\`)`
    // If we update the row, we should also update the `updatedAt` column because SQLite might not auto-update it on `UPDATE` unless there's a trigger.
    
    // So we will just delete the existing row and insert a new one to guarantee `updatedAt` is CURRENT_TIMESTAMP, or update it explicitly.
    const nowStr = new Date().toISOString().replace('T', ' ').replace('Z', ''); // SQLite format 'YYYY-MM-DD HH:MM:SS' roughly, or just use ISO string. We can use ISO.

    if (existing.length > 0) {
      await db.update(settings)
        .set({ value: aiSummary, updatedAt: nowStr })
        .where(eq(settings.key, CACHE_KEY));
    } else {
      await db.insert(settings).values({
        key: CACHE_KEY,
        value: aiSummary,
        updatedAt: nowStr
      });
    }

    return { success: true, cached: false, summary: aiSummary };

  } catch (error) {
    console.error('Error generating AI Summary:', error);
    return { success: false, message: error.message };
  }
}

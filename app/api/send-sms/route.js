import { NextResponse } from 'next/server';
import { sendConfirmationSMS } from '@/lib/smsProvider';

export async function POST(request) {
  try {
    const { name, phone, orderId, dbId } = await request.json();

    if (!name || !phone || !orderId) {
        return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const result = await sendConfirmationSMS(phone, name, orderId);

    // Update the order in the database with SMS status
    if (dbId) {
        try {
            const smsStatus = result ? "Sent" : "Failed";
            await fetch(`https://profit-first-server.vercel.app/orders/${dbId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ smsStatus: smsStatus })
            });
        } catch (dbError) {
            console.error("Failed to update DB with SMS status:", dbError);
            // We don't fail the request, just log it
        }
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("SMS API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

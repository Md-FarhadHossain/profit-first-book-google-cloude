import { NextResponse } from 'next/server';
import { syncActiveCouriers } from '@/app/actions/sync-courier';

export async function POST() {
  try {
    const result = await syncActiveCouriers();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Sync Courier API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error during courier sync.' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const shootId = searchParams.get('shootId');

    if (!shootId) {
        return NextResponse.json({ success: false, message: "Shoot ID is required" }, { status: 400 });
    }

    const apiKey = process.env.API_KEY;
    const baseUrl = process.env.DLR_API_URL;

    if (!apiKey || !baseUrl) {
        return NextResponse.json({ success: false, message: "Configuration error" }, { status: 500 });
    }

    try {
        // API URL : https://msg.mram.com.bd/miscapi/(API Key )/getDLR/(SMS SHOOT ID)
        // Note: The base URL in .env is https://msg.mram.com.bd/miscapi
        const url = `${baseUrl}/${apiKey}/getDLR/${shootId}`;
        
        const response = await axios.get(url);
        
        return NextResponse.json({ success: true, data: response.data });
    } catch (error: any) {
        console.error("Error checking DLR:", error.message);
        return NextResponse.json({ success: false, message: "Failed to check status", error: error.message }, { status: 500 });
    }
}

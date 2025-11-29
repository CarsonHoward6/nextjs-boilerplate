import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/test-db';

export async function GET() {
    const success = await testConnection();
    return NextResponse.json({ success });
}
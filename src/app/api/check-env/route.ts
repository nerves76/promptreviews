import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set (hidden)' : 'not set',
  };

  return NextResponse.json(envVars);
} 
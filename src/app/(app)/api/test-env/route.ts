/**
 * API Route: GET /api/test-env
 * Returns environment variable status for testing purposes
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  const missingVars = Object.entries(envVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  const allSet = missingVars.length === 0;

  return NextResponse.json({
    success: allSet,
    message: allSet ? 'All environment variables are set' : `Missing: ${missingVars.join(', ')}`,
    envVars: Object.fromEntries(
      Object.entries(envVars).map(([key, value]) => [
        key, 
        value ? (key.includes('SECRET') ? 'Set (hidden)' : 'Set') : 'Missing'
      ])
    ),
    missing: missingVars
  });
} 
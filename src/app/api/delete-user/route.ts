import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { user_id } = await req.json();

  if (!user_id) {
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
  }

  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const SUPABASE_PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_PROJECT_URL) {
    return NextResponse.json({ error: 'Missing server env vars' }, { status: 500 });
  }

  const res = await fetch(`${SUPABASE_PROJECT_URL}/auth/v1/admin/users/${user_id}`, {
    method: 'DELETE',
    headers: {
      apiKey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    return NextResponse.json({ error }, { status: res.status });
  }

  return NextResponse.json({ success: true });
} 
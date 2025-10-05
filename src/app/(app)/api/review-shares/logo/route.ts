import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get('bucket');
    const path = searchParams.get('path');

    if (!bucket || !path) {
      return new Response('Missing bucket or path', { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[Review Shares Logo] Missing Supabase configuration');
      return new Response('Storage not configured', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase.storage.from(bucket).download(path);

    if (error || !data) {
      console.error('[Review Shares Logo] Failed to download logo', error);
      return new Response('Logo not found', { status: 404 });
    }

    const arrayBuffer = await data.arrayBuffer();
    const contentType = data.type || 'image/png';

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, immutable',
      },
    });
  } catch (error) {
    console.error('[Review Shares Logo] Unexpected error', error);
    return new Response('Failed to fetch logo', { status: 500 });
  }
}

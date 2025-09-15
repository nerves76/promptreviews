import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { slugify } from '@/utils/slugify';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user: try Authorization bearer first, then cookie-based
    const supabaseAdmin = createServiceRoleClient();
    let userId: string | null = null;

    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data.user) {
        userId = data.user.id;
      }
    }

    if (!userId) {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) {
        userId = data.user.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Resolve account id, honoring X-Selected-Account header
    const accountId = await getRequestAccountId(request as unknown as Request, userId, supabaseAdmin);
    if (!accountId) {
      return NextResponse.json({ error: 'No account available' }, { status: 400 });
    }

    // Check for existing universal prompt page
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('prompt_pages')
      .select('*')
      .eq('account_id', accountId)
      .eq('is_universal', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingError) {
      return NextResponse.json({ error: 'Failed to query prompt pages', details: existingError.message }, { status: 500 });
    }

    if (existing && existing.length > 0) {
      return NextResponse.json({ success: true, page: existing[0] });
    }

    // Create universal prompt page if missing
    const universalSlug = slugify('universal', Date.now().toString(36));
    const insertPayload: any = {
      account_id: accountId,
      slug: universalSlug,
      is_universal: true,
      status: 'draft',
      type: 'universal',
      review_type: 'service',
      emoji_sentiment_enabled: false,
      review_platforms: [],
    };

    const { data: created, error: createError } = await supabaseAdmin
      .from('prompt_pages')
      .insert([insertPayload])
      .select('*')
      .single();

    if (createError) {
      return NextResponse.json({ error: 'Failed to create universal prompt page', details: createError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, page: created });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error?.message || String(error) }, { status: 500 });
  }
}


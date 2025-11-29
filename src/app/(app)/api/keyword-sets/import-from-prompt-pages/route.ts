"use server";

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { importPromptPageKeywords } from '@/features/keywords/promptPageKeywordImporter';
import { reprocessKeywordMatchesForAccount } from '@/features/keywords/reprocessKeywordMatches';

export async function POST(request: NextRequest) {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: () => {},
          remove: () => {}
        }
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const setName = typeof body?.name === 'string' ? body.name : undefined;

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const result = await importPromptPageKeywords(serviceSupabase, accountId, {
      setName,
      createdBy: user.id
    });

    if (result.created) {
      await reprocessKeywordMatchesForAccount(serviceSupabase, accountId);
    }

    return NextResponse.json(result, { status: result.created ? 200 : 400 });
  } catch (error: any) {
    console.error('❌ Prompt Page keyword import failed:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to import keywords' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { reprocessKeywordMatchesForAccount } from '@/features/keywords/reprocessKeywordMatches';

const normalizePhrase = (phrase: string) =>
  phrase
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

async function ensureLocations(
  serviceSupabase: ReturnType<typeof createClient>,
  accountId: string,
  locationIds: string[]
) {
  if (locationIds.length === 0) return [];

  const { data, error } = await serviceSupabase
    .from('google_business_locations')
    .select('id')
    .eq('account_id', accountId)
    .in('id', locationIds);

  if (error) {
    throw error;
  }

  if ((data || []).length !== locationIds.length) {
    throw new Error('One or more locations are invalid or unavailable.');
  }

  return data!.map((loc) => loc.id);
}

async function fetchKeywordSet(
  serviceSupabase: ReturnType<typeof createClient>,
  accountId: string,
  setId: string
) {
  const { data, error } = await serviceSupabase
    .from('keyword_sets')
    .select(`
      id,
      name,
      scope_type,
      scope_payload,
      created_at,
      keyword_set_terms (
        id,
        phrase,
        normalized_phrase
      ),
      keyword_set_locations (
        id,
        google_business_location_id,
        google_business_locations (
          id,
          location_name
        )
      )
    `)
    .eq('account_id', accountId)
    .eq('id', setId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json();
    const { name, scopeType = 'account', locationIds = [], terms = [] } = body || {};

    if (typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!Array.isArray(terms) || terms.length === 0) {
      return NextResponse.json({ error: 'At least one keyword is required' }, { status: 400 });
    }

    if (scopeType === 'selected' && (!Array.isArray(locationIds) || locationIds.length === 0)) {
      return NextResponse.json({ error: 'Select at least one location for this scope' }, { status: 400 });
    }

    const normalizedTerms = Array.from(
      new Map(
        terms
          .map((phrase: string) => ({
            phrase: typeof phrase === 'string' ? phrase.trim() : '',
            normalized: typeof phrase === 'string' ? normalizePhrase(phrase) : ''
          }))
          .filter((term) => term.phrase.length > 0 && term.normalized.length > 0)
          .map((term) => [term.normalized, term])
      ).values()
    );

    if (normalizedTerms.length === 0) {
      return NextResponse.json({ error: 'Provide valid keywords' }, { status: 400 });
    }

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const existing = await fetchKeywordSet(serviceSupabase, accountId, params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Keyword set not found' }, { status: 404 });
    }

    const verifiedLocationIds =
      scopeType === 'selected'
        ? await ensureLocations(serviceSupabase, accountId, locationIds)
        : [];

    const termRows = normalizedTerms.map((term) => ({
      keyword_set_id: params.id,
      phrase: term.phrase,
      normalized_phrase: term.normalized
    }));

    const locationRows =
      scopeType === 'selected' && verifiedLocationIds.length > 0
        ? verifiedLocationIds.map((locationId) => ({
            keyword_set_id: params.id,
            google_business_location_id: locationId
          }))
        : [];

    const { error: updateError } = await serviceSupabase
      .from('keyword_sets')
      .update({
        name: name.trim(),
        scope_type: scopeType,
        scope_payload: scopeType === 'selected' ? { locationIds: verifiedLocationIds } : {},
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('account_id', accountId);

    if (updateError) {
      // Check for unique constraint violation (duplicate name)
      if (updateError.code === '23505') {
        return NextResponse.json(
          { error: 'A keyword set with this name already exists. Please choose a different name.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: updateError.message || 'Failed to update keyword set' },
        { status: 500 }
      );
    }

    await serviceSupabase
      .from('keyword_set_terms')
      .delete()
      .eq('keyword_set_id', params.id);

    const { error: termError } = await serviceSupabase
      .from('keyword_set_terms')
      .insert(termRows);

    if (termError) {
      return NextResponse.json(
        { error: termError.message || 'Failed to save keywords' },
        { status: 500 }
      );
    }

    await serviceSupabase
      .from('keyword_set_locations')
      .delete()
      .eq('keyword_set_id', params.id);

    if (scopeType === 'selected' && locationRows.length > 0) {
      const { error: locationError } = await serviceSupabase
        .from('keyword_set_locations')
        .insert(locationRows);

      if (locationError) {
        return NextResponse.json(
          { error: locationError.message || 'Failed to save location scope' },
          { status: 500 }
        );
      }
    }

    await reprocessKeywordMatchesForAccount(serviceSupabase, accountId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Failed to update keyword set:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update keyword set' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: deleteError } = await serviceSupabase
      .from('keyword_sets')
      .delete()
      .eq('id', params.id)
      .eq('account_id', accountId);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete keyword set' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Failed to delete keyword set:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete keyword set' },
      { status: 500 }
    );
  }
}

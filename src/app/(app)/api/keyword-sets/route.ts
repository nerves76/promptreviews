import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { reprocessKeywordMatchesForAccount } from '@/features/keywords/reprocessKeywordMatches';

type SupabaseServiceClient = ReturnType<typeof createClient>;

const normalizePhrase = (phrase: string) =>
  phrase
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

const thirtyDaysAgo = () => {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString();
};

async function fetchKeywordSets(
  serviceSupabase: SupabaseServiceClient,
  accountId: string
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
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const { data: matches, error: matchError } = await serviceSupabase
    .from('review_keyword_matches')
    .select('keyword_set_id, keyword_term_id, google_location_name')
    .eq('account_id', accountId)
    .gte('matched_at', thirtyDaysAgo());

  if (matchError) {
    throw matchError;
  }

  const setMetrics = new Map<
    string,
    {
      total: number;
      locations: Map<string, number>;
      terms: Map<
        string,
        {
          count: number;
          locations: Map<string, number>;
        }
      >;
    }
  >();

  for (const match of matches || []) {
    const setId = match.keyword_set_id;
    const termId = match.keyword_term_id;
    const location = match.google_location_name || 'Unknown';
    if (!setId || !termId) continue;

    const setEntry =
      setMetrics.get(setId) ||
      {
        total: 0,
        locations: new Map<string, number>(),
        terms: new Map()
      };
    setEntry.total += 1;
    setEntry.locations.set(location, (setEntry.locations.get(location) || 0) + 1);

    const termEntry =
      setEntry.terms.get(termId) ||
      {
        count: 0,
        locations: new Map<string, number>()
      };
    termEntry.count += 1;
    termEntry.locations.set(location, (termEntry.locations.get(location) || 0) + 1);
    setEntry.terms.set(termId, termEntry);
    setMetrics.set(setId, setEntry);
  }

  return (data || []).map((set) => {
    const metrics = setMetrics.get(set.id) || {
      total: 0,
      locations: new Map<string, number>(),
      terms: new Map()
    };

    const topLocations = [...metrics.locations.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    return {
      id: set.id,
      name: set.name,
      scopeType: set.scope_type,
      scopePayload: set.scope_payload || {},
      createdAt: set.created_at,
      locations: (set.keyword_set_locations || []).map((loc: any) => ({
        id: loc.google_business_location_id,
        name: loc.google_business_locations?.location_name || 'Unnamed location'
      })),
      terms: (set.keyword_set_terms || []).map((term: any) => {
        const termMetrics = metrics.terms.get(term.id) || {
          count: 0,
          locations: new Map<string, number>()
        };

        const termTopLocations = [...termMetrics.locations.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name, count]) => ({ name, count }));

        return {
          id: term.id,
          phrase: term.phrase,
          normalized: term.normalized_phrase,
          mentionsLast30Days: termMetrics.count,
          topLocations: termTopLocations
        };
      }),
      stats: {
        mentionsLast30Days: metrics.total,
        topLocations
      }
    };
  });
}

async function ensureLocations(
  serviceSupabase: SupabaseServiceClient,
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

export async function GET(request: NextRequest) {
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

    const sets = await fetchKeywordSets(serviceSupabase, accountId);
    return NextResponse.json({ keywordSets: sets });
  } catch (error: any) {
    console.error('❌ Failed to fetch keyword sets:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch keyword sets' },
      { status: 500 }
    );
  }
}

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

    const verifiedLocationIds =
      scopeType === 'selected'
        ? await ensureLocations(serviceSupabase, accountId, locationIds)
        : [];

    const { data: newSet, error: setError } = await serviceSupabase
      .from('keyword_sets')
      .insert({
        account_id: accountId,
        name: name.trim(),
        scope_type: scopeType,
        scope_payload: scopeType === 'selected' ? { locationIds: verifiedLocationIds } : {},
        created_by: user.id
      })
      .select('id')
      .single();

    if (setError || !newSet) {
      // Check for unique constraint violation (duplicate name)
      if (setError?.code === '23505') {
        return NextResponse.json(
          { error: 'A keyword set with this name already exists. Please choose a different name.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: setError?.message || 'Failed to create keyword set' },
        { status: 500 }
      );
    }

    const termRows = normalizedTerms.map((term) => ({
      keyword_set_id: newSet.id,
      phrase: term.phrase,
      normalized_phrase: term.normalized
    }));

    const { error: termError } = await serviceSupabase
      .from('keyword_set_terms')
      .insert(termRows);

    if (termError) {
      return NextResponse.json(
        { error: termError.message || 'Failed to save keywords' },
        { status: 500 }
      );
    }

    if (scopeType === 'selected' && verifiedLocationIds.length > 0) {
      const locationRows = verifiedLocationIds.map((locationId) => ({
        keyword_set_id: newSet.id,
        google_business_location_id: locationId
      }));

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

    const sets = await fetchKeywordSets(serviceSupabase, accountId);
    const created = sets.find((set) => set.id === newSet.id);

    return NextResponse.json(
      {
        keywordSet: created,
        message: 'Keyword set created'
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Failed to create keyword set:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create keyword set' },
      { status: 500 }
    );
  }
}

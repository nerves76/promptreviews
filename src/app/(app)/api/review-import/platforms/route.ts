/**
 * GET /api/review-import/platforms
 *
 * Returns the list of supported import platforms with their search field configs.
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getSupportedPlatforms } from '@/features/review-import';
import type { ReviewPlatformId, SearchFieldConfig } from '@/features/review-import';

export async function GET() {
  try {
    // Verify authentication
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // GBP first, then DataForSEO platforms
    const dataForSeoPlatforms = getSupportedPlatforms();
    const platforms: { id: ReviewPlatformId; displayName: string; searchFields: SearchFieldConfig[] }[] = [
      {
        id: 'google_business_profile',
        displayName: 'Google Business Profile',
        searchFields: [],
      },
      ...dataForSeoPlatforms,
    ];

    return NextResponse.json({ platforms });
  } catch (error) {
    console.error('[review-import/platforms] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get supported platforms' },
      { status: 500 }
    );
  }
}

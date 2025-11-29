/**
 * API endpoint to import Google Business Profile reviews into the database
 * 
 * This endpoint:
 * 1. Fetches reviews from Google Business Profile API
 * 2. Creates contacts for reviewers if they don't exist
 * 3. Imports reviews into review_submissions table with imported flag
 * 4. Handles duplicates based on import type (all vs new)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';
import { GoogleReviewSyncService, ensureBusinessForAccount } from '@/features/google-reviews/reviewSyncService';
import { KeywordMatchService } from '@/features/keywords/keywordMatchService';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Import reviews request received');

    // Get request body
    const body = await request.json();
    const { locationId, importType } = body;

    console.log('📋 Import request params:', { locationId, importType });

    if (!locationId) {
      console.error('❌ No location ID provided');
      return NextResponse.json(
        { success: false, error: 'Location ID is required' },
        { status: 400 }
      );
    }

    if (!importType || !['all', 'new'].includes(importType)) {
      return NextResponse.json(
        { success: false, error: 'Import type must be "all" or "new"' },
        { status: 400 }
      );
    }

    // Create authenticated Supabase client with cookies
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: () => {}, // No-op for API route
          remove: () => {}, // No-op for API route
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's account ID
    const accountId = await getRequestAccountId(request, user.id, supabase);
    console.log('🔑 Account ID retrieved:', accountId);
    console.log('👤 User ID:', user.id);

    if (!accountId) {
      console.error('❌ No account ID found for user:', user.id);
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      );
    }

    // Create service role client for database operations (bypasses RLS)
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the account actually exists
    const { data: accountExists, error: accountCheckError } = await serviceSupabase
      .from('accounts')
      .select('id, created_by, business_name')
      .eq('id', accountId)
      .maybeSingle();

    if (accountCheckError) {
      console.error('❌ Error checking account existence:', {
        accountId,
        error: accountCheckError
      });
      Sentry.captureException(accountCheckError, {
        tags: { endpoint: 'import-reviews', issue: 'account-check-error' },
        extra: { accountId }
      });
      return NextResponse.json(
        { success: false, error: `Database error checking account: ${accountCheckError.message}` },
        { status: 500 }
      );
    }

    if (!accountExists) {
      console.error('❌ Account does not exist in database:', {
        accountId,
        userId: user.id,
        headerValue: request.headers.get('x-selected-account')
      });
      Sentry.captureMessage('Import attempted with non-existent account ID', {
        level: 'warning',
        tags: { endpoint: 'import-reviews', issue: 'invalid-account' },
        extra: { accountId, userId: user.id }
      });
      return NextResponse.json(
        {
          success: false,
          error: `Account not found. The account ID "${accountId}" does not exist in the database. Please try refreshing the page or contact support.`,
          details: process.env.NODE_ENV === 'development' ? {
            accountId,
            userId: user.id,
            headerSent: request.headers.get('x-selected-account')
          } : undefined
        },
        { status: 400 }
      );
    }

    console.log('✅ Account verified:', {
      id: accountExists.id,
      name: accountExists.business_name,
      createdBy: accountExists.created_by
    });

    // Get or create business record
    let businessId: string;
    try {
      const business = await ensureBusinessForAccount(serviceSupabase, accountId);
      businessId = business.id;
    } catch (businessError: any) {
      console.error('❌ Error ensuring business record:', businessError);
      return NextResponse.json(
        { success: false, error: `Failed to prepare business record: ${businessError?.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Imported reviews don't need to be associated with a prompt page
    // They were collected by Google, not through our system
    const defaultPromptPageId = null;

    // Get Google Business Profile access token from database
    const { data: platformData, error: platformError } = await serviceSupabase
      .from('google_business_profiles')
      .select('access_token, refresh_token, expires_at')
      .eq('account_id', accountId)
      .single();

    if (platformError || !platformData?.access_token) {
      console.error('❌ No Google Business Profile tokens found');
      return NextResponse.json(
        { success: false, error: 'Google Business Profile not connected' },
        { status: 400 }
      );
    }

    let locationRecord;
    try {
      locationRecord = await resolveAccountLocation(serviceSupabase, accountId, locationId);
    } catch (locationError: any) {
      console.error('❌ Error looking up Google Business location:', locationError);
      return NextResponse.json(
        { success: false, error: `Failed to look up Google Business location: ${locationError?.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    if (!locationRecord) {
      return NextResponse.json(
        { success: false, error: 'Google Business location not found for this account' },
        { status: 404 }
      );
    }

    const canonicalLocationId = locationRecord.location_id || locationId;

    // Use the GoogleBusinessProfileClient for proper API handling
    console.log('🔍 Creating Google Business Profile client');
    const client = new GoogleBusinessProfileClient({
      accessToken: platformData.access_token,
      refreshToken: platformData.refresh_token || undefined,
      expiresAt: platformData.expires_at ? new Date(platformData.expires_at).getTime() : undefined,
    });

    const keywordMatcher = new KeywordMatchService(serviceSupabase, accountId);

    console.log('🔧 Creating GoogleReviewSyncService with context:', {
      accountId,
      businessId,
      defaultPromptPageId,
      locationId: canonicalLocationId
    });

    const reviewSyncService = new GoogleReviewSyncService(
      serviceSupabase,
      client,
      {
        accountId,
        businessId,
        defaultPromptPageId,
      },
      keywordMatcher
    );

    const syncResult = await reviewSyncService.syncLocation({
      locationId: canonicalLocationId,
      locationName: locationRecord.location_name || undefined,
      googleBusinessLocationId: locationRecord.id,
      importType,
    });

    let message = '';
    if (syncResult.importedCount > 0 && syncResult.skippedCount > 0) {
      message = `Successfully imported ${syncResult.importedCount} new reviews (${syncResult.skippedCount} already existed)`;
    } else if (syncResult.importedCount > 0) {
      message = `Successfully imported ${syncResult.importedCount} new reviews`;
    } else if (syncResult.skippedCount > 0) {
      message = `All ${syncResult.skippedCount} reviews already exist in your database`;
    } else if (syncResult.errors.length > 0) {
      message = `Import failed with ${syncResult.errors.length} errors`;
    } else {
      message = 'No reviews found to import';
    }

    // Add verification info to message
    if (syncResult.verifiedCount > 0) {
      message += `. Auto-verified ${syncResult.verifiedCount} Prompt Page submission${syncResult.verifiedCount === 1 ? '' : 's'}`;
    }

    return NextResponse.json({
      success: syncResult.importedCount > 0 || syncResult.errors.length === 0,
      message,
      count: syncResult.importedCount,
      skipped: syncResult.skippedCount,
      verified: syncResult.verifiedCount,
      errors: syncResult.errors.length > 0 ? syncResult.errors.slice(0, 5) : undefined,
      totalErrorCount: syncResult.errors.length,
    });

  } catch (error: any) {
    console.error('❌ Import reviews error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      name: error.name
    });

    // Capture error in Sentry
    Sentry.captureException(error, {
      tags: {
        endpoint: 'import-reviews',
        feature: 'google-business-profile'
      },
      extra: {
        errorMessage: error.message,
        errorCode: error.code,
        errorName: error.name
      }
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to import reviews',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

type GoogleLocationRow = {
  id: string;
  location_id: string;
  location_name: string | null;
};

async function resolveAccountLocation(
  supabase: SupabaseClient<any, 'public', any>,
  accountId: string,
  requestedLocationId: string
): Promise<GoogleLocationRow | null> {
  const columns = 'id, location_id, location_name';

  const { data: directMatch, error: directError } = await supabase
    .from('google_business_locations')
    .select(columns)
    .eq('account_id', accountId)
    .eq('location_id', requestedLocationId)
    .maybeSingle();

  if (directError && directError.code !== 'PGRST116') {
    throw directError;
  }
  if (directMatch) {
    return directMatch;
  }

  const { data: fallbackMatch, error: fallbackError } = await supabase
    .from('google_business_locations')
    .select(columns)
    .eq('account_id', accountId)
    .eq('id', requestedLocationId)
    .maybeSingle();

  if (fallbackError && fallbackError.code !== 'PGRST116') {
    throw fallbackError;
  }

  return fallbackMatch ?? null;
}

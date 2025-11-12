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
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';
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
    const { data: existingBusiness, error: fetchError } = await serviceSupabase
      .from('businesses')
      .select('id')
      .eq('account_id', accountId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('❌ Error fetching business:', fetchError);
    }

    if (existingBusiness) {
      businessId = existingBusiness.id;
    } else {
      // Create a business record if it doesn't exist
      const { data: newBusiness, error: businessError } = await serviceSupabase
        .from('businesses')
        .insert({
          account_id: accountId,
          name: 'My Business', // Default name
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (businessError || !newBusiness) {
        console.error('❌ Error creating business:', businessError);
        console.error('Business data attempted:', {
          account_id: accountId,
          name: 'My Business'
        });
        return NextResponse.json(
          { success: false, error: `Failed to create business record: ${businessError?.message || 'Unknown error'}` },
          { status: 500 }
        );
      }
      businessId = newBusiness.id;
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

    // Use the GoogleBusinessProfileClient for proper API handling
    console.log('🔍 Creating Google Business Profile client');
    const client = new GoogleBusinessProfileClient({
      accessToken: platformData.access_token,
      refreshToken: platformData.refresh_token || undefined,
      expiresAt: platformData.expires_at ? new Date(platformData.expires_at).getTime() : undefined,
    });

    // Fetch reviews using the client
    console.log('🔍 Fetching reviews from Google API for location:', locationId);
    const googleReviews = await client.getReviews(locationId);

    console.log('✅ Reviews fetched from Google:', googleReviews.length);
    

    if (googleReviews.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No reviews found to import',
        count: 0
      });
    }

    // If import type is "new", check for existing reviews to avoid duplicates
    let existingReviewIds: string[] = [];
    if (importType === 'new') {
      const { data: existingReviews } = await serviceSupabase
        .from('review_submissions')
        .select('google_review_id')
        .eq('business_id', businessId)
        .not('google_review_id', 'is', null);
      
      existingReviewIds = (existingReviews || []).map(r => r.google_review_id).filter(Boolean);
    }

    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // Process each review
    for (const review of googleReviews) {
      try {
        // Skip if this is a "new" import and review already exists
        if (importType === 'new' && existingReviewIds.includes(review.reviewId)) {
          skippedCount++;
          continue;
        }

        const reviewerDisplayName = review.reviewer?.displayName || 'Anonymous';
        const reviewText = review.comment || '';
        
        // Convert Google's star rating format (e.g., "FIVE", "FOUR") to numbers
        const starRatingMap: { [key: string]: number } = {
          'FIVE': 5,
          'FOUR': 4,
          'THREE': 3,
          'TWO': 2,
          'ONE': 1
        };
        const starRating = typeof review.starRating === 'string' 
          ? (starRatingMap[review.starRating] || 0)
          : (review.starRating || 0);
        
        const createTime = review.createTime || new Date().toISOString();

        // Always create a new contact for Google reviews
        // Google only provides display names like "John S." which are impossible to match reliably
        let contactId: string | null = null;
        
        // Log the first contact creation attempt for debugging
        if (importedCount === 0 && errors.length === 0) {
          console.log('🔍 First contact creation attempt:', {
            accountId,
            reviewerDisplayName,
            accountIdType: typeof accountId,
            accountIdLength: accountId?.length
          });
        }

        const { data: newContact, error: contactError } = await serviceSupabase
          .from('contacts')
          .insert({
            account_id: accountId, // Use proper account ID from request context
            first_name: `Google User`, // Generic first name for system contact
            last_name: '',
            google_reviewer_name: reviewerDisplayName, // Store actual Google display name here
            email: '', // Google doesn't provide email
            phone: '', // Google doesn't provide phone
            notes: `Contact created from Google Business Profile review import. Original reviewer name: "${reviewerDisplayName}"`,
            created_at: new Date().toISOString(),
            imported_from_google: true
          })
          .select('id')
          .single();

        if (contactError) {
          console.error('❌ Error creating contact:', contactError);
          console.error('Contact data attempted:', {
            account_id: accountId,
            first_name: 'Google User',
            google_reviewer_name: reviewerDisplayName,
            errorCode: contactError.code,
            errorDetails: contactError.details
          });

          // Log first error with more detail
          if (errors.length === 0) {
            console.error('❌ First contact error - full details:', {
              error: contactError,
              accountId,
              constraint: contactError.message
            });
          }

          errors.push(`Failed to create contact for ${reviewerDisplayName}: ${contactError.message}`);
          continue;
        }

        contactId = newContact.id;

        // Convert star rating to sentiment
        let sentiment = 'positive';
        if (starRating <= 2) {
          sentiment = 'negative';
        } else if (starRating === 3) {
          sentiment = 'neutral';
        }

        // Import review into review_submissions table
        const { error: reviewError } = await serviceSupabase
          .from('review_submissions')
          .insert({
            prompt_page_id: defaultPromptPageId, // Use the default prompt page for imports
            business_id: businessId, // Use the business ID, not account ID
            contact_id: contactId,
            first_name: reviewerDisplayName,
            last_name: '',
            reviewer_name: reviewerDisplayName, // Required field
            review_content: reviewText,
            platform: 'Google Business Profile',
            star_rating: starRating,
            emoji_sentiment_selection: sentiment,
            review_type: 'review',
            created_at: createTime,
            google_review_id: review.reviewId,
            imported_from_google: true,
            verified: true, // Auto-verify Google imported reviews
            verified_at: createTime, // Set verification time to review creation time
            status: 'submitted'
          });

        if (reviewError) {
          // Check if it's a duplicate error
          if (reviewError.code === '23505' && reviewError.message.includes('idx_review_submissions_google_review_id_unique')) {
            skippedCount++;
          } else {
            console.error('❌ Error importing review:', reviewError);
            console.error('Review data attempted:', {
              business_id: businessId,
              contact_id: contactId,
              star_rating: starRating,
              google_review_id: review.reviewId,
              platform: 'Google Business Profile'
            });
            errors.push(`Failed to import review from ${reviewerDisplayName}: ${reviewError.message}`);
          }
          continue;
        }

        importedCount++;
        
      } catch (error) {
        console.error('❌ Error processing review:', error);
        errors.push(`Error processing review: ${error}`);
      }
    }


    let message = '';
    if (importedCount > 0 && skippedCount > 0) {
      message = `Successfully imported ${importedCount} new reviews (${skippedCount} already existed)`;
    } else if (importedCount > 0) {
      message = `Successfully imported ${importedCount} new reviews`;
    } else if (skippedCount > 0) {
      message = `All ${skippedCount} reviews already exist in your database`;
    } else if (errors.length > 0) {
      message = `Import failed with ${errors.length} errors`;
    } else {
      message = 'No reviews found to import';
    }

    return NextResponse.json({
      success: errors.length === 0 || importedCount > 0,
      message,
      count: importedCount,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined, // Return first 5 errors for debugging
      totalErrorCount: errors.length
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

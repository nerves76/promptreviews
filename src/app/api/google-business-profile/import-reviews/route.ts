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
import { getAccountIdForUser } from '@/utils/accountUtils';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Import Reviews API called');

    // Get request body
    const body = await request.json();
    const { locationId, importType } = body;

    if (!locationId) {
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
    const accountId = await getAccountIdForUser(user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      );
    }

    console.log('📍 Importing reviews for location:', locationId, 'Import type:', importType);
    console.log('👤 User ID:', user.id, 'Account ID:', accountId);

    // Create service role client for database operations (bypasses RLS)
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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
      console.log('📦 Found existing business ID:', businessId);
    } else {
      // Create a business record if it doesn't exist
      console.log('🆕 Creating new business for account:', accountId);
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
      console.log('📦 Created new business ID:', businessId);
    }

    // Get or create a default prompt page for imported reviews
    let defaultPromptPageId: string | null = null;
    const { data: existingPromptPage } = await serviceSupabase
      .from('prompt_pages')
      .select('id')
      .eq('account_id', user.id)
      .eq('slug', 'google-imports')
      .single();

    if (existingPromptPage) {
      defaultPromptPageId = existingPromptPage.id;
    } else {
      // Create a default prompt page for imports
      const { data: newPromptPage, error: promptPageError } = await serviceSupabase
        .from('prompt_pages')
        .insert({
          account_id: user.id,
          slug: 'google-imports',
          status: 'draft', // Keep it as a draft
          is_universal: false,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (!promptPageError && newPromptPage) {
        defaultPromptPageId = newPromptPage.id;
        console.log('✅ Created default prompt page for imports:', defaultPromptPageId);
      } else {
        console.error('⚠️ Could not create default prompt page:', promptPageError);
        // If we can't create a prompt page, we can't import reviews
        return NextResponse.json(
          { 
            success: false, 
            error: `Failed to create import prompt page: ${promptPageError?.message || 'Unknown error'}` 
          },
          { status: 500 }
        );
      }
    }
    
    // Ensure we have a prompt page ID
    if (!defaultPromptPageId) {
      return NextResponse.json(
        { success: false, error: 'Failed to get or create prompt page for imports' },
        { status: 500 }
      );
    }

    // Get Google Business Profile access token from database
    const { data: platformData, error: platformError } = await supabase
      .from('google_business_profiles')
      .select('access_token, refresh_token')
      .eq('user_id', user.id)
      .single();

    if (platformError || !platformData?.access_token) {
      return NextResponse.json(
        { success: false, error: 'Google Business Profile not connected' },
        { status: 400 }
      );
    }

    // First get account ID - Google API requires account/location format
    const accountsResponse = await fetch(
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
      {
        headers: {
          'Authorization': `Bearer ${platformData.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text();
      console.error('❌ Failed to get accounts:', accountsResponse.status, errorText);
      return NextResponse.json(
        { success: false, error: `Failed to get Google Business accounts: ${accountsResponse.status}` },
        { status: 500 }
      );
    }

    const accountsData = await accountsResponse.json();
    const accounts = accountsData.accounts || [];
    
    if (accounts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No Google Business accounts found' },
        { status: 404 }
      );
    }

    // Use first account and clean location ID format
    const googleAccountId = accounts[0].name.replace('accounts/', '');
    const cleanLocationId = locationId.replace('locations/', '');

    // Fetch reviews using correct v4 API endpoint format
    const reviewsResponse = await fetch(
      `https://mybusiness.googleapis.com/v4/accounts/${googleAccountId}/locations/${cleanLocationId}/reviews`,
      {
        headers: {
          'Authorization': `Bearer ${platformData.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!reviewsResponse.ok) {
      const errorText = await reviewsResponse.text();
      console.error('❌ Google API Error:', reviewsResponse.status, errorText);
      return NextResponse.json(
        { success: false, error: `Failed to fetch reviews from Google: ${reviewsResponse.status}` },
        { status: 500 }
      );
    }

    const reviewsData = await reviewsResponse.json();
    const googleReviews = reviewsData.reviews || [];
    
    console.log(`📊 Found ${googleReviews.length} reviews from Google`);

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
      console.log(`🔍 Found ${existingReviewIds.length} existing reviews in database`);
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
        
        const { data: newContact, error: contactError } = await serviceSupabase
          .from('contacts')
          .insert({
            account_id: user.id, // Use auth user ID, not the business account ID
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
            account_id: user.id,
            first_name: 'Google User',
            google_reviewer_name: reviewerDisplayName
          });
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
            console.log(`⏩ Review already exists for ${reviewerDisplayName}, skipping`);
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

    console.log(`✅ Import completed: ${importedCount} new, ${skippedCount} already existed`);

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
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to import reviews'
      },
      { status: 500 }
    );
  }
}
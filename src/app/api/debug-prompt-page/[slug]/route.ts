/**
 * Debug API Route for Prompt Page Issues
 * 
 * This endpoint provides detailed debugging information about a prompt page
 * and its associated business data to help diagnose "business profile not found" errors
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from '@/utils/supabaseClient';

const supabaseAdmin = createServiceRoleClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }

    console.log(`[DEBUG-PROMPT-PAGE] Analyzing slug: ${slug}`);

    // Step 1: Get the prompt page
    const { data: promptPage, error: promptError } = await supabaseAdmin
      .from('prompt_pages')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    const debugInfo = {
      slug,
      promptPage: {
        found: !!promptPage,
        error: promptError,
        data: promptPage
      },
      businesses: {
        found: false,
        error: null,
        data: null
      },
      businessLocations: {
        found: false,
        error: null,
        data: null
      },
      accounts: {
        found: false,
        error: null,
        data: null
      }
    };

    if (promptError) {
      console.error('[DEBUG-PROMPT-PAGE] Error fetching prompt page:', promptError);
      return NextResponse.json({ debugInfo }, { status: 200 });
    }

    if (!promptPage) {
      console.log(`[DEBUG-PROMPT-PAGE] No prompt page found for slug: ${slug}`);
      return NextResponse.json({ debugInfo }, { status: 200 });
    }

    // Step 2: Check if account exists
    const { data: accountData, error: accountError } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('id', promptPage.account_id)
      .maybeSingle();

    debugInfo.accounts = {
      found: !!accountData,
      error: null,
      data: accountData
    };

    // Step 3: Try to find business in businesses table
    const { data: businessData, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('account_id', promptPage.account_id)
      .maybeSingle();

    debugInfo.businesses = {
      found: !!businessData,
      error: null,
      data: businessData
    };

    // Step 4: Try to find business in business_locations table
    const { data: locationData, error: locationError } = await supabaseAdmin
      .from('business_locations')
      .select('*')
      .eq('account_id', promptPage.account_id)
      .eq('is_active', true)
      .maybeSingle();

    debugInfo.businessLocations = {
      found: !!locationData,
      error: null,
      data: locationData
    };

    // Step 5: Summary
    const summary = {
      promptPageExists: !!promptPage,
      accountExists: !!accountData,
      businessExists: !!businessData,
      locationExists: !!locationData,
      wouldApiWork: !!(promptPage && (businessData || locationData)),
      issue: !promptPage ? 'Prompt page not found' :
             !accountData ? 'Account not found' :
             !businessData && !locationData ? 'No business profile found in either table' :
             'Should work'
    };

    return NextResponse.json({
      summary,
      debugInfo
    });

  } catch (error) {
    console.error('[DEBUG-PROMPT-PAGE] Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    );
  }
} 
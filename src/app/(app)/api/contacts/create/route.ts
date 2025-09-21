import { NextRequest, NextResponse } from 'next/server';
import { getSessionOrMock, createClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { checkAccountLimits } from '@/utils/accountLimits';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const supabaseAdmin = createServiceRoleClient();
    
    // Get authenticated user - try both cookie and header auth
    let user = null;
    let userError = null;

    // Debug: Log all headers

    // First try cookie-based auth
    const cookieResult = await getSessionOrMock(supabase);
    if (!cookieResult.error && cookieResult.data?.session?.user) {
      user = cookieResult.data.session.user;
    } else {
      // If cookie auth fails, try Authorization header
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const headerResult = await supabaseAdmin.auth.getUser(token);
        if (!headerResult.error && headerResult.data.user) {
          user = headerResult.data.user;
        } else {
          userError = headerResult.error;
        }
      } else {
        userError = cookieResult.error;
      }
    }
    
    if (!user) {
      console.error('🔒 Contacts API - Authentication failed:', {
        cookieError: cookieResult.error instanceof Error ? cookieResult.error.message : 'No cookie session',
        headerError: userError instanceof Error ? userError.message : 'No valid token',
        hasAuthHeader: !!request.headers.get('authorization')
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const contactData = await request.json();

    // Get the proper account ID using the header and validate access
    const accountId = await getRequestAccountId(request, user.id);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found or access denied' }, { status: 403 });
    }

    // Validate account_id from request body matches the selected account
    if (contactData.account_id && contactData.account_id !== accountId) {
      return NextResponse.json({ error: 'Account ID mismatch' }, { status: 403 });
    }

    // Check account limits for contact creation
    const limitCheck = await checkAccountLimits(supabaseAdmin, accountId, 'contact');
    if (!limitCheck.allowed) {
      console.error('❌ Contacts API - Limit check failed:', limitCheck);
      return NextResponse.json({ 
        error: limitCheck.reason || 'Contact creation not allowed for your account plan',
        upgrade_required: true
      }, { status: 403 });
    }
    
    // Extract reviews from the request (if any)
    const reviews = contactData.reviews || [];
    
    // Validate required fields
    if (!contactData.first_name || contactData.first_name.trim() === '') {
      return NextResponse.json({ error: 'First name is required' }, { status: 400 });
    }

    // Validate reviews (if any)
    if (reviews.length > 15) {
      return NextResponse.json({ error: 'Maximum 15 reviews allowed per contact' }, { status: 400 });
    }

    for (const review of reviews) {
      if (!review.review_content?.trim() || !review.platform) {
        return NextResponse.json({ error: 'Review content and platform are required for all reviews' }, { status: 400 });
      }
    }

    // Prepare contact for insertion
    const contact = {
      account_id: accountId,
      first_name: contactData.first_name?.trim(),
      last_name: contactData.last_name?.trim() || null,
      email: contactData.email?.trim() || null,
      phone: contactData.phone?.trim() || null,
      business_name: contactData.business_name?.trim() || null,
      role: contactData.role?.trim() || null,
      address_line1: contactData.address_line1?.trim() || null,
      address_line2: contactData.address_line2?.trim() || null,
      city: contactData.city?.trim() || null,
      state: contactData.state?.trim() || null,
      postal_code: contactData.postal_code?.trim() || null,
      country: contactData.country?.trim() || null,
      category: contactData.category?.trim() || null,
      notes: contactData.notes?.trim() || null,
      status: "in_queue",
    };

    // Insert contact into the database using service role client to bypass RLS
    const { data: insertedContact, error: insertError } = await supabaseAdmin
      .from("contacts")
      .insert(contact)
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting contact:", insertError);
      return NextResponse.json(
        {
          error: "Failed to create contact",
          details: insertError.message || "Database error while creating contact",
        },
        { status: 500 }
      );
    }

    // Create reviews if any were provided
    if (reviews.length > 0) {
      
      const reviewSubmissions = reviews.map((review: any) => ({
        prompt_page_id: null, // No prompt page association for manual reviews
        contact_id: insertedContact.id, // Link to the created contact
        platform: review.platform,
        review_content: review.review_content.trim(),
        first_name: review.reviewer_first_name?.trim() || null,
        last_name: review.reviewer_last_name?.trim() || null,
        reviewer_role: review.reviewer_role?.trim() || null,
        star_rating: review.star_rating || null,
        created_at: review.date_posted || new Date().toISOString(),
        status: "submitted",
        verified: true, // Manual reviews are verified by default
        emoji_sentiment_selection: null, // Not applicable for manual reviews
      }));

      const { error: reviewInsertError } = await supabaseAdmin
        .from("review_submissions")
        .insert(reviewSubmissions);

      if (reviewInsertError) {
        console.error("Error inserting reviews:", reviewInsertError);
        // Note: We don't fail the entire request if review creation fails
        // The contact was created successfully, so we return success
        // but log the review creation error
      } else {
      }
    }

    return NextResponse.json({
      success: true,
      contact: insertedContact,
      reviewsCreated: reviews.length,
      message: "Contact created successfully"
    });

  } catch (error) {
    console.error('Create contact error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
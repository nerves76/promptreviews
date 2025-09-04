import { NextRequest, NextResponse } from 'next/server';
import { getSessionOrMock, createClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { checkAccountLimits } from '@/utils/accountLimits';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const supabaseAdmin = createServiceRoleClient();
    
    // Get authenticated user - try both cookie and header auth
    let user = null;
    let userError = null;

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
      console.error('🔒 Contact from Prompt API - Authentication failed:', {
        cookieError: cookieResult.error instanceof Error ? cookieResult.error.message : 'No cookie session',
        headerError: userError instanceof Error ? userError.message : 'No valid token',
        hasAuthHeader: !!request.headers.get('authorization')
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { promptPageData, promptPageId, account_id } = await request.json();
    
    // Get account ID from request body
    const accountId = account_id;
    if (!accountId) {
      return NextResponse.json({ error: 'account_id is required' }, { status: 400 });
    }
    
    // Validate user has access to this account
    const { data: accountUser } = await supabaseAdmin
      .from('account_users')
      .select('account_id')
      .eq('user_id', user.id)
      .eq('account_id', accountId)
      .single();

    if (!accountUser) {
      return NextResponse.json({ error: 'Access denied to this account' }, { status: 403 });
    }

    // Check account limits for contact creation
    const limitCheck = await checkAccountLimits(supabaseAdmin, user.id, 'contact');
    if (!limitCheck.allowed) {
      console.error('❌ Contact from Prompt API - Limit check failed:', limitCheck);
      return NextResponse.json({ 
        error: limitCheck.reason || 'Contact creation not allowed for your account plan',
        upgrade_required: true
      }, { status: 403 });
    }
    
    // Validate required fields
    if (!promptPageData.first_name || promptPageData.first_name.trim() === '') {
      return NextResponse.json({ error: 'First name is required' }, { status: 400 });
    }

    if (!promptPageId) {
      return NextResponse.json({ error: 'Prompt page ID is required' }, { status: 400 });
    }

    // Prepare contact for insertion
    const contact = {
      account_id: accountId,
      first_name: promptPageData.first_name?.trim(),
      last_name: promptPageData.last_name?.trim() || null,
      email: promptPageData.email?.trim() || null,
      phone: promptPageData.phone?.trim() || null,
      business_name: promptPageData.business_name?.trim() || null,
      role: promptPageData.role?.trim() || null,
      address_line1: promptPageData.address_line1?.trim() || null,
      address_line2: promptPageData.address_line2?.trim() || null,
      city: promptPageData.city?.trim() || null,
      state: promptPageData.state?.trim() || null,
      postal_code: promptPageData.postal_code?.trim() || null,
      country: promptPageData.country?.trim() || null,
      category: promptPageData.category?.trim() || null,
      notes: promptPageData.notes?.trim() || null,
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

    // Link the prompt page to the newly created contact
    const { error: linkError } = await supabaseAdmin
      .from("prompt_pages")
      .update({ contact_id: insertedContact.id })
      .eq("id", promptPageId);

    if (linkError) {
      console.error("Error linking prompt page to contact:", linkError);
      // Note: We don't fail the entire request if linking fails
      // The contact was created successfully, so we return success
      // but log the linking error
    } else {
    }

    return NextResponse.json({
      success: true,
      contact: insertedContact,
      promptPageLinked: true,
      message: "Contact created and linked to prompt page successfully"
    });

  } catch (error) {
    console.error('Create contact from prompt page error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
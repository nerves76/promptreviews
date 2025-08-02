import { NextRequest, NextResponse } from 'next/server';
import { getSessionOrMock, createClient } from '@/utils/supabaseClient';
import { getAccountIdForUser } from '@/utils/accountUtils';
import { checkAccountLimits } from '@/utils/accountLimits';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get authenticated user
    const { data: { session }, error: sessionError } = await getSessionOrMock(supabase);
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the correct account ID for this user
    const accountId = await getAccountIdForUser(session.user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No account found' }, { status: 404 });
    }

    // Check account limits for contact creation
    const limitCheck = await checkAccountLimits(supabase, session.user.id, 'contact');
    if (!limitCheck.allowed) {
      return NextResponse.json({ 
        error: limitCheck.reason || 'Contact creation not allowed for your account plan',
        upgrade_required: true
      }, { status: 403 });
    }

    // Parse request body
    const contactData = await request.json();
    
    // Validate required fields
    if (!contactData.first_name || contactData.first_name.trim() === '') {
      return NextResponse.json({ error: 'First name is required' }, { status: 400 });
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

    // Insert contact into the database
    const { data: insertedContact, error: insertError } = await supabase
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

    return NextResponse.json({
      success: true,
      contact: insertedContact,
      message: "Contact created successfully"
    });

  } catch (error) {
    console.error('Create contact error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
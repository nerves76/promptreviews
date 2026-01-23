import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createClient } from "@supabase/supabase-js";
import { slugify } from "@/utils/slugify";
import { getRequestAccountId } from "@/app/(app)/api/utils/getRequestAccountId";
import { preparePromptPageData, validatePromptPageData } from "@/utils/promptPageDataMapping";

// Initialize Supabase client with service key for privileged operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 🔒 SECURITY: Validate authentication before processing
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get account ID for authenticated user
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account not found. Please ensure you have completed the signup process.' },
        { status: 404 }
      );
    }

    // Fetch business name for slug generation
    const { data: business } = await supabase
      .from('businesses')
      .select('name, business_name')
      .eq('account_id', accountId)
      .maybeSingle();

    const businessName = business?.name || business?.business_name || 'business';

    // Generate a unique slug from client_name or title
    let slug;
    if (body.review_type === 'review_builder') {
      // For review builders, use business name with random suffix
      slug = slugify(businessName, nanoid(8));
    } else if (body.client_name) {
      slug = slugify(body.client_name, Date.now().toString(36));
    } else if (body.title) {
      slug = slugify(body.title, Date.now().toString(36));
    } else {
      slug = nanoid(8);
    }

    // Prepare form data with account ID and slug
    const formDataWithMeta = {
      ...body,
      account_id: accountId, // 🔒 SECURITY: Use authenticated user's account ID
      slug,
      // Map legacy field names to new structure
      name: body.client_name || body.name,
      features_or_benefits: Array.isArray(body.services_offered)
        ? body.services_offered
        : typeof body.services_offered === "string"
          ? [body.services_offered]
          : body.features_or_benefits || [],
      product_description: body.outcomes || body.product_description,
      review_platforms: body.review_platform_links || body.review_platforms
    };

    // Use centralized data mapping utility
    const insertData = preparePromptPageData(formDataWithMeta);

    // Validate the prepared data
    const validation = validatePromptPageData(insertData);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.errors
        },
        { status: 400 }
      );
    }

    // For individual campaigns, ensure contact_id is properly linked
    let contactId: string | null = null;

    // First, check if contact_id was already provided and is valid (not empty string)
    if (insertData.contact_id && typeof insertData.contact_id === 'string' && insertData.contact_id.trim()) {
      // Verify the contact exists and belongs to this account
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('id', insertData.contact_id)
        .eq('account_id', accountId)
        .maybeSingle();

      if (existingContact) {
        contactId = existingContact.id;
      }
    }

    // If no valid contact_id yet, try to find/create contact from contact info
    if (!contactId && insertData.campaign_type === 'individual' && (insertData.first_name || insertData.email || insertData.phone)) {
      // Check if contact already exists with same email or phone
      let existingContact = null;

      if (insertData.email) {
        const { data: emailMatch } = await supabase
          .from('contacts')
          .select('id')
          .eq('account_id', accountId)
          .eq('email', insertData.email)
          .maybeSingle();
        existingContact = emailMatch;
      }

      if (!existingContact && insertData.phone) {
        const { data: phoneMatch } = await supabase
          .from('contacts')
          .select('id')
          .eq('account_id', accountId)
          .eq('phone', insertData.phone)
          .maybeSingle();
        existingContact = phoneMatch;
      }

      if (existingContact) {
        // Use existing contact
        contactId = existingContact.id;
      } else {
        // Create new contact
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            account_id: accountId,
            first_name: insertData.first_name || '',
            last_name: insertData.last_name || '',
            email: insertData.email || null,
            phone: insertData.phone || null,
          })
          .select('id')
          .single();

        if (contactError) {
          console.error('Error creating contact:', contactError);
          // Continue without contact - don't block prompt page creation
        } else {
          contactId = newContact.id;
        }
      }
    }

    // Prepare final insert data - always set contact_id (null if no contact, valid ID if found/created)
    // This ensures empty strings don't get inserted
    const finalInsertData = {
      ...insertData,
      contact_id: contactId || null // Explicitly set to null if no valid contact
    };

    const { data, error } = await supabase
      .from("prompt_pages")
      .insert([finalInsertData])
      .select()
      .single();

    if (error) {
      console.error("Error creating prompt page:", error);
      return NextResponse.json(
        { error: "Failed to create prompt page" },
        { status: 500 },
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error in POST /api/prompt-pages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

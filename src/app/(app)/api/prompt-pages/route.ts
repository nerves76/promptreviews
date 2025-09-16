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

    // Generate a unique slug from client_name or title
    let slug;
    if (body.client_name) {
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
    const { data, error } = await supabase
      .from("prompt_pages")
      .insert([insertData])
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

import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/auth/providers/supabase";
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import OpenAI from "openai";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is missing from environment variables." },
      { status: 500 },
    );
  }

  try {
    // Create Supabase client for auth verification using proper SSR patterns
    const supabase = await createServerSupabaseClient();
    
    // Get the authenticated user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('Generate reviews API: Authentication failed', { error: authError?.message });
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
    
    const { pageId, platforms } = await request.json();

    if (!pageId || !platforms || !Array.isArray(platforms)) {
      return NextResponse.json(
        { error: "pageId and platforms array are required" },
        { status: 400 },
      );
    }

    // Get user's account ID for security verification
    const userAccountId = await getRequestAccountId(request, user.id, supabase);
    if (!userAccountId) {
      return NextResponse.json(
        { error: "No account found for user" },
        { status: 400 }
      );
    }

    // Fetch the prompt page data with account verification
    const { data: page, error: pageError } = await supabase
      .from("prompt_pages")
      .select("*")
      .eq("id", pageId)
      .eq("account_id", userAccountId) // Security: Only access pages owned by user's account
      .single();

    if (pageError || !page) {
      console.error('Generate reviews API: Access denied or page not found', {
        pageId,
        userAccountId,
        error: pageError?.message,
      });
      return NextResponse.json(
        { error: "Prompt page not found or access denied" },
        { status: 404 },
      );
    }

    // Generate reviews for each platform
    const reviews = await Promise.all(
      platforms.map(async (platform: string) => {
        const prompt = `You are writing a positive customer review from the perspective of a satisfied client. This review will be posted on ${platform}, so keep the tone and length appropriate for that platform.\n\nUse this tone of voice: ${page.tone_of_voice}\n\nBelow is information about the business being reviewed:\n- Client Name: ${page.client_name}\n- Location: ${page.location}\n- Project Type: ${page.project_type}\n- Services Offered: ${(page.features_or_benefits || "").split("\n").join(", ")}\n- Product Description: ${page.product_description}\n- Date Completed: ${page.date_completed}\n- Team Member: ${page.team_member || "Not specified"}\n\nWrite the review as if the customer/client is speaking. Make it sound authentic and natural. Do not mention that it was generated. Do not include the business name in every sentence. Focus on how the client felt and what they appreciated most. Keep it concise.`;

        const completion = await openai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "gpt-4",
          temperature: 0.7,
          max_tokens: 250,
        });

        return {
          platform,
          text: completion.choices[0].message.content || "",
        };
      }),
    );

    // Log token usage for analytics
    try {
      const serviceSupabase = createServiceRoleClient();
      await serviceSupabase.from("ai_usage").insert({
        user_id: user.id,
        feature: 'bulk_review_generation',
        input_data: { 
          pageId,
          platforms: platforms,
          reviewCount: reviews.length
        },
        created_at: new Date().toISOString(),
      });
    } catch (loggingError) {
      // Don't fail the request if logging fails
      console.error('Failed to log AI usage:', loggingError);
    }

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Error in POST /api/generate-reviews:", error);
    return NextResponse.json(
      { error: "Failed to generate reviews" },
      { status: 500 },
    );
  }
}

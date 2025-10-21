import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerSupabaseClient, createServiceRoleClient } from "@/auth/providers/supabase";

export const dynamic = "force-dynamic";

// Monthly limit per account for keyword generation
const MONTHLY_KEYWORD_GENERATION_LIMIT = 10;

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is missing from environment variables." },
      { status: 500 },
    );
  }

  try {
    // Create Supabase client for auth verification
    const supabase = await createServerSupabaseClient();
    const serviceSupabase = createServiceRoleClient();

    // Get the authenticated user from the session (required)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in to generate keywords" },
        { status: 401 },
      );
    }

    const {
      businessName,
      businessType,
      city,
      state,
      accountId,
      aboutUs,
      differentiators,
      yearsInBusiness,
      servicesOffered,
      industriesServed // Optional
    } = await request.json();

    // Validate required fields
    if (!businessName || !businessType || !city || !state || !aboutUs || !differentiators || !yearsInBusiness || !servicesOffered) {
      return NextResponse.json(
        {
          error: "Missing required business information",
          details: "Business name, type, city, state, about us, differentiators, years in business, and services offered are required to generate keywords."
        },
        { status: 400 },
      );
    }

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 },
      );
    }

    // Verify user has access to this account
    const { data: accountUser, error: accountError } = await serviceSupabase
      .from("account_users")
      .select("*")
      .eq("account_id", accountId)
      .eq("user_id", user.id)
      .single();

    if (accountError || !accountUser) {
      return NextResponse.json(
        { error: "Forbidden: You don't have access to this account" },
        { status: 403 },
      );
    }

    // Check usage limit for this account in the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: usageRecords, error: usageError } = await serviceSupabase
      .from("ai_usage")
      .select("*")
      .eq("user_id", user.id)
      .eq("feature_type", "keyword_generation")
      .gte("created_at", startOfMonth.toISOString());

    if (usageError) {
      console.error("Error checking usage:", usageError);
      // Don't block on usage check error, just log it
    }

    const currentUsage = usageRecords?.length || 0;

    if (currentUsage >= MONTHLY_KEYWORD_GENERATION_LIMIT) {
      return NextResponse.json(
        {
          error: "Monthly limit reached",
          details: `You've reached your monthly limit of ${MONTHLY_KEYWORD_GENERATION_LIMIT} keyword generations. Your limit will reset on the 1st of next month.`,
          currentUsage,
          limit: MONTHLY_KEYWORD_GENERATION_LIMIT
        },
        { status: 429 },
      );
    }

    // Build the prompt for OpenAI
    const prompt = `Generate 10 long-tail keyword ideas for a ${businessType} in ${city}, ${state}.

Business Information:
- Name: ${businessName}
- About: ${aboutUs}
- Differentiators: ${differentiators}
- Years in Business: ${yearsInBusiness}
- Services/Offerings: ${servicesOffered}${industriesServed ? `\n- Industries Served: ${industriesServed}` : ''}

These keywords will be used to help customers find this business when searching for reviews.

The keywords should:
• Sound like real search phrases people would use when looking for reviews (e.g., "best family dentist near me reviews" or "affordable root canal Portland OR reviews").
• Include location modifiers ("near me," neighborhood names, zip codes, landmarks, etc.).
• Focus on review-oriented search intent - how customers search when researching businesses.
• Reflect how customers talk (not marketing-speak).
• Include service + location + review intent combos (e.g., "teeth whitening reviews SE Portland").
• Consider the business's unique differentiators and specific services/offerings.

For each keyword, also provide a natural-sounding review phrase that incorporates that keyword organically.

IMPORTANT: Keep review phrases SHORT and punchy - ideally one short sentence or fragment (5-12 words max).

Examples:
- Search term: "Portland car accident lawyer reviews for disabled"
- Review phrase: "Best Portland car accident lawyer for disabled clients!"

- Search term: "affordable root canal Portland OR reviews"
- Review phrase: "Affordable root canal in Portland - highly recommend!"

- Search term: "best family dentist near me"
- Review phrase: "Found the best family dentist near me!"

Format your output as a JSON array of objects with these fields:
- searchTerm: The keyword phrase someone would search for
- reviewPhrase: A SHORT, punchy review phrase (5-12 words, authentic, conversational)

Return ONLY valid JSON, no additional text or markdown formatting.`;

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are an SEO expert that generates authentic, location-specific keyword ideas for local businesses. You understand how real customers search for services and products. Always return valid JSON output.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "gpt-4o-mini",
      temperature: 0.8,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content;
    let keywords;

    try {
      const parsed = JSON.parse(responseText || "{}");
      keywords = parsed.keywords || parsed;

      // Ensure we have an array
      if (!Array.isArray(keywords)) {
        keywords = Object.values(keywords);
      }
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      return NextResponse.json(
        { error: "Failed to parse keyword suggestions" },
        { status: 500 },
      );
    }

    // Log token usage and cost to ai_usage table
    const usage = completion.usage;
    if (usage) {
      // Pricing for GPT-4o-mini (as of 2025)
      const inputPrice = 0.00015; // $ per 1K tokens
      const outputPrice = 0.0006; // $ per 1K tokens
      const cost =
        (usage.prompt_tokens / 1000) * inputPrice +
        (usage.completion_tokens / 1000) * outputPrice;

      await serviceSupabase.from("ai_usage").insert({
        user_id: user.id,
        account_id: accountId,
        feature_type: "keyword_generation",
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
        cost_usd: cost,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      keywords,
      usage: {
        current: currentUsage + 1,
        limit: MONTHLY_KEYWORD_GENERATION_LIMIT,
        remaining: MONTHLY_KEYWORD_GENERATION_LIMIT - currentUsage - 1
      }
    });
  } catch (error) {
    console.error("Error generating keywords:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

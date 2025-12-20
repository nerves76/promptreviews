import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerSupabaseClient, createServiceRoleClient } from "@/auth/providers/supabase";
import { getRequestAccountId } from "@/app/(app)/api/utils/getRequestAccountId";
import { withCredits, checkCredits, getFeatureCost } from "@/lib/credits";

export const dynamic = "force-dynamic";

// Credit cost for generating 10 keywords
const DEFAULT_CREDIT_COST = 5;

export async function POST(request: NextRequest) {
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

    // Get account ID from X-Selected-Account header
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { error: "No valid account found" },
        { status: 403 },
      );
    }

    const {
      businessName,
      businessType,
      city,
      state,
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

    // Get credit cost from pricing rules (defaults to 5)
    const creditCost = await getFeatureCost(supabase, "keyword_finder", "generate_10", DEFAULT_CREDIT_COST);

    // Build the prompt for OpenAI
    const prompt = `Generate 10 SEO-optimized keyword ideas for a ${businessType} business.

Business Information:
- Name: ${businessName}
- Location: ${city}, ${state}
- About: ${aboutUs}
- Differentiators: ${differentiators}
- Years in Business: ${yearsInBusiness}
- Services/Offerings: ${servicesOffered}${industriesServed ? `\n- Industries Served: ${industriesServed}` : ''}

These keywords will be used to help customers find this business when searching for reviews.

IMPORTANT: Generate a MIX of keyword types:
• 4-5 keywords should be LOCATION-SPECIFIC (include city name, "near me", neighborhood names, etc.)
• 5-6 keywords should be GENERAL/SERVICE-FOCUSED (no location, focus on service quality, specializations, or differentiators)

The keywords should:
• Sound like real search phrases people would use when looking for reviews
• Focus on review-oriented search intent - how customers search when researching businesses
• Reflect how customers talk (not marketing-speak)
• Consider the business's unique differentiators and specific services/offerings
• Include a variety of lengths and styles

For each keyword, also provide a natural-sounding review phrase that incorporates that keyword organically.

IMPORTANT: Keep review phrases SHORT and punchy - ideally one short sentence or fragment (5-12 words max).

CRITICAL: NEVER generate review phrases that mention "reviews", "ratings", "testimonials", or "recommendations". A customer writing their own review wouldn't say "I read great reviews" or "with fantastic reviews" - they should describe THEIR OWN experience, not reference other people's opinions.

Examples of LOCATION-SPECIFIC:
- Search term: "best family dentist Portland OR"
- Review phrase: "Best family dentist in Portland - highly recommend!"

Examples of GENERAL/SERVICE-FOCUSED:
- Search term: "emergency dental care same day appointment"
- Review phrase: "Got same day emergency dental care - lifesaver!"

- Search term: "gentle dentist for anxious patients"
- Review phrase: "Finally found a gentle dentist for my dental anxiety!"

- Search term: "professional photography for small business"
- Review phrase: "Amazing professional photography for my small business!"

Format your output as a JSON array of objects with these fields:
- searchTerm: The keyword phrase someone would search for
- reviewPhrase: A SHORT, punchy review phrase (5-12 words, authentic, conversational)

Return ONLY valid JSON, no additional text or markdown formatting.`;

    // Use withCredits helper for credit-gated operation
    const result = await withCredits({
      supabase,
      accountId,
      userId: user.id,
      featureType: "keyword_finder",
      creditCost,
      idempotencyKey: `keyword-generate-${accountId}-${Date.now()}`,
      description: `AI Generate 10 keyword concepts for ${businessName}`,
      featureMetadata: { businessName, businessType, city, state },
      operation: async () => {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const completion = await openai.chat.completions.create({
          messages: [
            {
              role: "system",
              content:
                "You are an SEO expert that generates authentic keyword ideas for businesses. You understand how real customers search for services and products, including both location-based and general service-focused searches. Always return valid JSON output.",
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
          throw new Error("Failed to parse keyword suggestions");
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

        return keywords;
      },
    });

    // Handle credit errors
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.errorCode || 500 }
      );
    }

    return NextResponse.json({
      keywords: result.data,
      creditsUsed: result.creditsDebited,
      creditsRemaining: result.creditsRemaining,
    });
  } catch (error) {
    console.error("Error generating keywords:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

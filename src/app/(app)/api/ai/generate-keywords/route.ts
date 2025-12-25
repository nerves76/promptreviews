/**
 * AI Keyword Generation Endpoint
 *
 * Generates 10 SEO-optimized keyword concepts based on business information.
 * FREE with daily limit of 20 generations per account.
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerSupabaseClient } from "@/auth/providers/supabase";
import { getRequestAccountId } from "@/app/(app)/api/utils/getRequestAccountId";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Daily limit for free keyword generation
const DAILY_GENERATION_LIMIT = 20;

// Service client for tracking usage
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Get today's generation count for an account
 */
async function getDailyGenerationCount(accountId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count } = await serviceSupabase
    .from("ai_keyword_generation_usage")
    .select("*", { count: "exact", head: true })
    .eq("account_id", accountId)
    .gte("created_at", today.toISOString());

  return count || 0;
}

/**
 * Record a generation usage
 */
async function recordGenerationUsage(accountId: string, userId: string, businessName: string): Promise<void> {
  await serviceSupabase.from("ai_keyword_generation_usage").insert({
    account_id: accountId,
    user_id: userId,
    business_name: businessName,
    created_at: new Date().toISOString(),
  });
}

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

    // Check daily limit
    const usedToday = await getDailyGenerationCount(accountId);
    if (usedToday >= DAILY_GENERATION_LIMIT) {
      return NextResponse.json(
        {
          error: `Daily limit reached (${DAILY_GENERATION_LIMIT}/day). Try again tomorrow!`,
          dailyLimit: DAILY_GENERATION_LIMIT,
          usedToday,
          remaining: 0,
        },
        { status: 429 }
      );
    }

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

For each keyword concept, provide:
1. A short concept name (2-4 words) that describes the topic - this is the canonical name for the concept
2. THREE closely related search term variations - different word orders and phrasings that people might actually type into Google
3. A natural-sounding review phrase that incorporates the concept organically
4. 2-3 related questions people might ask AI assistants or search engines about this topic

IMPORTANT: Keep review phrases SHORT and punchy - ideally one short sentence or fragment (5-12 words max).

CRITICAL: NEVER generate review phrases that mention "reviews", "ratings", "testimonials", or "recommendations". A customer writing their own review wouldn't say "I read great reviews" or "with fantastic reviews" - they should describe THEIR OWN experience, not reference other people's opinions.

For related_questions:
- Questions should be what people type into ChatGPT, Google, or other AI/search tools
- Include a mix of funnel stages:
  • "top" = awareness (educational: "What is X?", "Why do I need X?")
  • "middle" = consideration (comparison: "What is the best X?", "How do I choose X?")
  • "bottom" = decision (purchase-intent: "How much does X cost?", "Where can I find X near me?")
- Include location when relevant to the keyword

Examples of LOCATION-SPECIFIC:
- conceptName: "Portland barbershop"
- searchTerms: ["barbershop portland", "portland barbershop", "portland barbers"]
- reviewPhrase: "Best barbershop in Portland - always a great cut!"
- relatedQuestions: [
    { "question": "What is the best barbershop in Portland?", "funnelStage": "middle" },
    { "question": "How much does a haircut cost in Portland?", "funnelStage": "bottom" }
  ]

- conceptName: "Portland family dentist"
- searchTerms: ["best family dentist Portland OR", "Portland family dentist", "family dentist near me Portland"]
- reviewPhrase: "Best family dentist in Portland - highly recommend!"
- relatedQuestions: [
    { "question": "How do I find a good family dentist in Portland?", "funnelStage": "middle" },
    { "question": "What should I look for in a family dentist?", "funnelStage": "top" }
  ]

Examples of GENERAL/SERVICE-FOCUSED:
- conceptName: "Same-day emergency dental"
- searchTerms: ["emergency dental care same day", "same day dental appointment", "urgent dental care"]
- reviewPhrase: "Got same day emergency dental care - lifesaver!"
- relatedQuestions: [
    { "question": "Can I get a same-day dental appointment for an emergency?", "funnelStage": "bottom" },
    { "question": "What counts as a dental emergency?", "funnelStage": "top" }
  ]

Format your output as a JSON array of objects with these fields:
- conceptName: Short name for this concept (2-4 words, title case)
- searchTerms: Array of 3 related search phrases (different word orders/phrasings of the same concept)
- reviewPhrase: A SHORT, punchy review phrase (5-12 words, authentic, conversational)
- relatedQuestions: Array of 2-3 objects with "question" and "funnelStage" fields

Return ONLY valid JSON, no additional text or markdown formatting.`;

    // Call OpenAI directly (no credit wrapper needed)
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

      // Normalize response: ensure each keyword has conceptName, searchTerms array, and relatedQuestions
      const now = new Date().toISOString();
      keywords = keywords.map((kw: any) => {
        // If AI returned old format (searchTerm string), convert to searchTerms array
        if (kw.searchTerm && !kw.searchTerms) {
          kw.searchTerms = [kw.searchTerm];
        }
        // Ensure searchTerms is an array
        if (!Array.isArray(kw.searchTerms)) {
          kw.searchTerms = kw.searchTerms ? [kw.searchTerms] : [];
        }
        // Process relatedQuestions - add addedAt timestamp and validate funnelStage
        if (Array.isArray(kw.relatedQuestions)) {
          const validStages = ['top', 'middle', 'bottom'];
          kw.relatedQuestions = kw.relatedQuestions
            .slice(0, 5) // Max 5 questions
            .map((q: any) => {
              // Handle if AI returns string instead of object
              if (typeof q === 'string') {
                return {
                  question: q,
                  funnelStage: 'middle',
                  addedAt: now,
                };
              }
              return {
                question: q.question || '',
                funnelStage: validStages.includes(q.funnelStage) ? q.funnelStage : 'middle',
                addedAt: now,
              };
            })
            .filter((q: any) => q.question.length > 0);
        } else {
          kw.relatedQuestions = [];
        }
        // Use conceptName if provided, fallback to first search term, then review phrase
        const conceptName = kw.conceptName || kw.searchTerms[0] || kw.reviewPhrase || 'Untitled concept';
        return {
          conceptName,
          searchTerms: kw.searchTerms,
          reviewPhrase: kw.reviewPhrase,
          relatedQuestions: kw.relatedQuestions,
        };
      });
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

    // Record usage for daily limit tracking (after successful generation)
    await recordGenerationUsage(accountId, user.id, businessName);

    const remaining = DAILY_GENERATION_LIMIT - usedToday - 1;

    return NextResponse.json({
      keywords,
      // Keep creditsUsed/creditsRemaining for backward compatibility but set to 0/null
      creditsUsed: 0,
      creditsRemaining: null,
      // New daily limit info
      dailyLimit: DAILY_GENERATION_LIMIT,
      usedToday: usedToday + 1,
      remaining,
      usage: {
        current: usedToday + 1,
        limit: DAILY_GENERATION_LIMIT,
        remaining,
      },
    });
  } catch (error) {
    console.error("Error generating keywords:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

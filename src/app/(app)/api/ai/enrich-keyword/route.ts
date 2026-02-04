/**
 * AI Keyword Enrichment Endpoint
 *
 * Takes a raw keyword phrase and generates:
 * - review_phrase: Customer-facing version for prompt pages (e.g., "best marketing consultant in Portland")
 * - search_query: Optimized for Google/geo-grid tracking (e.g., "portland marketing consultant")
 * - aliases: Variant phrases that should match this concept
 * - location_scope: Detected geographic scope
 * - related_questions: 3-5 questions people might ask about this topic (for PAA/LLM tracking)
 *
 * FREE with daily limit of 30 enrichments per account
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerSupabaseClient } from "@/auth/providers/supabase";
import { getRequestAccountId } from "@/app/(app)/api/utils/getRequestAccountId";
import { createClient } from "@supabase/supabase-js";

// Daily limit for free AI enrichments
const DAILY_ENRICHMENT_LIMIT = 30;

// Service client for tracking usage
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Get today's enrichment count for an account
 */
async function getDailyEnrichmentCount(accountId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count } = await serviceSupabase
    .from("ai_enrichment_usage")
    .select("*", { count: "exact", head: true })
    .eq("account_id", accountId)
    .gte("created_at", today.toISOString());

  return count || 0;
}

/**
 * Record an enrichment usage
 */
async function recordEnrichmentUsage(accountId: string, userId: string, phrase: string): Promise<void> {
  await serviceSupabase.from("ai_enrichment_usage").insert({
    account_id: accountId,
    user_id: userId,
    phrase,
    created_at: new Date().toISOString(),
  });
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface RelatedQuestion {
  question: string;
  funnelStage: "top" | "middle" | "bottom";
  addedAt: string;
}

interface EnrichmentResult {
  review_phrase: string;
  search_terms: string[];
  aliases: string[];
  location_scope: "local" | "city" | "region" | "state" | "national" | null;
  related_questions: RelatedQuestion[];
}

// GET: Check daily usage and availability
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: "No valid account found" }, { status: 403 });
    }

    // Get today's usage count
    const usedToday = await getDailyEnrichmentCount(accountId);
    const remaining = Math.max(0, DAILY_ENRICHMENT_LIMIT - usedToday);

    return NextResponse.json({
      cost: 0, // Free!
      dailyLimit: DAILY_ENRICHMENT_LIMIT,
      usedToday,
      remaining,
      available: remaining > 0,
      hasCredits: true, // Always true since it's free
    });
  } catch (error) {
    console.error("[ENRICH-KEYWORD] GET Error:", error);
    return NextResponse.json(
      { error: "Failed to check usage" },
      { status: 500 }
    );
  }
}

// POST: Perform enrichment (FREE with daily limit)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: "No valid account found" }, { status: 403 });
    }

    // Check daily limit
    const usedToday = await getDailyEnrichmentCount(accountId);
    if (usedToday >= DAILY_ENRICHMENT_LIMIT) {
      return NextResponse.json(
        {
          error: `Daily limit reached (${DAILY_ENRICHMENT_LIMIT}/day). Try again tomorrow!`,
          dailyLimit: DAILY_ENRICHMENT_LIMIT,
          usedToday,
          remaining: 0,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      phrase,
      businessName,
      businessCity,
      businessState,
      isLocationBased = true,
      locationAliases = [],
    } = body;

    if (!phrase || typeof phrase !== "string") {
      return NextResponse.json(
        { error: "Missing required field: phrase" },
        { status: 400 }
      );
    }

    const trimmedPhrase = phrase.trim();
    if (trimmedPhrase.length < 2) {
      return NextResponse.json(
        { error: "Phrase must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Build context about the business
    const businessContext = [
      businessName ? `Business: ${businessName}` : null,
      businessCity ? `City: ${businessCity}` : null,
      businessState ? `State: ${businessState}` : null,
    ]
      .filter(Boolean)
      .join(", ");

    // Build location handling instructions based on settings
    let locationInstructions = "";
    if (!isLocationBased) {
      locationInstructions = `
LOCATION HANDLING:
This is NOT a location-based business. Do NOT include any city, state, or geographic references in:
- review_phrase
- search_terms
- aliases
Focus only on the service/product terms. Set location_scope to "national".`;
    } else if (locationAliases && locationAliases.length > 0) {
      // Pick a random location alias to use consistently for this enrichment
      const selectedLocation = locationAliases[Math.floor(Math.random() * locationAliases.length)];
      locationInstructions = `
LOCATION HANDLING:
This is a location-based business. Use this location name: "${selectedLocation}"

IMPORTANT: Use "${selectedLocation}" consistently throughout:
- review_phrase: MUST include "${selectedLocation}" (e.g., "Best plumber in ${selectedLocation}!")
- search_terms: ALL 3 terms MUST include "${selectedLocation}"
- aliases: Include "${selectedLocation}" in most aliases

Be consistent - use "${selectedLocation}" everywhere, do not mix different location names.`;
    } else if (businessCity || businessState) {
      const locationName = businessCity || businessState;
      locationInstructions = `
LOCATION HANDLING:
This is a location-based business. Use this location: "${locationName}"

IMPORTANT: Use "${locationName}" consistently throughout:
- review_phrase: MUST include "${locationName}" (e.g., "Best plumber in ${locationName}!")
- search_terms: ALL 3 terms MUST include "${locationName}"
- aliases: Include "${locationName}" in most aliases

Be consistent - use "${locationName}" everywhere.`;
    }

    const systemPrompt = `You are a keyword optimization expert. Your job is to take a keyword phrase representing a SINGLE CUSTOMER INTENT and adapt it for different platforms where customers search.

WHAT IS A KEYWORD CONCEPT?
A keyword concept represents ONE specific thing a potential customer wants. You will adapt this intent for:
• GOOGLE SEARCH (search_terms): Short keyword phrases people type into Google
• AI ASSISTANTS (related_questions): Full questions people ask ChatGPT, Perplexity, or Google AI
• CUSTOMER REVIEWS (review_phrase): How satisfied customers naturally describe this in their own words

IMPORTANT RULES:
• Do NOT add the business name unless it was in the original keyword
• NEVER use the phrase "top-notch" - it sounds artificial and is overused
• Keep the same core business terms (don't substitute "barbershop" with "hair salon")

Generate the following:

1. **review_phrase**: How a happy customer would naturally mention this in their review. Should:
   - Sound authentic and conversational (5-15 words)
   - May include qualifiers like "best", "great", "amazing" when natural
   - Properly capitalize location names
   - Be first-person experience, NOT mentioning "reviews" or "ratings"

2. **search_terms**: THREE Google search phrases for this intent. Should:
   - Be lowercase (except proper nouns)
   - Be direct and simple (2-5 words typically)
   - Match how people actually search
   - Include location if present in original
   - Use different word orders/phrasings of the same intent
   - Example: ["barbershop portland", "portland barbershop", "best barbershop portland"]

3. **aliases**: 2-3 variant phrases NEARLY IDENTICAL to review_phrase. STRICT RULES:
   - ONLY allowed changes:
     a) Swap qualifier words (best ↔ top ↔ great ↔ amazing)
     b) Rearrange word order ("Portland barbershop" ↔ "barbershop in Portland")
     c) Add/remove small words like "in", "the", "a"
     d) Remove the qualifier entirely
   - NEVER substitute core nouns (jobs ≠ opportunities ≠ openings)
   - NEVER change the location
   - Purpose: catch when reviewers write the same phrase with tiny variations

4. **location_scope**: Geographic scope of the keyword:
   - "local" = neighborhood/area specific
   - "city" = city-level
   - "region" = multi-city area
   - "state" = state-level
   - "national" = no location specified
   - null if unclear

5. **related_questions**: 3-5 questions people ask AI assistants or search engines about this topic. Should:
   - Be conversational, full sentences people actually ask
   - Cover different aspects: cost, quality, comparison, process
   - Include location if relevant
   - Each needs a funnelStage:
     - "top" = awareness ("What is X?", "Why do I need X?")
     - "middle" = consideration ("What's the best X?", "How do I choose X?")
     - "bottom" = decision ("How much does X cost?", "Where can I find X near me?")
   - Include a mix of funnel stages

Respond with ONLY valid JSON, no markdown or explanation.`;

    const userPrompt = `Keyword phrase: "${trimmedPhrase}"
${businessContext ? `\nBusiness context: ${businessContext}` : ""}
${locationInstructions}

Generate the enriched keyword data as JSON with this exact structure:
{
  "review_phrase": "...",
  "search_terms": ["term1", "term2", "term3"],
  "aliases": ["...", "..."],
  "location_scope": "city" | "local" | "region" | "state" | "national" | null,
  "related_questions": [
    { "question": "...", "funnelStage": "top" | "middle" | "bottom" },
    { "question": "...", "funnelStage": "top" | "middle" | "bottom" }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    let enrichment: EnrichmentResult;
    try {
      enrichment = JSON.parse(responseText);
    } catch (parseError) {
      console.error("[ENRICH-KEYWORD] Failed to parse OpenAI response:", responseText);
      throw new Error("Failed to parse AI response");
    }

    // Validate the response structure
    if (!enrichment.review_phrase) {
      console.error("[ENRICH-KEYWORD] Invalid response structure:", enrichment);
      throw new Error("Invalid AI response structure");
    }

    // Ensure search_terms is an array with at least one term
    if (!Array.isArray(enrichment.search_terms) || enrichment.search_terms.length === 0) {
      // Fallback: if AI returned old format with search_query, convert it
      if ((enrichment as any).search_query) {
        enrichment.search_terms = [(enrichment as any).search_query];
      } else {
        // Default fallback: lowercase version of the original phrase
        enrichment.search_terms = [trimmedPhrase.toLowerCase()];
      }
    }

    // Final safety check: ensure we always have at least one search term
    if (enrichment.search_terms.length === 0) {
      enrichment.search_terms = [trimmedPhrase.toLowerCase()];
    }

    // Ensure aliases is an array
    if (!Array.isArray(enrichment.aliases)) {
      enrichment.aliases = [];
    }

    // Ensure related_questions is an array with max 5 items, properly formatted
    const now = new Date().toISOString();
    if (!Array.isArray(enrichment.related_questions)) {
      enrichment.related_questions = [];
    } else {
      enrichment.related_questions = enrichment.related_questions
        .slice(0, 5)
        .map((q: { question?: string; funnelStage?: string } | string) => {
          // Handle if AI returns string instead of object (backward compat)
          if (typeof q === 'string') {
            return {
              question: q,
              funnelStage: 'middle' as const,
              addedAt: now,
            };
          }
          // Validate funnelStage
          const validStages = ['top', 'middle', 'bottom'];
          const stage = validStages.includes(q.funnelStage || '') ? q.funnelStage : 'middle';
          return {
            question: q.question || '',
            funnelStage: stage as 'top' | 'middle' | 'bottom',
            addedAt: now,
          };
        })
        .filter(q => q.question.length > 0);
    }

    // Validate location_scope
    const validScopes = ["local", "city", "region", "state", "national", null];
    if (!validScopes.includes(enrichment.location_scope)) {
      enrichment.location_scope = null;
    }

    // Record usage (after successful enrichment)
    await recordEnrichmentUsage(accountId, user.id, trimmedPhrase);

    const remaining = DAILY_ENRICHMENT_LIMIT - usedToday - 1;

    return NextResponse.json({
      success: true,
      original_phrase: trimmedPhrase,
      enrichment: {
        ...enrichment,
        ai_generated: true,
      },
      // Keep creditsUsed/creditsRemaining for backward compatibility but set to 0
      creditsUsed: 0,
      creditsRemaining: null,
      // New daily limit info
      dailyLimit: DAILY_ENRICHMENT_LIMIT,
      usedToday: usedToday + 1,
      remaining,
    });
  } catch (error) {
    console.error("[ENRICH-KEYWORD] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to enrich keyword",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

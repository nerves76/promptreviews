/**
 * AI Keyword Enrichment Endpoint
 *
 * Takes a raw keyword phrase and generates:
 * - review_phrase: Customer-facing version for prompt pages (e.g., "best marketing consultant in Portland")
 * - search_query: Optimized for Google/geo-grid tracking (e.g., "portland marketing consultant")
 * - aliases: Variant phrases that should match this concept
 * - location_scope: Detected geographic scope
 * - related_questions: 3-5 questions people might ask about this topic (for PAA/LLM tracking)
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { verifyAccountAuth } from "@/app/(app)/api/middleware/auth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface EnrichmentResult {
  review_phrase: string;
  search_query: string;
  aliases: string[];
  location_scope: "local" | "city" | "region" | "state" | "national" | null;
  related_questions: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAccountAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.errorCode || 401 }
      );
    }

    const body = await request.json();
    const { phrase, businessName, businessCity, businessState } = body;

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

    const systemPrompt = `You are a keyword optimization expert for local SEO and review generation.

Given a keyword phrase, generate optimized versions for different use cases:

1. **review_phrase**: A natural, persuasive phrase to show customers when asking for reviews. Should:
   - Start with qualifiers like "best", "top", "trusted", "leading" when appropriate
   - Properly capitalize location names
   - Sound natural and professional
   - Be what a happy customer might naturally say

2. **search_query**: The exact phrase people type into Google. Should:
   - Be lowercase (except proper nouns if critical)
   - Be direct and simple
   - Match how people actually search
   - Include location if present in original

3. **aliases**: 2-4 variant phrases that mean the same thing. Include:
   - Different word orders
   - Common synonyms
   - With/without location variations

4. **location_scope**: Detect the geographic scope:
   - "local" = neighborhood/area specific
   - "city" = city-level
   - "region" = multi-city area
   - "state" = state-level
   - "national" = no location specified
   - null if unclear

5. **related_questions**: 3-5 questions people might ask about this topic. Should:
   - Be natural questions a customer might type into Google or ask an AI
   - Include "People Also Ask" style questions
   - Cover different aspects: cost, quality, comparison, process, etc.
   - Include location if relevant to the keyword
   - Examples: "Where can I find X near me?", "How much does X cost?", "What is the best X in [city]?"

Respond with ONLY valid JSON, no markdown or explanation.`;

    const userPrompt = `Keyword phrase: "${trimmedPhrase}"
${businessContext ? `\nBusiness context: ${businessContext}` : ""}

Generate the enriched keyword data as JSON with this exact structure:
{
  "review_phrase": "...",
  "search_query": "...",
  "aliases": ["...", "..."],
  "location_scope": "city" | "local" | "region" | "state" | "national" | null,
  "related_questions": ["...", "...", "..."]
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
    if (!enrichment.review_phrase || !enrichment.search_query) {
      console.error("[ENRICH-KEYWORD] Invalid response structure:", enrichment);
      throw new Error("Invalid AI response structure");
    }

    // Ensure aliases is an array
    if (!Array.isArray(enrichment.aliases)) {
      enrichment.aliases = [];
    }

    // Ensure related_questions is an array with max 5 items
    if (!Array.isArray(enrichment.related_questions)) {
      enrichment.related_questions = [];
    } else {
      enrichment.related_questions = enrichment.related_questions.slice(0, 5);
    }

    // Validate location_scope
    const validScopes = ["local", "city", "region", "state", "national", null];
    if (!validScopes.includes(enrichment.location_scope)) {
      enrichment.location_scope = null;
    }

    return NextResponse.json({
      success: true,
      original_phrase: trimmedPhrase,
      enrichment: {
        review_phrase: enrichment.review_phrase,
        search_query: enrichment.search_query,
        aliases: enrichment.aliases,
        location_scope: enrichment.location_scope,
        related_questions: enrichment.related_questions,
        ai_generated: true,
      },
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

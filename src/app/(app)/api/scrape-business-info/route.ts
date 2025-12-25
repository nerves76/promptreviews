/**
 * Scrape Business Info API
 *
 * Scrapes a user's website homepage and uses AI to extract business information
 * for auto-filling the business profile form.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/auth/providers/supabase";
import { getRequestAccountId } from "@/app/(app)/api/utils/getRequestAccountId";
import OpenAI from "openai";
import * as cheerio from "cheerio";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Response shape for imported business info
interface ImportedBusinessInfo {
  name?: string;
  about_us?: string;
  services_offered?: string[];
  keywords?: string;
  taglines?: string;
  phone?: string;
  business_email?: string;
  industry?: string;
  differentiators?: string[];
  years_in_business?: string;
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  youtube_url?: string;
  tiktok_url?: string;
  pinterest_url?: string;
  bluesky_url?: string;
  twitter_url?: string;
}

// Validate URL format
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Social URL field types (excludes array fields)
type SocialUrlField =
  | "facebook_url"
  | "instagram_url"
  | "linkedin_url"
  | "youtube_url"
  | "tiktok_url"
  | "pinterest_url"
  | "bluesky_url"
  | "twitter_url";

// Extract social media URLs from page
function extractSocialLinks($: cheerio.CheerioAPI): Pick<ImportedBusinessInfo, SocialUrlField> {
  const socialLinks: Partial<Pick<ImportedBusinessInfo, SocialUrlField>> = {};

  const socialPatterns: { pattern: RegExp; field: SocialUrlField }[] = [
    { pattern: /facebook\.com/i, field: "facebook_url" },
    { pattern: /instagram\.com/i, field: "instagram_url" },
    { pattern: /linkedin\.com/i, field: "linkedin_url" },
    { pattern: /youtube\.com/i, field: "youtube_url" },
    { pattern: /tiktok\.com/i, field: "tiktok_url" },
    { pattern: /pinterest\.com/i, field: "pinterest_url" },
    { pattern: /bsky\.app|bluesky/i, field: "bluesky_url" },
    { pattern: /(?:twitter\.com|x\.com)\/(?!share|intent)/i, field: "twitter_url" },
  ];

  // Helper to check and add a URL
  const tryAddUrl = (url: string) => {
    if (!url || typeof url !== "string") return;
    for (const { pattern, field } of socialPatterns) {
      if (pattern.test(url) && !socialLinks[field]) {
        socialLinks[field] = url;
      }
    }
  };

  // Method 1: Scan <a href> links
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (href) tryAddUrl(href);
  });

  // Method 2: Scan script tags for embedded social URLs (Squarespace, Wix, etc.)
  // Look for URLs in JSON-like structures within scripts
  $("script").each((_, el) => {
    const scriptContent = $(el).html();
    if (!scriptContent) return;

    // Extract URLs that look like social media profiles
    // Match patterns like "profileUrl":"https://..." or "url":"https://facebook.com/..."
    const urlPatterns = [
      /"(?:profileUrl|url|href)":\s*"(https?:\/\/[^"]+)"/gi,
      /"(https?:\/\/(?:www\.)?(?:facebook|instagram|linkedin|youtube|tiktok|pinterest|twitter|x|bsky)\.(?:com|app)\/[^"]+)"/gi,
    ];

    for (const urlPattern of urlPatterns) {
      let match;
      while ((match = urlPattern.exec(scriptContent)) !== null) {
        tryAddUrl(match[1]);
      }
    }
  });

  return socialLinks as Pick<ImportedBusinessInfo, SocialUrlField>;
}

// Extract text content from page
function extractPageContent($: cheerio.CheerioAPI): {
  title: string;
  metaDescription: string;
  headings: string[];
  mainContent: string;
} {
  // Get title
  const title = $("title").text().trim() || $("h1").first().text().trim() || "";

  // Get meta description
  const metaDescription = $('meta[name="description"]').attr("content")?.trim() || "";

  // Get all headings
  const headings: string[] = [];
  $("h1, h2, h3").each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length < 200) {
      headings.push(text);
    }
  });

  // Remove script, style, nav, footer, header elements
  $("script, style, nav, footer, header, noscript, iframe, form").remove();

  // Get main content - prefer main, article, or body
  let mainContent = "";
  const mainEl = $("main").first();
  const articleEl = $("article").first();

  if (mainEl.length) {
    mainContent = mainEl.text();
  } else if (articleEl.length) {
    mainContent = articleEl.text();
  } else {
    mainContent = $("body").text();
  }

  // Clean up whitespace and limit length
  mainContent = mainContent
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000);

  return { title, metaDescription, headings, mainContent };
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get account ID for multi-account support
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: "No valid account found" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL format
    if (!isValidUrl(url)) {
      return NextResponse.json({ error: "Invalid URL format. Please enter a valid http or https URL." }, { status: 400 });
    }

    // Fetch the webpage with timeout
    let html: string;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        headers: {
          "User-Agent": "PromptReviews Bot/1.0 (https://promptreviews.app; business profile import)",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json(
          { error: `Could not access website (status ${response.status})` },
          { status: 400 }
        );
      }

      html = await response.text();
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return NextResponse.json(
          { error: "Website took too long to respond. Please try again." },
          { status: 408 }
        );
      }
      return NextResponse.json(
        { error: "Could not access website. Please check the URL and try again." },
        { status: 400 }
      );
    }

    // Parse HTML with Cheerio
    const $ = cheerio.load(html);

    // Extract content
    const { title, metaDescription, headings, mainContent } = extractPageContent($);
    const socialLinks = extractSocialLinks($);

    // Check if we got any meaningful content
    if (!title && !metaDescription && !mainContent) {
      return NextResponse.json(
        { error: "Could not extract any content from the website." },
        { status: 400 }
      );
    }

    // Build prompt for OpenAI
    const prompt = `You are helping a business set up their profile on a review management platform. Extract business information from this website to help them get started quickly.

Return a JSON object with these fields (only include fields where you can confidently extract information):

- name: The business name (just the name, no taglines or locations)
- about_us: A warm, authentic description of the business written in third person (2-3 sentences). This will be used to help generate personalized review requests, so capture their personality and what makes them special.
- services_offered: An array of services or products offered. Keep each one concise (2-4 words each). Examples: "Kitchen Remodeling", "Emergency Plumbing", "Wedding Photography"
- keywords: Comma-separated industry terms and phrases that customers might naturally use when writing reviews about this type of business. Focus on service-related terms, not generic words.
- taglines: Any taglines, slogans, or mottos found on the site
- phone: Phone number if found (format as-is)
- business_email: Email address if found
- industry: The business category/industry (e.g., "Restaurant", "Home Services", "Healthcare", "Professional Services", "Retail")
- differentiators: An array of 3-5 unique selling points or differentiators. Keep each one concise (1 sentence max). Look for years in business, special expertise, awards, unique approach, certifications, guarantees, etc. Examples: "Family-owned since 1985", "Award-winning customer service", "Same-day emergency repairs"
- years_in_business: How long the business has been operating. Look for phrases like "Since 1985", "Established 1999", "Over 20 years of experience", "Founded in 2010". Return just the number of years or the founding year, e.g. "25 years" or "Since 1999"

Website Title: ${title}
Meta Description: ${metaDescription}
Headings: ${headings.join(", ")}
Page Content: ${mainContent}

Return ONLY valid JSON, no markdown or explanation.`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a senior brand copywriter who specializes in helping local businesses connect with their customers. You're excellent at reading a business's website and understanding what makes them special, then articulating that in a way that feels authentic and appealing. Your goal is to help business owners set up their profile on a review management platform. Be accurate - only include information you can confidently extract. Write copy that's warm, genuine, and highlights what customers would love about this business."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
      max_tokens: 1500,
    });

    const aiResponse = completion.choices[0].message.content || "{}";

    // Parse AI response
    let extractedInfo: Partial<ImportedBusinessInfo>;
    try {
      extractedInfo = JSON.parse(aiResponse);
    } catch {
      console.error("[scrape-business-info] Failed to parse AI response:", aiResponse);
      return NextResponse.json(
        { error: "Failed to process website content. Please try again." },
        { status: 500 }
      );
    }

    // Combine AI-extracted info with directly extracted social links
    const result: ImportedBusinessInfo = {
      ...extractedInfo,
      ...socialLinks,
    };

    // Add the original URL as business_website
    result.name = result.name || undefined;

    return NextResponse.json({
      success: true,
      data: result,
      url: url, // Return the URL so it can be used to fill business_website
    });

  } catch (error) {
    console.error("[scrape-business-info] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

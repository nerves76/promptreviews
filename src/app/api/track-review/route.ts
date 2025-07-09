import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/utils/supabaseClient";
import { sendTemplatedEmail } from "@/utils/emailTemplates";

const supabase = createClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Log Supabase config and payload
    console.log("[track-review] Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL || "not set");
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (typeof supabase !== 'undefined' ? 'not set' : 'not set');
    console.log("[track-review] Supabase anon key (first 8 chars):", anonKey ? anonKey.slice(0, 8) + '...' : 'not set');
    console.log("[track-review] Payload:", JSON.stringify(body));

    const {
      promptPageId,
      platform,
      status,
      first_name,
      last_name,
      reviewContent,
      promptPageType,
      review_type,
      sentiment,
      email,
      phone,
    } = body;
    const userAgent = request.headers.get("user-agent") || "";
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "";

    // Fetch business_id (account_id) from prompt_pages
    const { data: promptPage, error: promptPageError } = await supabase
      .from("prompt_pages")
      .select("account_id")
      .eq("id", promptPageId)
      .single();
    if (promptPageError || !promptPage?.account_id) {
      return NextResponse.json({ error: "Could not determine business_id for review." }, { status: 400 });
    }
    const business_id = promptPage.account_id;

    // Insert review with business_id (source of truth for stats)
    const { data, error } = await supabase
      .from("review_submissions")
      .insert({
        prompt_page_id: promptPageId,
        business_id, // Always set business_id for stats and dashboard
        platform,
        status,
        first_name,
        last_name,
        review_content: reviewContent,
        prompt_page_type: promptPageType,
        review_type: review_type || (status === "feedback" ? "feedback" : "review"),
        emoji_sentiment_selection: sentiment,
        email,
        phone,
        user_agent: userAgent,
        ip_address: ipAddress,
      })
      .select()
      .single();

    if (error) {
      console.error("[track-review] Error inserting review_submissions:", error);
      throw error;
    }

    // Log review submission to analytics_events
    const { error: analyticsError } = await supabase
      .from("analytics_events")
      .insert({
        prompt_page_id: promptPageId,
        event_type: "review_submitted",
        platform,
        created_at: new Date().toISOString(),
        user_agent: userAgent,
        ip_address: ipAddress,
        metadata: {
          review_type:
            review_type || (status === "feedback" ? "feedback" : "review"),
          sentiment,
          reviewer: [first_name, last_name].filter(Boolean).join(" "),
        },
      });
    if (analyticsError) {
      console.error("[track-review] Error inserting analytics event:", analyticsError);
      return NextResponse.json(
        {
          error: "Failed to log analytics event",
          details: analyticsError.message,
        },
        { status: 500 },
      );
    }

    // Now find the account to get the email address
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("email, first_name, review_notifications_enabled")
      .eq("id", business_id)
      .single();

    if (accountError || !account) {
      console.error("[track-review] Account not found:", accountError?.message);
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Send email notification if enabled
    if (account.review_notifications_enabled) {
      const reviewerFullName =
        [first_name, last_name].filter(Boolean).join(" ") || "A reviewer";
      const reviewerFirst =
        first_name || reviewerFullName.split(" ")[0] || "Someone";
      
      // Determine if sentiment is positive or negative
      const isPositiveSentiment = sentiment && ["excellent", "satisfied"].includes(sentiment.toLowerCase());
      const isNegativeSentiment = sentiment && ["neutral", "unsatisfied", "frustrated", "angry"].includes(sentiment.toLowerCase());
      
      // Choose the appropriate email template based on review type and sentiment
      let templateName = 'review_praise_notification'; // default
      
      if (review_type === "feedback" || isNegativeSentiment) {
        templateName = 'review_feedback_notification';
      } else if (review_type === "testimonial" || review_type === "photo") {
        templateName = 'review_testimonial_notification';
      } else {
        templateName = 'review_praise_notification';
      }
      
      console.log("[track-review] Sending templated email notification", {
        to: account.email,
        template: templateName,
        reviewerName: reviewerFullName,
        platform,
        reviewContent,
        accountFirstName: account.first_name,
        sentiment,
        isPositive: isPositiveSentiment,
        isNegative: isNegativeSentiment,
      });

      try {
        const emailResult = await sendTemplatedEmail(templateName, account.email, {
          firstName: account.first_name || "there",
          reviewerName: reviewerFullName,
          platform: platform || "your prompt page",
          reviewContent: reviewContent || "No content provided"
        });

        if (emailResult.success) {
          console.log("[track-review] Templated email sent successfully to", account.email);
        } else {
          console.error("[track-review] Failed to send templated email:", emailResult.error);
        }
      } catch (emailError) {
        console.error("[track-review] Error sending templated email:", emailError);
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(
      "Error tracking review:",
      error,
      JSON.stringify(error, null, 2),
    );
    if (typeof error === "object" && error !== null) {
      if ("message" in error) {
        console.error("Error message:", (error as any).message);
      }
      if ("details" in error) {
        console.error("Error details:", (error as any).details);
      }
      if (
        "response" in error &&
        typeof (error as any).response.text === "function"
      ) {
        (error as any).response.text().then((text: string) => {
          console.error("Error response text:", text);
        });
      }
    }
    return NextResponse.json(
      { error: "Failed to track review" },
      { status: 500 },
    );
  }
}

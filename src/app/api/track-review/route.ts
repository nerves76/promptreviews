import { NextResponse } from "next/server";
import { supabase, createServiceRoleClient } from "@/utils/supabaseClient";
import { sendResendEmail } from "@/utils/resend";

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
        sentiment,
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

    if (promptPage && promptPage.account_id) {
      console.log(
        "[track-review] promptPageId:",
        promptPageId,
        "promptPage.account_id:",
        promptPage?.account_id,
      );
      const supabaseAdmin = createServiceRoleClient(); // use service role
      const { data: account } = await supabaseAdmin
        .from("accounts")
        .select("email, review_notifications_enabled, first_name")
        .eq("id", promptPage.account_id)
        .single();

      console.log("[track-review] Account fetched:", account);
      console.log("[track-review] Checking notification eligibility:", {
        review_notifications_enabled: account?.review_notifications_enabled,
        email: account?.email,
      });

      if (account?.review_notifications_enabled && account?.email) {
        const reviewerFullName =
          [first_name, last_name].filter(Boolean).join(" ") || "A reviewer";
        let subject = "";
        const reviewerFirst =
          first_name || reviewerFullName.split(" ")[0] || "Someone";
        
        // Determine if sentiment is positive or negative
        const isPositiveSentiment = sentiment && ["excellent", "satisfied"].includes(sentiment.toLowerCase());
        const isNegativeSentiment = sentiment && ["neutral", "unsatisfied", "frustrated", "angry"].includes(sentiment.toLowerCase());
        
        if (review_type === "feedback" || isNegativeSentiment) {
          subject = `You've got feedback: ${reviewerFirst} submitted feedback`;
        } else if (review_type === "testimonial" || review_type === "photo") {
          subject = `You've got praise! ${reviewerFirst} submitted a testimonial & photo`;
        } else {
          subject = `You've got praise! ${reviewerFirst} submitted a review on ${platform}`;
        }
        console.log("[track-review] Sending review notification email", {
          to: account.email,
          review_notifications_enabled: account.review_notifications_enabled,
          account_first_name: account.first_name,
          reviewerFullName,
          review_type,
          platform,
          sentiment,
          isPositive: isPositiveSentiment,
          isNegative: isNegativeSentiment,
        });

        // For now, keep using the direct email sending until we integrate with the email template system
        // TODO: Update to use email templates with sentiment-aware template selection
        // Use the correct production URL as fallback
        const loginUrl = process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
          : "https://app.promptreviews.app/dashboard";
        
        const text = isNegativeSentiment || review_type === "feedback"
          ? `Hi ${account.first_name || "there"},\n\n${reviewerFullName} just submitted feedback through your prompt page.\n\nThis feedback can help you improve your business. Log in to view it:\n${loginUrl}\n\nEvery piece of feedback is an opportunity to grow!\n\nChris`
          : `Hi ${account.first_name || "there"},\n\n${reviewerFullName} just submitted a positive review on ${platform}.\n\nGreat reviews like this help your business get found online!\n\nLog in to check it out:\n${loginUrl}\n\nKeep up the great work!\n\nChris`;
        
        try {
          await sendResendEmail({
            to: account.email,
            subject,
            text,
          });
          console.log(
            "[track-review] Email sent successfully to",
            account.email,
          );
        } catch (emailError) {
          console.error("[track-review] Error sending email:", emailError);
        }
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

import { NextResponse, NextRequest } from "next/server";
import { createClient, createServiceRoleClient } from "@/auth/providers/supabase";
import { sendTemplatedEmail } from "@/utils/emailTemplates";
import { standardReviewRateLimit } from "@/utils/reviewRateLimit";

// Use service role client to bypass RLS for anonymous review submissions
const supabase = createServiceRoleClient();

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting first
    const rateLimitResult = standardReviewRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }
    
    const body = await request.json();
    // Log Supabase config and payload

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
      role,
      builderAnswers,
      builderKeywords,
    } = body;

    if (!promptPageId) {
      console.error("[track-review] ERROR: Missing promptPageId");
      return NextResponse.json({ error: "Missing promptPageId" }, { status: 400 });
    }

    const userAgent = request.headers.get("user-agent") || "";
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "";

    
    // Fetch business_id (account_id) and location info from prompt_pages
    const { data: promptPage, error: promptPageError } = await supabase
      .from("prompt_pages")
      .select(`
        account_id,
        business_location_id,
        business_locations (
          address_city,
          address_state,
          address_zip
        )
      `)
      .eq("id", promptPageId)
      .single();
    
    
    if (promptPageError) {
      console.error("[track-review] ERROR: Failed to fetch prompt page:", promptPageError);
      return NextResponse.json({ 
        error: "Could not fetch prompt page", 
        details: promptPageError.message,
        code: promptPageError.code 
      }, { status: 400 });
    }
    
    if (!promptPage?.account_id) {
      console.error("[track-review] ERROR: No account_id found in prompt page:", promptPage);
      return NextResponse.json({ error: "Could not determine business_id for review." }, { status: 400 });
    }
    
    const business_id = promptPage.account_id;

    // Derive location_name from business_location if available
    let location_name: string | null = null;
    if (promptPage.business_locations) {
      const loc = promptPage.business_locations as { address_city?: string; address_state?: string; address_zip?: string };
      if (loc.address_city) {
        const stateZip = [loc.address_state, loc.address_zip].filter(Boolean).join(' ');
        location_name = [loc.address_city, stateZip].filter(Boolean).join(', ');
      }
    }

    // Combine first_name and last_name into reviewer_name for the constraint
    const reviewer_name = [first_name, last_name].filter(Boolean).join(' ').trim();
    
    if (!reviewer_name) {
      console.error("[track-review] ERROR: No reviewer name provided");
      return NextResponse.json({ error: "Reviewer name is required" }, { status: 400 });
    }
    
    const normalizedBuilderAnswers = Array.isArray(builderAnswers) ? builderAnswers : null;
    const normalizedBuilderKeywords = Array.isArray(builderKeywords) ? builderKeywords : null;

    // Insert review with account_id and business_id
    const { data, error } = await supabase
      .from("review_submissions")
      .insert({
        prompt_page_id: promptPageId,
        account_id: business_id, // Primary account association
        business_id: business_id, // Legacy field, kept for compatibility
        platform,
        status,
        reviewer_name, // Use combined name to satisfy constraint
        reviewer_role: role || null,
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
        builder_answers: normalizedBuilderAnswers,
        builder_keywords: normalizedBuilderKeywords,
        // Auto-verification fields for Google reviews
        review_text_copy: reviewContent, // Store copy for matching
        auto_verification_status: 'pending', // Will be verified by cron job
        verification_attempts: 0,
        // Location tracking
        location_name,
      })
      .select()
      .single();

    if (error) {
      console.error("[track-review] ERROR: Failed to insert review submission:", error);
      console.error("[track-review] Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json({ 
        error: "Failed to insert review submission", 
        details: error.message,
        code: error.code 
      }, { status: 500 });
    }


    // Step 6: Create or update contact from review submission
    if (data?.id && (first_name || last_name) && (email || phone)) {
      
      try {
        // Check if contact already exists (by email or phone)
        let existingContactQuery = supabase
          .from("contacts")
          .select("id, review_verification_status, source")
          .eq("account_id", business_id);

        if (email) {
          existingContactQuery = existingContactQuery.eq("email", email);
        } else if (phone) {
          existingContactQuery = existingContactQuery.eq("phone", phone);
        }

        const { data: existingContact } = await existingContactQuery.maybeSingle();

        if (existingContact) {
          // Update existing contact with review info
          
          const updateData: any = {
            review_submission_id: data.id,
            review_verification_status: 'verified',
            [`${platform}_review_verified_at`]: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Update review content field if platform exists
          if (reviewContent && platform) {
            updateData[`${platform}_review`] = reviewContent;
          }

          // Only update source if it was manual (don't override if already from review)
          if (existingContact.source === 'manual') {
            updateData.source = 'review_submission';
          }

          const { error: updateError } = await supabase
            .from("contacts")
            .update(updateData)
            .eq("id", existingContact.id);

          if (updateError) {
            console.error("[track-review] Error updating existing contact:", updateError);
          } else {
            console.log("[track-review] Successfully updated existing contact");
          }
        } else {
          // Create new contact from review submission
          
          const contactData: any = {
            account_id: business_id,
            first_name: first_name || '',
            last_name: last_name || '',
            email: email || null,
            phone: phone || null,
            review_submission_id: data.id,
            review_verification_status: 'verified',
            source: 'review_submission',
            status: 'completed', // They already left a review
            category: 'auto-generated-from-review',
            [`${platform}_review_verified_at`]: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Add review content if available
          if (reviewContent && platform) {
            contactData[`${platform}_review`] = reviewContent;
          }

          const { data: newContact, error: insertError } = await supabase
            .from("contacts")
            .insert(contactData)
            .select("id")
            .single();

          if (insertError) {
            console.error("[track-review] Error creating new contact:", insertError);
          } else {
            console.log("[track-review] Successfully created new contact:", newContact?.id);
          }
        }
      } catch (contactError) {
        console.error("[track-review] Error in contact creation/update:", contactError);
        // Don't fail the whole request if contact creation fails
      }
    } else {
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
      

      try {
        const emailResult = await sendTemplatedEmail(templateName, account.email, {
          firstName: account.first_name || "there",
          reviewerName: reviewerFullName,
          platform: platform || "your prompt page",
          reviewContent: reviewContent || "No content provided"
        });

        if (emailResult.success) {
        } else {
          console.error("[track-review] Failed to send templated email:", emailResult.error);
        }
      } catch (emailError) {
        console.error("[track-review] Error sending templated email:", emailError);
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
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

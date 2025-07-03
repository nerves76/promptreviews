/**
 * Track Event API Route
 * 
 * This endpoint tracks analytics events for anonymous users
 * Logged-in users are excluded to avoid duplicate tracking
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient, getUserOrMock } from '@/utils/supabaseClient';
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const nextCookies = await cookies();
    const supabaseCookies = {
      getAll: async () => {
        return nextCookies.getAll().map(({ name, value }) => ({ name, value }));
      },
      setAll: async (cookies: any) => {
        // This is a no-op for server-side operations
        return;
      },
    };
    
    // Use anon key for user authentication check
    const supabaseAnon = await createServerSupabaseClient();

    // Check if user is logged in
    const {
      data: { user },
    } = await getUserOrMock(supabaseAnon);
    
    if (user) {
      // Do not record event for logged-in users to avoid duplicate tracking
      return NextResponse.json({ message: "Event not tracked for authenticated users" }, { status: 200 });
    }

    const body = await req.json();
    const { promptPageId, eventType, platform } = body;
    
    if (!promptPageId || !eventType) {
      return NextResponse.json(
        { error: "Missing required fields: promptPageId and eventType are required" },
        { status: 400 },
      );
    }

    // Track all events for anonymous users, including views
    // This helps with analytics for public prompt pages
    const allowedEvents = [
      "view",
      "review_submitted",
      "ai_generate",
      "copy_submit",
      "emoji_sentiment",
      "constructive_feedback",
      "login",
      "prompt_page_created",
      "contacts_uploaded",
      "save_for_later",
      "unsave_for_later",
      "feature_used",
    ];
    
    if (!allowedEvents.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid event type: ${eventType}. Allowed events: ${allowedEvents.join(", ")}` },
        { status: 400 },
      );
    }

    // Get user agent and IP address
    const userAgent = req.headers.get("user-agent") || null;
    const ip = req.headers.get("x-forwarded-for") || 
               req.headers.get("x-real-ip") || 
               req.headers.get("cf-connecting-ip") || 
               null;

    console.log(`[TRACK-EVENT] Tracking ${eventType} for prompt page: ${promptPageId}`);

    // Use service key for database operations to bypass RLS
    const supabaseService = createServiceRoleClient(); // use service role

    // Insert event
    const { error } = await supabaseService.from("analytics_events").insert({
      prompt_page_id: promptPageId,
      event_type: eventType,
      platform: platform || "web",
      user_agent: userAgent,
      ip_address: ip,
    });
    
    if (error) {
      console.error("[TRACK-EVENT] Database error:", error);
      return NextResponse.json({ error: "Failed to track event" }, { status: 500 });
    }
    
    return NextResponse.json({ message: "Event tracked successfully" }, { status: 200 });
    
  } catch (err) {
    console.error("[TRACK-EVENT] Error:", err);
    return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
  }
}

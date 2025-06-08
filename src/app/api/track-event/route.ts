import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getUserOrMock } from "@/utils/supabase";

export async function POST(req: NextRequest) {
  const nextCookies = await cookies();
  const supabaseCookies = {
    getAll: async () => {
      return nextCookies.getAll().map(({ name, value }) => ({ name, value }));
    },
  };
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: supabaseCookies },
  );

  // Check if user is logged in
  const {
    data: { user },
  } = await getUserOrMock(supabase);
  if (user) {
    // Do not record event for logged-in users
    return NextResponse.json({}, { status: 204 });
  }

  try {
    const body = await req.json();
    const { promptPageId, eventType, platform } = body;
    if (!promptPageId || !eventType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Only track important events, not page views
    const importantEvents = [
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
    if (!importantEvents.includes(eventType)) {
      // Ignore non-important events (like 'view')
      return NextResponse.json({}, { status: 204 });
    }

    // Get user agent and IP address
    const userAgent = req.headers.get("user-agent") || null;
    const ip = req.headers.get("x-forwarded-for") || null;

    // Insert event
    const { error } = await supabase.from("analytics_events").insert({
      prompt_page_id: promptPageId,
      event_type: eventType,
      platform: platform || null,
      user_agent: userAgent,
      ip_address: ip,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({}, { status: 204 });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isValidUuid, validateUrl } from "@/app/(app)/api/utils/validation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const { reviewId, widgetId, photoUrl } = await req.json();

    if (!reviewId || !widgetId || !photoUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate UUID parameters
    if (!isValidUuid(reviewId)) {
      return NextResponse.json({ error: "Invalid reviewId format" }, { status: 400 });
    }
    if (!isValidUuid(widgetId)) {
      return NextResponse.json({ error: "Invalid widgetId format" }, { status: 400 });
    }

    // Validate photoUrl
    const urlError = validateUrl(photoUrl, 'photoUrl');
    if (urlError) {
      return NextResponse.json({ error: urlError }, { status: 400 });
    }

    // Update the review with the photo URL
    const { error } = await supabase
      .from('widget_reviews')
      .update({ photo_url: photoUrl })
      .eq('review_id', reviewId)
      .eq('widget_id', widgetId);

    if (error) {
      console.error('[DEBUG] Error updating review with photo URL:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DEBUG] Unexpected error in upload-photo API:', err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 
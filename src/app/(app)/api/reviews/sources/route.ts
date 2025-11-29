/**
 * Review Sources API
 *
 * Returns review counts grouped by source channel for analytics.
 * Shows where reviews are coming from (email, widget, QR, direct, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/auth/providers/supabase";
import { getRequestAccountId } from "@/app/(app)/api/utils/getRequestAccountId";

interface SourceStats {
  source_channel: string;
  count: number;
  percentage: number;
}

interface TimeRangeStats {
  week: SourceStats[];
  month: SourceStats[];
  year: SourceStats[];
  all_time: SourceStats[];
}

const SOURCE_CHANNEL_LABELS: Record<string, string> = {
  prompt_page_direct: "Direct link",
  prompt_page_qr: "QR code",
  email_campaign: "Email campaign",
  sms_campaign: "SMS campaign",
  widget_cta: "Widget",
  gbp_import: "Google import",
  social_share: "Social share",
  referral: "Referral",
  unknown: "Unknown",
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: "No valid account found" }, { status: 403 });
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Fetch all reviews for this account with source_channel
    const { data: reviews, error } = await supabase
      .from("review_submissions")
      .select("id, source_channel, created_at")
      .eq("account_id", accountId)
      .eq("status", "submitted")
      .neq("review_type", "feedback");

    if (error) {
      console.error("[reviews/sources] Error fetching reviews:", error);
      return NextResponse.json({ error: "Failed to fetch review sources" }, { status: 500 });
    }

    // Group by time ranges
    const weekReviews = reviews?.filter(r => new Date(r.created_at) >= oneWeekAgo) || [];
    const monthReviews = reviews?.filter(r => new Date(r.created_at) >= oneMonthAgo) || [];
    const yearReviews = reviews?.filter(r => new Date(r.created_at) >= oneYearAgo) || [];
    const allReviews = reviews || [];

    // Calculate stats for each time range
    const calculateStats = (reviewList: typeof reviews): SourceStats[] => {
      if (!reviewList || reviewList.length === 0) {
        return [];
      }

      const counts: Record<string, number> = {};
      reviewList.forEach(r => {
        const channel = r.source_channel || "unknown";
        counts[channel] = (counts[channel] || 0) + 1;
      });

      const total = reviewList.length;
      return Object.entries(counts)
        .map(([channel, count]) => ({
          source_channel: channel,
          label: SOURCE_CHANNEL_LABELS[channel] || channel,
          count,
          percentage: Math.round((count / total) * 100),
        }))
        .sort((a, b) => b.count - a.count);
    };

    const stats: TimeRangeStats = {
      week: calculateStats(weekReviews),
      month: calculateStats(monthReviews),
      year: calculateStats(yearReviews),
      all_time: calculateStats(allReviews),
    };

    // Also return totals for summary
    const totals = {
      week: weekReviews.length,
      month: monthReviews.length,
      year: yearReviews.length,
      all_time: allReviews.length,
    };

    return NextResponse.json({ stats, totals, labels: SOURCE_CHANNEL_LABELS });
  } catch (error) {
    console.error("[reviews/sources] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

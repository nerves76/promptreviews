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

    const fetchRangeStats = async (since?: Date) => {
      let query = supabase
        .from("review_submissions")
        .select("source_channel, count:id", { head: false })
        .eq("account_id", accountId)
        .eq("status", "submitted")
        .neq("review_type", "feedback")
        .group("source_channel");

      if (since) {
        query = query.gte("created_at", since.toISOString());
      }

      const { data, error } = await query;
      if (error) {
        console.error("[reviews/sources] Error fetching grouped stats:", error);
        throw error;
      }

      const total = (data || []).reduce((sum, row: any) => sum + (row.count || 0), 0);

      const stats = (data || [])
        .map((row: any) => ({
          source_channel: row.source_channel || "unknown",
          label: SOURCE_CHANNEL_LABELS[row.source_channel] || row.source_channel || "unknown",
          count: row.count || 0,
          percentage: total > 0 ? Math.round((row.count || 0) / total * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);

      return { stats, total };
    };

    const [weekStats, monthStats, yearStats, allTimeStats] = await Promise.all([
      fetchRangeStats(oneWeekAgo),
      fetchRangeStats(oneMonthAgo),
      fetchRangeStats(oneYearAgo),
      fetchRangeStats(),
    ]);

    const stats: TimeRangeStats = {
      week: weekStats.stats,
      month: monthStats.stats,
      year: yearStats.stats,
      all_time: allTimeStats.stats,
    };

    // Also return totals for summary
    const totals = {
      week: weekStats.total,
      month: monthStats.total,
      year: yearStats.total,
      all_time: allTimeStats.total,
    };

    return NextResponse.json({ stats, totals, labels: SOURCE_CHANNEL_LABELS });
  } catch (error) {
    console.error("[reviews/sources] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

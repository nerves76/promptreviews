import { NextRequest, NextResponse } from "next/server";

/**
 * Daily 8 AM Dispatcher - Consolidates multiple daily 8 AM cron jobs into one
 *
 * This endpoint calls multiple daily scheduled tasks that run at 8 AM UTC
 * to stay within Vercel's 20 cron job limit.
 *
 * Consolidated jobs:
 * - send-credit-warnings
 * - monitor-gbp-changes
 * - send-communication-reminders
 * - send-onboarding-emails
 * - llm-data-maintenance
 */

const CRON_SECRET = process.env.CRON_SECRET_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.promptreviews.app";

interface JobResult {
  job: string;
  success: boolean;
  duration: number;
  error?: string;
}

async function runJob(path: string, jobName: string): Promise<JobResult> {
  const startTime = Date.now();

  try {
    const response = await fetch(`${APP_URL}${path}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${CRON_SECRET}`,
        "Content-Type": "application/json",
      },
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return {
        job: jobName,
        success: false,
        duration,
        error: `HTTP ${response.status}: ${errorText.substring(0, 200)}`,
      };
    }

    return {
      job: jobName,
      success: true,
      duration,
    };
  } catch (error) {
    return {
      job: jobName,
      success: false,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!CRON_SECRET || token !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[Daily 8AM Dispatcher] Starting daily 8 AM jobs...");

  // Run all daily 8 AM jobs in parallel for efficiency
  const results = await Promise.all([
    runJob("/api/cron/send-credit-warnings", "credit-warnings"),
    runJob("/api/cron/monitor-gbp-changes", "gbp-changes"),
    runJob("/api/cron/send-communication-reminders", "communication-reminders"),
    runJob("/api/cron/send-onboarding-emails", "onboarding-emails"),
    runJob("/api/cron/llm-data-maintenance", "llm-data-maintenance"),
  ]);

  const totalDuration = Date.now() - startTime;
  const successCount = results.filter((r) => r.success).length;
  const failedJobs = results.filter((r) => !r.success);

  console.log(
    `[Daily 8AM Dispatcher] Completed: ${successCount}/${results.length} jobs succeeded in ${totalDuration}ms`
  );

  if (failedJobs.length > 0) {
    console.error("[Daily 8AM Dispatcher] Failed jobs:", failedJobs);
  }

  return NextResponse.json({
    success: failedJobs.length === 0,
    totalDuration,
    results,
    summary: {
      total: results.length,
      succeeded: successCount,
      failed: failedJobs.length,
    },
  });
}

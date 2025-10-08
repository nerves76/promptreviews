import { NextResponse } from 'next/server';
import { runHealthCheck } from '@/lib/health/check';
import { sendResendEmail } from '@/utils/resend';

const alertRecipients = (process.env.HEALTH_ALERT_EMAILS || '').split(',').map((value) => value.trim()).filter(Boolean);

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await runHealthCheck();

  if (!result.healthy && alertRecipients.length > 0) {
    const subject = `[PromptReviews] Health check failed`;
    const summaryLines = Object.entries(result.checks)
      .map(([key, entry]) => `${key}: ${entry.status}${entry.message ? ` — ${entry.message}` : ''}`)
      .join('\n');

    await Promise.all(
      alertRecipients.map((to) =>
        sendResendEmail({
          to,
          subject,
          text: `Health check failed at ${new Date().toISOString()}\n${summaryLines}`,
        }).catch((error) => {
          console.error('Failed to send health alert email:', error);
        })
      )
    );
  }

  return NextResponse.json({
    status: result.healthy ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    checks: result.checks,
    alerted: !result.healthy && alertRecipients.length > 0,
  });
}

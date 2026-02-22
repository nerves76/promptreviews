import { NextRequest } from 'next/server';
import { runHealthCheck } from '@/lib/health/check';
import { logCronExecution, verifyCronSecret } from '@/lib/cronLogger';
import { sendResendEmail } from '@/utils/resend';

const alertRecipients = (process.env.HEALTH_ALERT_EMAILS || '').split(',').map((value) => value.trim()).filter(Boolean);

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel cron
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return logCronExecution('health-monitor', async () => {
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

    return {
      success: result.healthy,
      summary: {
        status: result.healthy ? 'ok' : 'error',
        checks: result.checks,
        alerted: !result.healthy && alertRecipients.length > 0,
      },
    };
  });
}

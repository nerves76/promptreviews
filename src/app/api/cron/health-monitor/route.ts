import { runHealthCheck } from '@/lib/health/check';
import { logCronExecution } from '@/lib/cronLogger';
import { sendResendEmail } from '@/utils/resend';

const alertRecipients = (process.env.HEALTH_ALERT_EMAILS || '').split(',').map((value) => value.trim()).filter(Boolean);

export const dynamic = 'force-dynamic';

export async function GET() {
  // Note: health-monitor doesn't use verifyCronSecret since it may be called for health checks
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

/**
 * Email notification for task/prompt page assignment
 */

import { sendResendEmail } from '@/utils/resend';

interface AssignmentNotificationEmailParams {
  to: string;
  assigneeFirstName?: string;
  assignerName: string;
  itemTitle: string;
  itemType: 'task' | 'prompt page';
  itemUrl: string;
  businessName?: string;
}

export async function sendAssignmentNotificationEmail({
  to,
  assigneeFirstName,
  assignerName,
  itemTitle,
  itemType,
  itemUrl,
  businessName,
}: AssignmentNotificationEmailParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.promptreviews.app';

  const subject = `${assignerName} assigned you to "${itemTitle}"`;

  const greeting = assigneeFirstName ? `Hi ${assigneeFirstName}` : 'Hi';
  const businessContext = businessName ? ` for ${businessName}` : '';
  const ctaText = itemType === 'task' ? 'View task' : 'View prompt page';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #527DE7 0%, #7864C8 50%, #914AAE 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                You were assigned
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #374151; line-height: 1.6;">
                ${greeting},
              </p>

              <p style="margin: 0 0 24px; font-size: 16px; color: #374151; line-height: 1.6;">
                <strong>${assignerName}</strong> assigned you to the ${itemType} <strong>"${itemTitle}"</strong>${businessContext}.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${itemUrl}" style="display: inline-block; background-color: #2E4A7D; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      ${ctaText}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                Or copy and paste this link into your browser:<br>
                <a href="${itemUrl}" style="color: #527DE7; word-break: break-all;">${itemUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                This is an automated notification from Prompt Reviews.
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af;">
                <a href="${appUrl}" style="color: #6b7280; text-decoration: none;">Prompt Reviews</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
${greeting},

${assignerName} assigned you to the ${itemType} "${itemTitle}"${businessContext}.

${ctaText}: ${itemUrl}

---
This is an automated notification from Prompt Reviews.
`;

  return sendResendEmail({
    to,
    subject,
    html,
    text,
  });
}

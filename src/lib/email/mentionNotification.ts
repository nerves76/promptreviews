/**
 * Email notification for @mentions in Work Manager comments
 */

import { sendResendEmail } from '@/utils/resend';

interface MentionNotificationEmailParams {
  to: string;
  mentionedUserName?: string;
  mentionerName: string;
  taskTitle: string;
  taskId: string;
  boardId?: string;
  businessName?: string;
  commentContent: string;
}

export async function sendMentionNotificationEmail({
  to,
  mentionedUserName,
  mentionerName,
  taskTitle,
  taskId,
  boardId,
  businessName,
  commentContent,
}: MentionNotificationEmailParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.promptreviews.app';
  const taskUrl = boardId ? `${appUrl}/work-manager/${boardId}?task=${taskId}` : `${appUrl}/work-manager`;

  // Truncate comment if too long
  const truncatedComment = commentContent.length > 300
    ? commentContent.substring(0, 300) + '...'
    : commentContent;

  const subject = `${mentionerName} mentioned you in "${taskTitle}"`;

  const greeting = mentionedUserName ? `Hi ${mentionedUserName}` : 'Hi';
  const businessContext = businessName ? ` for ${businessName}` : '';

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
                You were mentioned
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
                <strong>${mentionerName}</strong> mentioned you in a comment on the task <strong>"${taskTitle}"</strong>${businessContext}:
              </p>

              <!-- Comment Box -->
              <div style="background-color: #f9fafb; border-left: 4px solid #527DE7; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 0 0 24px;">
                <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6; white-space: pre-wrap;">
                  ${truncatedComment}
                </p>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${taskUrl}" style="display: inline-block; background-color: #2E4A7D; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      View task
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                Or copy and paste this link into your browser:<br>
                <a href="${taskUrl}" style="color: #527DE7; word-break: break-all;">${taskUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                This is an automated notification from Prompt Reviews Work Manager.
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

${mentionerName} mentioned you in a comment on the task "${taskTitle}"${businessContext}:

"${truncatedComment}"

View the task: ${taskUrl}

---
This is an automated notification from Prompt Reviews Work Manager.
`;

  return sendResendEmail({
    to,
    subject,
    html,
    text,
  });
}

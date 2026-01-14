-- Migration: Add agency invitation notification support
-- This adds the email template and notification preference columns for agency invitations

-- Add preference columns to notification_preferences table
ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS in_app_agency_invitations BOOLEAN DEFAULT TRUE;

ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS email_agency_invitations BOOLEAN DEFAULT TRUE;

-- Add the agency invitation email template
INSERT INTO public.email_templates (name, subject, html_content, text_content, is_active)
VALUES (
  'agency_invitation_received',
  '{{agencyName}} wants to manage your Prompt Reviews account',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agency Invitation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <img src="https://app.promptreviews.app/images/logo.png" alt="Prompt Reviews" width="180" style="display: block; margin: 0 auto;">
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px 40px 40px;">
              <h1 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600; color: #2E4A7D; text-align: center;">
                Agency Invitation
              </h1>

              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                Hi {{firstName}},
              </p>

              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                <strong>{{agencyName}}</strong> has invited you to become one of their managed clients on Prompt Reviews.
              </p>

              <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #0369a1;">
                  <strong>What this means:</strong><br>
                  If you accept, {{agencyName}} will be able to help manage your Prompt Reviews account. They may assist with reviews, settings, and other features depending on the access level you grant.
                </p>
              </div>

              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                To view and respond to this invitation, click the button below:
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="{{viewInvitationUrl}}" style="display: inline-block; background-color: #2E4A7D; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                      View Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                If you don''t recognize this agency or didn''t expect this invitation, you can safely ignore this email. The invitation will expire if not accepted.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #9ca3af; text-align: center;">
                This email was sent by Prompt Reviews<br>
                <a href="https://promptreviews.app" style="color: #2E4A7D; text-decoration: none;">promptreviews.app</a>
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
                &copy; {{year}} Prompt Reviews. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Hi {{firstName}},

{{agencyName}} has invited you to become one of their managed clients on Prompt Reviews.

What this means:
If you accept, {{agencyName}} will be able to help manage your Prompt Reviews account. They may assist with reviews, settings, and other features depending on the access level you grant.

To view and respond to this invitation, visit:
{{viewInvitationUrl}}

If you don''t recognize this agency or didn''t expect this invitation, you can safely ignore this email. The invitation will expire if not accepted.

---
Prompt Reviews
https://promptreviews.app

(c) {{year}} Prompt Reviews. All rights reserved.',
  true
)
ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  text_content = EXCLUDED.text_content,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

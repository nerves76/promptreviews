-- Add batch run completed notification preferences
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS in_app_batch_completed BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_batch_completed BOOLEAN DEFAULT true;

-- Insert email template for batch run completion notifications
INSERT INTO email_templates (name, subject, html_content, text_content, is_active)
VALUES (
  'batch_run_completed',
  '{{featureName}} check completed',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{featureName}} Check Completed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2E4A7D 0%, #527DE7 100%); padding: 32px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">{{featureName}} check completed</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 24px;">
                Hi {{firstName}}, your scheduled {{featureName}} check has finished.
              </p>

              <!-- Stats Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px; font-weight: 600;">Results summary</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 6px 0; color: #374151; font-size: 15px;">Total checked</td>
                        <td style="padding: 6px 0; color: #374151; font-size: 15px; text-align: right; font-weight: 600;">{{totalChecked}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #16a34a; font-size: 15px;">&#9650; Improved</td>
                        <td style="padding: 6px 0; color: #16a34a; font-size: 15px; text-align: right; font-weight: 600;">{{improved}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #dc2626; font-size: 15px;">&#9660; Declined</td>
                        <td style="padding: 6px 0; color: #dc2626; font-size: 15px; text-align: right; font-weight: 600;">{{declined}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 15px;">&#8212; Unchanged</td>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 15px; text-align: right; font-weight: 600;">{{unchanged}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #3b82f6; font-size: 15px;">&#9733; New entries</td>
                        <td style="padding: 6px 0; color: #3b82f6; font-size: 15px; text-align: right; font-weight: 600;">{{newEntries}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="{{dashboardUrl}}" style="display: inline-block; background-color: #2E4A7D; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">View results</a>
                  </td>
                </tr>
              </table>

              <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 0; text-align: center;">
                You can manage these notifications in your <a href="{{accountUrl}}" style="color: #2E4A7D; text-decoration: underline;">account settings</a>.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; {{year}} Prompt Reviews. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Hi {{firstName}},

Your scheduled {{featureName}} check has finished.

Results summary:
- Total checked: {{totalChecked}}
- Improved: {{improved}}
- Declined: {{declined}}
- Unchanged: {{unchanged}}
- New entries: {{newEntries}}

View results: {{dashboardUrl}}

You can manage these notifications in your account settings: {{accountUrl}}

© {{year}} Prompt Reviews. All rights reserved.',
  true
)
ON CONFLICT (name) DO NOTHING;

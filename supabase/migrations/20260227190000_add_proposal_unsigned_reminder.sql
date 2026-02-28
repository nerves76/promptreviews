-- Add reminder tracking column to proposals
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- Add notification type for unsigned contract reminders
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'proposal_unsigned_reminder';

-- Insert email template for unsigned contract reminder
INSERT INTO email_templates (name, subject, html_content, text_content, is_active)
VALUES (
  'proposal_unsigned_reminder',
  'Reminder: {{clientName}} hasn''t signed {{proposalTitle}} yet',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contract Unsigned Reminder</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2E4A7D 0%, #527DE7 100%); padding: 32px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">Contract awaiting signature</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 24px;">
                Hi {{firstName}}, your contract hasn''t been signed yet.
              </p>

              <!-- Details Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border-radius: 8px; border: 1px solid #fde68a; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="color: #92400e; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px; font-weight: 600;">Details</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 6px 0; color: #374151; font-size: 15px;">Contract</td>
                        <td style="padding: 6px 0; color: #374151; font-size: 15px; text-align: right; font-weight: 600;">{{proposalTitle}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #374151; font-size: 15px;">Client</td>
                        <td style="padding: 6px 0; color: #374151; font-size: 15px; text-align: right; font-weight: 600;">{{clientName}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #374151; font-size: 15px;">Sent</td>
                        <td style="padding: 6px 0; color: #374151; font-size: 15px; text-align: right; font-weight: 600;">{{daysSinceSent}} days ago</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="color: #374151; font-size: 15px; line-height: 1.5; margin: 0 0 24px;">
                You may want to follow up with your client to check if they have any questions.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="{{contractUrl}}" style="display: inline-block; background-color: #2E4A7D; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">View contract</a>
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

Your contract hasn''t been signed yet.

Details:
- Contract: {{proposalTitle}}
- Client: {{clientName}}
- Sent: {{daysSinceSent}} days ago

You may want to follow up with your client to check if they have any questions.

View contract: {{contractUrl}}

You can manage these notifications in your account settings: {{accountUrl}}

© {{year}} Prompt Reviews. All rights reserved.',
  true
)
ON CONFLICT (name) DO NOTHING;

-- Add email template for credit refund notifications
INSERT INTO email_templates (name, subject, html_content, text_content, variables)
VALUES (
  'credit_refund',
  'Credits refunded for failed {{featureName}} checks',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Credits Refunded</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #2E4A7D 0%, #4a6fa5 100%); padding: 32px 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Credits Refunded</h1>
    </div>
    <div style="padding: 32px 24px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
        Hi {{firstName}},
      </p>
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        We''ve refunded <strong>{{creditsRefunded}} credits</strong> to your account due to {{failedChecks}} failed {{featureName}} checks.
      </p>
      <div style="background: #f0f9ff; border-left: 4px solid #2E4A7D; padding: 16px; margin: 0 0 24px; border-radius: 0 8px 8px 0;">
        <p style="color: #1e40af; font-size: 14px; margin: 0;">
          <strong>What happened?</strong><br>
          Some checks failed due to temporary issues with the external service. Your credits have been automatically refunded.
        </p>
      </div>
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        You can retry the failed checks at any time from your dashboard.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="{{buyCreditsUrl}}" style="display: inline-block; background: #2E4A7D; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">View Credit Balance</a>
      </div>
    </div>
    <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px; margin: 0;">
        This is an automated notification from Prompt Reviews.<br>
        <a href="{{accountUrl}}" style="color: #2E4A7D;">Manage notification preferences</a>
      </p>
    </div>
  </div>
</body>
</html>',
  'Hi {{firstName}},

We''ve refunded {{creditsRefunded}} credits to your account due to {{failedChecks}} failed {{featureName}} checks.

What happened?
Some checks failed due to temporary issues with the external service. Your credits have been automatically refunded.

You can retry the failed checks at any time from your dashboard.

View your credit balance: {{buyCreditsUrl}}

---
This is an automated notification from Prompt Reviews.
Manage notification preferences: {{accountUrl}}',
  '["firstName", "creditsRefunded", "failedChecks", "featureName", "buyCreditsUrl", "accountUrl"]'
) ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  text_content = EXCLUDED.text_content,
  variables = EXCLUDED.variables,
  updated_at = now();

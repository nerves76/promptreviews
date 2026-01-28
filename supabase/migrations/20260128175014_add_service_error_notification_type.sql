-- Add service_error notification type to the enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'service_error';

-- Add email template for admin service error alerts
INSERT INTO email_templates (name, subject, html_content, text_content)
VALUES (
  'service_error',
  '[ALERT] {{title}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Service Alert</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background-color: #fef2f2; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background: #dc2626; padding: 32px 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Service Alert</h1>
    </div>
    <div style="padding: 32px 24px;">
      <h2 style="color: #991b1b; font-size: 18px; margin: 0 0 16px;">{{title}}</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">{{message}}</p>
      <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 0 0 24px; border-radius: 0 8px 8px 0;">
        <p style="color: #991b1b; font-size: 14px; margin: 0;">
          <strong>Feature:</strong> {{feature}}<br>
          <strong>Batch run ID:</strong> {{batchRunId}}<br>
          <strong>Error sample:</strong> {{errorSample}}
        </p>
      </div>
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
        Check the DataForSEO account balance and top up if needed.
      </p>
    </div>
    <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px; margin: 0;">
        Automated alert from Prompt Reviews
      </p>
    </div>
  </div>
</body>
</html>',
  '[ALERT] {{title}}

{{message}}

Feature: {{feature}}
Batch run ID: {{batchRunId}}
Error sample: {{errorSample}}

Check the DataForSEO account balance and top up if needed.

---
Automated alert from Prompt Reviews'
) ON CONFLICT (name) DO NOTHING;

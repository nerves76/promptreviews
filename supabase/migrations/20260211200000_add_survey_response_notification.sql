-- Add survey_response_submitted notification type and preferences

-- 1. Add to notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'survey_response_submitted';

-- 2. Add preference columns
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS in_app_survey_responses BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_survey_responses BOOLEAN DEFAULT true;

-- 3. Insert email template
INSERT INTO email_templates (name, subject, html_content, text_content, is_active)
VALUES (
  'survey_response_submitted',
  'New survey response: {{surveyTitle}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Survey Response</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2E4A7D 0%, #527DE7 100%); padding: 32px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">New survey response</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 24px;">
                Hi {{firstName}}, someone just submitted a response to your survey.
              </p>

              <!-- Details Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px; font-weight: 600;">Response details</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 6px 0; color: #374151; font-size: 15px;">Survey</td>
                        <td style="padding: 6px 0; color: #374151; font-size: 15px; text-align: right; font-weight: 600;">{{surveyTitle}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #374151; font-size: 15px;">Respondent</td>
                        <td style="padding: 6px 0; color: #374151; font-size: 15px; text-align: right; font-weight: 600;">{{respondentLabel}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #374151; font-size: 15px;">Total responses</td>
                        <td style="padding: 6px 0; color: #374151; font-size: 15px; text-align: right; font-weight: 600;">{{responseCount}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="{{responsesUrl}}" style="display: inline-block; background-color: #2E4A7D; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">View responses</a>
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

Someone just submitted a response to your survey.

Response details:
- Survey: {{surveyTitle}}
- Respondent: {{respondentLabel}}
- Total responses: {{responseCount}}

View responses: {{responsesUrl}}

You can manage these notifications in your account settings: {{accountUrl}}

© {{year}} Prompt Reviews. All rights reserved.',
  true
)
ON CONFLICT (name) DO NOTHING;

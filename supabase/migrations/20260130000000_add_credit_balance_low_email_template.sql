-- ============================================================================
-- Add email template for credit_balance_low notification
-- ============================================================================

INSERT INTO email_templates (name, subject, html_content, text_content, is_active)
VALUES (
  'credit_balance_low',
  'Your credit balance is running low',
  E'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #fff; margin: 0; font-size: 24px;">Credit Balance Low</h1>
  </div>

  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px;">Hi {{firstName}},</p>

    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-weight: 600; color: #856404;">
        ⚠️ Your credit balance (<strong>{{available}} credits</strong>) is running low.
      </p>
    </div>

    <p>To avoid interruption to your scheduled rank checks, geo-grid scans, and LLM visibility tracking, consider purchasing more credits.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{buyCreditsUrl}}" style="display: inline-block; background: #22c55e; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">Buy Credits Now</a>
    </div>

    <p style="color: #666; font-size: 14px;">Need help? Reply to this email or contact us at support@promptreviews.app</p>
  </div>

  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>© {{year}} Prompt Reviews. All rights reserved.</p>
  </div>
</body>
</html>',
  E'Hi {{firstName}},

⚠️ CREDIT BALANCE LOW

Your credit balance ({{available}} credits) is running low.

To avoid interruption to your scheduled rank checks, geo-grid scans, and LLM visibility tracking, consider purchasing more credits.

Buy credits now: {{buyCreditsUrl}}

Need help? Contact us at support@promptreviews.app

© {{year}} Prompt Reviews',
  true
)
ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  text_content = EXCLUDED.text_content,
  updated_at = NOW();

-- ============================================================================
-- Update existing email templates to be feature-aware
-- ============================================================================

-- Update credit_warning_upcoming template to use featureName variable
UPDATE email_templates
SET
  subject = 'Action Required: Low Credits for Upcoming {{featureName}} Check',
  html_content = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #fff; margin: 0; font-size: 24px;">Low Credit Balance</h1>
  </div>

  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px;">Hi {{firstName}},</p>

    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-weight: 600; color: #856404;">
        ⚠️ Your scheduled {{featureName}} check needs <strong>{{required}} credits</strong> but you only have <strong>{{available}} credits</strong>.
      </p>
    </div>

    <p>Your next check is scheduled for <strong>{{scheduledFor}}</strong>. Without enough credits, the check will be skipped.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{buyCreditsUrl}}" style="display: inline-block; background: #22c55e; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">Buy Credits Now</a>
    </div>

    <p style="color: #666; font-size: 14px;">Need help? Reply to this email or contact us at support@promptreviews.app</p>
  </div>

  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>© {{year}} Prompt Reviews. All rights reserved.</p>
  </div>
</body>
</html>',
  text_content = E'Hi {{firstName}},

⚠️ LOW CREDIT BALANCE

Your scheduled {{featureName}} check needs {{required}} credits but you only have {{available}} credits.

Your next check is scheduled for {{scheduledFor}}. Without enough credits, the check will be skipped.

Buy credits now: {{buyCreditsUrl}}

Need help? Contact us at support@promptreviews.app

© {{year}} Prompt Reviews',
  updated_at = NOW()
WHERE name = 'credit_warning_upcoming';

-- Update credit_check_skipped template to use featureName variable
UPDATE email_templates
SET
  subject = '{{featureName}} Check Skipped - Insufficient Credits',
  html_content = E'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #fff; margin: 0; font-size: 24px;">{{featureName}} Check Skipped</h1>
  </div>

  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px;">Hi {{firstName}},</p>

    <div style="background: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-weight: 600; color: #991b1b;">
        ❌ Your scheduled {{featureName}} check was skipped because you don''t have enough credits.
      </p>
    </div>

    <p><strong>Required:</strong> {{required}} credits<br>
    <strong>Available:</strong> {{available}} credits</p>

    <p>To resume your scheduled tracking, please add more credits to your account.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{buyCreditsUrl}}" style="display: inline-block; background: #22c55e; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">Buy Credits Now</a>
    </div>

    <p style="color: #666; font-size: 14px;">Need help? Reply to this email or contact us at support@promptreviews.app</p>
  </div>

  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>© {{year}} Prompt Reviews. All rights reserved.</p>
  </div>
</body>
</html>',
  text_content = E'Hi {{firstName}},

❌ {{featureName}} CHECK SKIPPED

Your scheduled {{featureName}} check was skipped because you don''t have enough credits.

Required: {{required}} credits
Available: {{available}} credits

To resume your scheduled tracking, please add more credits to your account.

Buy credits now: {{buyCreditsUrl}}

Need help? Contact us at support@promptreviews.app

© {{year}} Prompt Reviews',
  updated_at = NOW()
WHERE name = 'credit_check_skipped';

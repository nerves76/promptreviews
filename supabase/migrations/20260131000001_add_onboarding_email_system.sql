-- =============================================================
-- Onboarding Email System Migration
--
-- 1. Fix trial_reminder_logs CHECK constraint (add mid_trial_checkin)
-- 2. Create onboarding_email_logs table for duplicate prevention
-- 3. Insert 14 new email templates
-- =============================================================

-- =============================================================
-- 1. Fix trial_reminder_logs CHECK constraint
-- =============================================================
ALTER TABLE public.trial_reminder_logs
  DROP CONSTRAINT IF EXISTS trial_reminder_logs_reminder_type_check;

ALTER TABLE public.trial_reminder_logs
  ADD CONSTRAINT trial_reminder_logs_reminder_type_check
  CHECK (reminder_type IN ('trial_reminder', 'trial_expired', 'mid_trial_checkin'));

-- =============================================================
-- 2. Create onboarding_email_logs table
-- =============================================================
CREATE TABLE IF NOT EXISTS public.onboarding_email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    email_type TEXT NOT NULL,
    email TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent duplicate sends per account per email type
CREATE UNIQUE INDEX idx_onboarding_email_logs_unique
  ON public.onboarding_email_logs (account_id, email_type)
  WHERE success = true;

-- Lookup indexes
CREATE INDEX idx_onboarding_email_logs_account_id
  ON public.onboarding_email_logs (account_id);

CREATE INDEX idx_onboarding_email_logs_email_type
  ON public.onboarding_email_logs (email_type);

-- RLS: service role only
ALTER TABLE public.onboarding_email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage onboarding email logs"
    ON public.onboarding_email_logs FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- =============================================================
-- 3. Insert email templates
-- =============================================================

-- Template 1: onboarding_setup_prompt_page (Day 1)
INSERT INTO email_templates (name, subject, html_content, text_content, is_active)
VALUES (
  'onboarding_setup_prompt_page',
  'Quick win: create your first prompt page',
  E'<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>\n<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">\n  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 12px 12px 0 0;">\n    <h1 style="color: #fff; margin: 0; font-size: 24px;">Set up your prompt page</h1>\n  </div>\n  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">\n    <p style="font-size: 16px;">Hi {{firstName}},</p>\n    <p>Welcome to Prompt Reviews! The fastest way to start collecting reviews is to create a <strong>prompt page</strong> \u2014 a shareable link you can send to customers.</p>\n    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2E4A7D;">\n      <p style="margin: 0 0 10px 0; font-weight: bold; color: #1e293b;">It takes less than 2 minutes:</p>\n      <ol style="color: #475569; margin: 0; padding-left: 20px;">\n        <li>Choose your review platforms</li>\n        <li>Customize your branding</li>\n        <li>Share the link with customers</li>\n      </ol>\n    </div>\n    <div style="text-align: center; margin: 30px 0;">\n      <a href="{{promptPagesUrl}}" style="display: inline-block; background: #2E4A7D; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">Create your prompt page</a>\n    </div>\n    <p style="color: #666; font-size: 14px;">Need help? Reply to this email or contact us at support@promptreviews.app</p>\n  </div>\n  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">\n    <p>\u00a9 2026 Prompt Reviews. All rights reserved.</p>\n  </div>\n</body>\n</html>',
  E'Hi {{firstName}},\n\nWelcome to Prompt Reviews! The fastest way to start collecting reviews is to create a prompt page \u2014 a shareable link you can send to customers.\n\nIt takes less than 2 minutes:\n1. Choose your review platforms\n2. Customize your branding\n3. Share the link with customers\n\nCreate your prompt page: {{promptPagesUrl}}\n\nNeed help? Contact us at support@promptreviews.app\n\n\u00a9 2026 Prompt Reviews',
  true
) ON CONFLICT (name) DO NOTHING;

-- Template 2: onboarding_connect_google (Day 2)
INSERT INTO email_templates (name, subject, html_content, text_content, is_active)
VALUES (
  'onboarding_connect_google',
  'Connect Google to see all your reviews in one place',
  E'<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>\n<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">\n  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 12px 12px 0 0;">\n    <h1 style="color: #fff; margin: 0; font-size: 24px;">Connect your Google Business Profile</h1>\n  </div>\n  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">\n    <p style="font-size: 16px;">Hi {{firstName}},</p>\n    <p>Did you know you can manage all your Google reviews right from Prompt Reviews? Connect your Google Business Profile to:</p>\n    <ul style="color: #475569; padding-left: 20px;">\n      <li>See all your Google reviews in one dashboard</li>\n      <li>Respond to reviews directly</li>\n      <li>Get notified when new reviews come in</li>\n      <li>Track your rating over time</li>\n    </ul>\n    <div style="text-align: center; margin: 30px 0;">\n      <a href="{{googleBusinessUrl}}" style="display: inline-block; background: #2E4A7D; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">Connect Google</a>\n    </div>\n    <p style="color: #666; font-size: 14px;">Need help? Reply to this email or contact us at support@promptreviews.app</p>\n  </div>\n  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">\n    <p>\u00a9 2026 Prompt Reviews. All rights reserved.</p>\n  </div>\n</body>\n</html>',
  E'Hi {{firstName}},\n\nDid you know you can manage all your Google reviews right from Prompt Reviews? Connect your Google Business Profile to:\n\n- See all your Google reviews in one dashboard\n- Respond to reviews directly\n- Get notified when new reviews come in\n- Track your rating over time\n\nConnect Google: {{googleBusinessUrl}}\n\nNeed help? Contact us at support@promptreviews.app\n\n\u00a9 2026 Prompt Reviews',
  true
) ON CONFLICT (name) DO NOTHING;

-- Template 3: onboarding_add_widget (Day 4)
INSERT INTO email_templates (name, subject, html_content, text_content, is_active)
VALUES (
  'onboarding_add_widget',
  'Show off your reviews with a website widget',
  E'<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>\n<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">\n  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 12px 12px 0 0;">\n    <h1 style="color: #fff; margin: 0; font-size: 24px;">Display reviews on your website</h1>\n  </div>\n  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">\n    <p style="font-size: 16px;">Hi {{firstName}},</p>\n    <p>Reviews build trust \u2014 and showing them on your website can boost conversions. Add a review widget to display your best reviews automatically.</p>\n    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2E4A7D;">\n      <p style="margin: 0 0 10px 0; font-weight: bold; color: #1e293b;">Widget options:</p>\n      <ul style="color: #475569; margin: 0; padding-left: 20px;">\n        <li><strong>Multi-review carousel</strong> \u2014 show several reviews at once</li>\n        <li><strong>Single review spotlight</strong> \u2014 highlight one great review</li>\n        <li><strong>Photo review gallery</strong> \u2014 visual reviews with images</li>\n      </ul>\n    </div>\n    <div style="text-align: center; margin: 30px 0;">\n      <a href="{{widgetUrl}}" style="display: inline-block; background: #2E4A7D; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">Create a widget</a>\n    </div>\n    <p style="color: #666; font-size: 14px;">Need help? Reply to this email or contact us at support@promptreviews.app</p>\n  </div>\n  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">\n    <p>\u00a9 2026 Prompt Reviews. All rights reserved.</p>\n  </div>\n</body>\n</html>',
  E'Hi {{firstName}},\n\nReviews build trust \u2014 and showing them on your website can boost conversions. Add a review widget to display your best reviews automatically.\n\nWidget options:\n- Multi-review carousel \u2014 show several reviews at once\n- Single review spotlight \u2014 highlight one great review\n- Photo review gallery \u2014 visual reviews with images\n\nCreate a widget: {{widgetUrl}}\n\nNeed help? Contact us at support@promptreviews.app\n\n\u00a9 2026 Prompt Reviews',
  true
) ON CONFLICT (name) DO NOTHING;

-- Template 4: subscription_activated
INSERT INTO email_templates (name, subject, html_content, text_content, is_active)
VALUES (
  'subscription_activated',
  'Your subscription is now active',
  E'<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>\n<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">\n  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 12px 12px 0 0;">\n    <h1 style="color: #fff; margin: 0; font-size: 24px;">You''re all set!</h1>\n  </div>\n  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">\n    <p style="font-size: 16px;">Hi {{firstName}},</p>\n    <p>Your <strong>{{planName}}</strong> subscription is now active. Thank you for choosing Prompt Reviews!</p>\n    <p>Your account has full access to all features included in your plan. Head to your dashboard to get started.</p>\n    <div style="text-align: center; margin: 30px 0;">\n      <a href="{{dashboardUrl}}" style="display: inline-block; background: #2E4A7D; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">Go to dashboard</a>\n    </div>\n    <p style="color: #666; font-size: 14px;">Need help? Reply to this email or contact us at support@promptreviews.app</p>\n  </div>\n  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">\n    <p>\u00a9 2026 Prompt Reviews. All rights reserved.</p>\n  </div>\n</body>\n</html>',
  E'Hi {{firstName}},\n\nYour {{planName}} subscription is now active. Thank you for choosing Prompt Reviews!\n\nYour account has full access to all features included in your plan. Head to your dashboard to get started.\n\nGo to dashboard: {{dashboardUrl}}\n\nNeed help? Contact us at support@promptreviews.app\n\n\u00a9 2026 Prompt Reviews',
  true
) ON CONFLICT (name) DO NOTHING;

-- Template 5: payment_failed_first
INSERT INTO email_templates (name, subject, html_content, text_content, is_active)
VALUES (
  'payment_failed_first',
  'Action needed: your payment didn''t go through',
  E'<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>\n<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">\n  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 12px 12px 0 0;">\n    <h1 style="color: #fff; margin: 0; font-size: 24px;">Payment issue</h1>\n  </div>\n  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">\n    <p style="font-size: 16px;">Hi {{firstName}},</p>\n    <p>We weren''t able to process your recent payment of <strong>${{amount}}</strong>. Don''t worry \u2014 your account is still active during a {{gracePeriodDays}}-day grace period.</p>\n    <p>Please update your payment method to avoid any interruption to your service.</p>\n    <div style="text-align: center; margin: 30px 0;">\n      <a href="{{planUrl}}" style="display: inline-block; background: #2E4A7D; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">Update payment method</a>\n    </div>\n    <p style="color: #666; font-size: 14px;">We''ll automatically retry the payment on {{nextRetryDate}}. If you have questions, reply to this email.</p>\n  </div>\n  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">\n    <p>\u00a9 2026 Prompt Reviews. All rights reserved.</p>\n  </div>\n</body>\n</html>',
  E'Hi {{firstName}},\n\nWe weren''t able to process your recent payment of ${{amount}}. Don''t worry \u2014 your account is still active during a {{gracePeriodDays}}-day grace period.\n\nPlease update your payment method to avoid any interruption to your service.\n\nUpdate payment method: {{planUrl}}\n\nWe''ll automatically retry the payment on {{nextRetryDate}}. If you have questions, reply to this email.\n\n\u00a9 2026 Prompt Reviews',
  true
) ON CONFLICT (name) DO NOTHING;

-- Template 6: payment_failed_reminder
INSERT INTO email_templates (name, subject, html_content, text_content, is_active)
VALUES (
  'payment_failed_reminder',
  'Reminder: please update your payment method',
  E'<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>\n<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">\n  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 12px 12px 0 0;">\n    <h1 style="color: #fff; margin: 0; font-size: 24px;">Payment reminder</h1>\n  </div>\n  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">\n    <p style="font-size: 16px;">Hi {{firstName}},</p>\n    <p>This is a reminder that your payment of <strong>${{amount}}</strong> is still outstanding. Your account remains active, but please update your payment method soon.</p>\n    <div style="text-align: center; margin: 30px 0;">\n      <a href="{{planUrl}}" style="display: inline-block; background: #2E4A7D; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">Update payment method</a>\n    </div>\n    <p style="color: #666; font-size: 14px;">Need help? Reply to this email or contact us at support@promptreviews.app</p>\n  </div>\n  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">\n    <p>\u00a9 2026 Prompt Reviews. All rights reserved.</p>\n  </div>\n</body>\n</html>',
  E'Hi {{firstName}},\n\nThis is a reminder that your payment of ${{amount}} is still outstanding. Your account remains active, but please update your payment method soon.\n\nUpdate payment method: {{planUrl}}\n\nNeed help? Contact us at support@promptreviews.app\n\n\u00a9 2026 Prompt Reviews',
  true
) ON CONFLICT (name) DO NOTHING;

-- Template 7: payment_failed_final
INSERT INTO email_templates (name, subject, html_content, text_content, is_active)
VALUES (
  'payment_failed_final',
  'Final notice: your access will be restricted soon',
  E'<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>\n<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">\n  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 12px 12px 0 0;">\n    <h1 style="color: #fff; margin: 0; font-size: 24px;">Final payment notice</h1>\n  </div>\n  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">\n    <p style="font-size: 16px;">Hi {{firstName}},</p>\n    <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 20px; margin: 20px 0;">\n      <p style="margin: 0; font-weight: 600; color: #991b1b;">Your account access will be restricted in {{daysRemaining}} day(s) unless your payment is resolved.</p>\n    </div>\n    <p>Please update your payment method now to keep your account active and avoid losing access to your reviews, widgets, and analytics.</p>\n    <div style="text-align: center; margin: 30px 0;">\n      <a href="{{planUrl}}" style="display: inline-block; background: #dc2626; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">Update payment now</a>\n    </div>\n    <p style="color: #666; font-size: 14px;">Need help? Reply to this email or contact us at support@promptreviews.app</p>\n  </div>\n  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">\n    <p>\u00a9 2026 Prompt Reviews. All rights reserved.</p>\n  </div>\n</body>\n</html>',
  E'Hi {{firstName}},\n\nYour account access will be restricted in {{daysRemaining}} day(s) unless your payment is resolved.\n\nPlease update your payment method now to keep your account active and avoid losing access to your reviews, widgets, and analytics.\n\nUpdate payment now: {{planUrl}}\n\nNeed help? Contact us at support@promptreviews.app\n\n\u00a9 2026 Prompt Reviews',
  true
) ON CONFLICT (name) DO NOTHING;

-- Template 8: payment_access_restricted
INSERT INTO email_templates (name, subject, html_content, text_content, is_active)
VALUES (
  'payment_access_restricted',
  'Your account access has been restricted',
  E'<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>\n<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">\n  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 12px 12px 0 0;">\n    <h1 style="color: #fff; margin: 0; font-size: 24px;">Account access restricted</h1>\n  </div>\n  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">\n    <p style="font-size: 16px;">Hi {{firstName}},</p>\n    <p>Due to an unresolved payment issue, your account access has been restricted. Your data is safe \u2014 update your payment method to restore full access immediately.</p>\n    <div style="text-align: center; margin: 30px 0;">\n      <a href="{{planUrl}}" style="display: inline-block; background: #2E4A7D; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">Restore access</a>\n    </div>\n    <p style="color: #666; font-size: 14px;">Need help? Reply to this email or contact us at support@promptreviews.app</p>\n  </div>\n  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">\n    <p>\u00a9 2026 Prompt Reviews. All rights reserved.</p>\n  </div>\n</body>\n</html>',
  E'Hi {{firstName}},\n\nDue to an unresolved payment issue, your account access has been restricted. Your data is safe \u2014 update your payment method to restore full access immediately.\n\nRestore access: {{planUrl}}\n\nNeed help? Contact us at support@promptreviews.app\n\n\u00a9 2026 Prompt Reviews',
  true
) ON CONFLICT (name) DO NOTHING;

-- Template 9: payment_recovered
INSERT INTO email_templates (name, subject, html_content, text_content, is_active)
VALUES (
  'payment_recovered',
  'Payment received \u2014 your account is fully restored',
  E'<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>\n<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">\n  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 12px 12px 0 0;">\n    <h1 style="color: #fff; margin: 0; font-size: 24px;">Payment received</h1>\n  </div>\n  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">\n    <p style="font-size: 16px;">Hi {{firstName}},</p>\n    <p>Great news! Your payment of <strong>${{amount}}</strong> has been received and your account is fully restored.</p>\n    <p>Thank you for resolving this. You now have full access to all your Prompt Reviews features.</p>\n    <div style="text-align: center; margin: 30px 0;">\n      <a href="{{dashboardUrl}}" style="display: inline-block; background: #16a34a; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">Go to dashboard</a>\n    </div>\n    <p style="color: #666; font-size: 14px;">Need help? Reply to this email or contact us at support@promptreviews.app</p>\n  </div>\n  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">\n    <p>\u00a9 2026 Prompt Reviews. All rights reserved.</p>\n  </div>\n</body>\n</html>',
  E'Hi {{firstName}},\n\nGreat news! Your payment of ${{amount}} has been received and your account is fully restored.\n\nThank you for resolving this. You now have full access to all your Prompt Reviews features.\n\nGo to dashboard: {{dashboardUrl}}\n\nNeed help? Contact us at support@promptreviews.app\n\n\u00a9 2026 Prompt Reviews',
  true
) ON CONFLICT (name) DO NOTHING;

-- Template 10: cancellation_feedback
INSERT INTO email_templates (name, subject, html_content, text_content, is_active)
VALUES (
  'cancellation_feedback',
  'We''re sorry to see you go',
  E'<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>\n<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">\n  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 12px 12px 0 0;">\n    <h1 style="color: #fff; margin: 0; font-size: 24px;">Account cancelled</h1>\n  </div>\n  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">\n    <p style="font-size: 16px;">Hi {{firstName}},</p>\n    <p>Your Prompt Reviews account has been cancelled. Your data will be retained for 90 days in case you change your mind.</p>\n    <p>We''d love to know how we could improve. If you have a moment, simply reply to this email with any feedback \u2014 it goes directly to our team.</p>\n    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2E4A7D;">\n      <p style="margin: 0; color: #475569;">Want to come back? You can reactivate your account within 90 days by signing in and selecting a plan.</p>\n    </div>\n    <div style="text-align: center; margin: 30px 0;">\n      <a href="{{loginUrl}}" style="display: inline-block; background: #2E4A7D; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">Reactivate account</a>\n    </div>\n    <p style="color: #666; font-size: 14px;">Thank you for trying Prompt Reviews. We wish you the best!</p>\n  </div>\n  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">\n    <p>\u00a9 2026 Prompt Reviews. All rights reserved.</p>\n  </div>\n</body>\n</html>',
  E'Hi {{firstName}},\n\nYour Prompt Reviews account has been cancelled. Your data will be retained for 90 days in case you change your mind.\n\nWe''d love to know how we could improve. Simply reply to this email with any feedback \u2014 it goes directly to our team.\n\nWant to come back? You can reactivate your account within 90 days by signing in and selecting a plan.\n\nReactivate account: {{loginUrl}}\n\nThank you for trying Prompt Reviews. We wish you the best!\n\n\u00a9 2026 Prompt Reviews',
  true
) ON CONFLICT (name) DO NOTHING;

-- Template 11: post_expiration_1_week
INSERT INTO email_templates (name, subject, html_content, text_content, is_active)
VALUES (
  'post_expiration_1_week',
  'Your trial ended \u2014 your data is still waiting',
  E'<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>\n<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">\n  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 12px 12px 0 0;">\n    <h1 style="color: #fff; margin: 0; font-size: 24px;">We saved your spot</h1>\n  </div>\n  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">\n    <p style="font-size: 16px;">Hi {{firstName}},</p>\n    <p>It''s been a week since your trial ended, and everything you set up is still here \u2014 your prompt pages, widgets, and reviews are all saved.</p>\n    <p>Pick up where you left off by choosing a plan that fits your business.</p>\n    <div style="text-align: center; margin: 30px 0;">\n      <a href="{{upgradeUrl}}" style="display: inline-block; background: #2E4A7D; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">Choose a plan</a>\n    </div>\n    <p style="color: #666; font-size: 14px;">Need help deciding? Reply to this email and we''ll help you pick the right plan.</p>\n  </div>\n  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">\n    <p>\u00a9 2026 Prompt Reviews. All rights reserved.</p>\n  </div>\n</body>\n</html>',
  E'Hi {{firstName}},\n\nIt''s been a week since your trial ended, and everything you set up is still here \u2014 your prompt pages, widgets, and reviews are all saved.\n\nPick up where you left off by choosing a plan that fits your business.\n\nChoose a plan: {{upgradeUrl}}\n\nNeed help deciding? Reply to this email and we''ll help you pick the right plan.\n\n\u00a9 2026 Prompt Reviews',
  true
) ON CONFLICT (name) DO NOTHING;

-- Template 12: post_expiration_1_month
INSERT INTO email_templates (name, subject, html_content, text_content, is_active)
VALUES (
  'post_expiration_1_month',
  'Last chance: your Prompt Reviews data will be removed soon',
  E'<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>\n<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">\n  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 12px 12px 0 0;">\n    <h1 style="color: #fff; margin: 0; font-size: 24px;">Your data will be removed soon</h1>\n  </div>\n  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">\n    <p style="font-size: 16px;">Hi {{firstName}},</p>\n    <p>It''s been a month since your Prompt Reviews trial ended. Your data \u2014 including prompt pages, reviews, and widgets \u2014 will be removed soon.</p>\n    <p>If you''d like to keep your data and continue using Prompt Reviews, choose a plan today.</p>\n    <div style="text-align: center; margin: 30px 0;">\n      <a href="{{upgradeUrl}}" style="display: inline-block; background: #dc2626; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">Save my data</a>\n    </div>\n    <p style="color: #666; font-size: 14px;">If you no longer need your account, no action is required.</p>\n  </div>\n  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">\n    <p>\u00a9 2026 Prompt Reviews. All rights reserved.</p>\n  </div>\n</body>\n</html>',
  E'Hi {{firstName}},\n\nIt''s been a month since your Prompt Reviews trial ended. Your data \u2014 including prompt pages, reviews, and widgets \u2014 will be removed soon.\n\nIf you''d like to keep your data and continue using Prompt Reviews, choose a plan today.\n\nSave my data: {{upgradeUrl}}\n\nIf you no longer need your account, no action is required.\n\n\u00a9 2026 Prompt Reviews',
  true
) ON CONFLICT (name) DO NOTHING;

-- Template 13: team_member_welcome
INSERT INTO email_templates (name, subject, html_content, text_content, is_active)
VALUES (
  'team_member_welcome',
  'Welcome to {{businessName}} on Prompt Reviews',
  E'<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>\n<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">\n  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 12px 12px 0 0;">\n    <h1 style="color: #fff; margin: 0; font-size: 24px;">Welcome to the team!</h1>\n  </div>\n  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">\n    <p style="font-size: 16px;">Hi {{firstName}},</p>\n    <p>You''ve successfully joined <strong>{{businessName}}</strong> on Prompt Reviews as a <strong>{{role}}</strong>.</p>\n    <p>You now have access to the team dashboard where you can help manage reviews, prompt pages, and more.</p>\n    <div style="text-align: center; margin: 30px 0;">\n      <a href="{{dashboardUrl}}" style="display: inline-block; background: #2E4A7D; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">Go to dashboard</a>\n    </div>\n    <p style="color: #666; font-size: 14px;">Need help? Reply to this email or contact us at support@promptreviews.app</p>\n  </div>\n  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">\n    <p>\u00a9 2026 Prompt Reviews. All rights reserved.</p>\n  </div>\n</body>\n</html>',
  E'Hi {{firstName}},\n\nYou''ve successfully joined {{businessName}} on Prompt Reviews as a {{role}}.\n\nYou now have access to the team dashboard where you can help manage reviews, prompt pages, and more.\n\nGo to dashboard: {{dashboardUrl}}\n\nNeed help? Contact us at support@promptreviews.app\n\n\u00a9 2026 Prompt Reviews',
  true
) ON CONFLICT (name) DO NOTHING;

-- Template 14: milestone_first_review
INSERT INTO email_templates (name, subject, html_content, text_content, is_active)
VALUES (
  'milestone_first_review',
  'You just got your first review!',
  E'<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>\n<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">\n  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 12px 12px 0 0;">\n    <h1 style="color: #fff; margin: 0; font-size: 24px;">Congratulations!</h1>\n  </div>\n  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">\n    <p style="font-size: 16px;">Hi {{firstName}},</p>\n    <p>You just received your first review through Prompt Reviews \u2014 that''s a great milestone!</p>\n    <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">\n      <p style="margin: 0 0 10px 0; font-weight: bold; color: #166534;">What''s next?</p>\n      <ul style="color: #475569; margin: 0; padding-left: 20px;">\n        <li>Share your prompt page link with more customers</li>\n        <li>Add a review widget to your website</li>\n        <li>Set up automated review requests</li>\n      </ul>\n    </div>\n    <div style="text-align: center; margin: 30px 0;">\n      <a href="{{reviewsUrl}}" style="display: inline-block; background: #16a34a; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">View your review</a>\n    </div>\n    <p style="color: #666; font-size: 14px;">Keep it up! Every review helps build trust with potential customers.</p>\n  </div>\n  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">\n    <p>\u00a9 2026 Prompt Reviews. All rights reserved.</p>\n  </div>\n</body>\n</html>',
  E'Hi {{firstName}},\n\nYou just received your first review through Prompt Reviews \u2014 that''s a great milestone!\n\nWhat''s next?\n- Share your prompt page link with more customers\n- Add a review widget to your website\n- Set up automated review requests\n\nView your review: {{reviewsUrl}}\n\nKeep it up! Every review helps build trust with potential customers.\n\n\u00a9 2026 Prompt Reviews',
  true
) ON CONFLICT (name) DO NOTHING;

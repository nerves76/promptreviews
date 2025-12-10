-- Migration: Add review_auto_verified notification type
-- This enables notifications when a Prompt Page submission is auto-verified against Google

-- =============================================================================
-- 1. Add review_auto_verified to notification_type enum
-- =============================================================================
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'review_auto_verified';

-- =============================================================================
-- 2. Add notification preference columns
-- =============================================================================
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS in_app_review_auto_verified BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_review_auto_verified BOOLEAN DEFAULT TRUE;

-- =============================================================================
-- 3. Insert email template for auto-verified reviews
-- =============================================================================
INSERT INTO email_templates (name, subject, html_content, text_content, is_active) VALUES (
  'review_auto_verified',
  'Great news! {{reviewerName}}''s review is now live on Google',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #16a34a; margin-bottom: 20px;">Your Review Has Been Verified!</h2>

  <p style="color: #475569; margin-bottom: 20px;">
    Hi {{firstName}},
  </p>

  <p style="color: #475569; margin-bottom: 20px;">
    Great news! A review submitted through your Prompt Page has been published on Google and automatically verified.
  </p>

  <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #16a34a;">
    <div style="margin-bottom: 10px;">
      <span style="font-weight: bold; color: #166534;">{{reviewerName}}</span>
      <span style="margin-left: 10px; color: #facc15;">{{starRatingStars}}</span>
    </div>
    <p style="color: #475569; margin: 0; font-style: italic;">"{{reviewContent}}"</p>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="{{reviewsUrl}}"
       style="background: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
      View All Reviews
    </a>
  </div>

  <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
    <strong>What does this mean?</strong><br>
    When customers submit reviews through your Prompt Page and then post them on Google, we automatically verify the match. This confirmed review is now counted in your verified reviews.
  </p>

  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

  <p style="color: #94a3b8; font-size: 12px; text-align: center;">
    Prompt Reviews | <a href="{{accountUrl}}" style="color: #94a3b8;">Manage Notification Settings</a>
  </p>
</div>',
  'Your Review Has Been Verified!

Hi {{firstName}},

Great news! A review submitted through your Prompt Page has been published on Google and automatically verified.

{{reviewerName}} - {{starRatingStars}}
"{{reviewContent}}"

View all reviews: {{reviewsUrl}}

What does this mean?
When customers submit reviews through your Prompt Page and then post them on Google, we automatically verify the match. This confirmed review is now counted in your verified reviews.

Prompt Reviews | Manage Notification Settings: {{accountUrl}}',
  true
) ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  text_content = EXCLUDED.text_content,
  is_active = EXCLUDED.is_active;

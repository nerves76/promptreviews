-- Create email_templates table for managing email templates
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies (only admins can manage templates)
CREATE POLICY "Admins can view email templates"
    ON public.email_templates FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE account_id = auth.uid()
        )
    );

CREATE POLICY "Admins can insert email templates"
    ON public.email_templates FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE account_id = auth.uid()
        )
    );

CREATE POLICY "Admins can update email templates"
    ON public.email_templates FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE account_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE account_id = auth.uid()
        )
    );

CREATE POLICY "Admins can delete email templates"
    ON public.email_templates FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE account_id = auth.uid()
        )
    );

-- Create updated_at trigger
CREATE TRIGGER handle_email_templates_updated_at
    BEFORE UPDATE ON public.email_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert default email templates
INSERT INTO public.email_templates (name, subject, html_content, text_content) VALUES
(
    'welcome',
    'Welcome to PromptReviews! 🎉',
    '<p>Hi {{firstName}},</p>

<p>I''m really glad you''re here. Even if it''s just for a short ride.</p>

<p>Prompt Reviews isn''t just an app—it''s a tool to help small businesses like yours earn the 5-star feedback you deserve, without nagging or chasing your customers.</p>

<p>In a world where big companies are rushing to replace humans with AI, you offer something they can''t: real connection. People want to support small businesses. They want to give back. Sometimes they just need a little nudge—and an easy way to do it.</p>

<p>That''s where Prompt Reviews comes in.<br>
It helps your customers say what they already feel—it helps them help you.</p>

<p><strong>Did you know:</strong></p>
<ul>
  <li>Every 10 Google reviews = 2.7% more conversions</li>
  <li>25% of people check 3+ sites before making a decision</li>
</ul>

<p>Reviews matter. Let''s make them easier to collect—and more meaningful.</p>

<p>👉 <a href="{{dashboardUrl}}">Get started here</a></p>

<p>Let me know how it goes.</p>

<p>If you ever want help or ideas, I''d love to hear from you.</p>

<p>– Chris<br>
Founder, Prompt Reviews<br>
(Oh, Prompty says, Hi!)</p>

<p><small>You can also <a href="{{loginUrl}}">log in here</a> anytime.</small></p>',
    'Hi {{firstName}},

I''m really glad you''re here. Even if it''s just for a short ride.

Prompt Reviews isn''t just an app—it''s a tool to help small businesses like yours earn the 5-star feedback you deserve, without nagging or chasing your customers.

In a world where big companies are rushing to replace humans with AI, you offer something they can''t: real connection. People want to support small businesses. They want to give back. Sometimes they just need a little nudge—and an easy way to do it.

That''s where Prompt Reviews comes in.
It helps your customers say what they already feel—it helps them help you.

Did you know:
- Every 10 Google reviews = 2.7% more conversions
- 25% of people check 3+ sites before making a decision

Reviews matter. Let''s make them easier to collect—and more meaningful.

Get started here: {{dashboardUrl}}

Let me know how it goes.

If you ever want help or ideas, I''d love to hear from you.

– Chris
Founder, Prompt Reviews
(Oh, Prompty says, Hi!)

You can also log in here anytime: {{loginUrl}}'
),
(
    'trial_reminder',
    'Your PromptReviews trial expires in 3 days! ⏰',
    '<p>Hi {{firstName}},</p>

<p>Just a friendly reminder that your PromptReviews trial expires in <strong>3 days</strong>.</p>

<p>Don''t lose access to all the great features you''ve been using:</p>
<ul>
  <li>✅ Universal prompt page</li>
  <li>✅ Custom prompt pages</li>
  <li>✅ Review widget</li>
  <li>✅ And more!</li>
</ul>

<p>Upgrade now to keep collecting those 5-star reviews and growing your business:</p>

<p><a href="{{upgradeUrl}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Upgrade Now - $15/month</a></p>

<p>Questions? Just reply to this email - I''m here to help!</p>

<p>– Chris<br>
Founder, Prompt Reviews</p>',
    'Hi {{firstName}},

Just a friendly reminder that your PromptReviews trial expires in 3 days.

Don''t lose access to all the great features you''ve been using:
✅ Universal prompt page
✅ Custom prompt pages
✅ Review widget
✅ And more!

Upgrade now to keep collecting those 5-star reviews and growing your business:

{{upgradeUrl}}

Questions? Just reply to this email - I''m here to help!

– Chris
Founder, Prompt Reviews'
),
(
    'trial_expired',
    'Your PromptReviews trial has expired 😔',
    '<p>Hi {{firstName}},</p>

<p>Your PromptReviews trial has expired. We''re sad to see you go!</p>

<p>But don''t worry - you can still upgrade and get back to collecting those amazing reviews:</p>

<p><a href="{{upgradeUrl}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Upgrade Now - $15/month</a></p>

<p>Remember what you were building:</p>
<ul>
  <li>🌟 More 5-star reviews</li>
  <li>🌟 Better online visibility</li>
  <li>🌟 Happy customers spreading the word</li>
</ul>

<p>Ready to continue? Just click the button above!</p>

<p>– Chris<br>
Founder, Prompt Reviews</p>',
    'Hi {{firstName}},

Your PromptReviews trial has expired. We''re sad to see you go!

But don''t worry - you can still upgrade and get back to collecting those amazing reviews:

{{upgradeUrl}}

Remember what you were building:
🌟 More 5-star reviews
🌟 Better online visibility
🌟 Happy customers spreading the word

Ready to continue? Just click the link above!

– Chris
Founder, Prompt Reviews'
);

-- Add comments
COMMENT ON TABLE public.email_templates IS 'Stores email templates for various system emails';
COMMENT ON COLUMN public.email_templates.name IS 'Unique identifier for the template (e.g., welcome, trial_reminder)';
COMMENT ON COLUMN public.email_templates.subject IS 'Email subject line';
COMMENT ON COLUMN public.email_templates.html_content IS 'HTML version of the email content with template variables';
COMMENT ON COLUMN public.email_templates.text_content IS 'Plain text version of the email content with template variables';
COMMENT ON COLUMN public.email_templates.is_active IS 'Whether this template is currently active'; 
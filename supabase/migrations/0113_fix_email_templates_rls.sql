-- Fix email templates RLS policies to use new is_admin column
-- and add missing email templates for review notifications

-- Drop existing policies that reference the old admins table
DROP POLICY IF EXISTS "Admins can view email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admins can insert email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admins can update email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admins can delete email templates" ON public.email_templates;

-- Create new policies using the is_admin column
CREATE POLICY "Admins can view email templates"
    ON public.email_templates FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.accounts 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admins can insert email templates"
    ON public.email_templates FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.accounts 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admins can update email templates"
    ON public.email_templates FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.accounts 
            WHERE id = auth.uid() AND is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.accounts 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admins can delete email templates"
    ON public.email_templates FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.accounts 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Add missing email templates for review notifications
INSERT INTO public.email_templates (name, subject, html_content, text_content, is_active) VALUES
(
    'review_praise_notification',
    'You''ve got praise! {{reviewerName}} submitted a review on {{platform}} 🌟',
    '<p>Hi {{firstName}},</p>

<p><strong>Great news!</strong> {{reviewerName}} just submitted a positive review on {{platform}}.</p>

<p>Here''s what they said:</p>
<blockquote style="background-color: #f3f4f6; border-left: 4px solid #4F46E5; padding: 16px; margin: 16px 0; font-style: italic;">
{{reviewContent}}
</blockquote>

<p>Great reviews like this help your business get found online and build trust with potential customers!</p>

<p><strong>What you can do next:</strong></p>
<ul>
  <li>✅ Thank {{reviewerName}} for their feedback</li>
  <li>✅ Share this review on your website or social media</li>
  <li>✅ Keep up the excellent work that earned this praise!</li>
</ul>

<p><a href="{{dashboardUrl}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">View Dashboard</a></p>

<p>Keep up the great work!</p>

<p>– Chris<br>
Founder, Prompt Reviews</p>',
    'Hi {{firstName}},

Great news! {{reviewerName}} just submitted a positive review on {{platform}}.

Here''s what they said:
"{{reviewContent}}"

Great reviews like this help your business get found online and build trust with potential customers!

What you can do next:
✅ Thank {{reviewerName}} for their feedback
✅ Share this review on your website or social media
✅ Keep up the excellent work that earned this praise!

View your dashboard: {{dashboardUrl}}

Keep up the great work!

– Chris
Founder, Prompt Reviews',
    true
),
(
    'review_feedback_notification',
    'You''ve got feedback: {{reviewerName}} submitted feedback 💡',
    '<p>Hi {{firstName}},</p>

<p>{{reviewerName}} just submitted feedback through your prompt page.</p>

<p>Here''s what they shared:</p>
<blockquote style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0; font-style: italic;">
{{reviewContent}}
</blockquote>

<p>This feedback is valuable - it''s an opportunity to improve and show your commitment to customer satisfaction.</p>

<p><strong>What you can do next:</strong></p>
<ul>
  <li>✅ Follow up with {{reviewerName}} to address their concerns</li>
  <li>✅ Use this insight to improve your processes</li>
  <li>✅ Turn this feedback into a positive experience</li>
</ul>

<p><a href="{{dashboardUrl}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">View Dashboard</a></p>

<p>Every piece of feedback is an opportunity to grow!</p>

<p>– Chris<br>
Founder, Prompt Reviews</p>',
    'Hi {{firstName}},

{{reviewerName}} just submitted feedback through your prompt page.

Here''s what they shared:
"{{reviewContent}}"

This feedback is valuable - it''s an opportunity to improve and show your commitment to customer satisfaction.

What you can do next:
✅ Follow up with {{reviewerName}} to address their concerns
✅ Use this insight to improve your processes
✅ Turn this feedback into a positive experience

View your dashboard: {{dashboardUrl}}

Every piece of feedback is an opportunity to grow!

– Chris
Founder, Prompt Reviews',
    true
),
(
    'review_testimonial_notification',
    'You''ve got praise! {{reviewerName}} submitted a testimonial & photo 📸',
    '<p>Hi {{firstName}},</p>

<p><strong>Wonderful news!</strong> {{reviewerName}} just submitted a testimonial and photo for your business.</p>

<p>Here''s what they shared:</p>
<blockquote style="background-color: #f3f4f6; border-left: 4px solid #4F46E5; padding: 16px; margin: 16px 0; font-style: italic;">
{{reviewContent}}
</blockquote>

<p>Testimonials with photos are incredibly powerful for building trust and credibility!</p>

<p><strong>What you can do next:</strong></p>
<ul>
  <li>✅ Thank {{reviewerName}} for their time and testimonial</li>
  <li>✅ Use this testimonial on your website or marketing materials</li>
  <li>✅ Share the photo on social media (with permission)</li>
</ul>

<p><a href="{{dashboardUrl}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">View Dashboard</a></p>

<p>Keep up the amazing work!</p>

<p>– Chris<br>
Founder, Prompt Reviews</p>',
    'Hi {{firstName}},

Wonderful news! {{reviewerName}} just submitted a testimonial and photo for your business.

Here''s what they shared:
"{{reviewContent}}"

Testimonials with photos are incredibly powerful for building trust and credibility!

What you can do next:
✅ Thank {{reviewerName}} for their time and testimonial
✅ Use this testimonial on your website or marketing materials
✅ Share the photo on social media (with permission)

View your dashboard: {{dashboardUrl}}

Keep up the amazing work!

– Chris
Founder, Prompt Reviews',
    true
)
ON CONFLICT (name) DO NOTHING;

-- Add comments for the new templates
COMMENT ON TABLE public.email_templates IS 'Stores email templates for various system emails including review notifications'; 
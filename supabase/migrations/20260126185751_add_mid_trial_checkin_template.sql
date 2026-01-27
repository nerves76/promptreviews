-- Add mid-trial check-in email template (sent on day 7 of 14-day trial)
INSERT INTO public.email_templates (name, subject, html_content, text_content) VALUES
(
    'mid_trial_checkin',
    'How''s your first week going? 🌱',
    '<p>Hi {{firstName}},</p>

<p>You''re one week into your Prompt Reviews trial – how''s it going?</p>

<p>I hope you''re starting to see how easy it can be to collect genuine reviews from your happiest customers. Every great review is a tiny lighthouse guiding new customers to your door.</p>

<p><strong>Quick wins you can grab this week:</strong></p>
<ul>
  <li>🎯 Share your prompt page link with 3 recent customers</li>
  <li>⭐ Add the review widget to your website</li>
  <li>📱 Try the QR code at your checkout counter</li>
</ul>

<p>You have <strong>7 days left</strong> in your trial. Plenty of time to see real results – but only if you take that first step.</p>

<p><a href="{{dashboardUrl}}" style="background-color: #2E4A7D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Go to your dashboard</a></p>

<p>Small businesses thrive on word-of-mouth. Let''s make yours louder.</p>

<p>Cheering you on,</p>

<p>– Chris<br>
Founder, Prompt Reviews</p>

<p><small>P.S. Hit reply if you have any questions – I read every message.</small></p>',
    'Hi {{firstName}},

You''re one week into your Prompt Reviews trial – how''s it going?

I hope you''re starting to see how easy it can be to collect genuine reviews from your happiest customers. Every great review is a tiny lighthouse guiding new customers to your door.

Quick wins you can grab this week:
🎯 Share your prompt page link with 3 recent customers
⭐ Add the review widget to your website
📱 Try the QR code at your checkout counter

You have 7 days left in your trial. Plenty of time to see real results – but only if you take that first step.

Go to your dashboard: {{dashboardUrl}}

Small businesses thrive on word-of-mouth. Let''s make yours louder.

Cheering you on,

– Chris
Founder, Prompt Reviews

P.S. Hit reply if you have any questions – I read every message.'
);

-- Update trial_expired template to be more "last chance" focused
UPDATE public.email_templates
SET
    subject = 'Your trial ended – but it''s not too late ⏰',
    html_content = '<p>Hi {{firstName}},</p>

<p>Your Prompt Reviews trial ended today.</p>

<p>I get it – life is busy. Maybe you didn''t get a chance to fully explore what we built for you. That''s okay.</p>

<p>But here''s the thing: the reviews you could be collecting <em>right now</em> are the ones that will bring in customers next month. Every day without them is a missed opportunity.</p>

<p><strong>What you''re leaving on the table:</strong></p>
<ul>
  <li>🌟 A simple way for happy customers to share their experience</li>
  <li>🌟 More visibility on Google and other review sites</li>
  <li>🌟 Social proof that turns browsers into buyers</li>
</ul>

<p>For less than the cost of a coffee, you can unlock it all again:</p>

<p><a href="{{upgradeUrl}}" style="background-color: #2E4A7D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Upgrade for $15/month</a></p>

<p>Your prompt pages and settings are all still here, waiting for you.</p>

<p>Hope to see you back,</p>

<p>– Chris<br>
Founder, Prompt Reviews</p>',
    text_content = 'Hi {{firstName}},

Your Prompt Reviews trial ended today.

I get it – life is busy. Maybe you didn''t get a chance to fully explore what we built for you. That''s okay.

But here''s the thing: the reviews you could be collecting right now are the ones that will bring in customers next month. Every day without them is a missed opportunity.

What you''re leaving on the table:
🌟 A simple way for happy customers to share their experience
🌟 More visibility on Google and other review sites
🌟 Social proof that turns browsers into buyers

For less than the cost of a coffee, you can unlock it all again:

Upgrade for $15/month: {{upgradeUrl}}

Your prompt pages and settings are all still here, waiting for you.

Hope to see you back,

– Chris
Founder, Prompt Reviews',
    updated_at = NOW()
WHERE name = 'trial_expired';

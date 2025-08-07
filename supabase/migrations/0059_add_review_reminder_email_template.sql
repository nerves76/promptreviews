-- Add review reminder email template
INSERT INTO email_templates (name, subject, html_content, text_content) VALUES (
    'review_reminder',
    'You have {{reviewCount}} Google reviews that need responses',
    '<p>Hi {{firstName}},</p>

<p>You have <strong>{{reviewCount}}</strong> Google reviews across <strong>{{accountCount}}</strong> business locations that haven''t been responded to yet:</p>

{{#each accounts}}
<div style="margin: 20px 0; padding: 15px; border-left: 4px solid #475569; background-color: #f8fafc;">
  <h3 style="margin: 0 0 10px 0; color: #475569;">{{businessName}}</h3>
  <p style="margin: 0; color: #64748b;">{{reviewCount}} review{{#if multipleReviews}}s{{/if}} needing response{{#if locationName}} for {{locationName}}{{/if}}</p>
</div>
{{/each}}

<p>Responding to reviews helps improve your business visibility and customer satisfaction. It also shows potential customers that you care about feedback.</p>

<p><a href="{{dashboardUrl}}" style="background-color: #475569; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">View & Respond to Reviews</a></p>

<p>Best regards,<br>
Prompt Reviews Team</p>',
    'Hi {{firstName}},

You have {{reviewCount}} Google reviews across {{accountCount}} business locations that haven''t been responded to yet:

{{#each accounts}}
• {{businessName}}: {{reviewCount}} review{{#if multipleReviews}}s{{/if}}{{#if locationName}} ({{locationName}}){{/if}}
{{/each}}

Responding to reviews helps improve your business visibility and customer satisfaction.

View & Respond to Reviews: {{dashboardUrl}}

Best regards,
Prompt Reviews Team'
); 
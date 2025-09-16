-- Add communication follow-up reminder email template
INSERT INTO email_templates (
  name, 
  subject, 
  html_content, 
  text_content, 
  created_at, 
  updated_at
) VALUES (
  'Communication Follow-up Reminder',
  'Follow-up: {{original_subject}}',
  '<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1a1a1a; margin-bottom: 20px;">Follow-up Reminder</h2>
  
  <p style="color: #4a4a4a; line-height: 1.6;">Hi {{customer_name}},</p>
  
  <p style="color: #4a4a4a; line-height: 1.6;">
    This is a friendly reminder to follow up with you regarding our previous communication.
  </p>
  
  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
      <strong>Original message sent on {{original_date}}:</strong>
    </p>
    <p style="color: #4a4a4a; line-height: 1.6; margin: 0;">
      {{original_message}}
    </p>
  </div>
  
  <p style="color: #4a4a4a; line-height: 1.6;">
    We value your feedback and would love to hear from you. If you have a moment, 
    we''d greatly appreciate it if you could share your experience with us.
  </p>
  
  {{#if review_url}}
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{review_url}}" 
       style="display: inline-block; background-color: #4CAF50; color: white; 
              padding: 12px 30px; text-decoration: none; border-radius: 5px; 
              font-weight: 600;">
      Share Your Feedback
    </a>
  </div>
  {{/if}}
  
  <p style="color: #4a4a4a; line-height: 1.6;">
    If you have any questions or need assistance, please don''t hesitate to reach out.
  </p>
  
  <p style="color: #4a4a4a; line-height: 1.6;">
    Best regards,<br>
    {{business_name}} Team
  </p>
  
  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
  
  <p style="color: #999; font-size: 12px; text-align: center;">
    You''re receiving this email because you''re a valued customer of {{business_name}}.
  </p>
</div>',
  'Follow-up Reminder

Hi {{customer_name}},

This is a friendly reminder to follow up with you regarding our previous communication.

Original message sent on {{original_date}}:
{{original_message}}

We value your feedback and would love to hear from you. If you have a moment, we''d greatly appreciate it if you could share your experience with us.

{{#if review_url}}
Share Your Feedback: {{review_url}}
{{/if}}

If you have any questions or need assistance, please don''t hesitate to reach out.

Best regards,
{{business_name}} Team

---
You''re receiving this email because you''re a valued customer of {{business_name}}.',
  NOW(),
  NOW()
) ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  text_content = EXCLUDED.text_content,
  updated_at = NOW();
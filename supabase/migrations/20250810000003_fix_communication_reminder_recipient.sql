-- Fix communication follow-up reminder email template to be appropriate for business owners
-- The reminder should go to the business owner to remind them to follow up with their customer

UPDATE email_templates 
SET 
  subject = 'Reminder: Follow up with {{customer_name}} about their review',
  html_content = '<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1a1a1a; margin-bottom: 20px;">Review Follow-up Reminder</h2>
  
  <p style="color: #4a4a4a; line-height: 1.6;">Hi {{customer_name}},</p>
  
  <p style="color: #4a4a4a; line-height: 1.6;">
    This is a reminder that you reached out to a customer about leaving a review, but haven''t received one yet.
  </p>
  
  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
      <strong>Original communication sent {{original_date}}:</strong>
    </p>
    {{#if original_subject}}
    <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
      <strong>Subject:</strong> {{original_subject}}
    </p>
    {{/if}}
    <p style="color: #4a4a4a; line-height: 1.6; margin: 0;">
      {{original_message}}
    </p>
  </div>
  
  <p style="color: #4a4a4a; line-height: 1.6;">
    Consider sending a friendly follow-up to encourage them to share their feedback. 
    A gentle reminder often helps customers who intended to leave a review but forgot.
  </p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{review_url}}" 
       style="display: inline-block; background-color: #4CAF50; color: white; 
              padding: 12px 30px; text-decoration: none; border-radius: 5px; 
              font-weight: 600;">
      View Contacts & Send Follow-up
    </a>
  </div>
  
  <p style="color: #4a4a4a; line-height: 1.6;">
    <strong>Tips for effective follow-ups:</strong>
  </p>
  <ul style="color: #4a4a4a; line-height: 1.6;">
    <li>Keep it friendly and brief</li>
    <li>Remind them of their positive experience</li>
    <li>Make it easy with a direct link to leave a review</li>
    <li>Thank them for their time</li>
  </ul>
  
  <p style="color: #4a4a4a; line-height: 1.6;">
    Best regards,<br>
    The {{business_name}} Team
  </p>
  
  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
  
  <p style="color: #999; font-size: 12px; text-align: center;">
    This is an automated reminder from your Prompt Reviews account. 
    You set this follow-up reminder when you originally contacted your customer.
  </p>
</div>',
  text_content = 'Review Follow-up Reminder

Hi {{customer_name}},

This is a reminder that you reached out to a customer about leaving a review, but haven''t received one yet.

Original communication sent {{original_date}}:
{{#if original_subject}}Subject: {{original_subject}}{{/if}}
{{original_message}}

Consider sending a friendly follow-up to encourage them to share their feedback. A gentle reminder often helps customers who intended to leave a review but forgot.

View Contacts & Send Follow-up: {{review_url}}

Tips for effective follow-ups:
• Keep it friendly and brief
• Remind them of their positive experience
• Make it easy with a direct link to leave a review
• Thank them for their time

Best regards,
The {{business_name}} Team

---
This is an automated reminder from your Prompt Reviews account. You set this follow-up reminder when you originally contacted your customer.',
  updated_at = NOW()
WHERE name = 'Communication Follow-up Reminder';
-- Fix communication follow-up reminder email template to be appropriate for business owners
-- The reminder should go to the business owner to remind them to follow up with their customer

UPDATE email_templates 
SET 
  subject = 'Your requested follow-up reminder: {{customer_name}}',
  html_content = '<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #FFF3CD; border: 1px solid #FFC107; border-radius: 8px; padding: 12px; margin-bottom: 20px;">
    <p style="color: #856404; margin: 0; font-size: 14px;">
      <strong>📅 This is the follow-up reminder you scheduled</strong><br>
      You asked us to remind you to follow up with this customer if they hadn''t submitted a review yet.
    </p>
  </div>

  <h2 style="color: #1a1a1a; margin-bottom: 20px;">Time to follow up with {{customer_name}}</h2>
  
  <p style="color: #4a4a4a; line-height: 1.6;">Hi {{business_owner_name}},</p>
  
  <p style="color: #4a4a4a; line-height: 1.6;">
    {{original_date}}, you reached out to <strong>{{customer_name}}</strong> requesting a review, and you asked us to remind you to follow up if needed.
  </p>

  <p style="color: #4a4a4a; line-height: 1.6;">
    <strong>Good news:</strong> They haven''t submitted a review yet, so there''s still an opportunity to get their feedback!
  </p>
  
  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
      <strong>Customer Details:</strong>
    </p>
    <ul style="color: #4a4a4a; margin: 5px 0; padding-left: 20px;">
      <li><strong>Name:</strong> {{customer_name}}</li>
      {{#if customer_email}}<li><strong>Email:</strong> {{customer_email}}</li>{{/if}}
      {{#if customer_phone}}<li><strong>Phone:</strong> {{customer_phone}} (send a text)</li>{{/if}}
    </ul>
    
    <p style="color: #666; font-size: 14px; margin: 15px 0 10px 0;">
      <strong>Your original message:</strong>
    </p>
    <p style="color: #4a4a4a; line-height: 1.6; margin: 0; padding: 10px; background: white; border-radius: 4px;">
      "{{original_message}}"
    </p>
  </div>
  
  <p style="color: #4a4a4a; line-height: 1.6;">
    <strong>Suggested next steps:</strong>
  </p>
  <ol style="color: #4a4a4a; line-height: 1.8;">
    <li>Check if they actually left a review on another platform</li>
    <li>Send a friendly follow-up text or email</li>
    <li>Include the review link to make it easy for them</li>
    <li>Thank them for their business</li>
  </ol>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{review_url}}" 
       style="display: inline-block; background-color: #4CAF50; color: white; 
              padding: 12px 30px; text-decoration: none; border-radius: 5px; 
              font-weight: 600;">
      View Contact & Send Follow-up
    </a>
  </div>
  
  <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">
    <strong>Pro tip:</strong> Most customers who don''t leave reviews simply forgot or got busy. A friendly reminder showing you value their feedback often does the trick!
  </p>
  
  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
  
  <p style="color: #999; font-size: 12px; text-align: center;">
    You''re receiving this because you set a follow-up reminder in Prompt Reviews.<br>
    To adjust your reminder preferences, visit your dashboard settings.
  </p>
</div>',
  text_content = '📅 This is the follow-up reminder you scheduled

Hi {{business_owner_name}},

{{original_date}}, you reached out to {{customer_name}} requesting a review, and you asked us to remind you to follow up if needed.

Good news: They haven''t submitted a review yet, so there''s still an opportunity to get their feedback!

Customer Details:
• Name: {{customer_name}}
{{#if customer_email}}• Email: {{customer_email}}{{/if}}
{{#if customer_phone}}• Phone: {{customer_phone}} (send a text){{/if}}

Your original message:
"{{original_message}}"

Suggested next steps:
1. Check if they actually left a review on another platform
2. Send a friendly follow-up text or email
3. Include the review link to make it easy for them
4. Thank them for their business

View Contact & Send Follow-up: {{review_url}}

Pro tip: Most customers who don''t leave reviews simply forgot or got busy. A friendly reminder showing you value their feedback often does the trick!

---
You''re receiving this because you set a follow-up reminder in Prompt Reviews.
To adjust your reminder preferences, visit your dashboard settings.',
  updated_at = NOW()
WHERE name = 'Communication Follow-up Reminder';
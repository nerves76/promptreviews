-- Add email template for admin notifications when new users join
INSERT INTO public.email_templates (name, subject, html_content, text_content, is_active) VALUES (
  'admin_new_user_notification',
  'New user joined: {{firstName}} {{lastName}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New User Signup</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="text-align: center; padding: 20px 0; border-bottom: 3px solid #475569;">
      <h1 style="color: #475569; margin: 0; font-size: 28px;">🎉 New User Signup</h1>
    </div>

    <!-- Content -->
    <div style="padding: 30px 0;">
      <p style="font-size: 18px; margin-bottom: 20px;">A new user has joined Prompt Reviews!</p>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #475569;">
        <h3 style="margin: 0 0 15px 0; color: #475569;">User Details:</h3>
        <p style="margin: 5px 0;"><strong>Name:</strong> {{firstName}} {{lastName}}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> {{userEmail}}</p>
        <p style="margin: 5px 0;"><strong>Joined:</strong> {{joinDate}}</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{dashboardUrl}}/admin" 
           style="background: #475569; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
          View Admin Dashboard
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e2e8f0; margin-top: 30px;">
      <p style="color: #64748b; font-size: 14px; margin: 0;">
        This is an automated notification from Prompt Reviews
      </p>
    </div>
  </div>
</body>
</html>',
  'New User Signup

A new user has joined Prompt Reviews!

User Details:
Name: {{firstName}} {{lastName}}
Email: {{userEmail}}
Joined: {{joinDate}}

View admin dashboard: {{dashboardUrl}}/admin

---
This is an automated notification from Prompt Reviews',
  true
); 
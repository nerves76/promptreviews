-- Add team_invitation email template
INSERT INTO email_templates (name, subject, html_content, text_content, is_active) VALUES (
    'team_invitation',
    'You''re invited to join {{businessName}} on Prompt Reviews! 🎉',
    '<p>Hi there!</p>

<p>{{inviterName}} has invited you to join <strong>{{businessName}}</strong> on Prompt Reviews as a <strong>{{role}}</strong>.</p>

<p>Prompt Reviews helps businesses collect authentic 5-star reviews from their customers. As a team member, you''ll be able to:</p>

<ul>
  <li>✅ View and manage review pages</li>
  <li>✅ Access analytics and insights</li>
  <li>✅ Help grow the business through better reviews</li>
</ul>

<p><strong>Ready to join the team?</strong></p>

<p><a href="{{acceptUrl}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Accept Invitation</a></p>

<p><small>This invitation expires on {{expirationDate}}. If you don''t have a Prompt Reviews account yet, you''ll be able to create one when you accept the invitation.</small></p>

<p>Questions? Just reply to this email - we''re here to help!</p>

<p>– The Prompt Reviews Team</p>

<!-- Tracking pixel for email opens -->
<img src="{{trackingPixel}}" width="1" height="1" style="display:none;" alt="" />',
    'Hi there!

{{inviterName}} has invited you to join {{businessName}} on Prompt Reviews as a {{role}}.

Prompt Reviews helps businesses collect authentic 5-star reviews from their customers. As a team member, you''ll be able to:
✅ View and manage review pages
✅ Access analytics and insights
✅ Help grow the business through better reviews

Ready to join the team?

Accept your invitation here: {{acceptUrl}}

This invitation expires on {{expirationDate}}. If you don''t have a Prompt Reviews account yet, you''ll be able to create one when you accept the invitation.

Questions? Just reply to this email - we''re here to help!

– The Prompt Reviews Team',
    true
) ON CONFLICT (name) DO NOTHING; 
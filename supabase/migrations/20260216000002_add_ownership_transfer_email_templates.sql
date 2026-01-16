-- Add ownership transfer email templates

-- Template: ownership_transfer_initiated
-- Sent to the target user when an ownership transfer is initiated
INSERT INTO email_templates (name, subject, html_content, text_content, is_active) VALUES (
    'ownership_transfer_initiated',
    '{{fromUserName}} wants to transfer ownership of {{businessName}} to you',
    '<p>Hi {{firstName}},</p>

<p><strong>{{fromUserName}}</strong> wants to transfer ownership of <strong>{{businessName}}</strong> to you on Prompt Reviews.</p>

<div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2E4A7D;">
  <p style="margin: 0 0 10px 0; font-weight: bold; color: #1e293b;">What this means:</p>
  <ul style="color: #475569; margin: 0; padding-left: 20px;">
    <li>You will become the account owner</li>
    <li>You will have full control over billing and team management</li>
    <li>{{fromUserName}} will become a team member</li>
  </ul>
</div>

<p><small style="color: #64748b;">This request expires on <strong>{{expirationDate}}</strong>.</small></p>

<p><a href="{{teamUrl}}" style="background-color: #2E4A7D; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Review Transfer Request</a></p>

<p>– The Prompt Reviews Team</p>',
    'Hi {{firstName}},

{{fromUserName}} wants to transfer ownership of {{businessName}} to you on Prompt Reviews.

What this means:
- You will become the account owner
- You will have full control over billing and team management
- {{fromUserName}} will become a team member

This request expires on {{expirationDate}}.

Review the request: {{teamUrl}}

– The Prompt Reviews Team',
    true
) ON CONFLICT (name) DO NOTHING;

-- Template: ownership_transfer_completed_former
-- Sent to the former owner when transfer is accepted
INSERT INTO email_templates (name, subject, html_content, text_content, is_active) VALUES (
    'ownership_transfer_completed_former',
    'Ownership transfer completed for {{businessName}}',
    '<p>Hi {{firstName}},</p>

<p>The ownership transfer for <strong>{{businessName}}</strong> has been completed.</p>

<div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
  <p style="margin: 0; color: #166534;">
    <strong>Your role has changed:</strong> You are now a team member on this account.
  </p>
</div>

<p>You can still access the account and contribute to the business, but billing and team management are now handled by the new owner.</p>

<p><a href="{{teamUrl}}" style="background-color: #2E4A7D; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Team</a></p>

<p>– The Prompt Reviews Team</p>',
    'Hi {{firstName}},

The ownership transfer for {{businessName}} has been completed.

Your role has changed: You are now a team member on this account.

You can still access the account and contribute to the business, but billing and team management are now handled by the new owner.

View team: {{teamUrl}}

– The Prompt Reviews Team',
    true
) ON CONFLICT (name) DO NOTHING;

-- Template: ownership_transfer_completed_new
-- Sent to the new owner when transfer is accepted
INSERT INTO email_templates (name, subject, html_content, text_content, is_active) VALUES (
    'ownership_transfer_completed_new',
    'You are now the owner of {{businessName}}',
    '<p>Hi {{firstName}},</p>

<p>Congratulations! You are now the owner of <strong>{{businessName}}</strong> on Prompt Reviews.</p>

<div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
  <p style="margin: 0; color: #166534;">
    <strong>You now have full control</strong> over billing, team management, and all account settings.
  </p>
</div>

<p>As the account owner, you can:</p>
<ul>
  <li>Manage billing and subscriptions</li>
  <li>Invite and remove team members</li>
  <li>Access all account settings</li>
</ul>

<p><a href="{{teamUrl}}" style="background-color: #2E4A7D; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Team</a></p>

<p>– The Prompt Reviews Team</p>',
    'Hi {{firstName}},

Congratulations! You are now the owner of {{businessName}} on Prompt Reviews.

You now have full control over billing, team management, and all account settings.

As the account owner, you can:
- Manage billing and subscriptions
- Invite and remove team members
- Access all account settings

View team: {{teamUrl}}

– The Prompt Reviews Team',
    true
) ON CONFLICT (name) DO NOTHING;

-- Template: ownership_transfer_declined
-- Sent to the original owner when transfer is declined
INSERT INTO email_templates (name, subject, html_content, text_content, is_active) VALUES (
    'ownership_transfer_declined',
    '{{targetUserName}} declined ownership of {{businessName}}',
    '<p>Hi {{firstName}},</p>

<p><strong>{{targetUserName}}</strong> has declined your ownership transfer request for <strong>{{businessName}}</strong>.</p>

<div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
  <p style="margin: 0; color: #991b1b;">
    You remain the account owner. No changes have been made to your account.
  </p>
</div>

<p>If you still want to transfer ownership, you can initiate a new transfer request from the team management page.</p>

<p><a href="{{teamUrl}}" style="background-color: #2E4A7D; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Team Management</a></p>

<p>– The Prompt Reviews Team</p>',
    'Hi {{firstName}},

{{targetUserName}} has declined your ownership transfer request for {{businessName}}.

You remain the account owner. No changes have been made to your account.

If you still want to transfer ownership, you can initiate a new transfer request from the team management page.

Team management: {{teamUrl}}

– The Prompt Reviews Team',
    true
) ON CONFLICT (name) DO NOTHING;

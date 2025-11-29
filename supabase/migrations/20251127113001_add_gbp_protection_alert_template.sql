-- Add gbp_protection_alert email template
INSERT INTO email_templates (name, subject, html_content, text_content, is_active) VALUES (
    'gbp_protection_alert',
    'Google suggested a change to {{locationName}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #f59e0b; margin-bottom: 20px;">Google Suggested a Change to Your Business Profile</h2>

  <p style="color: #475569; margin-bottom: 20px;">
    Hi {{firstName}},
  </p>

  <p style="color: #475569; margin-bottom: 20px;">
    Google has suggested a change to <strong>{{locationName}}</strong>.
    Review the change and decide whether to accept or reject it.
  </p>

  <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
    <p style="margin: 0 0 10px 0; font-weight: bold; color: #92400e;">
      {{fieldChanged}}
    </p>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="width: 50%; padding: 10px; vertical-align: top;">
          <p style="color: #dc2626; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">Previous Value</p>
          <p style="color: #475569; margin: 0; padding: 10px; background: #fff; border-radius: 4px;">{{oldValue}}</p>
        </td>
        <td style="width: 50%; padding: 10px; vertical-align: top;">
          <p style="color: #16a34a; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">Google''s Suggestion</p>
          <p style="color: #475569; margin: 0; padding: 10px; background: #fff; border-radius: 4px;">{{newValue}}</p>
        </td>
      </tr>
    </table>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="{{protectionUrl}}"
       style="background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
      Review This Change
    </a>
  </div>

  <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
    <strong>Why am I receiving this?</strong><br>
    You have GBP Profile Protection enabled, which monitors your Google Business Profile
    for changes suggested by Google and allows you to accept or reject them with one click.
  </p>

  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

  <p style="color: #94a3b8; font-size: 12px; text-align: center;">
    Prompt Reviews | <a href="{{protectionUrl}}" style="color: #94a3b8;">Manage Protection Settings</a>
  </p>
</div>',
    'Google Suggested a Change to Your Business Profile

Hi {{firstName}},

Google has suggested a change to {{locationName}}. Review the change and decide whether to accept or reject it.

{{fieldChanged}}
Previous: {{oldValue}}
Google''s Suggestion: {{newValue}}

Review this change: {{protectionUrl}}

Why am I receiving this?
You have GBP Profile Protection enabled, which monitors your Google Business Profile for changes suggested by Google.

Prompt Reviews | Manage Protection Settings: {{protectionUrl}}',
    true
) ON CONFLICT (name) DO NOTHING;

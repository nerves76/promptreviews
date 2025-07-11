# PromptReviews Email Templates

This directory contains custom email templates for Supabase authentication emails.

## Available Templates

- **confirm.html** - Account confirmation email (when users sign up)
- **recovery.html** - Password reset email
- **invite.html** - Team invitation email (create if needed)
- **magic_link.html** - Magic link sign-in email (create if needed)

## Template Variables

Supabase provides these variables for use in templates:

- `{{ .ConfirmationURL }}` - The confirmation/action URL
- `{{ .Email }}` - The user's email address
- `{{ .Data.* }}` - Any additional data passed to the template

## Customization

To customize these templates:

1. Edit the HTML files in this directory
2. Restart Supabase: `supabase stop && supabase start`
3. Test by triggering the relevant auth action

## Branding

These templates use the PromptReviews brand colors:
- Primary: `#475569` (slate blue)
- Hover: `#334155` (darker slate)
- Background: `#f8fafc` (slate gray)

## SMTP Configuration

These templates work with the SMTP configuration in `supabase/config.toml`:

```toml
[auth.email.smtp]
enabled = true
host = "smtp.resend.com"
port = 587
user = "resend"
pass = "env(RESEND_SMTP_PASSWORD)"
admin_email = "noreply@updates.promptreviews.app"
sender_name = "Prompt Reviews"
```

Make sure to add `RESEND_SMTP_PASSWORD` to your `.env.local` file. 
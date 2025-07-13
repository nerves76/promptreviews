# Email Configuration Management

## Overview

This project uses different email configurations for local development and production:

- **Local Development**: Uses Inbucket (email testing server) - emails are captured locally and viewable at http://127.0.0.1:54324
- **Production**: Uses Resend SMTP - emails are sent via the Resend service

## How It Works

The system automatically detects which email service to use based on environment variables:

1. **If `RESEND_SMTP_PASSWORD` is set**: Uses Resend SMTP for production email sending
2. **If `RESEND_SMTP_PASSWORD` is NOT set**: Falls back to Inbucket for local email testing

## Environment Files

### `.env.local` (Local Development)
- **Purpose**: Local development configuration
- **Email Service**: Inbucket (local email testing server)
- **Should NOT contain**: `RESEND_SMTP_PASSWORD`

### `.env.local.production` (Production Backup)
- **Purpose**: Production configuration backup
- **Email Service**: Resend SMTP
- **Should contain**: `RESEND_SMTP_PASSWORD=your_resend_api_key`

## Setup Instructions

### For Local Development
1. Ensure `.env.local` does **NOT** contain `RESEND_SMTP_PASSWORD`
2. Start Supabase: `supabase start`
3. Start Next.js: `npm run dev`
4. View emails at: http://127.0.0.1:54324

### For Production Deployment
1. Copy production config: `cp .env.local.production .env.local`
2. Deploy to production
3. Restore local config: `git checkout .env.local` (or recreate without RESEND_SMTP_PASSWORD)

## Testing Email Locally

1. **Go to signup page**: http://localhost:3002/auth/sign-up
2. **Create account** with any email (e.g., `test@example.com`)
3. **Check Inbucket**: http://127.0.0.1:54324
4. **Click confirmation link** in the email
5. **Complete signup process**

## Troubleshooting

### Problem: Welcome emails not showing in Inbucket
- **Solution**: Ensure `RESEND_SMTP_PASSWORD` is not in `.env.local`
- **Check**: `grep RESEND_SMTP_PASSWORD .env.local` should return nothing

### Problem: Production emails not sending
- **Solution**: Ensure `RESEND_SMTP_PASSWORD` is set in production environment
- **Check**: Verify Resend API key is valid

## Git Management

The `.env.local` file should be configured for local development by default. The production configuration is stored in `.env.local.production` for reference.

### .gitignore
```
.env.local
.env.local.production
```

This ensures sensitive production credentials are not committed to the repository.

## Automatic Fallback

The Supabase configuration in `config.toml` is set up to automatically handle this:

```toml
[auth.email.smtp]
enabled = true
host = "smtp.resend.com"
port = 587
user = "resend"
pass = "env(RESEND_SMTP_PASSWORD)"  # When not set, falls back to inbucket
admin_email = "noreply@updates.promptreviews.app"
sender_name = "Prompt Reviews"
```

When `RESEND_SMTP_PASSWORD` is not available, Supabase automatically uses the local Inbucket server instead. 
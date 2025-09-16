# Email Configuration Management

## Overview

This project uses different email configurations for local development and production:

- **Local Development**: Uses Inbucket (email testing server) - emails are captured locally and viewable at http://127.0.0.1:54324
- **Production**: Uses Resend SMTP - emails are sent via the Resend service

## How It Works

The system uses different configuration approaches for local vs production:

### Local Development
- **SMTP Configuration**: Disabled in `supabase/config.toml`
- **Email Service**: Automatically falls back to Inbucket for local email testing
- **No API Keys Required**: No need for `RESEND_SMTP_PASSWORD`

### Production
- **SMTP Configuration**: Enabled in production config
- **Email Service**: Uses Resend SMTP when `RESEND_SMTP_PASSWORD` is set
- **API Key Required**: Production environment must have `RESEND_SMTP_PASSWORD`

## Configuration Files

### Local Development Configuration

In `supabase/config.toml`, SMTP is commented out:
```toml
# SMTP is disabled for local development - emails will use inbucket
# [auth.email.smtp]
# enabled = true
# host = "smtp.resend.com"
# port = 587
# user = "resend"
# pass = "env(RESEND_SMTP_PASSWORD)"
# admin_email = "noreply@updates.promptreviews.app"
# sender_name = "Prompt Reviews"
```

### Production Configuration

For production, uncomment and enable the SMTP section:
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

## Environment Files

### `.env.local` (Local Development)
- **Purpose**: Local development configuration
- **Email Service**: Inbucket (local email testing server)
- **Required**: No `RESEND_SMTP_PASSWORD` needed

### `.env.local.production` (Production Backup)
- **Purpose**: Backup of production settings
- **Email Service**: Resend SMTP
- **Required**: Contains `RESEND_SMTP_PASSWORD=your_resend_api_key`

## Testing Email Locally

1. **Start Supabase**: `supabase start`
2. **Access Inbucket**: http://127.0.0.1:54324
3. **Test Signup**: Create an account at http://localhost:3002/auth/sign-up
4. **Check Email**: Confirmation email appears in Inbucket

## Deployment Safety

### For Local Development
- Keep SMTP disabled in `supabase/config.toml`
- No `RESEND_SMTP_PASSWORD` in `.env.local`
- Emails automatically use Inbucket

### For Production Deployment
- Enable SMTP in production config
- Set `RESEND_SMTP_PASSWORD` in production environment
- Emails sent via Resend service

## Troubleshooting

### "Error sending confirmation email"
- **Cause**: SMTP enabled but no API key
- **Solution**: Disable SMTP in `supabase/config.toml` for local development

### Emails not appearing in Inbucket
- **Check**: Supabase services running (`supabase status`)
- **Check**: Inbucket accessible at http://127.0.0.1:54324
- **Check**: SMTP disabled in config file

### Production emails not sending
- **Check**: SMTP enabled in production config
- **Check**: `RESEND_SMTP_PASSWORD` set in production environment
- **Check**: Resend API key is valid

## Configuration History

- **Initial**: Manual environment variable switching (error-prone)
- **Improved**: Automatic environment detection (still had issues)
- **Final**: Separate config files for local vs production (current solution)

This approach ensures:
- ✅ No manual configuration switching required
- ✅ No risk of deploying wrong configuration
- ✅ Clear separation between local and production setups
- ✅ Easy testing and development workflow 
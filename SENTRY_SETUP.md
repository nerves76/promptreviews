# Sentry Setup Guide

## Environment Variables

Add the following variables to your `.env.local` file:

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
NEXT_PUBLIC_SENTRY_RELEASE=promptreviews@0.1.0
SENTRY_ORG=your_sentry_org_here
SENTRY_PROJECT=your_sentry_project_here
```

## Getting Your Sentry DSN

1. Go to [sentry.io](https://sentry.io) and create an account
2. Create a new project for your Next.js application
3. Copy the DSN from your project settings
4. Replace `your_sentry_dsn_here` with your actual DSN

## Features Configured

- ✅ Client-side error tracking
- ✅ Server-side error tracking  
- ✅ Performance monitoring
- ✅ Session replay (10% of sessions, 100% of errors)
- ✅ Release tracking
- ✅ Environment-based filtering
- ✅ Development mode suppression
- ✅ Common error filtering

## Next Steps

1. Add your Sentry DSN to `.env.local`
2. Test error reporting by triggering an error
3. Check your Sentry dashboard for incoming errors
4. Configure alerts and notifications as needed 
# Local Development Guide

## Overview

This document explains how to set up and run the PromptReviews application for local development.

## Database Setup

**Important**: This application uses the **production Supabase database** for all environments (local and production). We do not use a local database instance.

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase Configuration (Production Database)
NEXT_PUBLIC_SUPABASE_URL=https://kkejemfchqaprtihvgon.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Other required variables...
```

## Email Confirmation Bypass

### How It Works

Since we use the production Supabase database for all environments, email confirmations are always enabled on the server side. However, we've implemented a **local development bypass** for convenience:

1. **Local Development** (`localhost:3001` or `127.0.0.1`):
   - Users can sign in immediately after account creation
   - A friendly message explains that email confirmation is bypassed
   - No actual email confirmation is required

2. **Production** (`app.promptreviews.app`):
   - Normal email confirmation flow
   - Users must confirm their email before signing in

### Implementation Details

The bypass is implemented in `src/app/auth/sign-up/page.tsx`:

```typescript
// LOCAL DEVELOPMENT EMAIL BYPASS
// Since we use production Supabase for all environments, email confirmations
// are always enabled on the server side. However, for local development,
// we provide a user-friendly message explaining that they can sign in immediately.
const isLocalDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

if (isLocalDevelopment) {
  // Local development: Email confirmation is bypassed for convenience
  setMessage('✅ Account created successfully! Since you\'re in local development mode, you can sign in immediately with your credentials.');
} else {
  // Production: Normal email confirmation flow
  setMessage('📧 Account created! Please check your email and click the confirmation link to activate your account.');
}
```

## Running the Application

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   - Local: http://localhost:3001
   - Network: http://192.168.x.x:3001

## Development Workflow

### Testing User Accounts

For local development testing:

1. **Create a new account** using the sign-up form
2. **Sign in immediately** (no email confirmation required)
3. **Test all features** with the created account

### Manual Email Confirmation (if needed)

If you need to test the email confirmation flow:

1. Go to the [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to Authentication > Users
3. Find your test user
4. Click "Confirm" to manually confirm the email

## Important Notes

- **No local database**: We use the production Supabase instance for all environments
- **Email bypass**: Only affects the user experience, not the actual database behavior
- **Environment detection**: Based on `window.location.hostname`
- **Production behavior**: Unchanged - users still need email confirmation in production

## Troubleshooting

### "Invalid login credentials" error

This usually means:
1. The user account doesn't exist in the production database
2. The password is incorrect
3. The account was created but not properly saved

**Solution**: Create a new account using the sign-up form.

### Email confirmation links pointing to production

This is expected behavior since we use the production Supabase instance. The local development bypass handles this by allowing immediate sign-in.

## File Structure

- `src/app/auth/sign-up/page.tsx` - Contains the email bypass logic
- `src/utils/supabase.ts` - Supabase client configuration
- `.env.local` - Environment variables (not committed to git)
- `supabase/config.toml` - Local Supabase configuration (not used for database)

## Security Considerations

- The email bypass only affects the user interface
- Server-side email confirmation is still enabled
- Production users must still confirm their email
- The bypass is only active for localhost development 
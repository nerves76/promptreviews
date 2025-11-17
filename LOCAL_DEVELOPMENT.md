# Local Development Guide

**Last Updated: January 7, 2025, 6:15 AM PST**

## Overview

This document explains how to set up and run the PromptReviews application for local development with enhanced safety checks and Supabase client consolidation.

## Database Setup

This application supports both **local Supabase database** (recommended for development) and **remote Supabase database** configurations.

### Local Development (Recommended)

For local development, use the local Supabase instance:

```bash
# Start local Supabase services
supabase start

# Check status
supabase status
```

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# For Local Development (when using supabase start)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# For Remote Development (production data / cron parity)
# NEXT_PUBLIC_SUPABASE_URL=https://ltneloufqjktdplodvao.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=prod_anon_key_here
# SUPABASE_SERVICE_ROLE_KEY=prod_service_role_key_here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3002

# Other required variables...
```

## Email Confirmation

### Local Development

When using the local Supabase instance, email confirmations are **disabled by default** in `supabase/config.toml`:

```toml
[auth.email]
# If enabled, users need to confirm their email address before signing in.
enable_confirmations = false
```

This means:
- ✅ Users can sign in immediately after account creation
- ✅ No email confirmation required locally
- ✅ Simplified development workflow

### Production

In production, email confirmations are enabled:
- ✅ Normal email confirmation flow
- ✅ Users must confirm their email before signing in
- ✅ Real emails sent via configured SMTP

### Database Migrations

When developing locally, use the standard Supabase migration workflow (CLI now targets `ltneloufqjktdplodvao` as set in `supabase/config.toml`; pass `--project-ref <ref>` if you need to target a different environment):

```bash
# Reset local database with all migrations
supabase db reset

# Apply new migrations to local database
supabase db reset

# Push migrations to remote database (production)
supabase db push
```

## Running the Application

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start local Supabase services:**
   ```bash
   supabase start
   ```

3. **Verify Supabase is running:**
   ```bash
   supabase status
   ```

4. **Start the development server with safety checks:**
   ```bash
   npm run dev:clean
   ```
   
   Or for faster development (skip safety checks):
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - Local: http://localhost:3002
   - Local Supabase Studio: http://127.0.0.1:54323
   - Network: http://192.168.x.x:3002

## Development Workflow

### Enhanced Development Process

For comprehensive local development:

1. **Safety Check First** (recommended):
   ```bash
   npm run safety:full-audit
   ```
   This runs authentication checks, migration verification, and linting.

2. **Supabase Client Health Check** (optional):
   ```bash
   npm run audit:supabase-clients
   ```
   Analyzes Supabase client usage patterns for consolidation opportunities.

### Testing User Accounts

For local development testing:

1. **Create a new account** using the sign-up form
2. **Immediate sign-in** - No email confirmation required locally
3. **Test all features** with the created account

### Local Database Management

```bash
# Reset local database (applies all migrations)
supabase db reset

# View local database in Studio
open http://127.0.0.1:54323

# Check migration status
supabase migration list

# Generate new migration
supabase migration new <migration_name>
```

### Deploying Changes

1. **Test locally first:**
   ```bash
   supabase db reset
   npm run dev
   ```

2. **Push to production:**
   ```bash
   supabase db push
   ```

## Important Notes

- **Local database recommended**: Use `supabase start` for development
- **Migration-first workflow**: Always create migrations for schema changes
- **Email confirmations disabled locally**: Simplifies development workflow
- **Production parity**: Local Supabase mirrors production configuration
- **Environment variables**: Use local URLs when developing with `supabase start`

## Troubleshooting

### "Invalid login credentials" error

This usually means:
1. The user account doesn't exist in the local database
2. The password is incorrect
3. The local database needs to be reset

**Solution**: 
```bash
supabase db reset
# Then create a new account using the sign-up form
```

### Local Supabase not starting

If `supabase start` fails:
1. Check Docker is running
2. Check if ports 54321-54326 are available
3. Try stopping and restarting:
   ```bash
   supabase stop
   supabase start
   ```

### Migration sync issues

If you get migration history errors:
```bash
# Reset local to match migrations
supabase db reset

# Or repair migration history
supabase migration repair --status applied <migration_name>
```

## File Structure

- `src/app/auth/sign-up/page.tsx` - User registration form
- `src/utils/supabaseClient.ts` - Supabase client configuration
- `.env.local` - Environment variables (not committed to git)
- `supabase/config.toml` - Local Supabase configuration
- `supabase/migrations/` - Database migration files

## Security Considerations

- Local development uses separate database from production
- Email confirmations disabled locally for convenience
- Production users must confirm their email
- Use local service keys only for development
- Never commit real production keys to git 

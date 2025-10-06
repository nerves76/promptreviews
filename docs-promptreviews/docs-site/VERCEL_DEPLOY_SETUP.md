# Vercel Deployment Setup for Docs Site

## Issue Fixed ✅

The docs site was failing to build with:
```
Error: supabaseKey is required.
```

**Root Cause**: The docs site needs Supabase credentials to fetch CMS content, but Vercel didn't have these environment variables configured.

**Solution**: Created `.env.production` file with production Supabase credentials.

---

## Vercel Environment Variables Setup

To ensure successful deployments, you **MUST** add these environment variables in the Vercel dashboard:

### Required Environment Variables

1. Go to: https://vercel.com/your-team/docs-promptreviews (or your Vercel project)
2. Navigate to: **Settings → Environment Variables**
3. Add the following variables:

#### Production Environment Variables

| Variable Name | Value |
|--------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ltneloufqjktdplodvao.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bmVsb3VmcWprdGRwbG9kdmFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNDE1NzgsImV4cCI6MjA2MzYxNzU3OH0.ypbH1mu5m6a4jHFtpJfZPWeQVndtzZcmVELfNdqvgLw` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bmVsb3VmcWprdGRwbG9kdmFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODA0MTU3OCwiZXhwIjoyMDYzNjE3NTc4fQ.IkGh1VhXoqUSGPudm3NH9BqrUP2GMb1OxfmzJxpwOL4` |

### Environment Scopes

Set all variables to apply to:
- ✅ Production
- ✅ Preview
- ✅ Development

---

## Verification

After adding the environment variables:

1. **Trigger a new deployment**:
   - Push a commit to your branch, or
   - Go to Vercel → Deployments → Redeploy

2. **Check build logs**:
   - Should see: `✓ Compiled successfully`
   - Should see: `✓ Generating static pages (70/70)`
   - Should NOT see: `Error: supabaseKey is required`

3. **Verify locally**:
   ```bash
   cd /Users/chris/promptreviews/docs-promptreviews/docs-site
   npm run build
   ```
   Should complete successfully with 70 static pages generated.

---

## Files Created/Modified

1. **Created**: `.env.production` - Contains production Supabase credentials
   - ⚠️ This file should be added to `.gitignore` for security
   - Vercel uses its own environment variables system instead

2. **Existing**: `.env.local` - Local development credentials (points to localhost Supabase)

---

## How It Works

The docs site uses Next.js environment variable precedence:

1. **Local Development**: Uses `.env.local` (localhost Supabase)
2. **Production Build**: Uses `.env.production` OR Vercel environment variables
3. **Vercel Deployment**: Uses environment variables from Vercel dashboard (highest priority)

The docs site needs Supabase access because it:
- Fetches article content from `articles` table
- Queries `article_contexts` for featured articles
- Searches articles via `search_articles()` function

---

## Security Note

The `.env.production` file contains sensitive credentials. While it's useful for local production builds, it should:

1. **NOT** be committed to git (add to `.gitignore`)
2. Be replaced by Vercel environment variables in actual deployments
3. Be kept secure and not shared publicly

---

## Troubleshooting

### Build still fails with "supabaseKey is required"

1. Check Vercel dashboard has all 3 environment variables set
2. Verify variables are applied to "Production" scope
3. Trigger a new deployment (don't just redeploy)

### Build succeeds but pages show errors

1. Check Supabase credentials are correct
2. Verify database has articles with status='published'
3. Check Supabase RLS policies allow public read access to articles

### Local build works but Vercel fails

1. Vercel environment variables may not be set
2. Check Vercel build logs for specific error
3. Ensure `.env.production` is not in `.gitignore` (or set Vercel vars)

---

## Next Steps

1. ✅ Add environment variables to Vercel dashboard
2. ✅ Trigger new deployment
3. ✅ Verify build succeeds
4. ✅ Add `.env.production` to `.gitignore` (optional but recommended)
5. ✅ Test deployed site at your Vercel URL

---

**Last Updated**: October 6, 2025
**Status**: ✅ Build Fixed - Awaiting Vercel Configuration

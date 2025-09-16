# Google Business Profile Integration Setup

This guide explains how to set up Google Business Profile integration for social media posting functionality.

## Overview

The Google Business Profile integration allows users to:
- Connect their Google Business Profile accounts
- Select from multiple business locations
- Create and publish posts directly to Google Business Profile
- Use AI-powered content templates
- Track posting analytics

## Prerequisites

1. **Google Business Profile Account**: You need an active Google Business Profile with verified business locations
2. **Google Cloud Console Access**: Access to create OAuth credentials
3. **Business Verification**: Your business locations must be verified on Google

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID for reference

### 2. Enable Google Business Profile API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google My Business API" (this is the correct API name)
3. Click on it and press **Enable**
4. Also enable "Google My Business Account Management API" if available

### 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - Choose **External** user type
   - Fill in required application information
   - Add your domain to authorized domains
   - Add the following scopes:
     - `https://www.googleapis.com/auth/plus.business.manage` (for Google Business Profile)
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
4. For the OAuth client ID:
   - Application type: **Web application**
   - Name: "PromptReviews Google Business Profile"
   - Authorized JavaScript origins:
     - `http://localhost:3002` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3002/api/auth/google/callback` (for development)
     - `https://yourdomain.com/api/auth/google/callback` (for production)

### 4. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Google OAuth Configuration (for Google Business Profile integration)
GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3002/api/auth/google/callback

# For production, update the redirect URI to match your domain:
# GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
```

### 5. OAuth Consent Screen Configuration

If your app is in development/testing mode:

1. Add test users in **OAuth consent screen** > **Test users**
2. Add the email addresses that need access during development
3. These users can authenticate without going through the verification process

For production deployment:
1. Submit your app for verification if you need access to sensitive scopes
2. Complete the OAuth verification process
3. Update your privacy policy and terms of service URLs

## API Endpoints

The integration uses these API endpoints:

- **Connect Platform**: `GET /api/social-posting/platforms`
- **OAuth Callback**: `GET /api/auth/google/callback`
- **Get Locations**: `GET /api/social-posting/locations`
- **Create Post**: `POST /api/social-posting/posts`

## Testing the Integration

### Local Development

1. Start your development server: `npm run dev`
2. Navigate to `/dashboard/social-posting`
3. Click "Connect Google Business"
4. Complete the OAuth flow with a test user account
5. Select a business location and create a test post

### Test Page

Use the test page at `/test-google-oauth` to verify:
- OAuth flow works correctly
- Token exchange succeeds
- API credentials are properly configured

## Debugging

Check the browser console and server logs for:
- OAuth flow errors
- API authentication issues
- Missing scopes or permissions
- Network connectivity problems

Common issues:
- **Redirect URI mismatch**: Ensure the redirect URI in your OAuth config matches exactly
- **Invalid client**: Double-check your client ID and secret
- **Scope issues**: Verify you have the correct Google My Business API scopes
- **Unverified app**: For production, your app may need Google verification

## Security Considerations

1. **Environment Variables**: Never commit OAuth credentials to version control
2. **HTTPS**: Use HTTPS in production for OAuth callbacks
3. **Token Storage**: Implement secure token storage and refresh logic
4. **Scope Limitations**: Only request necessary API scopes
5. **User Consent**: Clearly explain what data access you're requesting

## Google Business Profile API Limits

- **Posts per day**: 100 posts per location per day
- **Character limit**: 1500 characters per post
- **Media size**: Max 10MB for images, 100MB for videos
- **Supported formats**: JPEG, PNG, GIF for images; MP4, MOV, AVI for videos
- **Rate limits**: 1 request per minute per project

## Troubleshooting

### Common OAuth Errors

**Error: redirect_uri_mismatch**
- Solution: Ensure redirect URI in OAuth config matches exactly with your environment variable

**Error: access_denied**
- Solution: User denied permission or app needs verification

**Error: invalid_client**
- Solution: Check client ID and secret are correct

**Error: Bad Request**
- Solution: Check that all required OAuth parameters are present and correct

### API Errors

**Error: 403 Forbidden**
- Solution: Check API is enabled and credentials have proper permissions

**Error: 404 Not Found**
- Solution: Verify business location ID and user has access

**Error: 429 Too Many Requests**
- Solution: Implement rate limiting and respect API quotas (1 request per minute)

**Error: 401 Unauthorized**
- Solution: Check access token is valid and not expired

### Authentication Issues

**User gets logged out during OAuth** ✅ **FIXED** (July 17, 2025)
- **Problem**: Users were being logged out during Google OAuth flow due to cookie parsing errors
- **Root Cause**: Supabase auth helpers package was trying to parse base64-encoded cookies as JSON
- **Solution Implemented**:
  - ✅ **Migrated to SSR package**: Updated from `@supabase/auth-helpers-nextjs` to `@supabase/ssr` for better cookie handling
  - ✅ **Added retry logic**: Implemented 5-retry mechanism with exponential backoff for session timing issues
  - ✅ **Enhanced error handling**: Added fallback authentication methods (getUser() and getSession())
  - ✅ **Improved cookie handling**: Proper Next.js 15 async cookie handling in API routes
- **✅ VALIDATION**: Test script confirms APIs return proper 401/redirect responses without crashing

**Cookie parsing errors** ✅ **FIXED** (July 17, 2025)
- **Problem**: "Failed to parse cookie string: SyntaxError: Unexpected token 'b', "base64-eyJ"... is not valid JSON"
- **Root Cause**: Auth helpers package was incorrectly parsing base64-encoded Supabase cookies
- **Solution Implemented**:
  - ✅ **Updated to SSR package**: Replaced auth helpers with SSR package for better compatibility
  - ✅ **Proper cookie handling**: Direct cookie access without JSON parsing
  - ✅ **Enhanced error recovery**: Multiple authentication methods with graceful fallbacks
- **✅ VALIDATION**: No more cookie parsing errors in server logs

## Production Deployment

1. Update environment variables with production OAuth credentials
2. Configure production domain in Google Cloud Console
3. Test OAuth flow on production environment
4. Monitor API usage and error rates
5. Implement proper error handling and retry logic

## Support

For additional help:
- [Google My Business API Documentation](https://developers.google.com/my-business)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console Support](https://cloud.google.com/support)

## Feature Roadmap

Planned enhancements:
- [ ] Post scheduling functionality
- [ ] Analytics and performance tracking
- [ ] Multi-platform posting (Facebook, Instagram)
- [ ] Advanced content templates
- [ ] Bulk posting capabilities
- [ ] Location-specific posting rules 
#!/usr/bin/env node

/**
 * Debug script for Google Business Profile authentication issues
 * Run this to check the current state of your Google Business connection
 */

const diagnostics = `
=== Google Business Profile Authentication Diagnostics ===

Based on the code analysis, here are the likely issues and solutions:

1. TOKEN EXPIRATION ISSUE
   Problem: The tokens might be expired but still showing as "connected"
   Solution: 
   - Check the 'expires_at' field in google_business_profiles table
   - If expired, the system needs to refresh tokens using the refresh_token
   - The API should handle this automatically, but it might be failing

2. RATE LIMITING ISSUE  
   Problem: Google Business API has strict rate limits (1 request per minute)
   Solution:
   - Check google_api_rate_limits table for last_api_call_at
   - Wait at least 2 minutes between API calls
   - The system enforces a 120-second wait time

3. LOCATION FETCH FAILURE
   Problem: Accounts found but locations not being fetched/stored
   Possible causes:
   - Rate limit hit during location fetch
   - Permission issues with the Google account
   - Locations not properly stored in google_business_locations table

4. DATABASE SYNC ISSUE
   Problem: Data exists in API but not syncing to database
   Check these tables:
   - google_business_profiles (tokens)
   - google_business_locations (actual locations)
   - google_api_rate_limits (rate limit tracking)

=== Debugging Steps ===

1. Check Token Status:
   SELECT user_id, expires_at, created_at, updated_at 
   FROM google_business_profiles 
   WHERE user_id = '[YOUR_USER_ID]';

2. Check Locations:
   SELECT * FROM google_business_locations 
   WHERE user_id = '[YOUR_USER_ID]';

3. Check Rate Limits:
   SELECT * FROM google_api_rate_limits 
   WHERE user_id = '[YOUR_USER_ID]' 
   ORDER BY last_api_call_at DESC;

4. Clear Local Storage (in browser console):
   localStorage.removeItem('google-business-connected');
   localStorage.removeItem('google-business-locations');
   localStorage.removeItem('google-business-selected-locations');
   localStorage.removeItem('google-business-fetch-attempted');

5. Force Re-authentication:
   - Disconnect Google Business Profile
   - Clear browser cache/cookies
   - Re-connect and authorize with Google

=== API Flow Issues ===

The flow should be:
1. /api/social-posting/platforms - Check connection status
2. /api/social-posting/platforms/google-business-profile/fetch-locations - Fetch from Google
3. Store in google_business_locations table
4. Return to frontend

If seeing "5 businesses" but then "no businesses":
- Initial API call succeeds (listAccounts)
- Location fetch fails or times out
- Frontend shows stale/incomplete data

=== Quick Fixes to Try ===

1. Wait 2+ minutes and try again (rate limit)
2. Disconnect and reconnect Google Business
3. Check browser console for specific error messages
4. Check Network tab for failing API calls
5. Look for 429 (rate limit) or 401 (auth) errors

=== Manual Token Refresh ===

If tokens are expired, you can manually trigger a refresh:
1. Get the refresh_token from google_business_profiles table
2. Use Google OAuth2 API to get new access_token
3. Update the database with new token and expires_at

=== Environment Variables to Check ===

Make sure these are set correctly:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- NEXT_PUBLIC_APP_URL (for OAuth redirect)

`;

console.log(diagnostics);

// Check if running in Node environment with database access
if (process.env.DATABASE_URL) {
  console.log("\n=== Live Database Check ===\n");
  console.log("DATABASE_URL is set. You could run SQL queries here to check the actual state.");
  console.log("For security, please run the SQL queries manually in your database client.\n");
}

console.log("=== Next Steps ===\n");
console.log("1. Open browser DevTools and check Console for errors");
console.log("2. Check Network tab for failing API requests");
console.log("3. Run the SQL queries above in your database");
console.log("4. Share any error messages you find\n");
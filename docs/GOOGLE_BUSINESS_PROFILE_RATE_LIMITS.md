# Google Business Profile API Rate Limits

## Overview

The Google Business Profile API has extremely strict rate limits that can be challenging to work with:

- **1 request per minute** per project
- **1000 requests per day** per project
- Rate limits are enforced globally across all users of the same Google Cloud project

## Demo Mode

To avoid hitting rate limits during development and testing, we've implemented a **Demo Mode** feature:

### How to Enable Demo Mode

1. **On the Social Posting Page**: Click the "🎭 Demo Mode OFF" button to enable demo mode
2. **Visual Indicator**: The button will change to "🎭 Demo Mode ON" with green styling
3. **Local Storage**: Demo mode preference is saved in your browser's localStorage

### What Demo Mode Does

- **Bypasses Google API**: No actual API calls are made to Google
- **Returns Mock Data**: Provides realistic sample data for testing
- **Full Functionality**: All features work exactly the same as with real data
- **No Rate Limits**: You can test as much as you want without hitting limits

### Demo Mode Data

When demo mode is enabled, you'll see:
- **Sample Business Account**: "Demo Business Account"
- **Sample Locations**: 
  - "Demo Coffee Shop" (123 Main St, City, State 12345)
  - "Demo Restaurant" (456 Oak Ave, City, State 12345)
- **Full Posting Capabilities**: Create and preview posts normally

### Testing Workflow

1. **Enable Demo Mode**: Click the demo mode toggle button
2. **Connect Google Business Profile**: Use the normal OAuth flow (tokens will be stored)
3. **Fetch Locations**: Click "Fetch Business Locations" - will return demo data instantly
4. **Test Posting**: Create posts and test all functionality
5. **Disable Demo Mode**: When ready for production, turn off demo mode

## Current Implementation

Our system handles these rate limits with the following approach:

### Backend Rate Limit Handling

1. **Conservative Retry Strategy**: Only 1 retry attempt with 2-minute delays
2. **Exponential Backoff**: Starting at 120 seconds for strict rate limits
3. **Clear Error Messages**: Specific feedback about rate limit status
4. **Graceful Degradation**: Connection succeeds even if API calls are skipped

### Frontend User Experience

1. **Rate Limit Detection**: Automatically detects 429 errors
2. **Countdown Timer**: Shows users how long to wait before retrying
3. **Clear Messaging**: Explains the rate limit situation
4. **Retry Button**: Disabled during countdown periods

## Common Scenarios

### New Connection
When a user first connects their Google Business Profile:

1. OAuth tokens are stored successfully
2. API calls are skipped due to rate limits
3. User sees "Connected successfully" message
4. User can manually fetch locations later

### Fetching Locations
When fetching business locations:

1. If rate limited: Shows countdown timer (60 seconds)
2. If successful: Locations are stored and displayed
3. If failed: Clear error message with retry instructions

### Posting Updates
When creating posts:

1. Rate limits are handled per-request
2. Users see clear feedback about success/failure
3. Retry logic is built into the posting flow

## Best Practices for Users

1. **Wait Between Requests**: Always wait at least 60 seconds between API calls
2. **Use Manual Fetch**: Click "Fetch Locations" when ready, don't rely on automatic loading
3. **Plan Ahead**: If you need to post frequently, space out your requests
4. **Monitor Limits**: Check the countdown timer before making new requests

## Technical Details

### API Configuration
```typescript
RATE_LIMITS: {
  REQUESTS_PER_MINUTE: 1,
  REQUESTS_PER_DAY: 1000,
  RETRY_ATTEMPTS: 1,
  RETRY_DELAY_MS: 120000, // 2 minutes
  MIN_WAIT_BETWEEN_REQUESTS: 60000 // 60 seconds
}
```

### Error Handling
- 429 errors are caught and handled gracefully
- Users see specific rate limit messages
- System prevents unnecessary retries during rate limit periods

## Troubleshooting

### "Rate limit exceeded" errors
This is **normal and expected** for the Google Business Profile API. The API is designed to be very restrictive.

**Solutions:**
1. Wait 60 seconds before trying again
2. Use the countdown timer on the frontend
3. Consider spacing out your API usage

### "Failed to fetch locations"
This usually means the API is rate limited.

**Solutions:**
1. Wait at least 1-2 minutes
2. Try the "Fetch Locations" button again
3. Check that your Google Business Profile is properly connected

### Connection issues
If you can't connect at all:

1. Check that you're using the correct Google account
2. Ensure you have a Google Business Profile set up
3. Verify the OAuth scopes are correct
4. Check the browser console for detailed error messages

## Future Improvements

1. **Request Queuing**: Implement a queue system for API requests
2. **Smart Retry Logic**: More sophisticated retry strategies
3. **Rate Limit Monitoring**: Track usage and warn users before limits
4. **Caching**: Cache responses to reduce API calls
5. **Batch Operations**: Group multiple operations into single requests where possible

## References

- [Google Business Profile API Documentation](https://developers.google.com/my-business/reference/rest)
- [Google API Quotas](https://developers.google.com/my-business/reference/rest/v1/accounts.locations)
- [Rate Limiting Best Practices](https://developers.google.com/my-business/reference/rest/v1/accounts.locations) 
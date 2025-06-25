# Authentication Cleanup and Security Standardization

## Overview
This document outlines the cleanup, standardization, and security hardening of authentication patterns across the PromptReviews application.

## Problem
The codebase had inconsistent authentication patterns and security vulnerabilities:
- **Old pattern**: `createRouteHandlerClient` (deprecated in Next.js 15)
- **Mixed pattern**: Some routes used Bearer tokens, others used session cookies
- **Inconsistent error handling**: Different error messages and status codes
- **Security vulnerabilities**: Several public endpoints lacked authentication

## Solution
Standardized on the modern Supabase client pattern with a unified authentication utility and comprehensive security hardening.

## Changes Made

### 1. Removed Deprecated Auth Helpers
- Removed all imports of `@supabase/auth-helpers-nextjs`
- Updated routes to use `createClient` from `@supabase/supabase-js`

### 2. Created Unified Authentication Utility
**File**: `src/utils/apiAuth.ts`
- Added `authenticateApiRequest()` function
- Supports both token-based (Authorization header) and session-based (cookies) authentication
- Consistent error handling and logging
- Returns standardized response format

### 3. Security Hardening - Immediate Fixes

#### File Upload Endpoints Secured ✅
- **`/api/upload-photo`**: Added authentication + account ownership verification
- **`/api/upload-widget-photo`**: Added authentication + widget ownership verification
- **Risk Mitigated**: Unauthorized file uploads, storage abuse, security vulnerabilities

#### Email Endpoint Secured ✅
- **`/api/send-welcome-email`**: Added authentication + rate limiting (5 attempts/hour per user)
- **Risk Mitigated**: Email spam abuse

#### Debug Endpoint Removed ✅
- **`/api/check-env`**: Completely removed
- **Risk Mitigated**: Information disclosure

#### Widget Endpoint Enhanced ✅
- **`/api/widgets/[id]`**: Added widget status verification + access logging
- **Risk Mitigated**: Unauthorized access to widget data

#### Public Tracking Endpoints Rate Limited ✅
- **`/api/track-event`**: Added rate limiting (100 events/hour per IP/UA)
- **`/api/track-review`**: Added rate limiting (10 reviews/hour per IP/UA)
- **Risk Mitigated**: Analytics and review spam

### 4. Updated API Routes

#### Fully Secured Routes (Authentication Required):
- `src/app/api/feedback/route.ts` ✅
- `src/app/api/upload-contacts/route.ts` ✅
- `src/app/api/check-schema/route.ts` ✅
- `src/app/api/upload-photo/route.ts` ✅
- `src/app/api/upload-widget-photo/route.ts` ✅
- `src/app/api/send-welcome-email/route.ts` ✅

#### Public Routes with Rate Limiting:
- `src/app/api/track-event/route.ts` ✅
- `src/app/api/track-review/route.ts` ✅

#### Public Routes with Enhanced Security:
- `src/app/api/widgets/[id]/route.ts` ✅

#### Routes Already Using Modern Pattern:
- `src/app/api/widgets/debug/route.ts`
- `src/app/api/widgets/upload-photo/route.ts`
- `src/app/api/create-checkout-session/route.ts`
- `src/app/api/stripe-webhook/route.ts`

### 5. Client-Side Authentication
Client-side components continue to use:
- `createBrowserClient` for browser environments
- `getSessionOrMock()` utility for session handling
- Bearer token authentication for API calls

## Authentication Flow

### API Routes
```typescript
// 1. Import the utility
import { authenticateApiRequest } from '@/utils/apiAuth';

// 2. Use in route handler
export async function POST(request: NextRequest) {
  const { user, supabase: authSupabase, error: authError } = await authenticateApiRequest(request);
  
  if (authError || !user) {
    console.log("API: Authentication failed:", authError);
    return NextResponse.json({ error: authError || "Authentication required" }, { status: 401 });
  }
  
  console.log("API: User authenticated:", { userId: user.id, email: user.email });
  
  // User is authenticated, proceed with business logic
}
```

### Client Components
```typescript
// 1. Get session
const { data: { session }, error } = await getSessionOrMock(supabase);

// 2. Make authenticated API call
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  },
  body: JSON.stringify(data),
});
```

## Security Implementation Details

### Authentication Pattern
All protected endpoints now use the unified `authenticateApiRequest` utility:
```typescript
const { user, supabase: authSupabase, error: authError } = await authenticateApiRequest(req);
if (authError || !user) {
  return NextResponse.json({ error: authError || "Authentication required" }, { status: 401 });
}
```

### Rate Limiting
Simple in-memory rate limiting implemented for public endpoints:
- Email: 5 attempts per hour per user
- Events: 100 events per hour per IP/User-Agent
- Reviews: 10 reviews per hour per IP/User-Agent

### Access Control
- File uploads: Verify user owns the account associated with the prompt page/widget
- Widget access: Verify widget is active and log access attempts

## Benefits

1. **Consistency**: All API routes use the same authentication pattern
2. **Maintainability**: Centralized authentication logic
3. **Future-proof**: Uses modern Supabase client patterns
4. **Error Handling**: Standardized error messages and status codes
5. **Flexibility**: Supports both token and session authentication
6. **Logging**: Consistent authentication logging for debugging
7. **Security**: Comprehensive protection against common attack vectors
8. **Rate Limiting**: Protection against abuse and spam

## Testing

The feedback system now works correctly:
- ✅ Authentication succeeds with Bearer tokens
- ✅ Proper error handling for invalid tokens
- ✅ Consistent logging for debugging
- ✅ No more 401 errors from cookie parsing issues
- ✅ File uploads require authentication
- ✅ Rate limiting prevents abuse

## Security Status

| Endpoint | Status | Authentication | Rate Limiting | Notes |
|----------|--------|----------------|---------------|-------|
| `/api/upload-photo` | ✅ Secure | User Auth | N/A | Account ownership verified |
| `/api/upload-widget-photo` | ✅ Secure | User Auth | N/A | Widget ownership verified |
| `/api/send-welcome-email` | ✅ Secure | User Auth | 5/hour | Email spam protection |
| `/api/check-env` | ✅ Removed | N/A | N/A | Information disclosure risk eliminated |
| `/api/widgets/[id]` | ✅ Enhanced | Widget Status | N/A | Access logging added |
| `/api/track-event` | ✅ Rate Limited | None | 100/hour | Analytics spam protection |
| `/api/track-review` | ✅ Rate Limited | None | 10/hour | Review spam protection |

## Next Steps

1. **Monitor**: Watch for any authentication issues in production
2. **Document**: Update API documentation to reflect new patterns
3. **Test**: Ensure all API routes work with both authentication methods
4. **Optimize**: Consider caching authentication results if needed
5. **Production**: Implement Redis-based rate limiting for production
6. **Monitoring**: Set up alerts for rate limit hits and authentication failures

## Migration Checklist

- [x] Remove deprecated auth helper imports
- [x] Update API routes to use modern pattern
- [x] Create unified authentication utility
- [x] Test feedback submission
- [x] Verify upload-contacts functionality
- [x] Check auth callback flow
- [x] Secure file upload endpoints
- [x] Secure email endpoint
- [x] Remove debug endpoint
- [x] Enhance widget endpoint
- [x] Add rate limiting to public endpoints
- [x] Update middleware configuration
- [x] Document all changes

## Notes

- The old `createRouteHandlerClient` was causing issues with base64 cookie parsing in Next.js 15
- The new pattern properly handles both authentication methods
- All existing functionality is preserved while improving reliability and security
- Error messages are now more descriptive and consistent
- Security posture significantly improved with minimal impact on functionality 
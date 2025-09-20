# CSRF Protection Implementation

## Date: 2025-09-01

## Overview
Added origin-based CSRF protection to critical endpoints in response to security concerns raised on Reddit about the application having "0 CSRF headers" and security vulnerabilities.

## What is CSRF?
Cross-Site Request Forgery (CSRF) is an attack where a malicious website tricks a user's browser into making unwanted requests to another site where the user is authenticated. Without protection, attackers could manipulate user accounts, delete data, or perform unauthorized transactions.

## Implementation Details

### 1. Created CSRF Protection Library
- **File:** `/src/lib/csrf-protection.ts`
- **Features:**
  - Origin validation against allowed domains
  - Automatic Vercel preview deployment support
  - Request logging for security monitoring
  - Helper functions for easy integration

### 2. Protected Critical Endpoints

#### DELETE Operations (High Risk)
- ✅ `/api/cancel-subscription/route.ts` - Both POST and DELETE methods
- ✅ `/api/business-locations/[id]/route.ts` - DELETE method

#### Payment/Billing Operations (Critical)
- ✅ `/api/create-checkout-session/route.ts` - POST method
- ✅ `/api/create-stripe-portal-session/route.ts` - POST method

#### Data Modification Operations (Important)
- ✅ `/api/widgets/route.ts` - POST method (widget creation)
- ✅ `/api/widgets/[id]/reviews/route.ts` - PUT method (review updates)

### 3. Additional Security Improvements

#### Security Headers (Added to middleware)
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy (disables camera, microphone, geolocation)

#### Rate Limiting (Ready but not enforced)
- **File:** `/src/lib/rate-limit.ts`
- In-memory rate limiter ready for use
- Different limits for auth, API, and widget endpoints
- Example implementation provided

#### robots.txt
- **File:** `/public/robots.txt`
- Blocks search engines from indexing sensitive paths
- Protects /api/, /dashboard/, /auth/ from crawling

#### Cookie Security Helper
- **File:** `/src/app/api/middleware-cookies.ts`
- SameSite cookie configuration for CSRF-sensitive cookies (separate from Supabase's managed auth session)
- Secure cookie options for production

## How It Works

When a request comes to a protected endpoint:
1. The origin/referer header is checked
2. If the request is from an allowed domain, it proceeds
3. If from an unknown domain, it's blocked and logged
4. All blocked attempts are logged for security monitoring

## Allowed Origins
- https://promptreviews.app
- https://app.promptreviews.app
- https://www.promptreviews.app
- http://localhost:3000-3002
- Vercel preview deployments (*.vercel.app)

## Testing the Protection

To verify CSRF protection is working:
1. Try to make a request from a different domain
2. Check console logs for "[CSRF] Blocked request" messages
3. Verify legitimate requests still work

## What's Still Needed

### Immediate (Should do soon)
1. Add protection to more endpoints:
   - Account deletion endpoints
   - Team management endpoints
   - Email template modifications
   
2. Implement rate limiting enforcement on critical endpoints

### Future Improvements
1. Implement proper CSRF tokens (more secure but requires frontend changes)
2. Add Web Application Firewall (WAF)
3. Re-enable Supabase RLS on all tables
4. Implement API key authentication for public endpoints

## Monitoring

All CSRF attempts are logged with:
- Origin of the attempt
- Target URL
- HTTP method
- Timestamp

Monitor logs for patterns of attacks using:
```bash
grep "\[CSRF\]" logs
grep "\[SECURITY\]" logs
```

## Rollback Instructions

If CSRF protection causes issues:
1. Remove the `requireValidOrigin` checks from affected endpoints
2. The protection is additive - removing it won't break functionality
3. Security headers can be removed from middleware if needed

## Notes
- This implementation provides immediate protection without breaking existing functionality
- Widget endpoints still allow `*` origin for backward compatibility but log external usage
- Rate limiting is implemented but not enforced - can be activated when ready

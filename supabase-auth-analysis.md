# Supabase Authentication Issues Analysis

## Current Problems Identified

### 1. **Mixed Authentication Approaches**
Your codebase is using multiple conflicting authentication patterns:
- Client-side Supabase client (`@supabase/supabase-js`)
- SSR-specific client (`@supabase/ssr`)
- Custom cookie-based authentication
- Both approaches running simultaneously

### 2. **Cookie Mismatch Issues**
Your `/api/auth/signin` route sets custom cookies (`sb-access-token`, `sb-refresh-token`), but:
- Supabase SSR expects different cookie names
- The client-side doesn't know about these custom cookies
- Middleware uses `@supabase/ssr` but doesn't read your custom cookies

### 3. **Session Synchronization Problems**
- Client stores session in localStorage with custom key `promptreviews-auth-token`
- Server reads from HTTP cookies
- No synchronization between client storage and server cookies
- Creates authentication state mismatch

### 4. **Inconsistent Client Creation**
Multiple ways of creating Supabase clients across your codebase:
- `supabaseClient.ts` - client-side with localStorage
- `middleware.ts` - SSR client with cookies
- `apiAuth.ts` - standard client without SSR support
- API routes using service role key

## Recommended Solutions

### Solution 1: Full Supabase SSR Implementation

#### A. Update Client Configuration

**Current Issue in `src/utils/supabaseClient.ts`:**
```typescript
// Currently using standard client
supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'promptreviews-auth-token',
    flowType: 'pkce',
  },
});
```

**Recommended Fix:**
```typescript
// Use createBrowserClient from @supabase/ssr for client-side
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

#### B. Fix Sign-in API Route

**Current Issue in `/api/auth/signin`:**
- Using service role key for authentication
- Setting custom cookie names
- Not compatible with Supabase SSR

**Recommended Fix:**
Replace the entire API route with proper SSR implementation:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const formData = await request.formData()
  const email = String(formData.get('email'))
  const password = String(formData.get('password'))

  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/sign-in?error=Could not authenticate user`,
      { status: 301 }
    )
  }

  return NextResponse.redirect(`${requestUrl.origin}/dashboard`, {
    status: 301,
  })
}
```

#### C. Update Client-Side Sign-in

**Current Issue in `src/app/auth/sign-in/page.tsx`:**
- Using custom API route for authentication
- Not leveraging Supabase SSR properly

**Recommended Fix:**
```typescript
// Use Supabase client directly instead of custom API
const { error } = await supabase.auth.signInWithPassword({
  email: formData.email,
  password: formData.password,
})

if (error) {
  setError(error.message)
  return
}

// Redirect after successful authentication
router.push('/dashboard')
```

### Solution 2: Fix Cookie Names and Synchronization

If you want to keep your current approach, you need to:

#### A. Update Cookie Names
Change your custom cookie names to match Supabase SSR expectations:
```typescript
// In /api/auth/signin route
response.cookies.set('sb-access-token', data.session.access_token, {
  // Should be: 'supabase-auth-token'
})
```

#### B. Update Middleware Cookie Reading
Modify middleware to read your custom cookies:
```typescript
// In middleware.ts
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get: (name) => {
        // Read your custom cookie names
        if (name === 'supabase-auth-token') {
          return req.cookies.get('sb-access-token')?.value
        }
        return req.cookies.get(name)?.value
      },
      set: (name, value, options) => {
        res.cookies.set({ name, value, ...options })
      },
      remove: (name, options) => {
        res.cookies.set({ name, value: "", ...options })
      },
    },
  },
)
```

### Solution 3: Session Synchronization (Current Approach)

If keeping the current mixed approach, add session synchronization:

#### A. Update Client After Server Authentication
```typescript
// In sign-in page after successful API call
if (data.success && data.session) {
  // Manually set the session in the client
  await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token
  })
  
  router.push('/dashboard')
}
```

#### B. Add Session Refresh Logic
```typescript
// In layout or auth guard
useEffect(() => {
  const refreshSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      // Try to get session from cookies via API
      const response = await fetch('/api/get-session')
      const serverSession = await response.json()
      if (serverSession.session) {
        await supabase.auth.setSession(serverSession.session)
      }
    }
  }
  refreshSession()
}, [])
```

## Priority Issues to Fix

### 1. **Critical: Mixed Authentication**
- **Problem**: Client and server using different authentication mechanisms
- **Impact**: Users appear logged out on client but authenticated on server
- **Solution**: Choose one approach (recommend full SSR)

### 2. **Critical: Cookie Mismatch**
- **Problem**: Custom cookie names don't match Supabase SSR expectations
- **Impact**: Middleware can't read authentication state
- **Solution**: Use standard Supabase cookie names or update middleware

### 3. **High: Session Persistence**
- **Problem**: No proper session synchronization between client/server
- **Impact**: Authentication state inconsistency across page loads
- **Solution**: Implement proper session management

### 4. **Medium: Multiple Client Instances**
- **Problem**: Different Supabase client configurations across files
- **Impact**: Potential memory leaks and conflicts
- **Solution**: Standardize client creation

## Recommended Implementation Plan

### Phase 1: Choose Authentication Strategy
1. Decide between full SSR or hybrid approach
2. Update documentation for chosen strategy
3. Remove conflicting implementations

### Phase 2: Implement Core Changes
1. Update client configuration
2. Fix cookie naming and handling
3. Update sign-in/sign-out flows

### Phase 3: Testing and Validation
1. Test authentication across all pages
2. Verify session persistence
3. Check middleware protection

### Phase 4: Cleanup
1. Remove unused authentication utilities
2. Update error handling
3. Add proper TypeScript types

## Files Requiring Updates

### Critical Files:
- `src/utils/supabaseClient.ts` - Client configuration
- `src/app/api/auth/signin/route.ts` - Server authentication
- `src/middleware.ts` - Session validation
- `src/app/auth/sign-in/page.tsx` - Client-side login

### Supporting Files:
- `src/utils/apiAuth.ts` - API authentication
- `src/utils/authGuard.ts` - Client protection
- `src/app/page.tsx` - Initial auth check
- All dashboard layouts and pages using auth

The main issue is that you're mixing client-side and SSR authentication patterns without proper synchronization. The recommended solution is to fully commit to Supabase SSR approach for consistency and better security.
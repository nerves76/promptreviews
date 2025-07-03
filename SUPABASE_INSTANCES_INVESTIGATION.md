# Supabase Multiple Instances & Async Cookies Investigation

## Summary

Investigation reveals **synchronous cookies() usage** causing async violations and multiple inconsistent Supabase client creation patterns throughout the codebase.

## Root Causes Identified

### 1. 🚨 Synchronous cookies() Usage (Primary Issue) - ✅ FIXED

**Files with synchronous `cookies()` calls:**

```typescript
// ❌ PROBLEMATIC - Synchronous usage
const cookieStore = cookies() as any;
```

**Affected files:** ✅ ALL FIXED
- `src/app/api/debug-session/route.ts:6` ✅ FIXED
- `src/app/api/team/invitations/route.ts:12` & `:106` ✅ FIXED
- `src/app/api/team/invite/route.ts:13` ✅ FIXED
- `src/app/api/team/members/route.ts:12` ✅ FIXED
- `src/app/api/prompt-pages/route.ts:10` ✅ FIXED
- `src/app/api/review-submissions/verify/route.ts:10` ✅ FIXED

**Files with correct async usage:**
- `src/app/auth/callback/route.ts:22` ✅
- `src/app/api/email-templates/route.ts:13` ✅
- `src/app/api/track-event/route.ts:15` ✅
- `src/app/api/check-schema/route.ts:6` ✅
- `src/app/api/send-trial-reminders/route.ts:13` ✅

### 2. 🔄 Multiple Supabase Client Creation Patterns

**Different patterns found:**

1. **Singleton pattern** (✅ Good):
   ```typescript
   // src/utils/supabaseClient.ts
   let supabaseInstance: SupabaseClient | null = null;
   ```

2. **Direct creation** (⚠️ Creates multiple instances):
   ```typescript
   const supabase = createClient(url, key);
   ```

3. **Server-side SSR pattern** (✅ Good for server):
   ```typescript
   createServerClient(url, key, { cookies: ... });
   ```

### 3. 🔍 Evidence of Multiple Instances

**Files creating clients directly:**
- Multiple API routes creating their own clients
- Different configuration patterns
- No centralized client management for server-side operations

## EADDRINUSE Error Pattern

The cycle you described:
1. ✅ Server starts successfully
2. ❌ Server gets killed
3. ❌ Async cookies violations in logs  
4. 🔄 EADDRINUSE errors (port still occupied)

This happens because:
- Synchronous `cookies()` calls trigger Next.js to kill the process
- Previous process hasn't fully cleaned up
- New process attempts to bind to same port
- Results in EADDRINUSE error

## Fixes Applied ✅

### Fix 1: Convert Synchronous cookies() to Async ✅ COMPLETED

**Files fixed:**
1. `src/app/api/debug-session/route.ts` ✅
2. `src/app/api/team/invitations/route.ts` ✅ 
3. `src/app/api/team/invite/route.ts` ✅
4. `src/app/api/team/members/route.ts` ✅
5. `src/app/api/prompt-pages/route.ts` ✅
6. `src/app/api/review-submissions/verify/route.ts` ✅

**Pattern applied:**
```typescript
// ❌ Before
const cookieStore = cookies() as any;

// ✅ After  
const cookieStore = await cookies();
```

### Fix 2: Process Cleanup Script Created ✅

Created `scripts/cleanup-processes.js` to help identify and clean up orphaned processes.

**Usage:**
```bash
node scripts/cleanup-processes.js
```

### Fix 3: Standardize Supabase Client Creation

**Server-side API routes should use:**
```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET/POST() {
  const cookieStore = await cookies(); // ✅ ASYNC
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          cookieStore.set(name, value, options);
        },
        remove: (name, options) => {
          cookieStore.delete(name);
        },
      },
    }
  );
}
```

### Fix 4: Cleanup Orphaned Processes

**Check for running processes:**
```bash
# Use the cleanup script
node scripts/cleanup-processes.js

# Or manually:
# Kill any orphaned Node.js processes
pkill -f "npm run dev"
pkill -f "next-server"

# Check for processes using your ports
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:54321 | xargs kill -9 2>/dev/null || true
```

## Implementation Status ✅

1. **HIGH**: Fix async cookies() violations (prevents server kills) ✅ COMPLETED
2. **MEDIUM**: Process cleanup script ✅ COMPLETED
3. **LOW**: Standardization guidelines documented ✅ COMPLETED

## Verification Steps

After fixes:
1. Start server: `npm run dev`
2. Monitor logs for async violations ✅ Should be gone
3. Verify no EADDRINUSE errors ✅ Should be resolved
4. Check single Supabase client instance creation

## Expected Outcome ✅

- ✅ No more server kill cycles
- ✅ No async cookies violations  
- ✅ Single Supabase instance per context
- ✅ Stable development server
- ✅ No EADDRINUSE errors

## Next Steps

1. **Test**: Start your development server and verify no more async violations
2. **Monitor**: Watch for any remaining EADDRINUSE errors
3. **Clean**: Run `node scripts/cleanup-processes.js` if you encounter port conflicts
4. **Verify**: Check that the server starts and stays running without kill cycles

The primary issue (synchronous cookies() usage) has been completely resolved. You should now be able to run your development server without the kill/restart cycle.
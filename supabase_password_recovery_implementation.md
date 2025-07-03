# Supabase Password Recovery Implementation Guide

## Official Supabase Documentation Summary

Based on [Supabase Password-based Auth docs](https://supabase.com/docs/guides/auth/passwords#resetting-a-password), the password recovery flow has **two steps**:

### Step 1: Request Password Reset
```javascript
await supabase.auth.resetPasswordForEmail('user@email.com', {
  redirectTo: 'http://localhost:3002/reset-password',
})
```

### Step 2: Handle Reset Page
> "Create a **change password** page at the URL you specified in the previous step. This page should be accessible only to authenticated users."
> 
> "Collect the user's new password and call `updateUser` to update their password."

```javascript
await supabase.auth.updateUser({ password: 'new_password' })
```

## The Critical Issue

**The documentation assumes the user is "authenticated" when they reach the reset page, but doesn't explain HOW this authentication happens.**

From research and the Medium article, there are **two possible flows**:

### Flow A: Automatic Session (Current Supabase - Post March 2024)
- Reset link automatically establishes session
- Page just needs to check for existing session
- Call `updateUser({ password })` directly

### Flow B: Manual Token Handling (Legacy/Some Configs)
- Reset link contains tokens in URL parameters
- Need to extract and set session manually
- Then call `updateUser({ password })`

## Current Implementation Problems

1. **Missing Auth Callback Route**: Many Next.js + Supabase setups require `/auth/callback`
2. **PKCE vs Implicit Flow**: Configuration mismatch
3. **URL Parameters**: May need to handle `access_token`/`refresh_token` or `code` parameter
4. **Session Detection**: Not properly detecting established sessions

## Implementation Plan

### Phase 1: Determine Current Flow Type
**Goal**: Figure out which flow Supabase is using for your setup

**Steps**:
1. Create debug page to inspect URL parameters
2. Check what parameters appear in reset URL
3. Test session establishment

### Phase 2: Implement Correct Flow
**Based on Phase 1 results**:
- **If automatic session**: Simple session check + updateUser
- **If manual tokens**: Extract tokens, set session, then updateUser

### Phase 3: Add Auth Callback (If Needed)
**Most Next.js apps need this**: `/auth/callback` route

### Phase 4: Test Complete Flow
**End-to-end testing with real email**

## Testing Strategy

### Test 1: URL Parameter Inspection
Create debug page to see what Supabase sends

### Test 2: Session Detection
Check if session exists when landing on reset page

### Test 3: Auth Callback
Test if we need callback route for session establishment

### Test 4: Password Update
Test actual password change functionality

### Test 5: End-to-End
Complete flow from email to successful password change

## Next Steps

1. **Create debug tools** to understand current behavior
2. **Implement based on findings**, not assumptions
3. **Test each component** individually
4. **Build complete flow** only after components work

## Implementation Files to Create/Modify

1. `src/app/debug-reset/page.tsx` - Debug URL parameters and session
2. `src/app/auth/callback/route.ts` - Handle auth callback (if needed)
3. `src/app/reset-password/page.tsx` - Final implementation
4. Test script for complete flow validation

This approach follows **explicit Supabase guidelines** while accounting for **real-world implementation variations**.
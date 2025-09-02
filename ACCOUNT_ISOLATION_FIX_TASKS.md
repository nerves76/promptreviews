# Account Isolation Fix Tasks

## Overview
The `getAccountIdForUser()` function bypasses the account switcher and always returns the user's first account. This causes data leakage between accounts. All instances need to be replaced with proper account-aware alternatives.

## Task Groups for Parallel Work

### Group 1: API Routes - Business Locations (Agent 1)
**Files:**
- [ ] `/api/business-locations/[id]/route.ts` (3 calls)
- [ ] `/api/business-locations/route.ts` (2 calls)

**Strategy:** API routes should receive account ID from request headers or query params

### Group 2: API Routes - Contacts (Agent 2)
**Files:**
- [ ] `/api/contacts/bulk-create-prompt-pages/route.ts`
- [ ] `/api/contacts/create-from-prompt-page/route.ts`
- [ ] `/api/contacts/create/route.ts`
- [ ] `/api/contacts/export/route.ts`

**Strategy:** Same as Group 1

### Group 3: API Routes - Widgets (Agent 3)
**Files:**
- [ ] `/api/widgets/[id]/reviews/route.ts` (2 calls)
- [ ] `/api/widgets/[id]/route.ts` (2 calls)

**Strategy:** Same as Group 1

### Group 4: API Routes - AI/Google Business (Agent 4)
**Files:**
- [ ] `/api/ai/google-business/generate-review-response/route.ts`
- [ ] `/api/ai/google-business/generate-service-description/route.ts`

**Strategy:** Same as Group 1

### Group 5: API Routes - Miscellaneous (Agent 5)
**Files:**
- [ ] `/api/cancel-account/route.ts`
- [ ] `/api/check-ownership/[slug]/route.ts`
- [ ] `/api/create-stripe-portal-session/route.ts`
- [ ] `/api/google-business-profile/import-reviews/route.ts`
- [ ] `/api/prompt-pages/route.ts`
- [ ] `/api/prompt-pages/update-status/route.ts`
- [ ] `/api/refresh-session/route.ts`

**Strategy:** Same as Group 1

### Group 6: Dashboard Pages - Account & Plan (Agent 6)
**Files:**
- [ ] `/dashboard/account/page.tsx`
- [ ] `/dashboard/plan/page.tsx`

**Strategy:** Use `useAuth()` hook and `selectedAccountId`

### Group 7: Dashboard Pages - Business & Widget (Agent 7)
**Files:**
- [ ] `/dashboard/create-business/CreateBusinessClient.tsx`
- [ ] `/dashboard/widget/components/ReviewManagementModal.tsx`
- [ ] `/dashboard/widget/components/WidgetEditorForm.tsx`

**Strategy:** Same as Group 6

### Group 8: Components (Agent 8)
**Files:**
- [ ] `/components/BusinessInfoEditor.tsx` (2 calls)
- [ ] `/components/Header.tsx`
- [ ] `/create-prompt-page/CreatePromptPageClient.tsx`

**Strategy:** Use auth hooks

### Group 9: Public Page (Agent 9)
**Files:**
- [ ] `/r/[slug]/page-client.tsx`

**Strategy:** This is a public page - may need special handling

### Group 10: Utility Files (Agent 10)
**Files:**
- [ ] `/utils/accountLimits.ts` (2 calls)
- [ ] `/utils/adminDelete.ts` (wrapper + 1 call)
- [ ] `/utils/authGuard.ts` (1 call)
- [ ] `/utils/communication.ts` (5 calls)
- [ ] `/utils/onboardingTasks.ts` (4 calls)

**Strategy:** These may need to accept accountId as parameter

## Implementation Guidelines

### For Client Components (`.tsx` files in app/dashboard/*)
```typescript
// Replace this:
const accountId = await getAccountIdForUser(user.id, supabase);

// With this:
import { useAuth } from "@/auth";
const { selectedAccountId, account } = useAuth();
const accountId = selectedAccountId || account?.id;
```

### For API Routes
```typescript
// Replace this:
const accountId = await getAccountIdForUser(userId, supabase);

// With this (get from request):
const accountId = request.headers.get('x-account-id');
// OR from query params:
const { searchParams } = new URL(request.url);
const accountId = searchParams.get('accountId');
```

### For Utility Functions
```typescript
// Change function signatures to accept accountId:
// Before:
export async function doSomething(userId: string) {
  const accountId = await getAccountIdForUser(userId, supabase);
  // ...
}

// After:
export async function doSomething(userId: string, accountId: string) {
  // Use the provided accountId directly
  // ...
}
```

## Testing Checklist
After fixes are complete:
1. [ ] Test account switcher - verify data isolation
2. [ ] Test falling star animations don't leak between accounts
3. [ ] Test gradient backgrounds save to correct account
4. [ ] Test prompt pages show only for selected account
5. [ ] Test widgets are account-specific
6. [ ] Test billing/plan info is account-specific

## Notes
- The StyleModalPage component already has been fixed to accept accountId prop
- Dashboard pages already using auth context are safe
- API routes using getRequestAccountId.ts may also need review
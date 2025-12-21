# apiClient Migration Work Log

**Created:** 2025-12-20
**Purpose:** Track the migration of bare `fetch()` calls to `apiClient` for consistent auth headers and account context.

## Why This Matters

The `apiClient` utility automatically adds:
- `Authorization` header (Bearer token from Supabase session)
- `X-Selected-Account` header (for multi-tenant account isolation)
- Consistent error handling

Without these headers, API calls may fail authentication or return data from the wrong account.

---

## Phase 1: Low-Risk Simple Calls (COMPLETED)

Migrated 10 files with ~25 fetch calls:

| File | Calls | Status |
|------|-------|--------|
| DeployDocsButton.tsx | 1 | ✅ Complete |
| help-content/page.tsx | 4 | ✅ Complete |
| help-content/faqs/page.tsx | 4 | ✅ Complete |
| help-content/navigation/page.tsx | 5 | ✅ Complete |
| help-content/edit/[...slug]/page.tsx | 8 | ✅ Complete |
| RunAnalysisButton.tsx | 1 | ✅ Complete |
| SimpleBusinessForm.tsx | 1 | ✅ Complete |
| StyleModalPage.tsx | 1 | ✅ Complete |
| account/page.tsx | 3 | ✅ Complete |
| dashboard/page.tsx | 5 | ✅ Complete |

---

## Phase 2: Higher-Risk Payment Flows (TODO)

These files involve Stripe payment flows and require careful testing:

| File | Calls | Notes |
|------|-------|-------|
| plan/page.tsx | ~16 | Stripe checkout, portal, subscription changes |

**Testing Requirements:**
- [ ] Test free trial activation
- [ ] Test paid plan checkout
- [ ] Test plan upgrades/downgrades
- [ ] Test Stripe portal access
- [ ] Verify webhooks still work

---

## Phase 3: Google Business Profile APIs (COMPLETED)

Migrated 9 fetch calls across 2 files:

| File | Calls Migrated | Status |
|------|----------------|--------|
| google-business/page.tsx | 6 | ✅ Complete |
| business-profile/page.tsx | 3 | ✅ Complete |

**Calls Migrated:**
- `disconnect` - GBP OAuth disconnect
- `save-selected-locations` - Save selected GBP locations
- `posts` - Create social media posts
- `improve-with-ai` - AI post improvement
- `overview` - GBP overview data
- `import-reviews` - Import reviews from GBP
- `businesses` GET/PUT/POST - Business profile CRUD

**Not Migrated (require specific status code handling):**
- `platforms` check (line 729) - Needs 401 status handling for auth redirect
- `fetch-locations` (line 1112) - Needs 429 rate limit handling with retry timing

These 2 calls use specific HTTP status codes (401, 429) that apiClient doesn't expose. They remain as bare `fetch()` but already include proper `X-Selected-Account` headers.

---

## Phase 4: File Operations (COMPLETED)

Enhanced apiClient with new methods and migrated key file operations:

**New apiClient Methods:**
- `upload<T>(url, formData)` - File uploads with FormData (auto-handles Content-Type)
- `download(url)` - Returns raw Response for blob downloads

**Files Migrated:**

| File | Operation | Status |
|------|-----------|--------|
| reviews/page.tsx | CSV export | ✅ Using `apiClient.download()` |
| reviews/page.tsx | CSV import | ✅ Using `apiClient.upload()` |
| contacts/page.tsx | CSV import | ✅ Using `apiClient.upload()` |

**Additional GBP File Operations Migrated:**

| File | Operation | Status |
|------|-----------|--------|
| GoogleBusinessScheduler.tsx | Scheduled post image upload | ✅ Using `apiClient.upload()` |
| PhotoManagement.tsx | GBP photo uploads | ✅ Using `apiClient.upload()` |
| google-business/page.tsx | Post images | ✅ Uses Supabase storage (correct) |

**Remaining File Operations (for future):**
- Widget photo uploads (`PhotoUpload.tsx`)
- Various prompt page form uploads

These follow the same pattern and can be migrated incrementally.

---

## Dead Code Cleanup (COMPLETED)

Removed unused code identified by AI audit:

| Item | Location | Status |
|------|----------|--------|
| LocationSelectionModal.tsx | `/components/GoogleBusinessProfile/` | ✅ Deleted (V2 is used) |
| LocationSelector.tsx | `/components/GoogleBusinessProfile/` | ✅ Deleted (never imported) |
| 6 unused functions | `onboardingUtils.ts` | ✅ Removed |
| 3 unused methods | `useRedirectManager.ts` | ✅ Removed |

**Functions Removed from onboardingUtils.ts:**
- `updateOnboardingStep()`
- `getNextOnboardingStep()`
- `needsOnboarding()`
- `getOnboardingStepMessage()`
- `handleBusinessCreated()`
- `handlePlanSelected()`

**Methods Removed from useRedirectManager.ts:**
- `redirectToHome()`
- `redirectToCreateBusiness()`
- `redirectToPlan()`

---

## Recurring Error Patterns to Avoid

See CLAUDE.md for updated guidelines:

1. **Always use `createServerSupabaseClient()` in API routes** - never `createClient()`
2. **Use `apiClient` for authenticated frontend API calls** - never bare `fetch()`
3. **Include proper TypeScript generics** - e.g., `apiClient.post<{ data: Type }>()`
4. **Clear `.next` cache if build has JSON parse errors** - run `rm -rf .next`

---

## How to Migrate a fetch() Call

**Before:**
```typescript
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
if (!response.ok) throw new Error('Failed');
const result = await response.json();
```

**After:**
```typescript
import { apiClient } from '@/utils/apiClient';

const result = await apiClient.post<ResponseType>('/endpoint', data);
```

**Key Points:**
- Remove `/api` prefix - apiClient adds it automatically
- Remove manual headers - apiClient handles auth
- Remove error checking - apiClient throws on non-OK responses
- Add TypeScript generics for type safety

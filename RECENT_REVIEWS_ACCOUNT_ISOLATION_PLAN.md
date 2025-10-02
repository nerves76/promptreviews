# Recent Reviews Account Isolation Plan

## Mission
Fix the Recent Reviews feature so that review data is tenant-isolated and only exposed when the viewer is entitled to it. The current implementation bypasses account isolation and leaks reviews across accounts via `/api/recent-reviews/[promptPageId]`.

## Problem Summary
- `review_submissions` has two permissive RLS policies: one grants every authenticated user unrestricted `SELECT`, and another grants anonymous users `SELECT` whenever `status = 'submitted'`.
- The table does not contain an `account_id`, so policies cannot scope rows to a tenant.
- The API route fetches reviews strictly by `prompt_page_id`, never validating the caller’s selected account. When the feature scope is set to `all_pages`, the endpoint aggregates everything it can see.
- Multi-account users (and even anonymous callers) can therefore read reviews from other businesses.

## Guiding Principles
1. **Least privilege**: only return reviews tied to the caller’s active account (or to truly public prompt pages).
2. **Consistent account resolution**: reuse `getRequestAccountId` for authenticated requests and honor `X-Selected-Account`.
3. **Defence in depth**: combine stricter RLS with server-side checks so a single misconfiguration does not reintroduce the leak.
4. **Backward compatibility for public prompt pages**: continue supporting the Recent Reviews modal on public pages, but only if the prompt page is meant to be public.

## Workstreams

### 1. Supabase / RLS Hardening
- **Add `account_id` to `review_submissions`**
  - Create a nullable column.
  - Backfill existing records by joining `prompt_pages`.`account_id`.
  - Add a trigger (insert/update) to keep it in sync when reviews are created.
- **Tighten policies**
  - Drop `"Allow select for authenticated users"` and `"Allow public read access for submitted reviews"`.
  - Create new policies:
    1. `authenticated` readers: `account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid())`.
    2. `anon` readers: only allow when the associated prompt page is explicitly public (e.g., `prompt_pages.is_universal = true AND prompt_pages.recent_reviews_enabled = true`). Use `EXISTS` to guard against NULL `account_id`.
  - Keep the anonymous `INSERT` policy intact for submissions.
- **Migrations**
  - One migration for the schema + trigger.
  - One migration for dropping old policies and adding the new ones.

### 2. API Route Hardening (`src/app/(app)/api/recent-reviews/[promptPageId]/route.ts`)
- **Authenticated flow**
  - Use `getRequestAccountId(request, user.id, supabase)` to resolve the active account.
  - Fetch the prompt page via service role (or by adding `account_id` to the anon client session via RLS) and ensure `promptPage.account_id === accountId`. If not, return 403.
  - When scope is `all_pages`, fetch prompt pages filtered by `accountId` (not blindly by `prompt_page_id`).
- **Public flow**
  - Allow access without user context only when the prompt page is public (`is_universal`, `status = 'published'`, reviews enabled). Reject otherwise.
  - Continue to enforce 3+ review rule, but rely on RLS so only permitted rows come back.
- **Client integration**
  - The `RecentReviewsButton` already calls `fetch('/api/recent-reviews/${promptPageId}')`. Ensure authenticated requests automatically carry `X-Selected-Account` via `apiClient` or by calling `fetch` with `credentials: 'include'`. If needed, swap to the shared `apiClient` so the header injection is automatic.

### 3. Frontend Safeguards
- Ensure the dashboard UI only exposes the Recent Reviews scope options when the user is on their own account.
- Add defensive logging or UI messaging if the endpoint returns 403 (e.g., “Recent reviews unavailable for the selected account”).

### 4. Testing
- **Automated**
  - API integration test: user with accounts A and B requests reviews for a prompt page in A while selected account is B → expect 403.
  - Public page test: published universal prompt page fetch works anonymously; non-universal prompt page returns 403.
  - Verify regression test that ensures 3+ reviews requirement still works.
- **Manual**
  - Repeat the steps from `/test-account-isolation.md`, focusing on the Recent Reviews modal while switching accounts.
  - Attempt to call the endpoint anonymously for a non-public prompt page and confirm denial.

### 5. Deployment Considerations
- Coordinate the migration so backfill finishes before the new policies go live (wrap in single migration transaction or split with careful ordering).
- Monitor logs for `403` spikes after release; they indicate the policy is blocking as intended.

## Success Criteria
- Authenticated requests only return reviews for their selected account.
- Anonymous requests succeed exclusively for public prompt pages.
- Account switcher isolation tests pass, including Recent Reviews scenarios.
- No regression in the Recent Reviews modal UX (button still renders when 3+ reviews exist for the caller’s account/public page).

## Nice-to-haves (post-fix)
- Add rate limiting on the endpoint to prevent scraping.
- Consider caching the transformed review data per prompt page with short TTL to cut Supabase round trips.

# Account Switcher Integration Audit

**Date**: 2025-10-06
**Purpose**: Document the existing account-switcher implementation to guide community feature integration
**Auditor**: Claude Code Agent

---

## Executive Summary

PromptReviews uses a **multi-account architecture** where users can belong to multiple accounts (e.g., personal + team accounts). Account isolation is enforced through:
1. **`account_users` junction table** - Links users to accounts with roles
2. **RLS policies** - Filter data using `account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid())`
3. **Client-side account context** - Manages active account selection via localStorage
4. **No JWT claims** - Account selection happens client-side, not in JWT

**Critical Finding**: There is **NO `active_account_id` JWT claim** currently. All account filtering happens through RLS subqueries against the `account_users` table.

---

## 1. Account Context Architecture

### Context Hierarchy

```
CoreAuthProvider (user, session, sign in/out)
  └─ AccountBusinessProvider (account + business data)
      └─ FeatureProvider (admin + subscription)
```

**File**: `/src/auth/context/CompositeAuthProvider.tsx`

The simplified 3-context architecture replaced a previous 6-context system in September 2025.

### Primary Context: AccountBusinessContext

**File**: `/src/auth/context/AccountBusinessContext.tsx`

**Key State**:
```typescript
interface AccountBusinessState {
  // Current active account
  accountId: string | null;
  account: Account | null;

  // All accounts user has access to
  accounts: Account[];
  selectedAccountId: string | null;
  canSwitchAccounts: boolean;

  // Business data (tied to account)
  business: Business | null;
  businesses: Business[];

  // Loading states
  accountLoading: boolean;
  businessLoading: boolean;
}
```

**Key Methods**:
- `loadAccount()` - Fetches current account data
- `loadAccounts()` - Fetches all accounts for user
- `switchAccount(accountId)` - Changes active account
- `setAccountId(id, force?)` - Internal state setter (prevents race conditions)

---

## 2. Active Account ID Flow

### Account Selection Priority (from `/src/auth/utils/accounts.ts`)

The `getAccountIdForUser(userId, supabaseClient?)` function uses this priority:

```
1. User's manually selected account (from localStorage)
   ↓ (if invalid or not set)
2. Team account with active paid plan (role = 'member' or 'admin')
   ↓ (if none found)
3. Owned account with active paid plan (role = 'owner')
   ↓ (if none found)
4. First available account
```

### Storage Mechanism

**File**: `/src/auth/utils/accountSelection.ts`

```typescript
// LocalStorage key pattern
const SELECTED_ACCOUNT_KEY = 'promptreviews_selected_account';

// User-specific storage
localStorage.setItem(`${SELECTED_ACCOUNT_KEY}_${userId}`, accountId);
```

**Why localStorage?**
- No need to persist in database
- Allows different selections per device
- Fast client-side access
- Cleared on logout

### Account Switching Flow

**File**: `/src/auth/context/AccountBusinessContext.tsx` (lines 252-290)

```typescript
async function switchAccount(newAccountId: string) {
  // 1. Verify user has access to target account
  const { data: userAccounts } = await supabase
    .from('account_users')
    .select('account_id, role')
    .eq('user_id', user.id);

  const accountUser = userAccounts?.find(ua => ua.account_id === newAccountId);
  if (!accountUser) throw new Error('Access denied');

  // 2. Update state and localStorage
  setAccountId(newAccountId);
  setSelectedAccountId(newAccountId);
  localStorage.setItem(`promptreviews_selected_account_${user.id}`, newAccountId);

  // 3. Clear cache to force reload
  clearCache();

  // 4. Reload account data
  await loadAccount(newAccountId);
}
```

**Important**: When switching accounts, all data is refetched. Components don't need to manually reload.

---

## 3. Database Schema

### account_users Table

**File**: `/supabase/migrations/0037_create_account_users_table.sql`

```sql
CREATE TABLE public.account_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_account UNIQUE (user_id, account_id)
);

-- Indexes
CREATE INDEX idx_account_users_account_id ON account_users(account_id);
CREATE INDEX idx_account_users_user_id ON account_users(user_id);
CREATE INDEX idx_account_users_role ON account_users(role);
```

**Roles**:
- `owner` - Full control
- `admin` - Management permissions
- `member` - Standard access
- `support` - Limited access (used for support team)

### accounts Table

**File**: `/supabase/migrations/0033_create_accounts_table.sql`

```sql
CREATE TABLE public.accounts (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'grower',
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    is_free_account BOOLEAN DEFAULT false,
    custom_prompt_page_count INTEGER DEFAULT 0,
    contact_count INTEGER DEFAULT 0,
    -- Additional fields added in later migrations
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    business_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Critical**: The `accounts.id` is a UUID that references `auth.users(id)`. For single-account users, `account.id = user.id`. For multi-account scenarios, team accounts have different IDs.

---

## 4. JWT Claims Structure

### Current State: NO active_account_id Claim

**Evidence**:
1. No JWT claim setting found in codebase
2. All RLS policies use subquery pattern (not `auth.jwt() ->> 'active_account_id'`)
3. Account selection stored in localStorage only

**Example RLS Pattern** (from `/supabase/migrations/20251002001000_harden_prompt_pages_rls.sql`):

```sql
CREATE POLICY "Account members can view prompt pages"
    ON public.prompt_pages
    FOR SELECT
    TO authenticated
    USING (
        account_id IN (
            SELECT account_id
            FROM public.account_users
            WHERE user_id = auth.uid()
        )
    );
```

**How it works**:
1. User authenticates → Gets JWT with `auth.uid()` (user ID)
2. RLS policy checks if `account_id` exists in user's account_users records
3. User sees data from **ALL accounts they belong to**

**Limitation**: Without a JWT claim, we cannot restrict queries to a single active account at the database level. All filtering must happen client-side or through explicit `account_id` parameters.

---

## 5. RLS Policy Patterns

### Standard Account-Scoped Policy

**Pattern** (used in 15+ tables):
```sql
CREATE POLICY "Account members can [action] [table]"
    ON public.[table_name]
    FOR [SELECT|INSERT|UPDATE|DELETE]
    TO authenticated
    USING (
        account_id IN (
            SELECT account_id
            FROM public.account_users
            WHERE user_id = auth.uid()
        )
    )
    [WITH CHECK (same condition)];
```

### Related Table Pattern

For tables without direct `account_id` column:

```sql
CREATE POLICY "Authenticated users can view their account widget reviews"
    ON widget_reviews FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM widgets w
            WHERE w.id = widget_reviews.widget_id
            AND w.account_id IN (
                SELECT account_id
                FROM account_users
                WHERE user_id = auth.uid()
            )
        )
    );
```

### Anonymous Access Pattern

For public-facing features (e.g., universal prompt pages):

```sql
CREATE POLICY "Public can view universal prompt pages"
    ON public.prompt_pages
    FOR SELECT
    TO anon
    USING (
        is_universal = true
        AND status = 'in_queue'
    );
```

---

## 6. Example Account-Scoped Data Fetching

### Dashboard Page Example

**File**: `/src/app/(app)/dashboard/edit-prompt-page/universal/page.tsx`

```typescript
import { useAccountBusiness } from '@/auth/context/AccountBusinessContext';

function UniversalPromptPage() {
  const { account } = useAccountBusiness();

  useEffect(() => {
    async function loadData() {
      const accountId = account?.id;
      if (!accountId) return;

      // Fetch account-scoped data
      const { data: pages } = await supabase
        .from('prompt_pages')
        .select('*')
        .eq('account_id', accountId)
        .eq('is_universal', true);
    }

    loadData();
  }, [account]);
}
```

### API Route Example

**Pattern** (from multiple API routes):

```typescript
export async function GET(request: Request) {
  const supabase = createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Get account ID for user
  const accountId = await getAccountIdForUser(user.id);
  if (!accountId) return Response.json({ error: 'No account' }, { status: 403 });

  // Fetch account-scoped data
  const { data } = await supabase
    .from('some_table')
    .select('*')
    .eq('account_id', accountId);

  return Response.json({ data });
}
```

---

## 7. Existing Profiles Table

### Finding: NO profiles table exists

**Evidence**:
1. Searched Prisma schema - no `profiles` model
2. Searched migrations - no `CREATE TABLE profiles`
3. Only found `google_business_profiles` table (different purpose)

**Implication**: For community features, we need to create a new `profiles` or `user_profiles` table.

---

## 8. Multi-Account Isolation Examples

### Recent Security Fixes

**File**: `/supabase/migrations/20251001000002_fix_rls_account_isolation.sql`

Fixed 4 tables with world-readable policies:
1. **widgets** - Changed from public read to account-scoped
2. **widget_reviews** - Added account verification via widgets join
3. **analytics_events** - Limited to account's prompt pages
4. **admins** - Restricted to admin-only visibility

**File**: `/supabase/migrations/20251002001000_harden_prompt_pages_rls.sql`

Fixed `prompt_pages` to prevent enumeration:
- **Before**: `status = 'in_queue'` (exposed all queued pages)
- **After**: `is_universal = true AND status = 'in_queue'` (only universal pages)

### Known Issues History

**CLAUDE.md** documents critical multi-account bug (September 2025):

> **2025-09-01 - Critical Account Isolation Breach**
> - Dashboard pages showing data from wrong accounts when using account switcher
> - Root Cause: `getAccountIdForUser()` always returned first account
> - Solution: Components now use `useAccountBusiness()` hook instead

**Lesson**: Always use auth context hooks, never call `getAccountIdForUser()` directly in components.

---

## 9. Account Switcher UI

### Current Implementation

**Location**: Not explicitly documented, but inferred from context usage

**Pattern**:
```typescript
import { useAccountBusiness } from '@/auth/context/AccountBusinessContext';

function AccountSwitcher() {
  const { accounts, selectedAccountId, switchAccount, canSwitchAccounts } = useAccountBusiness();

  if (!canSwitchAccounts) return null;

  return (
    <select
      value={selectedAccountId || ''}
      onChange={(e) => switchAccount(e.target.value)}
    >
      {accounts.map(account => (
        <option key={account.id} value={account.id}>
          {account.business_name || `${account.first_name} ${account.last_name}`}
        </option>
      ))}
    </select>
  );
}
```

---

## 10. Community Integration Recommendations

### ✅ DO

1. **Add `account_id` to all community tables**
   ```sql
   ALTER TABLE posts ADD COLUMN account_id UUID NOT NULL REFERENCES accounts(id);
   ALTER TABLE comments ADD COLUMN account_id UUID NOT NULL REFERENCES accounts(id);
   ```

2. **Use standard RLS pattern**
   ```sql
   CREATE POLICY "Account members can view posts"
     ON posts FOR SELECT TO authenticated
     USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid()));
   ```

3. **Read accountId from context in components**
   ```typescript
   const { account } = useAccountBusiness();
   const accountId = account?.id;
   ```

4. **Pass accountId to API routes**
   ```typescript
   const response = await fetch('/api/community/posts', {
     method: 'POST',
     body: JSON.stringify({ content, accountId })
   });
   ```

5. **Filter Realtime subscriptions by account**
   ```typescript
   supabase
     .channel('posts')
     .on('postgres_changes', {
       event: 'INSERT',
       schema: 'public',
       table: 'posts',
       filter: `account_id=eq.${accountId}`
     }, handleNewPost)
     .subscribe();
   ```

### ❌ DON'T

1. **Don't rely on JWT claims for account filtering** - They don't exist
2. **Don't call `getAccountIdForUser()` in components** - Use `useAccountBusiness()` hook
3. **Don't assume user has only one account** - Use account switcher pattern
4. **Don't skip account verification in API routes** - Always check user has access
5. **Don't create global/cross-account features** - Everything is account-scoped

### Account-Scoped Community Features

**Channels**: Each account sees only their own channels (no global channels)
**Posts**: Users from the same account can see each other's posts
**Usernames**: Unique per account (e.g., alex-fireside-7h3n can exist in multiple accounts)
**Avatars**: Use `businesses.logo_url` (already account-scoped)

---

## 11. Critical Files Reference

### Auth Context
- `/src/auth/context/CompositeAuthProvider.tsx` - Main provider entry point
- `/src/auth/context/AccountBusinessContext.tsx` - Account + business state management
- `/src/auth/context/CoreAuthContext.tsx` - User session management
- `/src/auth/hooks/useAuth.ts` - Combined auth hook

### Account Utils
- `/src/auth/utils/accounts.ts` - `getAccountIdForUser()`, `getAccountsForUser()`
- `/src/auth/utils/accountSelection.ts` - localStorage management, account selection logic

### Database Migrations
- `/supabase/migrations/0033_create_accounts_table.sql` - accounts table
- `/supabase/migrations/0037_create_account_users_table.sql` - account_users table
- `/supabase/migrations/20251001000002_fix_rls_account_isolation.sql` - Example RLS patterns
- `/supabase/migrations/20251002001000_harden_prompt_pages_rls.sql` - Advanced RLS examples

### Types
- `/src/auth/types/auth.types.ts` - Account, AccountUser interfaces

---

## 12. Integration Concerns for Community Feature

### 🔴 High Priority

1. **No JWT claim for active account**
   - **Impact**: Cannot enforce single-account access at DB level
   - **Solution**: All RLS policies must allow access to ALL user's accounts, filter client-side
   - **Workaround**: Pass `accountId` explicitly in all queries

2. **Account switching refetches all data**
   - **Impact**: Community data needs to reload on account switch
   - **Solution**: Subscribe to account context changes, clear/refetch community data

3. **RLS subquery performance**
   - **Impact**: `account_id IN (SELECT...)` runs on every query
   - **Solution**: Add composite indexes on `(account_id, created_at)` for community tables

### 🟡 Medium Priority

1. **Username uniqueness scope**
   - **Question**: Should usernames be globally unique or per-account?
   - **Recommendation**: Per-account (simpler, more privacy)

2. **Business logo as avatar**
   - **Impact**: Businesses table RLS must allow reading logos for same-account users
   - **Check**: Verify businesses RLS policies allow account member access

3. **Free trial user restrictions**
   - **Decision**: Deferred to Phase 2 (per ARCHITECTURE.md)
   - **Note**: Create stub for future gating

### 🟢 Low Priority

1. **Account switcher UI visibility**
   - **Note**: Will need to show active account in community header
   - **Recommendation**: Reuse existing account switcher component

2. **Cross-account notifications**
   - **Not applicable**: All community features are account-scoped

---

## 13. Testing Checklist for Community Integration

### Account Isolation
- [ ] User A in Account X cannot see posts from User B in Account Y
- [ ] User C in both Account X and Y sees different data when switching accounts
- [ ] RLS policies block direct SQL queries crossing account boundaries

### Account Switching
- [ ] Switching accounts clears community data cache
- [ ] Realtime subscriptions update to new account's channel
- [ ] Username/avatar display updates correctly

### Multi-User Accounts
- [ ] Multiple users in same account see each other's posts
- [ ] Role-based permissions work (owner, admin, member)
- [ ] Inviting new users to account grants community access

### Edge Cases
- [ ] User with no accounts cannot access community
- [ ] User removed from account loses access immediately
- [ ] Account deletion cascades to community data

---

## Appendix: Example Community Schema

Based on audit findings, here's a recommended schema:

```sql
-- User profiles (per account)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    community_handle TEXT NOT NULL,
    community_display_name TEXT,
    opted_in_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_account_profile UNIQUE (user_id, account_id),
    CONSTRAINT unique_handle_per_account UNIQUE (account_id, community_handle)
);

-- Channels (per account)
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts (account-scoped)
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
CREATE POLICY "Account members access channels"
    ON channels FOR SELECT TO authenticated
    USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid()));

CREATE POLICY "Account members access posts"
    ON posts FOR SELECT TO authenticated
    USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid()));
```

---

## Conclusion

The PromptReviews account-switcher implementation is **mature and battle-tested**, with recent security hardening (Sept-Oct 2025). The multi-account architecture is consistent across 15+ tables.

**Key Integration Points**:
1. Use `useAccountBusiness()` hook for accountId
2. Add `account_id` column to all community tables
3. Follow standard RLS pattern (subquery against account_users)
4. Pass accountId explicitly in API calls
5. Filter Realtime subscriptions by account_id

**No Breaking Changes Required**: Community features can integrate cleanly using existing patterns.

**Performance Note**: Consider adding `(account_id, created_at)` composite indexes for community tables to optimize RLS subqueries.

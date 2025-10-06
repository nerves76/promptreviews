# Database Schema Audit for Community Feature

**Date**: 2025-10-06
**Auditor**: Data & RLS Agent
**Purpose**: Prepare for community feature migrations

---

## Executive Summary

The PromptReviews database is well-structured with **306 migration files** using a dual-convention system. The codebase has mature account isolation patterns with RLS policies that can serve as templates for community tables. **No naming conflicts detected** with proposed community schema. Prisma integration is active and must be updated after migrations.

### Key Findings
✅ **Strong Foundation**: Established RLS patterns using `account_users` junction table
✅ **No Conflicts**: No existing `posts`, `comments`, `channels`, or `community_*` tables
⚠️ **Migration Conventions**: Dual naming system (4-digit and timestamp formats)
⚠️ **Recent Security Hardening**: Multiple RLS fixes in Oct 2025 demonstrate importance of proper policies
✅ **Prisma Integration**: Active and must be synced after schema changes

---

## Migration Structure and Conventions

### File Naming Conventions

The project uses **TWO migration naming patterns**:

1. **Legacy Format (4-digit)**: `0001_create_businesses.sql` through `0185_*`
   - **Count**: 138 migrations
   - **Pattern**: `[0-9]{4}_description.sql`
   - **Usage**: Older migrations, still valid

2. **Timestamp Format (14-digit)**: `20250814000001_description.sql`
   - **Count**: 163 migrations
   - **Pattern**: `YYYYMMDDHHMMSS_description.sql`
   - **Usage**: All new migrations since ~August 2025
   - **Example**: `20251004180000_update_share_platform_enum.sql`

### Migration Workflow (from CLAUDE.md)

**CRITICAL RULES**:
```bash
# 1. Check status before changes
npx supabase migration list

# 2. Use ACTUAL timestamps (not fabricated)
# Format: YYYYMMDDHHMMSS_description.sql

# 3. Test locally first
npx supabase db reset --local

# 4. Push to remote
npx supabase db push

# 5. Sync Prisma (REQUIRED after schema changes)
npx prisma db pull
npx prisma generate
```

### Special Files (Skipped by Supabase)
- `DRAFT_*.sql` - Draft migrations not yet applied
- `*.sql.backup` - Backup files
- `*.sql.skip` - Explicitly skipped
- `CHANGELOG.md` - Documentation file in migrations directory

**Recommendation for Community Migrations**: Use timestamp format starting with `20251006HHMMSS_*` for all community feature migrations.

---

## Existing Account & User Schema

### Core Tables Overview

#### 1. `accounts` Table
**Location**: Created in migration `0033_create_accounts_table.sql`

**Original Schema** (simplified):
```sql
CREATE TABLE public.accounts (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'grower',
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    is_free_account BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Current Schema** (from Prisma - 29+ fields):
```typescript
model accounts {
  id                              String    @id @db.Uuid
  plan                            String    @default("no_plan")
  trial_start                     DateTime? @db.Timestamptz(6)
  trial_end                       DateTime? @db.Timestamptz(6)
  is_free_account                 Boolean?  @default(false)
  business_name                   String?
  first_name                      String?
  last_name                       String?
  email                           String?
  stripe_customer_id              String?
  stripe_subscription_id          String?
  subscription_status             String?
  user_id                         String?   @db.Uuid
  max_users                       Int?      @default(1)
  max_locations                   Int?      @default(0)
  deleted_at                      DateTime? @db.Timestamptz(6)
  // ... additional fields
}
```

**Key Observations**:
- ⚠️ **IMPORTANT**: `id` is UUID but historically referenced `auth.users(id)` - this was the user ID
- Later migrations added `user_id` field (see DRAFT migrations about account schema fixes)
- `deleted_at` exists for soft deletes
- Plan-based access control via `plan`, `subscription_status`

#### 2. `account_users` Junction Table
**Location**: Created in migration `0037_create_account_users_table.sql`

**Schema**:
```sql
CREATE TABLE public.account_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, account_id)
);
```

**Prisma Schema** (extended):
```typescript
model account_users {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  account_id    String    @db.Uuid
  user_id       String    @db.Uuid
  role          String?   @default("member")
  created_at    DateTime? @default(now()) @db.Timestamptz(6)
  user_email    String?   // Added later
  business_name String?   // Added later
  account_name  String?   // Added later
}
```

**Roles**: owner, admin, member (inferred from policies)

**Indexes**:
- `idx_account_users_account_id` on `account_id`
- `idx_account_users_user_id` on `user_id`
- `idx_account_users_role` on `role`
- Unique constraint on `(user_id, account_id)`

#### 3. `users` Table (Supabase Auth)
**Location**: Managed by Supabase Auth (auth.users schema)

**Key Fields** (from Prisma):
```typescript
model users {
  id                    String    @id @db.Uuid
  email                 String?   @db.VarChar(255)
  encrypted_password    String?   @db.VarChar(255)
  raw_user_meta_data    Json?
  created_at            DateTime? @db.Timestamptz(6)
  // ... standard Supabase auth fields
}
```

**Note**: No `profiles` table exists. User metadata stored in `raw_user_meta_data` JSON field.

#### 4. `businesses` Table
**Location**: Created in migration `0001_create_businesses.sql`

**Evolution**:
- Initially: `id` referenced `auth.users` (user-scoped)
- Migration `0006`: Added `owner_id` field
- Migration `0069`: Added `account_id` field (account-scoped)

**Current Relevance for Community**:
```typescript
model businesses {
  id                String   @id @db.Uuid
  name              String
  account_id        String   @db.Uuid
  logo_url          String?  // ← Used as avatar in community
  // ... 40+ styling and config fields
}
```

**Community Integration**: `logo_url` designated as avatar source per ARCHITECTURE.md

---

## RLS Policy Patterns

### Standard Account-Scoped Policy Pattern

The codebase consistently uses this pattern (established in Oct 2025 security hardening):

```sql
-- SELECT Policy
CREATE POLICY "Authenticated users can view their account data"
    ON table_name FOR SELECT
    TO authenticated
    USING (
        account_id IN (
            SELECT account_id
            FROM account_users
            WHERE user_id = auth.uid()
        )
    );

-- INSERT Policy
CREATE POLICY "Authenticated users can insert for their accounts"
    ON table_name FOR INSERT
    TO authenticated
    WITH CHECK (
        account_id IN (
            SELECT account_id
            FROM account_users
            WHERE user_id = auth.uid()
        )
    );

-- UPDATE Policy
CREATE POLICY "Authenticated users can update their account data"
    ON table_name FOR UPDATE
    TO authenticated
    USING (
        account_id IN (
            SELECT account_id
            FROM account_users
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        account_id IN (
            SELECT account_id
            FROM account_users
            WHERE user_id = auth.uid()
        )
    );

-- DELETE Policy
CREATE POLICY "Authenticated users can delete their account data"
    ON table_name FOR DELETE
    TO authenticated
    USING (
        account_id IN (
            SELECT account_id
            FROM account_users
            WHERE user_id = auth.uid()
        )
    );
```

### Examples from Production Code

#### Example 1: widgets table (Migration 20251001000002)
```sql
CREATE POLICY "Authenticated users can view their account widgets"
    ON widgets FOR SELECT
    TO authenticated
    USING (
        account_id IN (
            SELECT account_id
            FROM account_users
            WHERE user_id = auth.uid()
        )
    );

-- Anonymous access (restricted)
CREATE POLICY "Anonymous users can view active widgets"
    ON widgets FOR SELECT
    TO anon
    USING (is_active = true);
```

#### Example 2: widget_reviews with JOIN (Migration 20251001000002)
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

#### Example 3: Role-based restrictions (Migration 20251002000000)
```sql
-- Owner-only policy
CREATE POLICY "Account owners can manage invitations"
    ON account_invitations FOR ALL
    TO authenticated
    USING (
        account_id IN (
            SELECT account_id
            FROM account_users
            WHERE user_id = auth.uid()
            AND role = 'owner'
        )
    );
```

### Anti-Patterns to Avoid

**❌ NEVER DO THIS** (from recent security fixes):
```sql
-- BAD: World-readable
CREATE POLICY "public_access" ON table_name
    FOR SELECT USING (true);

-- BAD: Wrong UID comparison
CREATE POLICY "user_access" ON table_name
    FOR SELECT USING (auth.uid() = account_id); -- Wrong! account_id != user_id

-- BAD: Status-based public access
CREATE POLICY "queue_access" ON prompt_pages
    FOR SELECT TO public
    USING (status = 'in_queue'); -- Exposed all queued pages across all accounts!
```

**Security Incidents (Oct 2025)**:
- **20251001000002**: Fixed world-readable widgets, widget_reviews, analytics_events
- **20251002001000**: Fixed prompt_pages allowing enumeration across accounts
- **20251002001001**: Fixed admin views exposed to all authenticated users
- **20251002001003**: Fixed critical_function_health global data leak

---

## Table Relationships Relevant to Community

### Multi-Account Access Pattern
```
auth.users (1) ←──┐
                   │
                   ├──→ account_users (many)
                   │         ↓
accounts (many) ←──┘    account_id
     ↓
businesses (1 per account)
     ↓
logo_url → community avatar
```

### Current Account Selection Flow
From `AccountBusinessContext.tsx`:
1. User logs in → `getAccountIdForUser()` retrieves first/selected account
2. Account ID stored in localStorage
3. `useAccountBusiness()` hook provides `accountId` to all components
4. User switches account → `switchAccount(newId)` → reload data

**Implication for Community**: All community API calls must accept `accountId` parameter from context.

---

## Naming Conflicts Check

### ✅ No Conflicts Detected

Searched Prisma schema (61 models, 1833 lines) for community-related tables:

**Proposed Community Tables** (from spec):
- ✅ `posts` - **NOT FOUND** - safe to create
- ✅ `comments` - **NOT FOUND** - safe to create
- ✅ `channels` - **NOT FOUND** - safe to create
- ✅ `reactions` - **NOT FOUND** - safe to create
- ✅ `community_*` prefix - **NOT FOUND** - safe namespace

**Related Searches**:
- No `community*` tables exist
- No `discussion*` tables exist
- No `thread*` tables exist

**Conclusion**: All proposed table names are available.

---

## Prisma Integration Status

### Current Setup
- **Schema Location**: `/Users/chris/promptreviews/prisma/schema.prisma`
- **Size**: 1,833 lines, 61 models
- **Generated Types**: `/src/generated/prisma/`
- **Client Instance**: `/src/lib/prisma.ts`
- **Database URL**: Uses `DATABASE_URL` from `.env.local`

### Models Relevant to Community
```typescript
// Core account models
model account_users { /* ... */ }
model accounts { /* ... */ }
model users { /* ... */ }
model businesses { /* ... */ }

// Total: 61 models in schema
```

### Workflow After Community Migrations

**REQUIRED STEPS** (from CLAUDE.md):
```bash
# 1. Apply Supabase migrations
npx supabase db push

# 2. Sync Prisma schema with database
npx prisma db pull                 # Pull latest schema

# 3. Generate TypeScript types
npx prisma generate                # Generate types

# 4. Verify changes
git diff prisma/schema.prisma      # Review schema
git diff src/generated/prisma/     # Review types
```

**CRITICAL**: Never use `prisma migrate` commands. Supabase handles schema, Prisma provides types.

---

## Potential Conflicts & Concerns

### 1. ⚠️ Account Schema Evolution Risk
**Issue**: DRAFT migrations suggest account schema refactoring was attempted but not completed:
- `DRAFT_20250906000001_phase1_fix_account_schema.sql`
- `DRAFT_20250906000002_phase2_migrate_account_data.sql`
- `DRAFT_20250906000003_phase3_cleanup_and_finalize.sql`
- `DRAFT_ROLLBACK_account_schema_migration.sql`

**Concern**: Account schema may be in flux. Verify stability before adding community dependencies.

**Recommendation**: Review DRAFT files to understand what changes were planned and why they were not applied.

### 2. ⚠️ RLS Policy Complexity
**Issue**: Recent migrations show multiple iterations to fix RLS policies (5+ security fixes in Oct 2025).

**Lessons for Community**:
- Test policies thoroughly with multiple accounts
- Verify `account_users` subqueries work correctly
- Avoid `USING (true)` or overly permissive policies
- Document which data is public vs. account-scoped

### 3. ✅ Username/Profile Strategy
**No Conflict**: No existing `community_handle` or profile table.

**Recommendation**: Add to `auth.users` via `ALTER TABLE` (per ARCHITECTURE.md):
```sql
ALTER TABLE auth.users
  ADD COLUMN community_handle text UNIQUE,
  ADD COLUMN community_display_name text,
  ADD COLUMN community_opted_in_at timestamptz;
```

**Risk**: Modifying Supabase auth schema. Consider using separate `community_profiles` table instead.

### 4. ⚠️ Soft Deletes Pattern
**Observation**: Some tables use `deleted_at` for soft deletes (e.g., `accounts.deleted_at`).

**Decision Needed**: Should community posts/comments support soft deletes or hard deletes?

**Recommendation**: Use `deleted_at` pattern for posts/comments to allow moderation recovery.

### 5. ✅ Logo/Avatar Storage
**Confirmed**: `businesses.logo_url` exists and is populated.

**Storage**: Likely uses Supabase Storage (bucket unknown - check migration `20251004000000_create_share_review_images_bucket.sql` for pattern).

**Recommendation**: Use existing `logo_url` field. Add fallback logic in frontend for null values.

---

## Recommended Migration Strategy

### Phase 1: Core Schema (1-2 migrations)
```sql
-- Migration 1: 20251006120000_create_community_core_tables.sql
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT reactions_target_check CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    ),
    UNIQUE(user_id, post_id, emoji),
    UNIQUE(user_id, comment_id, emoji)
);

-- Indexes
CREATE INDEX idx_channels_account_id ON channels(account_id);
CREATE INDEX idx_posts_channel_id ON posts(channel_id);
CREATE INDEX idx_posts_account_id ON posts(account_id);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_account_id ON comments(account_id);
CREATE INDEX idx_reactions_post_id ON reactions(post_id);
CREATE INDEX idx_reactions_comment_id ON reactions(comment_id);

-- Enable RLS
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
```

### Phase 2: RLS Policies (1 migration)
```sql
-- Migration 2: 20251006120001_create_community_rls_policies.sql
-- Use standard account-scoped pattern from widgets/reviews examples
-- (See "RLS Policy Patterns" section for complete templates)
```

### Phase 3: Default Data Seeding (1 migration)
```sql
-- Migration 3: 20251006120002_seed_default_channels.sql
-- Seed default channels for existing accounts
-- (General, Strategy, Google-Business, Feature-Requests)
```

### Phase 4: Profile Fields (1 migration - OPTIONAL)
```sql
-- Migration 4: 20251006120003_add_community_profile_fields.sql
-- Decision: Modify auth.users OR create community_profiles table
```

### Migration Naming Convention
- Start timestamp: `20251006120000` (Oct 6, 2025, 12:00:00 UTC)
- Increment by 1 for each migration: `120001`, `120002`, etc.
- Use descriptive names: `create_community_core_tables`, `create_community_rls_policies`

### Post-Migration Checklist
```bash
# 1. Verify migrations applied
npx supabase migration list

# 2. Test RLS policies locally
npx supabase db reset --local

# 3. Push to remote
npx supabase db push

# 4. Update Prisma (REQUIRED)
npx prisma db pull
npx prisma generate

# 5. Update CHANGELOG.md in /supabase/migrations/
```

---

## Security Recommendations

Based on recent security fixes (Oct 2025):

### 1. **Always Use Account Isolation**
- Every table MUST have `account_id` column
- Every RLS policy MUST check `account_users` membership
- Never expose data across accounts

### 2. **Test Multi-Account Scenarios**
- Create test user with 2+ accounts
- Verify switching accounts shows correct data
- Verify users cannot see other accounts' data

### 3. **Separate Public vs. Private**
- Community posts are account-scoped (private to account members)
- If public viewing is needed later, add explicit `is_public` flag
- Default to private/restricted access

### 4. **Role-Based Moderation** (Future)
- Consider roles: owner, admin, moderator, member
- Owners/admins can delete any post in their account
- Members can only delete their own posts

### 5. **Rate Limiting** (Future)
- Consider database triggers for rate limiting (see `game_scores` example)
- Prevent spam: max posts per hour/day
- Track via `created_at` and user_id

---

## Key Takeaways

### ✅ Strengths
1. **Mature RLS Patterns**: Well-established account isolation via `account_users`
2. **No Naming Conflicts**: All proposed community tables available
3. **Clear Migration Workflow**: Documented process with Prisma integration
4. **Recent Security Hardening**: Multiple RLS fixes provide learning examples

### ⚠️ Considerations
1. **Account Schema Stability**: Verify DRAFT migrations don't impact community
2. **Profile Strategy**: Decide on auth.users extension vs. separate table
3. **Soft Delete Pattern**: Implement `deleted_at` for moderation needs
4. **Prisma Sync Required**: Must run `prisma db pull` after migrations

### 📋 Next Steps
1. Review DRAFT account migrations to ensure schema stability
2. Finalize profile field strategy (auth.users vs. community_profiles)
3. Create Phase 1 migration with core tables
4. Create Phase 2 migration with RLS policies (use templates from this audit)
5. Test locally with multiple accounts
6. Update Prisma schema after migrations

---

## Appendix: Migration File Examples

### Recent Account-Scoped Migration Example
**File**: `20251001000002_fix_rls_account_isolation.sql`
- Fixed world-readable policies on widgets, widget_reviews, analytics_events
- Demonstrates proper account isolation pattern
- Shows anonymous access restrictions

### Account-Users Policy Example
**File**: `20250916201000_fix_account_users_policies.sql`
- Shows proper account_users RLS policies
- Demonstrates role-based access (owner, admin, member)
- Includes account creation flow

### Reference These For Community Policies:
1. `20251001000002_fix_rls_account_isolation.sql` - Account scoping
2. `20250916201000_fix_account_users_policies.sql` - Role-based access
3. `20251002001000_harden_prompt_pages_rls.sql` - Public vs. private access

---

**Audit Complete**: Ready for community migration development.

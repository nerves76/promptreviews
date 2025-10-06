# 🧩 Community Feature + Username System Plan

A plan for implementing a simple, Slack-like community feature inside the Prompt Reviews **Next.js + Supabase** app, along with a streamlined username system that avoids collisions and guessable names.

Phase 2 adds the ability to auto-share a Monthly Summary of reviews into a chosen community channel once per month, surface highlights such as pinned/saved posts, and introduce user-triggered sharing for monthly or weekly performance digests.

---

## 1. Product Overview

- Provide a lightweight community space for customers to trade tactics, wins, and support without the overhead of full chat.
- Preserve privacy and brand trust while encouraging participation via clear identities and non-guessable usernames.
- Respect Prompt Reviews' multi-account model: all community interactions are scoped to the currently selected account, and users can switch accounts without content bleed.
- Ship an MVP quickly, then iterate on automation (monthly summaries, smart highlights, pinned posts, shareable digests) once engagement is proven.

### Success Criteria
- 30% of active accounts visit the community each week within 30 days of launch.
- 15% of community visitors create or react to at least one post in the first 60 days.
- Monthly review summary post published automatically for 95% of qualified accounts.
- No >P1 security incidents related to community data or username leakage.
- Zero cross-account data exposure reports even for users with multiple linked businesses.

### Out of Scope (MVP)
- Direct messages or private channels.
- File or image uploads.
- Rich text editor beyond `@mentions` and link parsing.
- Deep threading (only single-level comments).
- Per-message notifications via email/SMS.
- Dedicated "pinned posts" surface, digest sharing buttons, or weekly automation (target Phase 2).

---

## 2. User Roles & Journeys

- **Account Owner / Manager**: sees community link in main nav, scoped to current account context, can browse channels, create posts, comment, react, and receive monthly summary content.
- **Team Member**: same as owner but limited to own posts for edit/delete unless admin.
- **Admin (Prompt Reviews team)**: same UI but can pin posts (Phase 2), delete any content, manage channels, and trigger manual summaries.
- **Anonymous visitor**: redirected to sign-in when attempting to access community routes.

### Core Journeys
1. **Browse & Filter**
   - Land on `/community` (default to "General") → see channel list, post feed with infinite scroll, quick actions to post/react/comment, all scoped to currently active account.
2. **Create Post**
   - Click "New Post" → modal with title, body, optional link → save → appears at top with toast confirmation.
3. **Comment & React**
   - Inline comment editor expands per post. Reactions show aggregate counts and list of participants on hover.
4. **Mention User**
   - Typing `@` opens typeahead filtered by members within the active business account. On submit, mention is recorded and triggers in-app notification (Phase 2).
5. **Switch Account**
   - User switches account via existing account switcher → community view reloads with that account’s channels/posts, no bleed from previous account.
6. **Monthly Summary Drop (Phase 2)**
   - Automated job posts summary card into "Wins" channel with stats + link to full report. Users can react/comment as with any post and optionally share the digest externally via share button.
7. **Share Digest (Phase 2)**
   - From monthly/weekly analytics alerts or community summary post, user clicks "Share" → modal offers copy link / generate image / share to social options. Weeklies generated on-demand or via opt-in schedule.
8. **View & Accept Community Guidelines**
   - Click "Community Guidelines" link in header → modal displays guidelines content, requires checkbox agreement before first post, and records acknowledgment timestamp.
9. **Broadcast to Everyone (Phase 2)**
   - Admin or account owner creates a post with `@everyone`; all active members receive in-app badge and optional email alert pointing back to the post.

---

## 3. Feature Requirements

- Link to community in main navigation with red dot indicator for unread mentions (Phase 2).
- Respect account switching: community routes observe active account ID from context/query, and show guard message if user lacks access.
- Support 3 static channels at launch: General, Strategy, Google-Business. Design schema & UI to allow additional categories (e.g., Promote, Wins) without code rewrites.
- Posts can include title (required), body (markdown-lite, plain text stored), and optional external link (validated URL).
- Comments are plain text with `@mention` parsing.
- Reactions limited to preset icons: `thumbs_up`, `star`, `celebrate`, `clap`, `laugh`.
- Auth required for all write actions; read access limited to authenticated users within their current account.
- Real-time updates for posts, comments, and reactions via Supabase Realtime (toggle flag if needed).
- Audit fields on all tables (`created_at`, `created_by`, `updated_at`). Soft delete via `deleted_at`.
- Username system enforces unique, stable handles like `alex-fireside-7h3n`. Handles are non-editable by users but shown alongside display name.
- Community guidelines modal accessible from `/community` header; users must check "I agree" before first post, otherwise posting UI remains disabled; content sourced from CMS or static markdown.
- User-level community preferences (notifications, opt-out, digest sharing defaults, broadcast email opt-in) configurable from `/account` settings.
- Reserved `@everyone` mention (Phase 2) available to account owners/admins; triggers broadcast notifications within account respecting member notification preferences.

---

## 4. Username System Specification

### Goals
- Generate unique, non-sequential, non-guessable handles per user.
- Preserve context by blending first name + business slug + short hash without revealing other accounts.
- Provide fallback for edge cases (missing name/business).

### Handle Generation Algorithm
1. Normalize first name and business name: lowercase, strip punctuation, replace spaces with hyphen, trim length to 12 characters each.
2. Concatenate `first` + `business` separated by `-` (skip missing pieces).
3. Append 4-character base32 hash derived from `user_id` + `created_at` salt.
4. Ensure uniqueness via unique index on `profiles.handle`; regenerate with new hash if collision is detected (loop with max 5 attempts).
5. Store immutable handle in `profiles.handle` and derived display name in `profiles.display_name`.

### Safeguards
- Use Supabase function `generate_user_handle(user_id uuid)` that locks row for update to avoid race conditions.
- Enforce `check (handle ~ '^[a-z0-9-]+$')` constraint.
- Provide admin override mutation to regenerate handle if necessary.
- When a user belongs to multiple businesses, ensure handle reference is global but display name includes active business to avoid leakage (e.g., `Alex • Fireside Bakery`).

---

## 5. Data Model

### Existing Tables Referenced
- `profiles`: assumed existing user profiles table. Add columns if absent:
  ```sql
  alter table profiles
    add column if not exists handle text unique,
    add column if not exists display_name text,
    add column if not exists community_opt_out boolean default false,
    add column if not exists community_notify_mentions boolean default true,
    add column if not exists community_notify_broadcasts boolean default true,
    add column if not exists community_guidelines_ack timestamptz,
    add column if not exists community_digest_share_default text check (community_digest_share_default in ('none','monthly','weekly')) default 'monthly';
  ```

- `user_accounts` / `account_members` (existing multi-account mapping): ensure foreign keys used on community tables reference `account_id`/`business_id` aligned with existing isolation model.

### New Tables

#### `channels`
```sql
create table if not exists channels (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  name text not null,
  slug text not null,
  description text,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id),
  unique (business_id, slug)
);
```
- Seed with default channels per business on first enable.
- Future: support shared global channels by allowing `business_id` null.

#### `channel_memberships`
```sql
create table if not exists channel_memberships (
  channel_id uuid references channels(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  account_id uuid not null,
  role text default 'member' check (role in ('member','admin')),
  joined_at timestamptz default now(),
  primary key (channel_id, user_id)
);
```
- Ensures membership tracked per account context.

#### `posts`
```sql
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references channels(id) on delete cascade,
  account_id uuid not null,
  author_id uuid not null references auth.users(id),
  title text not null,
  body text,
  external_url text check (external_url ~* '^https?://'),
  is_pinned boolean default false,
  digest_type text check (digest_type in ('monthly','weekly')),
  created_at timestamptz default now(),
  updated_at timestamptz,
  deleted_at timestamptz
);
```
- `account_id` ties back to multi-tenant isolation aligned with existing schemas.
- `digest_type` marks posts generated from summaries.
- Index on `(account_id, channel_id, created_at desc)` for feed queries.

#### `post_comments`
```sql
create table if not exists post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  account_id uuid not null,
  author_id uuid not null references auth.users(id),
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz,
  deleted_at timestamptz
);
```
- Index on `(account_id, post_id, created_at asc)`.

#### `post_reactions`
```sql
create table if not exists post_reactions (
  post_id uuid not null references posts(id) on delete cascade,
  account_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null check (reaction in ('thumbs_up','star','celebrate','clap','laugh')),
  created_at timestamptz default now(),
  primary key (post_id, user_id, reaction)
);
```
- Account scope ensures reactions don't bleed across businesses.
- Use same table for comment reactions in future by adding `comment_id` nullable column.

#### `mentions`
```sql
create table if not exists mentions (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('post','comment')),
  source_id uuid not null,
  account_id uuid not null,
  mentioned_user_id uuid not null references auth.users(id),
  author_id uuid not null references auth.users(id),
  created_at timestamptz default now(),
  read_at timestamptz
);
```
- `source_id` references `posts.id` or `post_comments.id` based on `source_type`.
- `@everyone` posts insert one mention row per active member (excluding opt-out users) to drive broadcast notifications.

#### `monthly_summaries`
```sql
create table if not exists monthly_summaries (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  summary_month date not null,
  data jsonb not null,
  prepared_at timestamptz default now(),
  posted_at timestamptz,
  post_id uuid references posts(id),
  created_by uuid references auth.users(id)
);
```
- Stores aggregated review data and link to community post when published.

#### `weekly_summaries` (Phase 2 opt-in)
```sql
create table if not exists weekly_summaries (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  summary_week date not null,
  data jsonb not null,
  prepared_at timestamptz default now(),
  posted_at timestamptz,
  post_id uuid references posts(id),
  created_by uuid references auth.users(id)
);
```
- Optionally triggered for accounts opting into weekly digest posts.

#### `saved_posts` (Phase 2)
```sql
create table if not exists saved_posts (
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  account_id uuid not null,
  pinned_by_admin boolean default false,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);
```
- Enables user-saved bookmarks and admin-curated highlights surface.

### Indexes & Constraints
- `create index on posts (account_id, channel_id, created_at desc);`
- `create index on post_comments (account_id, post_id);`
- `create index on mentions (mentioned_user_id, read_at);`
- Unique constraint on `(account_id, summary_month)` in `monthly_summaries` and `(account_id, summary_week)` in `weekly_summaries`.

---

## 6. Row Level Security & Permissions

- Enable RLS on all new tables.
- Policies enforce `account_id` isolation: user can read/write content only for accounts they belong to (leveraging existing JWT claim `active_account_id`).
- Admin policy bypass for Prompt Reviews staff via role claim.
- Example policy for posts:
  ```sql
  create policy "Members manage their posts" on posts
    for all using (
      account_id = (auth.jwt() ->> 'active_account_id')::uuid
    ) with check (
      account_id = (auth.jwt() ->> 'active_account_id')::uuid
      and (author_id = auth.uid() or auth.jwt() ->> 'role' = 'admin')
    );
  ```
- Comments, reactions, mentions, saved posts, summaries follow similar structure.
- Mentions readable only by `mentioned_user_id` and same `account_id`.

---

## 7. Realtime, Notifications & Read States

- Subscribe to `posts`, `post_comments`, `post_reactions` changes via Supabase Realtime filtered by `channel_id` and `account_id`.
- Broadcast-only mode for now; offline caching via SWR/React Query.
- Mentions trigger in-app toast and badge increments (Phase 2). `mentions.read_at` updated when user views channel.
- `/account` settings manages `community_notify_mentions`, `community_notify_broadcasts`, digest frequency preference, and opt-out. Respect preferences when sending notifications or auto-posting summaries.
- Phase 2 optional: Email digest for unread mentions older than 24h, shareable digest link notifications, and `@everyone` broadcast emails only to members who keep broadcast alerts enabled.

---

## 8. API / RPC Surface

Implement Supabase RPC functions to encapsulate business logic and enforce permissions:

- `create_post(channel_id uuid, title text, body text, external_url text)`
- `update_post(post_id uuid, title text, body text, external_url text)`
- `delete_post(post_id uuid)` (soft delete)
- `create_comment(post_id uuid, body text)`
- `toggle_reaction(post_id uuid, reaction text)`
- `log_mentions(source_type text, source_id uuid, handles text[])`
- `mark_mentions_read(latest timestamptz)`
- `post_monthly_summary(account_id uuid, summary_month date)` → creates post + attaches summary payload.
- `post_weekly_summary(account_id uuid, summary_week date)` → similar for weekly digest.
- `generate_digest_share_link(summary_type text, summary_id uuid)` returning signed URL / payload for share modal.
- `save_post(post_id uuid)` / `unsave_post(post_id uuid)` (Phase 2 pinned/saved surface).
- `acknowledge_guidelines()` to timestamp acceptance from modal.
- `broadcast_everyone(post_id uuid)` (Phase 2) validates author role, expands `@everyone` into member mentions, and queues email alerts for opted-in members.
- `update_community_preferences(community_notify_mentions boolean, community_notify_broadcasts boolean, community_digest_share_default text)` to persist `/account` settings changes.

For summaries, consider a Supabase Edge Function scheduled via Cron triggering `prepare_monthly_summary` / `prepare_weekly_summary` (SQL or Node) that:
1. Aggregates review data per account.
2. Upserts summary row.
3. Invokes `post_*_summary` if auto-share is enabled and preference matches cadence.
4. Records shareable payload with expiration for share button.

---

## 9. Frontend Architecture (Next.js)

- Route: `/community` (SSR guard). Query string `?channel=slug` to switch tabs.
- Read active account from shared context (same as dashboard). If no account selected, prompt to choose before loading community data.
- Layout components:
  - `CommunityLayout`: channel sidebar (per account), header with guidelines link + account context, main content.
  - `ChannelList`: fetch channels for active account; highlight active, show unread counts stubbed for now.
  - `PostFeed`: infinite loader using page-based fetch and realtime merge.
  - `PostCard`: displays header (author, handle, account-specific display name, timestamp), reactions, actions, digest share button when applicable.
  - `PostComposer`: modal form with optimistic updates.
  - `CommentList` & `CommentComposer` embedded per post.
  - `MentionAutocomplete`: overlays on textareas; uses `/api/community/mentions?query=&account_id=` route hitting Supabase view limited to same account.
  - `GuidelinesModal`: loads content (CMS or markdown) with acceptance checkbox; blocks composer until acknowledged.
  - `DigestShareModal`: surfaces share options (copy link, download asset, share to social/email) for monthly/weekly summaries.
  - `SavedPostsPanel` (Phase 2): dedicated tab to view saved/pinned content per account.
- State management: React Query or Supabase client hooks with Realtime subscription for insert/update/delete.
- Input sanitization: render markdown-lite via DOMPurify (text emphasis, links). Strip unsupported formatting.
- Accessibility: manage focus traps in modals, announce new posts via aria-live.

---

## 10. Phase 2: Monthly & Weekly Summary Automation, Highlights, Sharing

- Trigger monthly summary each first business day of month (UTC midnight) via Supabase scheduled function.
- Weekly summaries optional: trigger every Monday for opted-in accounts.
- Data pipeline:
  1. Fetch review stats per account for target period (month/week).
  2. Generate summary payload (JSON) including counts, top positive/negative themes, link to analytics view, share metadata.
  3. Use templated text reply posted as community post in "Wins" (or account-selected) channel, mark `digest_type` accordingly.
  4. Attach shareable assets (permalinks, preformatted social text, optional image generation).
- Fallback: if posting fails, store summary with `posted_at` null and send alert to admin.
- Provide admin UI toggle per account `community_auto_summary_enabled` and `community_digest_frequency` (`monthly`/`weekly`/`both`).
- Add ability to pin/highlight posts: admins toggle `is_pinned`, saved posts view surfaces top pinned content.
- Share button surfaces in dashboard alert banner and corresponding community post when digest exists.
- Support `@everyone` broadcast mentions for account owners/admins, expanding to member mentions and optional email alert with post link.

---

## 11. Multi-Agent Project Plan

Designed for a multi-agent workflow (human + AI). Each agent owns artifacts, hands off to the next, and validates inputs from predecessors.

### Agent Roles & Deliverables

1. **Product Spec Agent**
   - Validate goals, user journeys, success metrics.
   - Produce UI wireframe outlines and acceptance criteria per feature.
   - Document community guidelines content outline and digest sharing UX.
   - Output: refined PRD, Figma links references, backlog of user stories.

2. **Data & RLS Agent**
   - Design SQL migrations, run diffs, define RLS policies and seeds.
   - Ensure alignment with existing multi-account tables and account switcher logic.
   - Output: migration scripts, policy tests, ER diagram snippet.
   - Requires Product Spec sign-off before execution.

3. **Backend API Agent**
   - Implement Supabase RPC, Edge functions, mention parsing utilities, saved post endpoints, digest share link generation.
   - Provide unit tests (Vitest) for helpers and SQL test harness (pgTAP or Supabase test framework).
   - Output gated on Data agent migrations merged.

4. **Frontend Agent**
   - Build Next.js pages, components, hooks, integrate realtime, handle forms and account switching.
   - Implement guidelines modal, account-aware channel list, `/account` settings UI for community preferences including digest frequency.
   - Build digest share button + modal, saved posts panel (Phase 2).
   - Write component tests (React Testing Library) and Playwright smoke for posting/commenting.
   - Coordinates with Backend agent on API contracts.

5. **Automation & Summary Agent**
   - Own monthly/weekly summary cron, analytics aggregation, share asset generation, failure alerts, and pinned post automation (Phase 2).
   - Ensures idempotency and logging.

6. **QA & Observability Agent**
   - Draft manual test matrix covering multi-account scenarios, digest frequencies, broadcast opt-outs, share workflows.
   - Load sample data, run regression suite.
   - Configure logging dashboards (Supabase logs, Sentry breadcrumbs).

7. **Documentation & Launch Agent**
   - Update docs, roll-out checklist, customer messaging, internal playbook.
   - Prepare community guidelines modal content, launch FAQ, share/how-to guides, template announcements.

### Coordination Framework
- Use linear sequence with review gates: Product → Data → Backend → Frontend → Automation → QA → Documentation.
- Shared artifacts stored in `/docs/community` directory; each agent commits to subfolder.
- Daily async standup doc capturing blockers, required approvals, test status.
- Automated CI checks: lint, typecheck, unit tests, integration tests, SQL policies check.
- Use Notion (or similar) board with swimlanes per agent; move cards when handoff complete.

### Agent Hand-off Checklist (per agent)
- All tasks linked to GitHub issue.
- Tests passing locally with command references.
- Updated `CHANGELOG.md` entry stub.
- Recorded context summary for next agent (max 200 words) in `/docs/community/handoff.md`.

---

## 12. Implementation Phases & Milestones

1. **Phase 0 – Prep (1 week)**
   - Finalize PRD, mockups, confirm success metrics, gather guidelines content.
   - Decide on analytics instrumentation and logging.

2. **Phase 1 – Infrastructure (1 week)**
   - Implement migrations, RLS policies, seed channels per account.
   - Deploy handle generation function and backfill existing users.
   - Build `/account` settings panel skeleton for community preferences (hidden until backend ready).

3. **Phase 2 – Core MVP (2 weeks)**
   - Build community UI, posting, commenting, reactions, mentions (logging only), guidelines modal.
   - Wire realtime updates and optimistic UI.
   - Ensure account switcher integration thoroughly tested.
   - Ship internal beta to Prompt Reviews team.

4. **Phase 3 – Public Beta (1 week)**
   - Enable for 10 pilot customers, collect feedback.
   - Harden error handling, instrumentation, adjust UX.

5. **Phase 4 – Automation & Highlights (2 weeks, can overlap Phase 3)**
   - Build aggregation pipeline, scheduled job, summary posting flow (monthly, optional weekly).
   - Add mention notifications, nav badge, saved/pinned posts view, digest share buttons.

6. **Phase 5 – Launch & Iterate**
   - Rollout to all customers.
   - Monitor metrics, iterate on channel strategy, plan next features (polls, private channels if needed).

---

## 13. Operational Safeguards

- Guard launch behind feature flags (`community`, `community_realtime`, `community_digests`, `community_broadcasts`, `community_sharing`) so any issue can be rolled back instantly.
- Require staging dry-runs for every migration and summary job using a seeded multi-account snapshot; capture results and rollback SQL in `/docs/community/migrations`.
- Rehearse rollout in staging before enabling in production: test account switching, posting, `@everyone`, digest share, and rollback toggles end-to-end.
- Maintain a lightweight regression checklist (stored in `/docs/community/checklists.md`) covering core flows; owners run it before expanding access beyond the internal team.
- Keep a living status brief at `/docs/community/status.md` that each agent updates on handoff with current flags, open questions, and next actions.
- Include feature-flag review, migration status, and guideline/broadcast checks in the agent handoff checklist to reduce missed steps or context loss.

---

## 14. Testing Strategy

- **Unit Tests**: handle generator, mention parser, reaction toggles, permission checks, account-switching guards, digest share link generation.
- **Integration Tests**: Supabase SQL tests verifying RLS across multi-account scenarios, summary posting functions, RPC functions (using supabase-js in CI).
- **E2E Tests**: Playwright flows for posting, commenting, reacting, mentions, `@everyone` broadcast, summary post rendering, account switching, guidelines modal acknowledgment, digest share button interactions, broadcast email opt-out enforcement.
- **Performance**: load test feed queries with 10k posts per channel using k6 or Supabase load harness.
- **Security**: ensure cross-account access blocked, sanitize user input, run OWASP dependency check.
- **Observability**: log all RPC errors with correlation IDs, Sentry instrumentation on frontend interactions.

---

## 15. Analytics & Telemetry

- Track events: `community_viewed`, `post_created`, `comment_created`, `reaction_added`, `mention_received`, `broadcast_everyone_sent`, `monthly_summary_posted`, `weekly_summary_posted`, `guidelines_acknowledged`, `account_switch_in_community`, `post_saved`, `digest_shared`.
- Store event payloads in existing analytics pipeline keyed by `account_id`.
- Build dashboard slices per account, per channel, and per feature stage.
- Monitor mention response time to gauge engagement and check for cross-account anomalies.

---

## 16. Risks & Mitigations

- **Low Engagement**: seed conversation with Prompt Reviews team posts, add prompts in onboarding, highlight top posts in dashboard.
- **Spam / Abuse**: throttle post creation (5 per minute), add soft profanity filter, allow admins to hide content quickly.
- **Realtime Drift**: provide manual refresh CTA, fallback to polling if websocket fails.
- **Handle Collisions**: unique index + retry ensures safety; log collisions for audit.
- **Monthly/Weekly Summary Overload**: allow opt-out and ensure scheduling respects business timezone preferences (phase 2 enhancement).
- **Broadcast Fatigue**: limit `@everyone` usage to owners/admins and enforce per-day cap; honor user-level broadcast email opt-outs from `/account` settings.
- **Account Bleed**: RLS with `account_id`, route guards, and analytics monitoring ensure no cross-account leakage; add Sentry breadcrumb tagging account context for audits.

---

## 17. Open Questions

- Do we need business-specific private channels in near term?
- Should monthly summaries post in business-specific channels vs global ones?
- Do mentions require email notifications at launch?
- How will we moderate and surface top posts (pin vs highlight vs new "Community Highlights" page)?
- What share channels (social, email, download) do users value most for digest sharing?
- Do weekly digests require different content than monthly (e.g., shorter highlights)?
- What limits or approvals should apply to `@everyone` broadcasts and accompanying emails?
- Should broadcast email opt-out live at the user level, account level, or both?

---

## 18. Next Steps

- Confirm product assumptions with stakeholders, including guidelines content, saved/pinned behavior, and digest sharing UX.
- Assign agent owners and create initial tasks in tracking system.
- Kick off Phase 0 with discovery meetings and draft UI mocks.
- Audit existing account-switcher context to ensure community feature hooks into same state management.
- Prototype digest share modal flows to validate requirements for asset generation.

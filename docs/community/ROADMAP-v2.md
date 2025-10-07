# Community Feature Roadmap v2 - Global Public Architecture

**Version**: 2.0
**Date**: 2025-10-06
**Status**: Planning
**Architecture**: Global Public Community (ONE shared space for all customers)

---

## Critical Architecture Change

**v1 (WRONG)**: Isolated per-account communities
**v2 (CORRECT)**: ONE global public community for all PromptReviews customers

Think of it like a single Slack workspace where all customers interact, not separate workspaces per account.

---

## 1. Product Overview

### Vision
Create a thriving global community where all PromptReviews customers can share tactics, wins, and support in ONE shared space. Everyone sees the same posts, channels, and conversations - like a single town square for the entire customer base.

### Key Principles
- **One Community, All Customers**: Everyone shares the same space
- **Account Identity Display**: Posts show "User • Business Name" to provide context
- **Public by Default**: All posts visible to all authenticated customers
- **Simple Architecture**: No complex account isolation logic
- **Glassmorphic Design**: Matches PromptReviews design system
- **Prompt Reviews Team Visibility**: Subtle visual enhancement for team posts

### Success Criteria
- 30% of active users visit community each week within 30 days of launch
- 15% of visitors create or react to at least one post in first 60 days
- Monthly review summaries posted for 95% of qualified accounts
- Zero unauthorized access incidents (authentication still required)
- Active moderation prevents spam/abuse in shared space

### Out of Scope (MVP)
- Direct messages or private channels
- File or image uploads (except monthly summary assets)
- Rich text editor beyond @mentions and link parsing
- Deep threading (only single-level comments)
- Per-message email notifications
- Account-specific private spaces

---

## 2. User Roles & Journeys

### Roles
- **Customer User**: Any authenticated PromptReviews user can read/write in community
- **Prompt Reviews Team**: Same access as customers but with subtle visual badge/indicator
- **Admin (Prompt Reviews team)**: Can pin posts, delete any content, manage channels
- **Anonymous Visitor**: Redirected to sign-in (no public access)

### Core Journeys

#### 1. Browse Global Feed
- Navigate to `/community` → see shared channel list
- Default to "General" channel
- See posts from all customers with identity displayed as "User • Business Name"
- Infinite scroll with realtime updates
- Filter by channel (all global, all public)

#### 2. Create Post
- Click "New Post" → modal with title, body, optional link
- Post appears in global feed with identity "Chris • Prompt Reviews"
- All authenticated users can see it immediately
- Optional: Tag with channel (General, Strategy, Google Business, etc.)

#### 3. Comment & React
- Comment on any post from any customer
- Reactions show aggregate counts
- Comments display as "User • Business Name"

#### 4. Mention User
- Type `@` → typeahead shows ALL community members (global search)
- On submit, mentioned user gets notification
- No account filtering in mention search

#### 5. Account Switcher (Identity Display Only)
- User switches account → **community content stays the same**
- Only changes: posting identity display
  - Account A selected: "Chris • Fireside Bakery"
  - Account B selected: "Chris • Other Business"
- No data reload needed (all posts are global)

#### 6. Monthly Summary Posting (Phase 2)
- Each account's monthly stats posted as global community post
- Displays as "Account Name • Monthly Summary" in "Wins" channel
- **Decision Needed**: Should everyone see all accounts' performance stats?
- Post is public, anyone can react/comment
- Account owner can share externally via share button

#### 7. View Community Guidelines
- Click "Community Guidelines" link → modal displays rules
- Checkbox agreement required before first post
- Timestamp recorded per user (not per account)

#### 8. Broadcast to Everyone (Phase 2)
- Admin-only feature
- `@everyone` mention sends notification to all active community members
- Used for product announcements, community events

---

## 3. Feature Requirements

### Global Community Model
- ONE shared space for all customers
- All channels are global (no account-specific channels)
- All posts visible to all authenticated users
- Account selection only affects posting identity display

### Authentication & Access
- Authentication required for all read/write operations
- No anonymous access to community
- User must have at least one active PromptReviews account
- All authenticated users have equal read access

### Channels (Global)
- **General**: Open discussion, introductions, questions
- **Strategy**: Tactics, best practices, optimization tips
- **Google Business**: GBP-specific discussions
- **Feature Requests**: Product feedback and suggestions
- **Wins**: Monthly summaries, success stories, celebrations

Additional categories for future consideration (see DECISIONS-NEEDED.md):
- **Promote**: Share your business (self-promotion allowed)
- **Announcements**: Prompt Reviews team updates (admin-only posting)
- **Help**: Technical support, troubleshooting

### Posts
- Title (required, max 200 chars)
- Body (markdown-lite, plain text stored, max 5000 chars)
- Optional external link (validated URL)
- Author identity: "Username • Business Name"
- Timestamps (created_at, updated_at, deleted_at for soft delete)
- Reactions: thumbs_up, star, celebrate, clap, laugh

### Comments
- Plain text with @mention parsing
- Single-level only (no nested threads)
- Same identity display as posts
- Can react to comments

### Username System
- Format: `firstname-hash` (e.g., `alex-7h3n`)
- Globally unique (not per-account)
- Generated once per user (not per account)
- Display name: "Alex • Fireside Bakery" (changes with account selection)
- Hash: 4-char base32 from user_id + created_at salt

### Monthly Summaries (Phase 2)
- Auto-posted on first business day of month
- Posted in "Wins" channel as public post
- Identity: "Business Name • Monthly Summary"
- Contains: review count, rating average, top themes, link to full report
- **Question**: Privacy concerns with public stats?

### Realtime Updates
- Supabase Realtime for new posts, comments, reactions
- No account_id filtering needed (all data is global)
- Simpler subscription logic

### Community Guidelines
- Modal shown on first visit to /community
- Checkbox acceptance required before posting
- Content covers: Be respectful, no spam, stay on topic, privacy rules
- Timestamp stored in user profile (not per account)

### Visual Design
- Glassmorphic design system matching PromptReviews
- Subtle badge/indicator for Prompt Reviews team posts
- Account context displayed but not filtering data
- Clean, minimal UI focused on content

---

## 4. Username System Specification

### Simplified Architecture
Since community is global (not per-account), usernames are globally unique and generated once per user.

### Generation Algorithm
1. Extract first name from user profile (fallback to email prefix)
2. Normalize: lowercase, strip punctuation, max 12 chars
3. Generate 4-char hash from user_id + created_at (base32)
4. Concatenate: `firstname-hash` (e.g., `alex-7h3n`)
5. Check uniqueness via unique constraint
6. Retry with new hash if collision (max 5 attempts)

### Display Name Logic
Display name changes based on selected account but username stays constant:
- Selected Account A: "alex-7h3n" displays as "Alex • Fireside Bakery"
- Selected Account B: "alex-7h3n" displays as "Alex • Other Business"

### Implementation
```sql
-- User profile table (one row per user, not per account)
CREATE TABLE community_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name_override TEXT, -- Optional custom display name
    guidelines_accepted_at TIMESTAMPTZ,
    opted_out_at TIMESTAMPTZ,
    notify_mentions BOOLEAN DEFAULT true,
    notify_broadcasts BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Safeguards
- Unique constraint on `username`
- Check constraint: `username ~ '^[a-z0-9-]+$'`
- Generated on first community visit
- Immutable (cannot be changed by user)
- Admin override function for special cases

---

## 5. Data Model - Global Architecture

### Key Change: Remove account_id from Posts/Comments/Reactions

**v1 (WRONG)**: Every table had `account_id` for isolation
**v2 (CORRECT)**: Only user identity tables have account references

### Tables Overview

#### `community_profiles` (User Identity - Global)
```sql
CREATE TABLE community_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name_override TEXT,
    guidelines_accepted_at TIMESTAMPTZ,
    opted_out_at TIMESTAMPTZ,
    notify_mentions BOOLEAN DEFAULT true,
    notify_broadcasts BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT username_format CHECK (username ~ '^[a-z0-9-]+$')
);

CREATE INDEX idx_community_profiles_username ON community_profiles(username);
```

**Note**: No account_id - one profile per user across all accounts

#### `channels` (Global Channels)
```sql
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT, -- Emoji or icon identifier
    category TEXT, -- 'discussion', 'support', 'wins', 'announcements'
    is_active BOOLEAN DEFAULT true,
    admin_only_posting BOOLEAN DEFAULT false, -- For announcements channel
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_channels_slug ON channels(slug);
CREATE INDEX idx_channels_active ON channels(is_active);
```

**Note**: No account_id - channels are global

#### `posts` (Global Posts)
```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Content
    title TEXT NOT NULL,
    body TEXT,
    external_url TEXT CHECK (external_url ~* '^https?://'),

    -- Metadata
    is_pinned BOOLEAN DEFAULT false,
    is_from_promptreviews_team BOOLEAN DEFAULT false, -- For visual badge

    -- Monthly summary specific
    is_monthly_summary BOOLEAN DEFAULT false,
    summary_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL, -- Only for summaries
    summary_month DATE, -- Only for summaries

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT summary_fields_check CHECK (
        (is_monthly_summary = false AND summary_account_id IS NULL AND summary_month IS NULL)
        OR
        (is_monthly_summary = true AND summary_account_id IS NOT NULL AND summary_month IS NOT NULL)
    )
);

CREATE INDEX idx_posts_channel_created ON posts(channel_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_author ON posts(author_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_pinned ON posts(is_pinned, created_at DESC) WHERE is_pinned = true AND deleted_at IS NULL;
CREATE INDEX idx_posts_summaries ON posts(summary_account_id, summary_month) WHERE is_monthly_summary = true;
```

**Note**: No account_id except for monthly summaries (which reference source account)

#### `comments` (Global Comments)
```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_comments_post_created ON comments(post_id, created_at ASC) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_author ON comments(author_id);
```

**Note**: No account_id - comments are global

#### `reactions` (Global Reactions)
```sql
CREATE TABLE reactions (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL CHECK (emoji IN ('thumbs_up', 'star', 'celebrate', 'clap', 'laugh')),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (user_id, COALESCE(post_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(comment_id, '00000000-0000-0000-0000-000000000000'::uuid), emoji),

    CONSTRAINT reaction_target_check CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL)
        OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    )
);

CREATE INDEX idx_reactions_post ON reactions(post_id);
CREATE INDEX idx_reactions_comment ON reactions(comment_id);
```

**Note**: No account_id - reactions are global

#### `mentions` (User Notifications)
```sql
CREATE TABLE mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type TEXT NOT NULL CHECK (source_type IN ('post', 'comment')),
    source_id UUID NOT NULL,
    mentioned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE INDEX idx_mentions_user_read ON mentions(mentioned_user_id, read_at);
CREATE INDEX idx_mentions_source ON mentions(source_type, source_id);
```

**Note**: No account_id - mentions are global, tied to user not account

#### `monthly_summaries` (Account-Specific Data, Posted Publicly)
```sql
CREATE TABLE monthly_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    summary_month DATE NOT NULL,

    -- Summary data
    review_count INT,
    average_rating NUMERIC(3,2),
    top_positive_theme TEXT,
    top_negative_theme TEXT,
    analytics_url TEXT,

    -- Posting status
    prepared_at TIMESTAMPTZ DEFAULT NOW(),
    posted_at TIMESTAMPTZ,
    post_id UUID REFERENCES posts(id) ON DELETE SET NULL,

    created_by UUID REFERENCES auth.users(id),

    UNIQUE(account_id, summary_month)
);

CREATE INDEX idx_monthly_summaries_account_month ON monthly_summaries(account_id, summary_month DESC);
CREATE INDEX idx_monthly_summaries_posted ON monthly_summaries(posted_at) WHERE posted_at IS NOT NULL;
```

**Note**: Has account_id because it's account-specific data, but resulting POST is public

#### `saved_posts` (User Bookmarks - Phase 2)
```sql
CREATE TABLE saved_posts (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (user_id, post_id)
);

CREATE INDEX idx_saved_posts_user ON saved_posts(user_id, created_at DESC);
```

**Note**: No account_id - saves are per user, not per account

---

## 6. Row Level Security - Simplified for Global Access

### Key Principle: Authenticated = Access

Since the community is global and public to all customers, RLS is dramatically simplified.

### Standard Pattern (Read)
```sql
-- All authenticated users can read all content
CREATE POLICY "Authenticated users can view [table]"
    ON [table_name]
    FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);
```

### Standard Pattern (Write)
```sql
-- Users can create content
CREATE POLICY "Authenticated users can create [table]"
    ON [table_name]
    FOR INSERT
    TO authenticated
    WITH CHECK (author_id = auth.uid());

-- Users can update their own content
CREATE POLICY "Users can update own [table]"
    ON [table_name]
    FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

-- Users can delete their own content (soft delete)
CREATE POLICY "Users can delete own [table]"
    ON [table_name]
    FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid() AND deleted_at IS NOT NULL);
```

### Admin Override Pattern
```sql
-- Admin can modify/delete any content
CREATE POLICY "Admins can manage all [table]"
    ON [table_name]
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
        )
    );
```

### Example: Posts RLS
```sql
-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Everyone can read non-deleted posts
CREATE POLICY "Anyone can view posts"
    ON posts FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

-- Users can create posts
CREATE POLICY "Users can create posts"
    ON posts FOR INSERT
    TO authenticated
    WITH CHECK (author_id = auth.uid());

-- Authors can update their own posts
CREATE POLICY "Authors can update own posts"
    ON posts FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid() AND deleted_at IS NULL)
    WITH CHECK (author_id = auth.uid());

-- Authors can soft-delete their own posts
CREATE POLICY "Authors can delete own posts"
    ON posts FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid() AND deleted_at IS NOT NULL);

-- Admins can manage all posts
CREATE POLICY "Admins can manage all posts"
    ON posts FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
        )
    );
```

### Comparison: v1 vs v2

**v1 (Complex Account Isolation)**:
```sql
-- Required subquery on every operation
USING (
    account_id IN (
        SELECT account_id
        FROM account_users
        WHERE user_id = auth.uid()
    )
)
```

**v2 (Simple Global Access)**:
```sql
-- Just check authentication
USING (deleted_at IS NULL)
```

**Performance Impact**: Massive improvement - no subquery overhead on every read

---

## 7. Account Context Usage - Display Only

### What Changed
- **v1**: Account context filtered all queries and data
- **v2**: Account context only affects identity display on new posts

### Frontend Usage

#### Reading Data (No Account Filter)
```typescript
import { useAuth } from '@/auth/hooks/useAuth';

function CommunityFeed() {
  const { user } = useAuth(); // Only need user, not account

  useEffect(() => {
    async function loadPosts() {
      // No account_id parameter - fetch all global posts
      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      setPosts(posts);
    }

    loadPosts();
  }, []); // No dependency on account
}
```

#### Creating Posts (Account for Identity Display)
```typescript
import { useAccountBusiness } from '@/auth/context/AccountBusinessContext';

function CreatePostModal() {
  const { user } = useAuth();
  const { account } = useAccountBusiness(); // For display name only

  async function handleSubmit(data) {
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        channel_id: selectedChannelId,
        author_id: user.id,
        title: data.title,
        body: data.body,
        // No account_id needed - post is global
      })
      .select()
      .single();

    // Display will show "User • Account.business_name"
  }
}
```

#### Displaying Author Identity
```typescript
function PostCard({ post }) {
  const { author_id } = post;
  const [authorProfile, setAuthorProfile] = useState(null);
  const [authorAccount, setAuthorAccount] = useState(null);

  useEffect(() => {
    async function loadAuthorInfo() {
      // Get username
      const { data: profile } = await supabase
        .from('community_profiles')
        .select('username, display_name_override')
        .eq('user_id', author_id)
        .single();

      // Get author's primary account for display name
      // (You'll need a utility to get user's display account)
      const account = await getDisplayAccountForUser(author_id);

      setAuthorProfile(profile);
      setAuthorAccount(account);
    }

    loadAuthorInfo();
  }, [author_id]);

  return (
    <div>
      <div className="author">
        {authorProfile?.username} • {authorAccount?.business_name}
      </div>
      {/* Post content */}
    </div>
  );
}
```

#### Account Switching (Identity Change Only)
```typescript
function AccountSwitcher() {
  const { accounts, selectedAccountId, switchAccount } = useAccountBusiness();

  const handleSwitch = async (newAccountId) => {
    // Switch account
    await switchAccount(newAccountId);

    // NO NEED to reload community data - it's all global
    // Only future posts will show new business name
  };

  return (
    <select value={selectedAccountId} onChange={(e) => handleSwitch(e.target.value)}>
      {accounts.map(account => (
        <option key={account.id} value={account.id}>
          {account.business_name}
        </option>
      ))}
    </select>
  );
}
```

### Realtime Subscriptions (No Account Filter)
```typescript
function useCommunityRealtime(channelId: string) {
  useEffect(() => {
    const subscription = supabase
      .channel('community_posts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
        filter: `channel_id=eq.${channelId}` // Filter by channel, NOT account
      }, handleNewPost)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [channelId]);
}
```

---

## 8. API Surface - Simplified

### RPC Functions

**User Profile Management**:
- `generate_username(user_id uuid)` → Returns generated username
- `acknowledge_guidelines()` → Updates community_profiles.guidelines_accepted_at
- `update_community_preferences(notify_mentions bool, notify_broadcasts bool)`

**Content Creation** (No account_id parameters):
- `create_post(channel_id uuid, title text, body text, external_url text)` → Inserts with author_id = auth.uid()
- `update_post(post_id uuid, title text, body text, external_url text)`
- `delete_post(post_id uuid)` → Soft delete (sets deleted_at)
- `create_comment(post_id uuid, body text)`
- `toggle_reaction(post_id uuid, comment_id uuid, emoji text)`

**Mentions & Notifications**:
- `parse_mentions(content text)` → Extracts @username mentions
- `create_mentions(source_type text, source_id uuid, usernames text[])` → Inserts mention records
- `mark_mentions_read(mention_ids uuid[])`
- `get_unread_mention_count()` → Returns integer

**Monthly Summaries** (Account-specific but posted publicly):
- `prepare_monthly_summary(account_id uuid, summary_month date)` → Aggregates data
- `post_monthly_summary(summary_id uuid)` → Creates public post in "Wins" channel
- `generate_summary_share_link(summary_id uuid)` → Returns shareable URL

**Admin Functions**:
- `pin_post(post_id uuid)` → Requires admin role
- `unpin_post(post_id uuid)` → Requires admin role
- `admin_delete_content(table_name text, content_id uuid)` → Hard delete for moderation

**Search & Discovery**:
- `search_users(query text)` → Returns username matches for @mentions
- `search_posts(query text, channel_id uuid)` → Full-text search

### Edge Functions

**Monthly Summary Cron** (Scheduled):
```typescript
// Runs on first business day of month
async function monthlyReportCron() {
  // Get all accounts with reviews in past month
  const accounts = await getActiveAccounts();

  for (const account of accounts) {
    // Prepare summary data
    const summaryId = await prepareMonthlySummary(account.id, lastMonth);

    // Post to community if account opted in
    if (account.auto_share_monthly_summary) {
      await postMonthlySummary(summaryId);
    }
  }
}
```

**Mention Notification Processor**:
```typescript
// Triggered on mention creation
async function processMentionNotification(mention: Mention) {
  // Get user's notification preferences
  const profile = await getCommunityProfile(mention.mentioned_user_id);

  if (!profile.notify_mentions || profile.opted_out_at) {
    return;
  }

  // Send in-app notification
  await createInAppNotification({
    user_id: mention.mentioned_user_id,
    type: 'mention',
    source_id: mention.source_id,
    source_type: mention.source_type
  });

  // Optional: Send email digest (Phase 2)
}
```

---

## 9. Frontend Architecture (Next.js)

### Route Structure
```
/community
  /            → Community home (default to General channel)
  /[slug]      → Specific channel view
  /search      → Search posts/users
  /saved       → User's saved posts (Phase 2)
  /guidelines  → Community guidelines page
```

### Component Hierarchy
```
CommunityLayout
├── CommunityHeader
│   ├── ChannelSelector (global channels)
│   ├── AccountSwitcher (affects posting identity only)
│   └── GuidelinesLink
├── ChannelSidebar
│   ├── ChannelList (global channels, no account filter)
│   └── MentionBadge (unread count)
├── PostFeed
│   ├── PostCard (shows "User • Business" identity)
│   │   ├── AuthorInfo
│   │   ├── PostContent
│   │   ├── ReactionBar
│   │   ├── CommentList
│   │   │   └── CommentCard
│   │   └── CommentComposer
│   └── InfiniteScroll
└── PostComposer (modal)
    ├── TitleInput
    ├── BodyTextarea (with @mention autocomplete)
    ├── LinkInput (optional)
    └── SubmitButton
```

### Key Components

#### CommunityLayout
```typescript
function CommunityLayout() {
  const { user } = useAuth();
  const { account } = useAccountBusiness(); // For posting identity display

  // No need to filter by account - all data is global

  return (
    <div className="glassmorphic-container">
      <CommunityHeader currentAccount={account} />
      <div className="flex">
        <ChannelSidebar />
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}
```

#### PostCard
```typescript
interface PostCardProps {
  post: Post;
  onReact: (emoji: string) => void;
  onComment: (body: string) => void;
}

function PostCard({ post, onReact, onComment }: PostCardProps) {
  const [authorInfo, setAuthorInfo] = useState(null);

  useEffect(() => {
    // Load author's username and business name for display
    loadAuthorDisplayInfo(post.author_id).then(setAuthorInfo);
  }, [post.author_id]);

  return (
    <div className="post-card glassmorphic">
      {/* Prompt Reviews team badge if applicable */}
      {post.is_from_promptreviews_team && (
        <Badge variant="team">Prompt Reviews Team</Badge>
      )}

      <div className="author-info">
        <Avatar src={authorInfo?.logo_url} />
        <div>
          <span className="username">{authorInfo?.username}</span>
          <span className="separator">•</span>
          <span className="business">{authorInfo?.business_name}</span>
        </div>
      </div>

      <h3>{post.title}</h3>
      <div className="body">{post.body}</div>

      <ReactionBar reactions={post.reactions} onReact={onReact} />
      <CommentList postId={post.id} />
      <CommentComposer onSubmit={onComment} />
    </div>
  );
}
```

#### MentionAutocomplete
```typescript
function MentionAutocomplete({ query, onSelect }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!query) return;

    // Search ALL users (no account filter)
    supabase
      .rpc('search_users', { query })
      .then(({ data }) => setUsers(data));
  }, [query]);

  return (
    <div className="mention-dropdown">
      {users.map(user => (
        <div key={user.user_id} onClick={() => onSelect(user)}>
          {user.username} • {user.display_business_name}
        </div>
      ))}
    </div>
  );
}
```

#### GuidelinesModal
```typescript
function GuidelinesModal({ onAccept, onClose }) {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = async () => {
    await supabase.rpc('acknowledge_guidelines');
    onAccept();
  };

  return (
    <Modal>
      <h2>Community Guidelines</h2>
      <div className="guidelines-content">
        {/* Load from CMS or static content */}
        <p>Be respectful and constructive...</p>
        <p>No spam or self-promotion outside Promote channel...</p>
        <p>Respect privacy - don't share others' business data...</p>
      </div>

      <Checkbox
        checked={accepted}
        onChange={(e) => setAccepted(e.target.checked)}
        label="I agree to follow these guidelines"
      />

      <Button disabled={!accepted} onClick={handleAccept}>
        Continue to Community
      </Button>
    </Modal>
  );
}
```

### State Management
- **React Query** for data fetching and caching
- **Supabase Realtime** for live updates
- **useAuth** hook for user authentication
- **useAccountBusiness** hook for posting identity (NOT for data filtering)
- **Local state** for UI interactions (modals, forms)

### Realtime Strategy
```typescript
function useCommunityRealtime(channelId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to new posts (no account filter)
    const channel = supabase
      .channel('community_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
        filter: `channel_id=eq.${channelId}`
      }, (payload) => {
        // Invalidate posts query to fetch new data
        queryClient.invalidateQueries(['posts', channelId]);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [channelId, queryClient]);
}
```

---

## 10. Monthly Summary Automation (Phase 2)

### Architecture Decision: Public Summaries

**Question**: Should monthly summaries be visible to all customers?

**Options**:
1. **Public Summaries**: All accounts' stats posted publicly in "Wins" channel
   - **Pros**: Builds transparency, inspires others, creates community engagement
   - **Cons**: Competitors see each other's performance, privacy concerns

2. **Private Summaries**: Only account members see their own summary
   - **Pros**: Privacy protected, no competitive concerns
   - **Cons**: Loses community engagement, defeats "Wins" channel purpose

3. **Opt-In Public**: Accounts choose to share publicly or keep private
   - **Pros**: Best of both worlds, user control
   - **Cons**: More complexity, fragmented experience

**Recommendation**: Opt-In Public (Option 3)
- Default: Private (summary generated but not posted)
- Account setting: "Share monthly summaries with community"
- If enabled: Post appears in "Wins" channel for all to see

### Automation Flow

```typescript
// Cron job: First business day of month, 9 AM UTC
async function monthlyReportCron() {
  const lastMonth = getLastMonthDate();

  // Get all accounts with reviews in past month
  const accounts = await supabase
    .from('accounts')
    .select('id, business_name')
    .gte('last_review_date', lastMonth);

  for (const account of accounts) {
    try {
      // 1. Aggregate review data
      const stats = await aggregateMonthlyStats(account.id, lastMonth);

      // 2. Create summary record
      const { data: summary } = await supabase
        .from('monthly_summaries')
        .insert({
          account_id: account.id,
          summary_month: lastMonth,
          review_count: stats.count,
          average_rating: stats.avgRating,
          top_positive_theme: stats.topPositive,
          top_negative_theme: stats.topNegative,
          analytics_url: generateAnalyticsUrl(account.id, lastMonth)
        })
        .select()
        .single();

      // 3. Check if account opted into public sharing
      const { data: settings } = await supabase
        .from('account_settings')
        .select('auto_share_monthly_summary')
        .eq('account_id', account.id)
        .single();

      // 4. Post publicly if opted in
      if (settings?.auto_share_monthly_summary) {
        await postMonthlySummaryToWins(summary, account);
      }

      // 5. Send private notification to account members
      await notifyAccountMembers(account.id, summary.id);

    } catch (error) {
      logger.error('Failed to generate summary', { account_id: account.id, error });
    }
  }
}

async function postMonthlySummaryToWins(summary, account) {
  const winsChannel = await getChannelBySlug('wins');

  const postBody = formatSummaryPost(summary, account);

  const { data: post } = await supabase
    .from('posts')
    .insert({
      channel_id: winsChannel.id,
      author_id: account.user_id, // Or system user
      title: `${account.business_name} - ${formatMonth(summary.summary_month)} Summary`,
      body: postBody,
      is_monthly_summary: true,
      summary_account_id: account.id,
      summary_month: summary.summary_month,
      external_url: summary.analytics_url
    })
    .select()
    .single();

  // Update summary record with post reference
  await supabase
    .from('monthly_summaries')
    .update({ post_id: post.id, posted_at: new Date() })
    .eq('id', summary.id);
}
```

### Summary Post Format

```
Title: Fireside Bakery - September 2025 Summary

Body:
We had a great month! Here's what happened:

📊 Reviews: 47 new reviews (+12 from August)
⭐ Average Rating: 4.8 stars
💚 Top Positive: "Friendly staff and delicious pastries"
⚠️ Top Negative: "Long wait times on weekends"

[View Full Analytics Report →]

---
Powered by PromptReviews Monthly Summaries
```

### Share Button (On Summary Posts)

```typescript
function MonthlySummaryShareButton({ post }) {
  const [showShareModal, setShowShareModal] = useState(false);

  const handleShare = async () => {
    // Generate shareable assets
    const shareData = await supabase
      .rpc('generate_summary_share_link', {
        summary_id: post.summary_account_id
      });

    setShowShareModal(true);
  };

  if (!post.is_monthly_summary) return null;

  return (
    <>
      <Button onClick={handleShare}>
        Share Externally
      </Button>

      {showShareModal && (
        <ShareModal
          title="Share Your Monthly Summary"
          url={shareData.url}
          imageUrl={shareData.image_url}
          preformattedText={shareData.social_text}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
}
```

---

## 11. Implementation Phases

### Phase 0: Planning & Design (1 week)
- Finalize global vs. per-account decision (DONE - global public)
- Design glassmorphic UI components
- Write community guidelines content
- Confirm privacy policies for public summaries
- Stakeholder review of DECISIONS-NEEDED.md

### Phase 1: Database Foundation (1 week)
- Create migrations for community tables (no account_id on posts/comments)
- Implement simplified RLS policies (authenticated access)
- Create username generation function
- Seed default channels (General, Strategy, Google Business, Feature Requests, Wins)
- Test with multiple users (no multi-account testing needed)

### Phase 2: Core MVP (2 weeks)
- Build community layout and navigation
- Implement post feed with infinite scroll
- Create post composer modal
- Add commenting functionality
- Implement reactions
- Build @mention autocomplete (global user search)
- Add guidelines modal
- Wire up realtime subscriptions
- Internal beta with Prompt Reviews team

### Phase 3: Public Beta (1 week)
- Enable for 10-20 pilot customers
- Monitor for spam/abuse
- Collect feedback on UX
- Verify no data leaks or security issues
- Iterate on design and functionality

### Phase 4: Monthly Summaries & Automation (2 weeks)
- Build monthly summary aggregation pipeline
- Create summary posting cron job
- Add account setting: "Share monthly summaries publicly"
- Implement summary share button and modal
- Add "Wins" channel with example posts
- Test opt-in/opt-out flows

### Phase 5: Notifications & Engagement (1 week)
- Implement @mention notifications (in-app)
- Add unread badge to community nav
- Build saved posts feature
- Create admin moderation tools (pin, delete)
- Add Prompt Reviews team badge to posts

### Phase 6: Launch & Iterate
- Rollout to all customers
- Monitor engagement metrics
- Iterate based on usage patterns
- Plan next features (search, polls, announcements channel)

---

## 12. Testing Strategy

### Unit Tests
- Username generation and collision handling
- Mention parsing (@username extraction)
- Reaction toggle logic
- Content validation (title length, URL format)

### Integration Tests
- RLS policies: authenticated users can read/write
- RLS policies: unauthenticated users blocked
- Post creation and retrieval
- Comment threading
- Reaction aggregation
- Mention notification creation

### E2E Tests (Playwright)
- User signs in → views community feed
- User creates post → appears in feed
- User comments on post → comment appears
- User reacts to post → count increments
- User @mentions another user → mention created
- User accepts guidelines → can post
- User switches account → posting identity changes (data stays same)
- Monthly summary posted → appears in Wins channel
- User clicks share → modal opens with options

### Performance Tests
- Load 10,000 posts → measure query time
- 100 concurrent users posting → check for race conditions
- Realtime updates with 500 active subscribers
- Mention search with 5,000 users

### Security Tests
- Anonymous user cannot access community
- User cannot impersonate another user
- User cannot delete others' posts (unless admin)
- SQL injection attempts blocked
- XSS attempts sanitized

---

## 13. Moderation & Safety

### Community Guidelines Content

**Core Principles**:
1. **Be Respectful**: Treat all community members with courtesy
2. **Stay On Topic**: Keep discussions relevant to review management and PromptReviews
3. **No Spam**: Don't post repetitive or promotional content (except in Promote channel)
4. **Respect Privacy**: Don't share other businesses' data or confidential information
5. **Follow Laws**: No illegal content, harassment, or hate speech

### Moderation Tools

**Admin Capabilities**:
- Delete any post/comment (soft delete)
- Pin/unpin posts
- Mark posts as from Prompt Reviews team
- View moderation log
- Ban users (opt_out flag)

**User Reporting** (Phase 2):
- Report button on posts/comments
- Reasons: Spam, Inappropriate, Off-topic, Other
- Reports create admin notification
- Admin reviews and takes action

**Automated Moderation** (Future):
- Rate limiting: max 5 posts/hour per user
- Profanity filter (soft warning, not blocking)
- Link spam detection
- Duplicate post detection

### Privacy Considerations

**What's Public in Community**:
- All posts, comments, reactions
- Usernames and business names
- Monthly summaries (if account opted in)

**What's Private**:
- User email addresses
- Account billing information
- Review content (unless quoted in post)
- Direct analytics data (only summary stats if shared)

**User Controls**:
- Opt out of community entirely
- Disable mention notifications
- Disable broadcast notifications
- Delete own posts/comments

---

## 14. Analytics & Success Metrics

### Key Metrics

**Engagement**:
- Daily/weekly/monthly active users (DAU/WAU/MAU)
- Posts created per day
- Comments per post (average)
- Reactions per post (average)
- @mentions sent per day

**Adoption**:
- % of customers who visited community
- % of visitors who posted
- % of visitors who commented
- Time to first post (days from signup)

**Retention**:
- 7-day return rate
- 30-day return rate
- Weekly active users trend

**Channel Activity**:
- Posts per channel
- Most active channels
- Channel growth over time

**Monthly Summaries**:
- Summaries generated
- Summaries posted publicly (% opted in)
- Summary posts engagement (reactions, comments)
- External shares from summaries

### Event Tracking

```typescript
// Track all major interactions
trackEvent('community_viewed', { channel_slug });
trackEvent('post_created', { channel_id, has_link, has_mentions });
trackEvent('comment_created', { post_id });
trackEvent('reaction_added', { post_id, emoji });
trackEvent('mention_sent', { target_user_id });
trackEvent('guidelines_accepted', { user_id });
trackEvent('monthly_summary_posted', { account_id, review_count });
trackEvent('summary_shared_externally', { summary_id, platform });
trackEvent('account_switched_in_community', { from_account, to_account });
```

### Dashboards

**Community Health Dashboard** (Admin):
- Total users, posts, comments, reactions
- Top contributors (most posts, most helpful)
- Channel activity breakdown
- Moderation queue (reports pending)

**Account Summary Dashboard** (Account owners):
- Your monthly summary performance
- Your posts/comments in community
- Mentions of your business
- Engagement on your summaries

---

## 15. Risks & Mitigations

### Risk: Low Engagement
**Mitigation**:
- Seed conversations with Prompt Reviews team
- Highlight community in onboarding
- Pin high-quality posts
- Send weekly digest emails (Phase 2)
- Feature top posts in dashboard

### Risk: Spam & Abuse
**Mitigation**:
- Community guidelines required acceptance
- Rate limiting on post creation
- Admin moderation tools
- User reporting system
- Automated spam detection (Phase 2)

### Risk: Privacy Concerns
**Mitigation**:
- Clear guidelines on what's public
- Opt-in for monthly summary sharing
- Ability to delete posts/comments
- Ability to opt out of community entirely
- Transparent privacy policy

### Risk: Competitor Tension
**Mitigation**:
- Frame as collaborative learning space
- Emphasize shared challenges
- Create "wins" culture (celebrate others)
- Moderate competitive/negative posts
- Encourage niche-specific discussions (not direct competition)

### Risk: Prompt Reviews Team Overhead
**Mitigation**:
- Automated moderation tools
- Clear escalation process
- Community manager role (if needed)
- Empower power users as moderators (Phase 2)

### Risk: Technical Performance
**Mitigation**:
- Proper indexing on all queries
- Pagination/infinite scroll
- Realtime subscription limits
- CDN for assets
- Caching strategy

---

## 16. Open Questions (See DECISIONS-NEEDED.md)

Critical decisions that need stakeholder input:

1. **Monthly Summary Privacy**: Public by default, private by default, or opt-in?
2. **Channel Categories**: Which channels to launch with? Need Promote? Announcements?
3. **Moderation Responsibility**: Who moderates? Prompt Reviews team only or community moderators?
4. **Competitive Concerns**: How to handle competitors in same niche interacting?
5. **Username Immutability**: Can users ever change their username or is it permanent?
6. **@everyone Broadcasts**: Frequency limits? Admin-only or account owners too?
7. **Email Notifications**: At launch or Phase 2? Digest format or immediate?

---

## 17. Design System Integration

### Glassmorphic Components

**Card Styling**:
```css
.community-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

**Prompt Reviews Team Badge**:
```typescript
function TeamBadge() {
  return (
    <div className="team-badge">
      <Icon name="verified" />
      <span>Prompt Reviews Team</span>
    </div>
  );
}

// Styling
.team-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
```

**Author Identity Display**:
```typescript
function AuthorInfo({ username, businessName, isTeam }) {
  return (
    <div className="author-info">
      <Avatar size="sm" businessName={businessName} />
      <div className="author-text">
        <span className="username">{username}</span>
        <span className="separator">•</span>
        <span className="business">{businessName}</span>
      </div>
      {isTeam && <TeamBadge />}
    </div>
  );
}
```

### Color Palette
- Primary: PromptReviews brand colors
- Glass panels: rgba(255, 255, 255, 0.08)
- Borders: rgba(255, 255, 255, 0.18)
- Text: High contrast for accessibility
- Reactions: Colorful emojis with subtle hover states

---

## 18. Multi-Agent Project Plan

### Agent Roles

1. **Product Spec Agent** (Current)
   - Define requirements and user journeys
   - Document decisions and open questions
   - Create wireframe outlines
   - Output: This document (ROADMAP-v2.md)

2. **Data & RLS Agent**
   - Design simplified schema (no account_id on posts)
   - Write migration files
   - Implement RLS policies (authenticated access)
   - Output: Migration files, policy tests

3. **Backend API Agent**
   - Implement RPC functions
   - Build Edge functions for cron jobs
   - Create mention parsing utilities
   - Output: API routes, RPC functions, tests

4. **Frontend Agent**
   - Build Next.js pages and components
   - Implement glassmorphic design
   - Wire up realtime subscriptions
   - Output: React components, pages, tests

5. **Automation Agent**
   - Build monthly summary cron job
   - Implement notification system
   - Create share link generation
   - Output: Edge functions, cron jobs

6. **QA & Observability Agent**
   - Write test matrix
   - Configure analytics
   - Set up error tracking
   - Output: Test suites, monitoring dashboards

7. **Documentation & Launch Agent**
   - Write user-facing docs
   - Create community guidelines content
   - Prepare launch checklist
   - Output: Help docs, guidelines, launch plan

### Handoff Process

Each agent creates a handoff document:
```markdown
## [Agent Name] Handoff

**Status**: [Complete | Blocked | In Progress]
**Completed**: [List of deliverables]
**Blockers**: [Any issues]
**Next Agent**: [Who needs this work]
**Context**: [200 word summary for next agent]
```

### Shared Artifacts Location
`/docs/community/[agent-name]/`

Example:
- `/docs/community/data/` - Migration files, schema docs
- `/docs/community/backend/` - API specs, RPC documentation
- `/docs/community/frontend/` - Component specs, wireframes
- `/docs/community/automation/` - Cron job specs
- `/docs/community/qa/` - Test plans, checklists

---

## 19. Next Steps

### Immediate (This Week)
1. Review DECISIONS-NEEDED.md with stakeholders
2. Get approval on global public architecture
3. Finalize monthly summary privacy approach
4. Assign agent owners

### Phase 1 Kickoff (Next Week)
1. Data agent creates migration files
2. Backend agent specs RPC functions
3. Frontend agent creates component wireframes
4. Product agent finalizes guidelines content

### Success Criteria for MVP Launch
- 100 posts created in first week
- 50+ unique contributors
- <5 moderation incidents
- Zero security breaches
- 90%+ uptime
- <500ms average page load time

---

## Appendix A: Comparison Table - v1 vs v2

| Feature | v1 (Account-Isolated) | v2 (Global Public) |
|---------|----------------------|-------------------|
| **Data Model** | account_id on all tables | No account_id on posts/comments |
| **RLS Policies** | Complex subqueries | Simple authenticated check |
| **Channels** | Per-account channels | Global shared channels |
| **Account Switching** | Reload all data | Only affects posting identity |
| **User Search** | Account members only | All community members |
| **Monthly Summaries** | Private to account | Opt-in public sharing |
| **Performance** | Subquery overhead | Direct queries |
| **Complexity** | High | Low |
| **Privacy** | High (isolated) | Medium (public with opt-outs) |

---

## Appendix B: Migration Checklist

- [ ] Create community_profiles table
- [ ] Create channels table
- [ ] Create posts table (NO account_id)
- [ ] Create comments table (NO account_id)
- [ ] Create reactions table (NO account_id)
- [ ] Create mentions table
- [ ] Create monthly_summaries table (HAS account_id)
- [ ] Create saved_posts table
- [ ] Add indexes for performance
- [ ] Enable RLS on all tables
- [ ] Create SELECT policies (authenticated access)
- [ ] Create INSERT policies (author = auth.uid())
- [ ] Create UPDATE policies (own content only)
- [ ] Create DELETE policies (soft delete)
- [ ] Create admin override policies
- [ ] Seed default channels
- [ ] Create username generation function
- [ ] Test with multiple users
- [ ] Sync Prisma schema
- [ ] Generate TypeScript types

---

**End of Roadmap v2**

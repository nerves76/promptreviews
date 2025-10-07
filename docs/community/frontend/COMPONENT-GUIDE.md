# Community Feature - Component Guide

**Version**: 1.0
**Last Updated**: 2025-10-06
**Status**: MVP Ready for Backend Integration

## Overview

This document provides a comprehensive guide to all React components built for the Community Feature MVP. All components follow the PromptReviews glassmorphic design system and are production-ready pending backend API implementation.

---

## Table of Contents

1. [Layout Components](#layout-components)
2. [Post Components](#post-components)
3. [Comment Components](#comment-components)
4. [Reaction Components](#reaction-components)
5. [Mention Components](#mention-components)
6. [Modal Components](#modal-components)
7. [Shared Components](#shared-components)
8. [Custom Hooks](#custom-hooks)
9. [Type Definitions](#type-definitions)
10. [Utility Functions](#utility-functions)

---

## Layout Components

### CommunityLayout

**File**: `/src/app/(app)/community/components/layout/CommunityLayout.tsx`

**Purpose**: Main layout wrapper for all community pages with sidebar and header.

**Props**:
```typescript
interface CommunityLayoutProps {
  children: React.ReactNode;
  channels: Channel[];
  activeChannelSlug: string;
  accountName: string;
  onGuidelinesClick: () => void;
  onChannelSelect?: (slug: string) => void;
}
```

**Features**:
- Responsive sidebar (collapsible on mobile)
- Glassmorphic styling throughout
- Sticky sidebar on desktop
- Mobile hamburger menu

**Usage**:
```tsx
<CommunityLayout
  channels={channels}
  activeChannelSlug="general"
  accountName="My Business"
  onGuidelinesClick={() => setShowGuidelines(true)}
  onChannelSelect={(slug) => router.push(`/community?channel=${slug}`)}
>
  {children}
</CommunityLayout>
```

---

### CommunityHeader

**File**: `/src/app/(app)/community/components/layout/CommunityHeader.tsx`

**Purpose**: Page header with guidelines link and account context.

**Props**:
```typescript
interface CommunityHeaderProps {
  accountName: string;
  onGuidelinesClick: () => void;
}
```

**Features**:
- Displays "Community • Account Name"
- Guidelines button with icon
- Glassmorphic background

---

### ChannelList

**File**: `/src/app/(app)/community/components/layout/ChannelList.tsx`

**Purpose**: Sidebar list of community channels.

**Props**:
```typescript
interface ChannelListProps {
  channels: Channel[];
  activeChannelSlug: string;
  onChannelSelect?: (slug: string) => void;
}
```

**Features**:
- Auto-sorted by `sort_order`
- Active channel highlighted with glassmorphic effect
- # icon prefix for all channels
- Lock icon for admin-only channels
- Hover states

---

## Post Components

### PostCard

**File**: `/src/app/(app)/community/components/posts/PostCard.tsx`

**Purpose**: Individual post display with glassmorphic design.

**Props**:
```typescript
interface PostCardProps {
  post: Post;
  currentUserId: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onReact: (emoji: ReactionType) => void;
  onComment: () => void;
  showComments?: boolean;
}
```

**Features**:
- User identity display ("Username • Business Name")
- Relative timestamps with hover tooltip
- Highlighted @mentions
- External link with domain extraction
- Edit/delete menu (author only)
- Reaction bar
- Comment count
- Admin badge for Prompt Reviews team posts
- Deleted post state (grayed out)

**Design**:
- `bg-white/8` glassmorphic card
- `backdrop-blur-[10px]`
- `border border-white/18`
- Hover: `shadow-lg` transition

---

### PostFeed

**File**: `/src/app/(app)/community/components/posts/PostFeed.tsx`

**Purpose**: Infinite scroll feed of posts.

**Props**:
```typescript
interface PostFeedProps {
  posts: Post[];
  currentUserId: string;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onPostEdit?: (postId: string) => void;
  onPostDelete?: (postId: string) => void;
  onPostReact: (postId: string, emoji: ReactionType) => void;
  onPostComment?: (postId: string) => void;
}
```

**Features**:
- Intersection Observer for infinite scroll
- Loading skeleton (3 placeholder cards)
- Empty state with icon
- "End of feed" message
- Smooth loading indicator at bottom

---

### PostComposer

**File**: `/src/app/(app)/community/components/posts/PostComposer.tsx`

**Purpose**: Modal form for creating/editing posts with @mention support.

**Props**:
```typescript
interface PostComposerProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialValues?: Partial<PostFormData>;
  channelName: string;
  onSubmit: (data: PostFormData) => Promise<void>;
  onCancel: () => void;
}
```

**Features**:
- Title input (required, max 200 chars)
- Body textarea (optional, max 5000 chars)
- External URL input (optional, validated)
- Real-time character counters
- @mention autocomplete dropdown
- Dirty state tracking with confirmation on close
- Validation with error messages
- Submitting state with spinner

**Validation**:
- Title: 1-200 characters (required)
- Body: 0-5000 characters
- URL: Valid http/https format

---

## Comment Components

### CommentList

**File**: `/src/app/(app)/community/components/comments/CommentList.tsx`

**Purpose**: Displays list of comments under a post.

**Props**:
```typescript
interface CommentListProps {
  comments: Comment[];
  currentUserId: string;
  onEdit?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
  onReact: (commentId: string, emoji: ReactionType) => void;
}
```

**Features**:
- Chronological order (oldest first)
- User identity display
- Highlighted @mentions
- Edit/delete buttons (author only)
- Reaction bar
- Deleted comment state
- Left border accent

---

### CommentComposer

**File**: `/src/app/(app)/community/components/comments/CommentComposer.tsx`

**Purpose**: Inline textarea for adding comments with @mention support.

**Props**:
```typescript
interface CommentComposerProps {
  postId: string;
  onSubmit: (body: string) => Promise<void>;
}
```

**Features**:
- Collapsed/expanded states
- Auto-focus on expand
- Character counter (max 2000)
- @mention autocomplete
- Cancel button
- Submitting state

**Behavior**:
- Collapsed: Single line placeholder
- Expanded: Multiline textarea with buttons
- Auto-collapse after submit

---

## Reaction Components

### ReactionBar

**File**: `/src/app/(app)/community/components/reactions/ReactionBar.tsx`

**Purpose**: Horizontal bar of reaction buttons with counts and tooltips.

**Props**:
```typescript
interface ReactionBarProps {
  targetId: string;
  targetType: 'post' | 'comment';
  reactions: ReactionCount[];
  userReactions: ReactionType[];
  onReact: (emoji: ReactionType) => void;
}
```

**Features**:
- 5 reaction types: 👍 ⭐ 🎉 👏 😂
- Count displayed next to emoji
- User's reactions highlighted (purple background)
- Hover tooltips showing who reacted
- Optimistic UI updates

**States**:
- Default (gray, count 0)
- Has count (white, count > 0)
- User reacted (purple background, highlighted)

---

## Mention Components

### MentionAutocomplete

**File**: `/src/app/(app)/community/components/mentions/MentionAutocomplete.tsx`

**Purpose**: Dropdown for @mention suggestions with keyboard navigation.

**Props**:
```typescript
interface MentionAutocompleteProps {
  query: string;
  users: MentionableUser[];
  onSelect: (user: MentionableUser) => void;
  position: { top: number; left: number };
}
```

**Features**:
- Keyboard navigation (Arrow up/down, Enter, Escape)
- Shows username, display name, business name
- Optional avatar images
- Max 10 results
- Glassmorphic styling
- "No users found" empty state

---

## Modal Components

### GuidelinesModal

**File**: `/src/app/(app)/community/components/modals/GuidelinesModal.tsx`

**Purpose**: Displays community guidelines with acceptance checkbox.

**Props**:
```typescript
interface GuidelinesModalProps {
  isOpen: boolean;
  requireAcceptance: boolean;
  onAccept: () => void;
  onClose: () => void;
}
```

**Features**:
- Scrollable content area
- Markdown-formatted guidelines
- Checkbox acceptance (required mode)
- Cannot close without accepting (required mode)
- View-only mode (no checkbox)

**Content Sections**:
1. Be Respectful
2. Stay On Topic
3. No Spam
4. Respect Privacy
5. Follow the Law
6. Moderation

---

## Shared Components

### UserIdentity

**File**: `/src/app/(app)/community/components/shared/UserIdentity.tsx`

**Purpose**: Displays user identity as "Username • Business Name".

**Props**:
```typescript
interface UserIdentityProps {
  author: AuthorInfo;
  showBadge?: boolean;
  className?: string;
}
```

**Features**:
- Optional avatar image
- Display name + business name
- Admin badge (if applicable)

---

### AdminBadge

**File**: `/src/app/(app)/community/components/shared/AdminBadge.tsx`

**Purpose**: Purple gradient badge for Prompt Reviews team posts.

**Features**:
- Purple/pink gradient background
- Verified icon
- "Prompt Reviews Team" text

**Styling**:
- `bg-gradient-to-r from-purple-500/20 to-pink-500/20`
- `border border-purple-400/30`

---

### RelativeTime

**File**: `/src/app/(app)/community/components/shared/RelativeTime.tsx`

**Purpose**: Displays timestamps as relative time with tooltip.

**Props**:
```typescript
interface RelativeTimeProps {
  date: Date | string;
  withTooltip?: boolean;
  className?: string;
}
```

**Features**:
- Auto-updates every minute
- Formats as "just now", "2 minutes ago", etc.
- Tooltip shows full datetime on hover
- Uses `<time>` element with `datetime` attribute

---

### LoadingSpinner

**File**: `/src/app/(app)/community/components/shared/LoadingSpinner.tsx`

**Purpose**: Reusable loading spinner.

**Props**:
```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}
```

**Features**:
- Three size variants (16px, 24px, 32px)
- Tailwind `animate-spin`
- Accessible with `role="status"` and `aria-label`

---

### EmptyState

**File**: `/src/app/(app)/community/components/shared/EmptyState.tsx`

**Purpose**: Generic empty state display.

**Props**:
```typescript
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}
```

**Usage**:
```tsx
<EmptyState
  icon="📝"
  title="No posts yet"
  description="Be the first to start a conversation!"
  action={{
    label: "New Post",
    onClick: () => setShowComposer(true)
  }}
/>
```

---

## Custom Hooks

### usePosts

**File**: `/src/app/(app)/community/hooks/usePosts.ts`

**Purpose**: Fetch and manage posts with infinite scroll.

**Returns**:
```typescript
{
  posts: Post[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  fetchPosts: () => Promise<void>;
  loadMore: () => Promise<void>;
  createPost: (data: PostFormData) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
}
```

**Features**:
- Fetches 20 posts per page
- Infinite scroll pagination
- Filters by channel
- Excludes deleted posts
- Sorted by created_at DESC

---

### useComments

**File**: `/src/app/(app)/community/hooks/useComments.ts`

**Purpose**: Fetch and manage comments for a post.

**Returns**:
```typescript
{
  comments: Comment[];
  isLoading: boolean;
  error: Error | null;
  fetchComments: () => Promise<void>;
  createComment: (body: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
}
```

**Features**:
- Fetches all comments for a post
- Sorted chronologically (oldest first)
- Soft delete support

---

### useReactions

**File**: `/src/app/(app)/community/hooks/useReactions.ts`

**Purpose**: Toggle reactions with optimistic updates.

**Returns**:
```typescript
{
  toggleReaction: (targetId: string, targetType: 'post' | 'comment', emoji: ReactionType) => Promise<void>;
}
```

**Features**:
- Add/remove reactions
- Works for both posts and comments
- Optimistic UI updates

---

### useMentionSearch

**File**: `/src/app/(app)/community/hooks/useMentions.ts`

**Purpose**: Search for mentionable users.

**Returns**:
```typescript
{
  users: MentionableUser[];
  isLoading: boolean;
  error: Error | null;
}
```

**Features**:
- Debounced search (300ms)
- Global user search (no account filtering)
- Returns username, display name, business name

---

## Type Definitions

All types are defined in `/src/app/(app)/community/types/community.ts`.

**Key Types**:
- `Post` - Post data structure
- `Comment` - Comment data structure
- `Reaction` - Reaction data
- `ReactionType` - 'thumbs_up' | 'star' | 'celebrate' | 'clap' | 'laugh'
- `Channel` - Channel data
- `AuthorInfo` - User identity information
- `MentionableUser` - User for @mentions
- `PostFormData` - Form data for creating posts
- `CommentFormData` - Form data for creating comments

---

## Utility Functions

### mentionParser.ts

**File**: `/src/app/(app)/community/utils/mentionParser.ts`

**Functions**:
- `extractMentions(text: string)` - Extracts all @mentions with positions
- `extractUsernames(text: string)` - Extracts unique usernames
- `highlightMentions(text: string)` - Returns segments for rendering
- `insertMention(text, cursor, username)` - Inserts mention at cursor
- `getMentionQuery(text, cursor)` - Gets current mention query
- `isValidUsername(username: string)` - Validates username format

---

### timeFormatter.ts

**File**: `/src/app/(app)/community/utils/timeFormatter.ts`

**Functions**:
- `formatRelativeTime(date)` - "2 minutes ago"
- `formatShortDate(date)` - "Jan 15" or "Jan 15, 2024"
- `formatFullDateTime(date)` - "January 15, 2025 at 3:45 PM"
- `formatISO(date)` - ISO 8601 format
- `formatTimeUntil(date)` - "in 2 hours"

---

### urlValidator.ts

**File**: `/src/app/(app)/community/utils/urlValidator.ts`

**Functions**:
- `isValidUrl(url: string)` - Validates URL format
- `sanitizeUrl(url: string)` - Adds https:// if missing
- `extractDomain(url: string)` - Returns domain name
- `validateAndSanitizeUrl(url: string)` - Combined validation
- `isTrustedDomain(url, domains)` - Anti-phishing check
- `shortenUrl(url, maxLength)` - Truncates for display

---

## Glassmorphic Design Tokens

All components use these design tokens:

**Glass Panels**:
- Background: `bg-white/8`
- Backdrop blur: `backdrop-blur-[10px]`
- Border: `border border-white/18`

**Text Colors**:
- Primary: `text-white`
- Secondary: `text-white/70`
- Tertiary: `text-white/50`

**Hover States**:
- Background: `hover:bg-white/12`
- Text: `hover:text-white`

**Admin Badge**:
- Background: `bg-gradient-to-r from-purple-500/20 to-pink-500/20`
- Border: `border border-purple-400/30`

**Buttons**:
- Primary: `bg-[#452F9F] text-white hover:bg-[#452F9F]/90`
- Ghost: `hover:bg-[#452F9F]/10 hover:text-[#452F9F]`

---

## Next Steps for Integration

1. **Backend Agent**: Implement API endpoints and RPC functions
   - POST `/api/community/posts` - Create post
   - GET `/api/community/posts?channel_id=...` - Fetch posts
   - POST `/api/community/comments` - Create comment
   - POST `/api/community/reactions` - Toggle reaction
   - RPC `search_community_users` - Search for mentions

2. **Database Agent**: Apply migrations
   - Create all community tables
   - Set up RLS policies
   - Seed default channels
   - Generate usernames for existing users

3. **QA Agent**: Test all flows
   - Create post, comment, react
   - @mention autocomplete
   - Infinite scroll
   - Real-time updates
   - Guidelines acceptance

4. **Documentation Agent**: Finalize docs
   - User-facing help articles
   - Integration guide for main app
   - Launch checklist

---

**Status**: ✅ All components built and ready for backend integration

**Next Agent**: Backend API Agent (create endpoints) → Data Agent (run migrations) → QA Agent (test flows)

# Community Feature - UI Requirements & Component Specifications

**Document Version:** 1.0
**Last Updated:** 2025-10-06
**Phase:** Phase 1 MVP
**Status:** Draft for Design Review

## Overview

This document provides detailed UI component specifications for the Community Feature MVP. Each component includes behavior, states, responsive design, and accessibility requirements for the frontend team.

**Design System:** Follow existing PromptReviews patterns using Tailwind CSS, Headless UI, and Radix UI components.

---

## Table of Contents

1. [Layout Components](#1-layout-components)
2. [Navigation Components](#2-navigation-components)
3. [Post Components](#3-post-components)
4. [Comment Components](#4-comment-components)
5. [Reaction Components](#5-reaction-components)
6. [Input Components](#6-input-components)
7. [Modal Components](#7-modal-components)
8. [Utility Components](#8-utility-components)
9. [Responsive Design](#9-responsive-design)
10. [Design Tokens](#10-design-tokens)

---

## 1. Layout Components

### CommunityLayout

**Purpose:** Main layout container for all community pages

**Structure:**
```
┌─────────────────────────────────────────────┐
│ Main Navigation (existing)                   │
├──────────┬──────────────────────────────────┤
│          │  Community Header                 │
│          ├──────────────────────────────────┤
│ Channel  │                                   │
│ Sidebar  │  Post Feed Area                   │
│          │                                   │
│          │                                   │
└──────────┴──────────────────────────────────┘
```

**Props:**
```typescript
interface CommunityLayoutProps {
  children: React.ReactNode;
  activeChannelSlug: string;
}
```

**Behavior:**
- Sticky channel sidebar on desktop
- Collapsible sidebar on mobile (hamburger menu)
- Sidebar always visible on tablet/desktop (min-width: 768px)
- Maintains scroll position when switching channels
- Shows loading skeleton while channel data fetches

**Responsive:**
- Mobile (<768px): Sidebar hidden, hamburger button reveals overlay
- Tablet (768px-1024px): Sidebar 200px wide
- Desktop (>1024px): Sidebar 250px wide

**Accessibility:**
- Landmark regions: `<nav>`, `<main>`, `<aside>`
- Skip link to main content
- Sidebar toggle button has aria-label "Toggle channel list"

---

### CommunityHeader

**Purpose:** Page header with guidelines link and account context

**Visual:**
```
┌─────────────────────────────────────────────┐
│ Community · [Account Name]    [Guidelines] │
└─────────────────────────────────────────────┘
```

**Props:**
```typescript
interface CommunityHeaderProps {
  accountName: string;
  onGuidelinesClick: () => void;
}
```

**Behavior:**
- Shows current account name (from context)
- Guidelines button opens modal
- Sticky header on scroll (optional, based on design preference)

**States:**
- Default
- Guidelines button hover (blue background)

**Accessibility:**
- Guidelines button: aria-label "View community guidelines"

---

## 2. Navigation Components

### ChannelList

**Purpose:** Sidebar list of available channels

**Visual:**
```
┌──────────────┐
│ Channels     │
├──────────────┤
│ # General  ← │ (active, highlighted)
│ # Strategy   │
│ # Google...  │
└──────────────┘
```

**Props:**
```typescript
interface ChannelListProps {
  channels: Channel[];
  activeChannelSlug: string;
  onChannelSelect: (slug: string) => void;
}

interface Channel {
  id: string;
  name: string;
  slug: string;
  description?: string;
  unreadCount?: number; // Phase 2
}
```

**Behavior:**
- Channels sorted by `sort_order` ascending
- Active channel highlighted with background color
- Clicking channel navigates to `/community?channel={slug}`
- Hover state on inactive channels
- # icon prefix for all channels (hashtag)

**States:**
- Default (inactive channel)
- Hover (light background)
- Active (blue background, white text)
- Loading (skeleton)

**Styling:**
- Active: `bg-indigo-600 text-white`
- Hover: `bg-gray-100`
- Default: `text-gray-700`

**Accessibility:**
- `<nav aria-label="Community channels">`
- Each channel is a link with aria-current="page" when active
- Focus visible on keyboard navigation

---

### ChannelHeader

**Purpose:** Displays channel name and description at top of feed

**Visual:**
```
┌─────────────────────────────────────────────┐
│ # General                                    │
│ Community-wide discussions and announcements │
└─────────────────────────────────────────────┘
```

**Props:**
```typescript
interface ChannelHeaderProps {
  channelName: string;
  channelDescription?: string;
}
```

**Behavior:**
- Shows channel name with # prefix
- Description in smaller, lighter text
- If no description, shows channel name only

**Styling:**
- Name: `text-2xl font-bold text-gray-900`
- Description: `text-sm text-gray-600 mt-1`

---

## 3. Post Components

### PostFeed

**Purpose:** Infinite scroll list of posts

**Props:**
```typescript
interface PostFeedProps {
  channelId: string;
  accountId: string;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}
```

**Behavior:**
- Displays posts in reverse chronological order
- Infinite scroll: loads next 20 when 200px from bottom
- Shows loading spinner at bottom when fetching
- Shows "No posts yet" empty state if count = 0
- Smooth insertion of new posts via realtime

**States:**
- Loading initial posts (skeleton)
- Empty feed (empty state)
- Normal display
- Loading more posts (spinner at bottom)

**Accessibility:**
- `<ul role="feed">` with `<li>` for each post
- aria-busy="true" while loading
- aria-live="polite" for new post announcements

---

### PostCard

**Purpose:** Individual post display

**Visual:**
```
┌───────────────────────────────────────────┐
│ Alex @alex-h7k2 · 2 minutes ago     [···] │
│                                            │
│ How to improve Google review response    │ (title - bold)
│                                            │
│ I've been experimenting with...          │ (body)
│                                            │
│ 🔗 example.com                             │ (external link)
│                                            │
│ 👍 3  ⭐ 5  🎉 1   💬 12 comments         │
└───────────────────────────────────────────┘
```

**Props:**
```typescript
interface PostCardProps {
  post: Post;
  currentUserId: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onReact: (reaction: ReactionType) => void;
  onComment: () => void;
}

interface Post {
  id: string;
  title: string;
  body: string;
  externalUrl?: string;
  author: {
    id: string;
    displayName: string;
    handle: string;
  };
  createdAt: Date;
  reactions: ReactionCount[];
  commentCount: number;
}
```

**Behavior:**
- Author name clickable (Phase 2: profile)
- Timestamp shows relative time ("2 minutes ago") with hover tooltip of full datetime
- External link opens in new tab with `rel="noopener noreferrer"`
- Mentions in body highlighted blue and bold
- Edit/Delete menu (···) only visible if current user is author
- Clicking comment icon scrolls to comment section
- Deleted posts show "[Post deleted]" with grayed background

**States:**
- Default
- Hover (subtle shadow)
- Deleted (grayed out)
- Loading (skeleton)

**Interactions:**
- Hover on post shows subtle lift shadow
- Hover on author shows pointer cursor
- Hover on actions menu shows background

**Accessibility:**
- Post wrapped in `<article>`
- Timestamp has `<time datetime="ISO8601">`
- External link has aria-label "Visit {domain}"
- Actions menu button aria-label "Post actions"

---

### PostComposer (Modal)

**Purpose:** Modal form for creating/editing posts

**Visual:**
```
┌─────────────────────────────────────────┐
│ Create Post                      [X]    │
├─────────────────────────────────────────┤
│ Title *                                 │
│ ┌─────────────────────────────────────┐ │
│ │ Enter title...                      │ │
│ └─────────────────────────────────────┘ │
│ 0/200                                   │
│                                         │
│ Body                                    │
│ ┌─────────────────────────────────────┐ │
│ │ Share your thoughts...              │ │
│ │                                     │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│ 0/5000                                  │
│                                         │
│ Link (optional)                         │
│ ┌─────────────────────────────────────┐ │
│ │ https://...                         │ │
│ └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│              [Cancel]  [Create Post]    │
└─────────────────────────────────────────┘
```

**Props:**
```typescript
interface PostComposerProps {
  mode: 'create' | 'edit';
  initialValues?: Partial<Post>;
  channelId: string;
  onSubmit: (data: PostFormData) => Promise<void>;
  onCancel: () => void;
}

interface PostFormData {
  title: string;
  body: string;
  externalUrl?: string;
}
```

**Behavior:**
- Modal opens with focus on title input
- Character counters update as user types
- Submit button disabled until valid (title 1-200 chars)
- Escape key closes modal (with confirmation if dirty)
- Clicking outside closes modal (with confirmation if dirty)
- Error messages appear below fields
- Success closes modal and shows toast

**Validation:**
- Title: Required, 1-200 chars
- Body: Optional, max 5000 chars
- External URL: Optional, valid URL format

**States:**
- Default
- Typing (character counter updates)
- Error (red border, error message)
- Submitting (button shows spinner, form disabled)
- Success (modal closes)

**Accessibility:**
- Modal has `role="dialog"` aria-modal="true"
- Focus trap within modal
- Title has `aria-label="New post"` or "Edit post"
- Error messages have `aria-live="polite"`
- Character counters have `aria-live="polite"` when near limit

---

### PostActionsMenu

**Purpose:** Dropdown menu for post edit/delete

**Visual:**
```
[···] (button)

(on click)
┌──────────┐
│ Edit     │
│ Delete   │
└──────────┘
```

**Props:**
```typescript
interface PostActionsMenuProps {
  postId: string;
  onEdit: () => void;
  onDelete: () => void;
}
```

**Behavior:**
- Only rendered if current user is author (or admin)
- Clicking ··· button opens dropdown
- Clicking outside closes dropdown
- Edit opens PostComposer in edit mode
- Delete shows confirmation dialog

**Accessibility:**
- Button has aria-label "Post actions"
- Menu has `role="menu"`
- Items have `role="menuitem"`

---

## 4. Comment Components

### CommentList

**Purpose:** List of comments under a post

**Visual:**
```
┌─────────────────────────────────────────┐
│ 12 Comments                              │
├─────────────────────────────────────────┤
│ Maria @maria-k3n1 · 1 hour ago    [···] │
│ Great point! I've noticed...            │
├─────────────────────────────────────────┤
│ Sam @sam-f9x4 · 30 minutes ago          │
│ Thanks for sharing this.                │
└─────────────────────────────────────────┘
```

**Props:**
```typescript
interface CommentListProps {
  postId: string;
  comments: Comment[];
  currentUserId: string;
  onEdit: (commentId: string) => void;
  onDelete: (commentId: string) => void;
}

interface Comment {
  id: string;
  body: string;
  author: {
    id: string;
    displayName: string;
    handle: string;
  };
  createdAt: Date;
  updatedAt?: Date;
}
```

**Behavior:**
- Comments sorted oldest first (chronological)
- Each comment shows author, timestamp, body
- Edit/delete menu only for comment author
- Mentions in body highlighted
- Empty state if no comments: (hidden, just show composer)

**Accessibility:**
- List has `aria-label="Comments"`
- Each comment is a `<div>` or `<article>`

---

### CommentComposer

**Purpose:** Inline textarea for adding comments

**Visual:**
```
(collapsed state)
┌─────────────────────────────────────────┐
│ Add a comment...                        │
└─────────────────────────────────────────┘

(expanded state)
┌─────────────────────────────────────────┐
│ Write a comment...                      │
│                                         │
│                                         │
│ 0/2000          [Cancel] [Comment]      │
└─────────────────────────────────────────┘
```

**Props:**
```typescript
interface CommentComposerProps {
  postId: string;
  onSubmit: (body: string) => Promise<void>;
}
```

**Behavior:**
- Starts collapsed (single line)
- Clicking expands to multiline textarea
- Cancel button collapses and clears text
- Submit button disabled if empty or >2000 chars
- Successful submit clears field and adds comment to list

**Validation:**
- Body: Required, 1-2000 chars

**States:**
- Collapsed
- Expanded (focused)
- Submitting (button spinner)
- Error (red border, error message)

**Accessibility:**
- Textarea has aria-label "Write a comment"
- Character counter has aria-live="polite"

---

## 5. Reaction Components

### ReactionBar

**Purpose:** Horizontal bar of reaction buttons below post

**Visual:**
```
┌──────────────────────────────────────┐
│ 👍 3  ⭐ 5  🎉 1  👏 0  😂 0         │
└──────────────────────────────────────┘
```

**Props:**
```typescript
interface ReactionBarProps {
  postId: string;
  reactions: ReactionCount[];
  userReactions: ReactionType[];
  onReact: (reaction: ReactionType) => void;
}

interface ReactionCount {
  type: ReactionType;
  count: number;
  users: string[]; // for tooltip
}

type ReactionType = 'thumbs_up' | 'star' | 'celebrate' | 'clap' | 'laugh';
```

**Behavior:**
- Shows all 5 reaction types always
- Count = 0 shown in gray
- Count > 0 shown in default color
- User's reactions highlighted (filled background)
- Clicking toggles reaction (add/remove)
- Hover shows tooltip with names

**States:**
- Default (not reacted, count 0) - gray
- Has count (not reacted by user) - black text
- Reacted by user - blue background, highlighted
- Hover - light background

**Tooltip:**
- Count = 1: "Alex"
- Count = 2: "Alex and Maria"
- Count = 3: "Alex, Maria, and Sam"
- Count >3: "Alex, Maria, and 5 others"

**Accessibility:**
- Each button has aria-label "React with thumbs up (3)"
- Button has aria-pressed="true" if user reacted

---

## 6. Input Components

### MentionAutocomplete

**Purpose:** Dropdown for @mention suggestions

**Visual:**
```
(typing in textarea)
Great idea @al|

(autocomplete appears below cursor)
┌────────────────────────────┐
│ Alex                       │
│ @alex-h7k2                 │
├────────────────────────────┤
│ Alice                      │
│ @alice-m3p9                │
└────────────────────────────┘
```

**Props:**
```typescript
interface MentionAutocompleteProps {
  query: string;
  users: MentionableUser[];
  onSelect: (user: MentionableUser) => void;
  position: { top: number; left: number };
}

interface MentionableUser {
  id: string;
  displayName: string;
  handle: string;
  avatarUrl?: string; // Phase 2
}
```

**Behavior:**
- Triggered by typing `@` in any textarea
- Filters users as query updates
- Shows max 10 results
- Keyboard navigation: Arrow up/down to select, Enter to insert
- Mouse: Click to select
- Clicking outside closes dropdown
- No results: shows "No users found"

**States:**
- Loading (spinner while fetching users)
- Results list
- Empty state

**Styling:**
- Dropdown positioned absolutely below cursor
- Selected item highlighted (blue background)
- Max height 300px, scroll if more

**Accessibility:**
- Dropdown has `role="listbox"`
- Each item has `role="option"`
- Selected item has `aria-selected="true"`
- Announce results count with aria-live

---

## 7. Modal Components

### GuidelinesModal

**Purpose:** Display community guidelines with acceptance checkbox

**Visual:**
```
┌─────────────────────────────────────────┐
│ Community Guidelines              [X]   │
├─────────────────────────────────────────┤
│                                         │
│ (Scrollable content area)               │
│                                         │
│ ## Purpose                              │
│ Our community is a space for...        │
│                                         │
│ ## Expected Behavior                    │
│ - Be respectful                         │
│ - Share knowledge                       │
│                                         │
│ (more content...)                       │
│                                         │
├─────────────────────────────────────────┤
│ ☐ I agree to these guidelines           │
│                                         │
│                   [Continue] (disabled) │
└─────────────────────────────────────────┘
```

**Props:**
```typescript
interface GuidelinesModalProps {
  isOpen: boolean;
  requireAcceptance: boolean; // false for view-only mode
  onAccept: () => void;
  onClose: () => void;
}
```

**Behavior:**
- If `requireAcceptance = true`: Cannot close without accepting
- If `requireAcceptance = false`: Can close with X or ESC
- Checkbox must be checked to enable Continue button
- Content loaded from markdown file, rendered with safe HTML
- Scrollable content area with max height

**States:**
- Acceptance required (checkbox, button disabled)
- Checkbox checked (button enabled)
- View-only (no checkbox, just Close button)

**Accessibility:**
- Modal has `role="dialog"` aria-labelledby="modal-title"
- Focus trap when open
- Continue button disabled with aria-disabled="true"
- Checkbox has label association

---

### ConfirmationDialog

**Purpose:** Reusable confirmation for destructive actions

**Visual:**
```
┌─────────────────────────────────────────┐
│ Delete Post?                            │
├─────────────────────────────────────────┤
│ This action cannot be undone.           │
│                                         │
│                    [Cancel] [Delete]    │
└─────────────────────────────────────────┘
```

**Props:**
```typescript
interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string; // default "Confirm"
  confirmVariant?: 'danger' | 'primary'; // default 'primary'
  onConfirm: () => void;
  onCancel: () => void;
}
```

**Behavior:**
- Used for delete post, delete comment, discard draft
- Confirm button in red for destructive actions
- ESC or clicking outside triggers cancel
- Focus on Cancel button by default (safer)

**Accessibility:**
- Dialog has `role="alertdialog"`
- Focus trap
- Initial focus on Cancel

---

## 8. Utility Components

### EmptyState

**Purpose:** Display when no content exists

**Visual:**
```
┌─────────────────────────────────────────┐
│                                         │
│            📝                           │
│                                         │
│    No posts yet. Be the first!         │
│                                         │
│         [New Post]                      │
│                                         │
└─────────────────────────────────────────┘
```

**Props:**
```typescript
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Behavior:**
- Centered in container
- Icon optional (emoji or icon component)
- Action button optional
- Used for empty feeds, no comments, no search results

---

### LoadingSpinner

**Purpose:** Loading indicator

**Props:**
```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string; // for accessibility
}
```

**Behavior:**
- Spinning circle animation
- Sizes: sm (16px), md (24px), lg (32px)
- Uses Tailwind animate-spin

**Accessibility:**
- Wrapper has `role="status"`
- `aria-label={label}` or aria-label="Loading"

---

### Toast

**Purpose:** Temporary notification

**Visual:**
```
┌─────────────────────────────┐
│ ✓ Post created successfully │
└─────────────────────────────┘
```

**Props:**
```typescript
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number; // default 3000ms
}
```

**Behavior:**
- Appears at top-right of screen
- Auto-dismisses after duration
- Can be manually dismissed with X
- Multiple toasts stack vertically
- Used for success/error feedback

**Accessibility:**
- `role="alert"`
- `aria-live="polite"` for success/info
- `aria-live="assertive"` for errors

---

### RelativeTime

**Purpose:** Format timestamps as relative time

**Props:**
```typescript
interface RelativeTimeProps {
  date: Date;
  withTooltip?: boolean; // default true
}
```

**Behavior:**
- Renders "just now", "2 minutes ago", "1 hour ago", "yesterday", "Jan 15"
- Tooltip shows full datetime on hover if `withTooltip = true`
- Updates automatically (rerenders every minute for accuracy)

**Output Examples:**
- <1 min: "just now"
- 1-59 min: "5 minutes ago"
- 1-23 hours: "3 hours ago"
- Yesterday: "yesterday"
- <7 days: "3 days ago"
- >7 days: "Jan 15" or "Jan 15, 2024" if different year

**Accessibility:**
- Uses `<time datetime="ISO8601">`
- Screen reader reads full datetime

---

## 9. Responsive Design

### Breakpoints (Tailwind)

```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### Layout Behavior

#### Mobile (<768px)
- Channel sidebar hidden by default
- Hamburger menu button reveals overlay sidebar
- PostCard full width
- Comment composer full width
- Modal full screen

#### Tablet (768px-1024px)
- Sidebar 200px fixed left
- Post feed main area
- Modal centered, max-width 600px
- Touch-friendly tap targets (min 44px)

#### Desktop (>1024px)
- Sidebar 250px fixed left
- Post feed max-width 800px centered
- Modal max-width 700px
- Hover states enabled

### Touch Interactions

- Tap targets minimum 44x44px
- Swipe to close modals on mobile
- Pull to refresh on mobile (optional)
- Long press for actions menu on mobile

---

## 10. Design Tokens

### Colors (Tailwind)

```css
/* Primary */
primary: indigo-600 (#4F46E5)
primary-hover: indigo-700
primary-light: indigo-100

/* Text */
text-primary: gray-900
text-secondary: gray-600
text-tertiary: gray-500

/* Backgrounds */
bg-primary: white
bg-secondary: gray-50
bg-hover: gray-100

/* Borders */
border-color: gray-200
border-focus: indigo-500

/* Status */
success: green-600
error: red-600
warning: yellow-600
info: blue-600
```

### Typography

```css
/* Headings */
h1: text-2xl font-bold (post title)
h2: text-xl font-semibold (section headers)

/* Body */
body: text-base (16px) font-normal
small: text-sm (14px)
xs: text-xs (12px)

/* Font Family */
font-sans: Inter, system-ui (existing PromptReviews font)
```

### Spacing

```css
/* Component padding */
card-padding: p-4 (16px)
modal-padding: p-6 (24px)

/* Component gaps */
gap-xs: gap-1 (4px)
gap-sm: gap-2 (8px)
gap-md: gap-4 (16px)
gap-lg: gap-6 (24px)
```

### Borders

```css
border-radius: rounded-lg (8px)
border-radius-modal: rounded-xl (12px)
border-width: border (1px)
```

### Shadows

```css
shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1)
shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1)
```

### Animations

```css
/* Transitions */
transition-fast: transition duration-150
transition-base: transition duration-200
transition-slow: transition duration-300

/* Hover effects */
hover:shadow-md
hover:scale-105 (for buttons)

/* Loading spinner */
animate-spin
```

---

## 11. Component Library Structure

### File Organization

```
/src/app/(app)/community/
├── components/
│   ├── layout/
│   │   ├── CommunityLayout.tsx
│   │   ├── CommunityHeader.tsx
│   │   └── ChannelList.tsx
│   ├── posts/
│   │   ├── PostFeed.tsx
│   │   ├── PostCard.tsx
│   │   ├── PostComposer.tsx
│   │   └── PostActionsMenu.tsx
│   ├── comments/
│   │   ├── CommentList.tsx
│   │   └── CommentComposer.tsx
│   ├── reactions/
│   │   ├── ReactionBar.tsx
│   │   └── ReactionButton.tsx
│   ├── mentions/
│   │   └── MentionAutocomplete.tsx
│   ├── modals/
│   │   ├── GuidelinesModal.tsx
│   │   └── ConfirmationDialog.tsx
│   └── shared/
│       ├── EmptyState.tsx
│       ├── LoadingSpinner.tsx
│       ├── Toast.tsx
│       └── RelativeTime.tsx
├── hooks/
│   ├── usePosts.ts
│   ├── useComments.ts
│   ├── useReactions.ts
│   ├── useMentions.ts
│   └── useRealtime.ts
├── utils/
│   ├── mentionParser.ts
│   ├── timeFormatter.ts
│   └── urlValidator.ts
└── types/
    └── community.ts
```

### Naming Conventions

- Components: PascalCase (e.g., `PostCard.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `usePosts.ts`)
- Utils: camelCase (e.g., `mentionParser.ts`)
- Types: PascalCase interfaces (e.g., `Post`, `Comment`)

---

## 12. State Management Patterns

### React Query (Recommended)

Use React Query for server state:

```typescript
// Example: usePosts hook
export function usePosts(channelId: string, accountId: string) {
  return useQuery({
    queryKey: ['posts', channelId, accountId],
    queryFn: () => fetchPosts(channelId, accountId),
    staleTime: 1000 * 60, // 1 minute
  });
}
```

### Realtime Subscriptions

```typescript
// Example: useRealtimePosts hook
export function useRealtimePosts(channelId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const subscription = supabase
      .channel(`posts:${channelId}`)
      .on('INSERT', (payload) => {
        queryClient.setQueryData(['posts', channelId], (old) =>
          [payload.new, ...old]
        );
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, [channelId]);
}
```

### Context Usage

Use existing auth contexts:
- `useCoreAuth()` - for user session
- `useAccountContext()` - for account selection
- No new contexts needed for community (use React Query)

---

## 13. Error States

### Component Error Boundaries

Wrap major sections in error boundaries:

```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <PostFeed />
</ErrorBoundary>
```

### API Error Display

```typescript
interface ErrorDisplayProps {
  error: Error;
  retry?: () => void;
}

// Shows user-friendly message with retry option
<ErrorDisplay
  error={error}
  retry={() => refetch()}
/>
```

### Error Messages

- Network error: "Unable to connect. Please check your internet."
- Permission error: "You don't have access to this content."
- Not found: "This post could not be found."
- Rate limit: "Slow down! Please wait before trying again."
- Generic: "Something went wrong. Please try again."

---

## 14. Loading States

### Skeleton Screens

Use skeleton placeholders while loading:

```
┌───────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓ ▓▓▓▓▓▓ · ▓▓▓▓▓▓▓▓▓               │
│                                            │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                 │
│                                            │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓          │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                       │
└───────────────────────────────────────────┘
```

- Show 3 skeleton posts on initial load
- Animate shimmer effect (pulse)
- Match layout of actual content

### Optimistic Updates

Show UI changes immediately, rollback on error:

```typescript
// Example: Optimistic reaction
const { mutate } = useMutation(toggleReaction, {
  onMutate: async (newReaction) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['posts']);

    // Snapshot previous value
    const previous = queryClient.getQueryData(['posts']);

    // Optimistically update
    queryClient.setQueryData(['posts'], (old) =>
      updateReactionInPost(old, newReaction)
    );

    return { previous };
  },
  onError: (err, newReaction, context) => {
    // Rollback on error
    queryClient.setQueryData(['posts'], context.previous);
  },
});
```

---

## 15. Accessibility Checklist

- [ ] All interactive elements keyboard accessible
- [ ] Focus visible on all focusable elements
- [ ] ARIA labels on icon-only buttons
- [ ] Form inputs have associated labels
- [ ] Error messages announced to screen readers
- [ ] Modal focus trap working
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Touch targets minimum 44x44px
- [ ] Skip links to main content
- [ ] Heading hierarchy logical (h1 → h2 → h3)
- [ ] Images have alt text (when added in Phase 2)
- [ ] Time elements have datetime attribute
- [ ] Live regions for dynamic content

---

## 16. Testing Guidelines

### Component Tests (React Testing Library)

Test user behavior, not implementation:

```typescript
describe('PostCard', () => {
  it('displays post title and author', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByRole('heading', { name: mockPost.title })).toBeInTheDocument();
    expect(screen.getByText(mockPost.author.displayName)).toBeInTheDocument();
  });

  it('allows author to delete their post', () => {
    const onDelete = jest.fn();
    render(<PostCard post={mockPost} currentUserId={mockPost.author.id} onDelete={onDelete} />);

    fireEvent.click(screen.getByLabelText('Post actions'));
    fireEvent.click(screen.getByText('Delete'));

    expect(onDelete).toHaveBeenCalled();
  });
});
```

### E2E Tests (Playwright)

Test critical user flows:

```typescript
test('user can create a post', async ({ page }) => {
  await page.goto('/community');
  await page.click('text=New Post');

  await page.fill('[aria-label="Post title"]', 'My first post');
  await page.fill('[aria-label="Post body"]', 'This is the content');
  await page.click('text=Create Post');

  await expect(page.locator('text=My first post')).toBeVisible();
});
```

---

## 17. Performance Optimization

### Code Splitting

```typescript
// Lazy load heavy components
const PostComposer = lazy(() => import('./components/posts/PostComposer'));
const GuidelinesModal = lazy(() => import('./components/modals/GuidelinesModal'));
```

### Memoization

```typescript
// Memoize expensive computations
const PostCard = memo(({ post }) => {
  const formattedBody = useMemo(() =>
    parseMentions(post.body),
    [post.body]
  );

  return <article>{formattedBody}</article>;
});
```

### Virtual Scrolling

For channels with >100 posts, consider react-window:

```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={posts.length}
  itemSize={200}
>
  {({ index, style }) => (
    <div style={style}>
      <PostCard post={posts[index]} />
    </div>
  )}
</FixedSizeList>
```

---

## 18. Design Handoff Checklist

Before implementation begins, design team should provide:

- [ ] High-fidelity mockups for all states (default, hover, active, error, loading, empty)
- [ ] Mobile, tablet, desktop layouts
- [ ] Interaction animations (hover effects, transitions)
- [ ] Modal and overlay designs
- [ ] Toast notification design
- [ ] Error state designs
- [ ] Empty state illustrations/copy
- [ ] Loading skeleton designs
- [ ] Icon set for reactions, actions, etc.
- [ ] Accessibility annotations (focus order, ARIA labels)
- [ ] Responsive breakpoint specifications
- [ ] Design tokens exported (colors, typography, spacing)

---

## 19. Open Design Questions

The following require design decisions before implementation:

1. **Avatar Images:** Should user avatars be shown in Phase 1 or Phase 2?
2. **Channel Icons:** Should channels have custom icons or always use #?
3. **Reaction Picker:** Should reactions be always visible or hidden behind "+" button?
4. **Comment Count Display:** Show count in reaction bar or separately?
5. **Post Hover Actions:** Show edit/delete on hover or always visible (mobile)?
6. **Guidelines Content:** Who provides the actual guidelines text?
7. **Branding:** Should community feel like separate section or integrated?
8. **Dark Mode:** Support dark mode in Phase 1 or Phase 2?
9. **Animations:** How much animation/transition is desired?
10. **Empty State Illustrations:** Custom illustrations or simple icons?

---

## 20. Integration with Existing PromptReviews Design

### Maintain Consistency

The community should feel like a natural extension of PromptReviews:

- **Use existing components:** Button, Input, Modal from existing UI library
- **Match navigation:** Same header and account switcher
- **Color scheme:** Use existing indigo primary colors
- **Typography:** Use existing Inter font
- **Spacing:** Match existing dashboard page layouts

### Reusable Components

Leverage these existing PromptReviews components:

- `<Button>` - Primary, secondary, danger variants
- `<Input>` - Text input with validation
- `<Textarea>` - Multiline input
- `<Modal>` - Base modal wrapper
- `<Dropdown>` - Menu dropdowns
- `<Tooltip>` - Hover tooltips
- `<Card>` - Container cards
- Account switcher in header

### New Component Guidelines

New community-specific components should:

- Follow existing naming conventions
- Use Tailwind utility classes (no CSS modules)
- Support dark mode preparation (use theme tokens)
- Include TypeScript types
- Export from index files for clean imports

---

## Summary

This UI specification provides a comprehensive blueprint for implementing the Community Feature frontend. The design prioritizes:

1. **Consistency** with existing PromptReviews patterns
2. **Accessibility** for all users
3. **Responsiveness** across all devices
4. **Performance** for smooth interactions
5. **Extensibility** for Phase 2 features

Next steps:
1. Design team reviews and provides mockups
2. Frontend team reviews component structure
3. Answer open design questions
4. Proceed with implementation per acceptance criteria

---

**Document Status:** Draft - Awaiting Design Review
**Reviewers Needed:** Design Lead, Frontend Lead, Accessibility Specialist
**Dependencies:** Acceptance Criteria document, Data schema (Data Agent output)

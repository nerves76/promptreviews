# Community Feature - Integration Guide

**Version**: 1.0
**Last Updated**: 2025-10-06
**For**: Main App Integration

## Overview

This guide explains how to integrate the Community Feature into the main PromptReviews application.

---

## Prerequisites

1. **Backend APIs implemented** (by Backend Agent)
   - POST/GET/PUT/DELETE endpoints for posts, comments, reactions
   - RPC functions for mentions, guidelines acceptance
   - Supabase Realtime subscriptions configured

2. **Database migrations applied** (by Data Agent)
   - All community tables created
   - RLS policies enabled
   - Default channels seeded
   - Usernames generated for existing users

3. **Auth system configured**
   - Community profiles created for all users
   - `is_admin` flag available in user metadata
   - Account context provides business_name for display

---

## File Structure

All community files are located in:

```
/src/app/(app)/community/
├── components/
│   ├── layout/              # CommunityLayout, Header, ChannelList
│   ├── posts/               # PostCard, PostFeed, PostComposer
│   ├── comments/            # CommentList, CommentComposer
│   ├── reactions/           # ReactionBar
│   ├── mentions/            # MentionAutocomplete
│   ├── modals/              # GuidelinesModal
│   └── shared/              # UserIdentity, AdminBadge, etc.
├── hooks/                   # usePosts, useComments, useReactions, useMentions
├── utils/                   # mentionParser, timeFormatter, urlValidator
├── types/                   # community.ts (TypeScript types)
└── page.tsx                 # Main community page
```

---

## Navigation Integration

### Add Community Link to Main Navigation

**File**: `/src/app/(app)/components/Header.tsx` (or wherever main nav is)

```tsx
import Link from 'next/link';

// In your nav component
<nav>
  <Link href="/dashboard">Dashboard</Link>
  <Link href="/dashboard/reviews">Reviews</Link>
  <Link href="/dashboard/widget">Widgets</Link>
  {/* ADD THIS */}
  <Link href="/community">
    Community
    {/* Optional: Unread mention badge */}
    {unreadMentions > 0 && (
      <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
        {unreadMentions}
      </span>
    )}
  </Link>
</nav>
```

### Mobile Menu

Add the same link to your mobile hamburger menu.

---

## Feature Flag (Optional)

To enable/disable community feature during rollout:

**File**: `/src/lib/featureFlags.ts` (create if doesn't exist)

```typescript
export const FEATURES = {
  community: process.env.NEXT_PUBLIC_FEATURE_COMMUNITY === 'true',
  // ... other flags
};
```

**Environment Variable**:
```bash
# .env.local
NEXT_PUBLIC_FEATURE_COMMUNITY=true
```

**Usage in Navigation**:
```tsx
import { FEATURES } from '@/lib/featureFlags';

{FEATURES.community && (
  <Link href="/community">Community</Link>
)}
```

---

## User Onboarding Flow

### First-Time Guidelines

The GuidelinesModal automatically shows on first visit if user hasn't accepted guidelines yet.

**Logic** (already in `/src/app/(app)/community/page.tsx`):
```typescript
// Check if user has accepted guidelines
useEffect(() => {
  const checkGuidelines = async () => {
    const { data } = await supabase
      .from('community_profiles')
      .select('guidelines_accepted_at')
      .eq('user_id', user.id)
      .single();

    if (!data?.guidelines_accepted_at) {
      setRequireGuidelinesAcceptance(true);
      setShowGuidelines(true);
    }
  };

  checkGuidelines();
}, [user]);
```

No additional setup needed - this is already implemented.

---

## Real-Time Updates Integration

### Supabase Realtime Channels

To enable real-time post updates, add this hook to `/src/app/(app)/community/page.tsx`:

```typescript
import { useEffect } from 'react';
import { createClient } from '@/auth/providers/supabase';

function useCommunityRealtime(channelId: string, onNewPost: () => void) {
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel('community_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          console.log('New post:', payload);
          onNewPost(); // Refetch posts
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [channelId, supabase, onNewPost]);
}

// Usage in CommunityPage
useCommunityRealtime(activeChannel?.id || '', () => {
  fetchPosts();
});
```

---

## Analytics Integration

### Track Community Events

**File**: `/src/utils/analytics.ts` (existing file)

Add these events:

```typescript
export const GA_EVENTS = {
  // ... existing events

  // Community events
  COMMUNITY_VIEWED: 'community_viewed',
  POST_CREATED: 'post_created',
  COMMENT_CREATED: 'comment_created',
  REACTION_ADDED: 'reaction_added',
  MENTION_SENT: 'mention_sent',
  GUIDELINES_ACCEPTED: 'guidelines_accepted',
};
```

**Track in components**:

```typescript
import { trackEvent, GA_EVENTS } from '@/utils/analytics';

// In CommunityPage
useEffect(() => {
  trackEvent(GA_EVENTS.COMMUNITY_VIEWED, {
    channel_slug: activeChannelSlug,
  });
}, [activeChannelSlug]);

// In PostComposer (after successful submit)
trackEvent(GA_EVENTS.POST_CREATED, {
  channel_id: channelId,
  has_link: !!externalUrl,
  has_mentions: body.includes('@'),
});
```

---

## Error Handling

### Sentry Integration

If using Sentry, errors are automatically captured. No additional setup needed.

### Custom Error Boundary

Wrap community page in error boundary:

**File**: `/src/app/(app)/community/layout.tsx` (create if doesn't exist)

```tsx
'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-6 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong</h2>
          <p className="mb-4">We're having trouble loading the community.</p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Reload Page
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
```

---

## Performance Optimization

### Code Splitting

The community page is already lazy-loaded by Next.js routing. No additional setup needed.

### Image Optimization

If adding avatar images in Phase 2, use Next.js Image component:

```tsx
import Image from 'next/image';

<Image
  src={author.logo_url}
  alt={author.business_name}
  width={32}
  height={32}
  className="rounded-full"
/>
```

---

## SEO Considerations

Community pages are behind auth, so no SEO needed. But if making a public changelog/announcements channel in Phase 2:

**File**: `/src/app/(app)/community/page.tsx`

```tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community | PromptReviews',
  description: 'Connect with other PromptReviews customers',
  robots: 'noindex', // Private community
};
```

---

## Testing Checklist

Before going live, test these flows:

- [ ] User can navigate to `/community` from main nav
- [ ] Guidelines modal shows on first visit
- [ ] User can accept guidelines
- [ ] User can view posts in all channels
- [ ] User can create post with title, body, link
- [ ] User can @mention other users (autocomplete works)
- [ ] User can comment on post
- [ ] User can react to post/comment
- [ ] User can edit/delete own posts
- [ ] User can edit/delete own comments
- [ ] Infinite scroll loads more posts
- [ ] Real-time updates show new posts (if enabled)
- [ ] Admin badge shows on Prompt Reviews team posts
- [ ] External links open in new tab
- [ ] Mobile responsive (sidebar collapses, hamburger menu)
- [ ] Loading states work (skeleton, spinner)
- [ ] Empty states work (no posts, no comments)
- [ ] Error states work (failed to load, network error)

---

## Launch Rollout Plan

### Phase 1: Internal Testing (3 days)
- Enable for Chris B + team only
- Test all flows
- Fix any issues

### Phase 2: Pilot Launch (1 week)
- Enable for all 5 customers
- Personal notification from Chris B
- Monitor for issues
- Collect feedback

### Phase 3: Full Rollout (Ongoing)
- Monitor engagement metrics
- Iterate based on feedback
- Plan Phase 2 features (monthly summaries, email notifications)

---

## Troubleshooting

### Issue: Guidelines modal not showing

**Solution**: Check that `community_profiles` table exists and RLS policies allow read access.

```sql
-- Check if user has profile
SELECT * FROM community_profiles WHERE user_id = 'user-id';

-- If missing, insert profile
INSERT INTO community_profiles (user_id, username)
VALUES ('user-id', 'generated-username');
```

---

### Issue: Posts not loading

**Solution**: Check Supabase RLS policies.

```sql
-- Posts should be readable by all authenticated users
CREATE POLICY "Authenticated users can view posts"
  ON posts
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);
```

---

### Issue: @mention autocomplete not working

**Solution**: Ensure `search_community_users` RPC function exists.

```sql
-- Check if function exists
SELECT * FROM pg_proc WHERE proname = 'search_community_users';
```

If missing, backend agent needs to create it.

---

## Support

For integration questions, contact:
- **Frontend Issues**: Review `/docs/community/frontend/COMPONENT-GUIDE.md`
- **Backend Issues**: Contact Backend Agent
- **Database Issues**: Contact Data Agent
- **QA Issues**: Contact QA Agent

---

**Status**: ✅ Ready for integration after backend APIs are implemented

**Next Steps**:
1. Backend Agent implements API endpoints
2. Data Agent runs migrations
3. Test in staging environment
4. Deploy to production
5. Enable for pilot customers

# Community Feature

A Slack-style community platform for Prompt Reviews customers to share knowledge, ask questions, and celebrate wins together.

## Overview

The community is organized into channels, starting with:
- **#general** - Open discussions and announcements
- **#feature-requests** - Request and vote on new features

## Features

### Posts
- Create posts with title, body, and optional external links
- Edit and delete your own posts
- React with emoji (👍 👎 ❤️ 🎉 🚀)
- View engagement metrics

### Comments
- Reply to posts with threaded comments
- React to comments
- Delete your own comments
- @mention other users

### User Identity
- Display name shows your first name + business name
- Customize display name in settings
- Prompt Reviews team members get a special badge

### Account Context
- Posts show which business you represent (when you have multiple accounts)
- Account switcher in top-right changes which business context you post from
- Your posts are tied to you personally (you can only delete your own)

## Usage

### Creating a Post
1. Use the composer at the bottom of the channel
2. Type your title (first line) and body (optional)
3. Press Enter to send, or Shift+Enter for new line
4. Add links by pasting URLs - they'll be automatically detected

### Mentioning Users
- Type `@` to see a list of community members
- Use arrow keys to select, Enter to insert
- Mentions are highlighted in purple

### Guidelines
- First-time visitors must accept community guidelines
- Be respectful and constructive
- No spam or self-promotion outside designated channels
- Moderation by Prompt Reviews team

## File Structure

```
community/
├── page.tsx                    # Main community page
├── components/
│   ├── layout/
│   │   └── CommunityLayout.tsx # Sidebar + main layout
│   ├── posts/
│   │   ├── PostFeed.tsx        # Infinite scroll feed
│   │   ├── PostCard.tsx        # Individual post display
│   │   └── InlinePostComposer.tsx # Bottom posting bar
│   ├── comments/
│   │   ├── CommentList.tsx     # Comment display
│   │   ├── CommentCard.tsx     # Individual comment
│   │   └── CommentComposer.tsx # Comment input
│   ├── reactions/
│   │   └── ReactionBar.tsx     # Reaction buttons
│   ├── mentions/
│   │   └── MentionAutocomplete.tsx # @mention dropdown
│   ├── modals/
│   │   ├── GuidelinesModal.tsx # Community guidelines
│   │   └── EditDisplayNameModal.tsx # Name customization
│   └── shared/
│       ├── UserIdentity.tsx    # User avatar + name
│       ├── RelativeTime.tsx    # Timestamp formatter
│       ├── LoadingSpinner.tsx  # Loading states
│       └── EmptyState.tsx      # Empty state UI
├── hooks/
│   ├── usePosts.ts             # Post CRUD + pagination
│   ├── useComments.ts          # Comment CRUD
│   ├── useReactions.ts         # Reaction toggle
│   └── useMentionableUsers.ts  # User search for mentions
├── types/
│   └── community.ts            # TypeScript types
└── utils/
    ├── linkify.ts              # URL detection
    └── urlValidator.ts         # URL parsing
```

## API Reference

### Posts
```
GET    /api/community/posts              # List posts
POST   /api/community/posts              # Create post
GET    /api/community/posts/:id          # Get single post
PATCH  /api/community/posts/:id          # Update post (author only)
DELETE /api/community/posts/:id          # Delete post (author only)
POST   /api/community/posts/:id/react    # Toggle reaction
```

### Comments
```
GET    /api/community/posts/:id/comments # List comments
POST   /api/community/posts/:id/comments # Create comment
DELETE /api/community/comments/:id       # Delete comment (author only)
POST   /api/community/comments/:id/react # Toggle reaction
```

### Channels
```
GET    /api/community/channels           # List channels
```

## Database Schema

### Tables
- `channels` - Community channels
- `posts` - Main posts
- `comments` - Comments on posts
- `post_reactions` - Post reactions
- `comment_reactions` - Comment reactions
- `community_profiles` - User profiles

### Key Relationships
- Posts belong to a channel
- Posts have an author (user_id) and account context (account_id)
- Comments belong to a post
- Reactions belong to posts or comments
- All users have a community_profile

## Security

- **Authentication**: All endpoints require valid Supabase auth token
- **Authorization**: Users can only delete their own content
- **RLS Policies**: Row-level security on all tables
- **Admin Privileges**: Admins can moderate any content

## Development Notes

### Why API Endpoints Instead of Direct Supabase?
Direct Supabase UPDATE calls from the client fail due to RLS policy complexity. The API endpoints use the service role client to bypass RLS after proper authorization checks.

### Account Isolation
The `account_id` column tracks which business context a post was created from. This is separate from `author_id` which tracks who personally created it. Users can only delete posts they authored, regardless of account_id.

### Performance Considerations
- Reactions currently use N+1 queries (could be optimized)
- Consider adding database indexes for: `posts.channel_id`, `comments.post_id`
- Infinite scroll loads 20 posts at a time

## Future Enhancements

See [ROADMAP.md](./ROADMAP.md) for planned features including:
- Post editing UI
- Search and filtering
- Notifications
- Rich media uploads
- And more!

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and release notes.

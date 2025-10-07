# Community Feature Changelog

## [1.0.0] - 2025-10-07

### Added - Initial Release
- Channel-based community system with #general and #feature-requests
- Post creation with title, body, and optional external URLs
- Comment system with nested discussions
- Reaction system with 5 emoji types (👍 👎 ❤️ 🎉 🚀)
- @mention autocomplete for users
- Infinite scroll pagination for posts
- Real-time post and comment display
- Community guidelines modal with acceptance tracking
- Display name customization (shows first name + business name)
- Glassmorphic UI design with purple accent colors
- Empty states and loading indicators
- Relative timestamps (e.g., "2 hours ago")
- Automatic URL detection and linkification
- Account context tracking - posts show which business they were created under
- Mobile-responsive design with hamburger menu and slide-in sidebar

### Security
- Row Level Security (RLS) policies for all data access
- Authentication required for all endpoints
- Author-only deletion rights for posts and comments
- Admin moderation capabilities
- Proper account isolation between users

### API Endpoints
- Complete REST API for posts, comments, reactions, and channels
- Service role client used for admin operations
- Authorization via Bearer token in headers

### Fixed During Development
- **Account bleed issue**: Posts now correctly track and display which business account they were created from via `account_id` column
- **Deletion not working**: Direct Supabase UPDATE calls blocked by RLS policies
  - Solution: Route deletions through API endpoints with service role client
  - Both posts and comments now delete properly with proper auth checks
- **Missing Authorization headers**: Added token extraction and header injection for API calls
- **UI overlap**: Moved Send button to left side to avoid help bubble overlap
- **Branding**: Updated "PromptReviews" to "Prompt Reviews" (two words)

### Technical Details
- Built with Next.js 15 App Router
- TypeScript for type safety
- Supabase for database and real-time features
- Tailwind CSS for styling
- Server-side rendering compatible

---

## Deployment Notes

### Database Tables Created
- `channels` - Community channels (#general, etc.)
- `posts` - Main posts with title, body, external_url
- `comments` - Comments on posts (table name: `comments`)
- `post_reactions` - Reactions to posts
- `comment_reactions` - Reactions to comments
- `community_profiles` - User profiles with display names and guidelines acceptance

### Database Columns Added
- `posts.account_id` - Tracks which business account created the post
- `comments.account_id` - Tracks which business account created the comment
- Both have foreign keys to `accounts(id)` with CASCADE delete

### RLS Policies
- Posts: View (authenticated), Create (authenticated), Update (author/admin), Delete (author/admin)
- Comments: View (authenticated), Create (authenticated), Update (author/admin), Delete (author/admin)
- Reactions: View (authenticated), Create/Delete (authenticated)
- Channels: View (authenticated), Manage (admin only)

### Known Limitations
- Post editing UI exists but not wired up (API endpoint ready)
- Comment editing not implemented
- Direct Supabase UPDATE calls fail due to RLS policy interaction (use API endpoints instead)

---

*For future features and enhancements, see ROADMAP.md*

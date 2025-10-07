# Community Feature Roadmap

## ✅ Implemented (v1.0)

### Core Features
- [x] Channel-based organization (#general, #feature-requests, etc.)
- [x] Post creation with title, body, and external links
- [x] Comment system with threaded discussions
- [x] Reaction system (👍 👎 ❤️ 🎉 🚀)
- [x] @mentions with autocomplete
- [x] Real-time post and comment display
- [x] Infinite scroll pagination
- [x] Post and comment deletion (soft delete)
- [x] Account isolation (posts show correct business context)
- [x] Community guidelines modal with acceptance tracking
- [x] Display name customization (with business name)
- [x] Glassmorphic UI design
- [x] Empty states and loading indicators
- [x] Relative timestamps
- [x] URL detection and linkification

### Security & Authorization
- [x] Authentication required
- [x] RLS policies for data access
- [x] Author-only deletion rights
- [x] Admin moderation capabilities
- [x] Account context tracking (account_id on posts/comments)

### API Endpoints
- [x] GET /api/community/posts - List posts with pagination
- [x] POST /api/community/posts - Create new post
- [x] GET /api/community/posts/:id - Get single post
- [x] PATCH /api/community/posts/:id - Update post (author only)
- [x] DELETE /api/community/posts/:id - Delete post (author only)
- [x] POST /api/community/posts/:id/react - Add/remove reaction
- [x] GET /api/community/posts/:id/comments - List comments
- [x] POST /api/community/posts/:id/comments - Create comment
- [x] DELETE /api/community/comments/:id - Delete comment
- [x] POST /api/community/comments/:id/react - React to comment

## 🔮 Future Enhancements (Not Yet Implemented)

### Post Editing
- [ ] Edit post functionality (UI exists but not wired up)
  - PostCard has `onEdit` prop that's optional
  - Would need EditPostModal component
  - API PATCH endpoint already exists at `/api/community/posts/:id`

### Comment Editing
- [ ] Edit comment functionality
  - Would need EditCommentModal component
  - API PATCH endpoint already exists at `/api/community/comments/:id`

### Search & Discovery
- [ ] Search posts by title/content
- [ ] Filter posts by channel
- [ ] Filter by reactions/popular posts
- [ ] Tag system for categorization

### Notifications
- [ ] Notify when mentioned in post/comment
- [ ] Notify when someone reacts to your post
- [ ] Notify when someone comments on your post
- [ ] Email digest of community activity

### Rich Content
- [ ] Image uploads in posts
- [ ] File attachments
- [ ] Video embeds (YouTube, Vimeo)
- [ ] Code syntax highlighting
- [ ] Markdown formatting

### Moderation
- [ ] Report post/comment functionality
- [ ] Admin dashboard for moderation queue
- [ ] User blocking/muting
- [ ] Pin important posts
- [ ] Lock/archive posts

### User Experience
- [ ] Keyboard shortcuts (j/k navigation, c for compose)
- [ ] Draft post saving (localStorage)
- [ ] Quote/reply to specific comment
- [ ] Emoji picker for reactions (currently hard-coded 5 emojis)
- [ ] View who reacted (hover tooltip)

### Analytics
- [ ] Post view counts
- [ ] Engagement metrics per channel
- [ ] Top contributors leaderboard
- [ ] Activity heatmap

### Channels
- [ ] Create custom channels (admin only)
- [ ] Private channels (invite-only)
- [ ] Channel descriptions
- [ ] Channel-specific rules

### Mobile (Basic Support Implemented)
- [x] Responsive layout with hamburger menu
- [x] Slide-in sidebar for channel navigation
- [x] Touch-friendly tap targets
- [ ] Swipe gestures (swipe from edge to open sidebar)
- [ ] Pull-to-refresh
- [ ] Bottom navigation bar (alternative to top hamburger)
- [ ] Optimized font sizes and spacing for small screens

### Integrations
- [ ] Slack integration (post to Slack, get notifications)
- [ ] Email posting (send email to create post)
- [ ] RSS feed per channel
- [ ] Webhook notifications

## 📝 Technical Debt

### Performance
- [ ] Implement proper caching for posts/comments
- [ ] Optimize reaction queries (currently N+1)
- [ ] Add database indexes for commonly filtered columns
- [ ] Implement read receipts without performance impact

### Code Quality
- [ ] Extract shared types to separate file
- [ ] Add unit tests for hooks
- [ ] Add integration tests for API endpoints
- [ ] Improve error handling and user feedback
- [ ] Add loading skeletons instead of spinners

### Accessibility
- [ ] Add proper ARIA labels throughout
- [ ] Keyboard navigation for all interactive elements
- [ ] Screen reader testing and improvements
- [ ] Color contrast audit
- [ ] Focus management in modals

### Database
- [ ] Add full-text search indexes
- [ ] Optimize RLS policies (currently multiple queries per post)
- [ ] Add composite indexes for common query patterns
- [ ] Consider materialized views for engagement metrics

## 🐛 Known Issues

### RLS Policy Complexity
- Direct Supabase client UPDATE operations fail due to RLS policy interaction
- **Workaround**: Using API endpoints with service role client
- **Proper fix**: Simplify RLS policies or investigate why multiple permissive policies conflict

### Auth Token Passing
- API endpoints require Authorization header
- Client-side fetch must manually extract and pass auth token
- **Potential improvement**: Use middleware or wrapper to auto-inject auth

## 💡 Ideas for Consideration

- **Gamification**: Badges for contributions, helpful reactions, etc.
- **Polls**: Quick polls within posts
- **Events**: Announce and RSVP to community events
- **Resources**: Shared document library
- **Member Directory**: Browse community members and their businesses
- **Private Messages**: 1-on-1 DMs between users
- **Bookmarks**: Save posts for later reading
- **Following**: Follow specific users or topics

---

*Last updated: 2025-10-07*

# Community Feature - Final Decisions

**Date**: 2025-10-06
**Decision Maker**: Chris B (Product Owner)
**Status**: ✅ APPROVED - Ready for Implementation

---

## Approved Decisions Summary

### 1. Monthly Summary Privacy ✅ DEFER TO PHASE 2
**Decision**: Summaries are shareable (not auto-posted)
- Users can manually share summaries if they want
- Show in dashboard alerts/notices (not auto-posted to community)
- **Implementation**: Phase 2 feature, not in MVP
- **Rationale**: "Let's finish the feature before we get to the win summaries"

---

### 2. Channel Strategy ✅ DECIDED
**Decision**: 5 Channels - General, Strategy, Google Business, Feature Requests, Promote
- No "Wins" channel for MVP (use General instead)
- Can expand later if General gets too busy
- No industry-specific channels initially
- **Rationale**: Simple start, expand based on demand

---

### 3. Moderation ✅ DECIDED
**Decision**: Admin-only moderation
- Anyone with `admin` status in database can moderate
- Chris B is primary moderator
- Powers: Delete posts, ban users, pin content
- **Rationale**: Small user base (5 customers), manageable manually

---

### 4. Username System ✅ APPROVED
**Decision**: Immutable username + optional display name override
- Username: `alex-7h3n` (permanent, generated once)
- Display name override: "Alex the Baker" (optional, user-set)
- Full display: "Alex the Baker (alex-7h3n) • Fireside Bakery"
- **Rationale**: Stability + user personalization

---

### 5. @everyone Broadcasts ✅ DECIDED
**Decision**: Admin-only
- Only users with `admin` status can use `@everyone`
- No frequency limits (trusted users only)
- **Rationale**: Prevent spam, keep professional

---

### 6. Email Notifications ✅ DEFER TO PHASE 2
**Decision**: In-app only for MVP
- No email notifications at launch
- Badge count on community nav link
- Notification bell in app
- **Implementation**: Phase 2 feature
- **Rationale**: Simplify MVP, reduce complexity

---

### 7. Privacy Controls ✅ DECIDED
**Decision**: Fully public (authenticated users only)
- All posts visible to all authenticated users
- No private channels or hidden posts
- Community guidelines warn against sharing sensitive info
- **Rationale**: "Nothing hidden" - simple, transparent
- **Future**: Content warnings for sensitive topics (Phase 2+)

---

### 8. Launch Rollout ✅ DECIDED
**Decision**: Simple direct rollout
- Enable for all 5 customers at once
- Personal notification from Chris B
- **Rationale**: "I only have 5 customers - I will tell them"
- No phased rollout needed for small user base

---

## Competitive Dynamics ✅ NO ACTION
**Decision**: Do not restrict competitors from interacting
- Multiple businesses in same niche can see each other's posts
- "I do not see this as negative"
- Community guidelines emphasize constructive sharing

---

## Implementation Impact

### MVP Scope (Phase 1-2)
**IN SCOPE**:
- ✅ 5 channels: General, Strategy, Google Business, Feature Requests, Promote
- ✅ Post, comment, react functionality
- ✅ @mention support
- ✅ Username generation (immutable + display name)
- ✅ In-app notifications only
- ✅ Admin-only moderation tools
- ✅ Community guidelines modal
- ✅ Glassmorphic design
- ✅ Realtime updates

**OUT OF SCOPE (Defer to Phase 2+)**:
- ❌ Monthly summary auto-posting
- ❌ Email notifications
- ❌ Weekly summaries
- ❌ @everyone broadcasts (infrastructure ready, not promoted)
- ❌ Saved/pinned posts surface
- ❌ Content warnings
- ❌ Community moderators (volunteer)

### Database Schema Simplifications
- No `account_id` on posts, comments, reactions (global community)
- No `monthly_summaries` table needed for MVP
- No `weekly_summaries` table
- No `saved_posts` table for MVP
- Simplified RLS: authenticated users only

### Feature Flags
```
community=false                  # Master toggle
community_realtime=false         # Realtime subscriptions
community_notifications=false    # In-app notifications
```

**Phase 2+ flags** (not implemented in MVP):
- `community_digests=false` (monthly/weekly summaries)
- `community_broadcasts=false` (@everyone functionality)
- `community_email=false` (email notifications)

---

## Revised Timeline

### Phase 1: Database Foundation (1 week)
- Create 3 core migrations (down from 4)
  - Core tables (channels, posts, comments, reactions, mentions)
  - RLS policies
  - Seed 5 channels
- Skip: monthly_summaries, weekly_summaries, saved_posts
- Test with multiple users

### Phase 2: Core MVP (2 weeks)
- Build community UI
- Post, comment, react functionality
- @mention autocomplete
- In-app notifications
- Realtime updates
- Community guidelines modal
- Admin moderation tools

### Phase 3: Internal Testing (3 days)
- Test with Chris B + team
- Verify all flows work
- Polish UX

### Phase 4: Launch (1 day)
- Enable for 5 customers
- Personal notification from Chris B
- Monitor for issues

### Phase 5: Iterate Based on Feedback (ongoing)
- Collect user feedback
- Plan Phase 2 features (summaries, email, saved posts)

**Total MVP Timeline: ~3.5 weeks**

---

## Success Metrics (Revised for 5 Customers)

| Metric | Target | Rationale |
|--------|--------|-----------|
| % of customers who visit community in first week | 80% (4/5) | Small user base, personal outreach |
| % of visitors who post or comment | 60% (3/5) | High engagement expected with direct communication |
| Posts created in first week | 10+ | 2+ posts per active user |
| Unique contributors | 3+ | Majority participation |
| Moderation incidents | 0 | Trusted small group |
| Page load time | <500ms | Performance benchmark |

---

## Next Steps

1. ✅ **Decisions documented** (this file)
2. ⏳ **Update ROADMAP-v2.md** with final scope
3. ⏳ **Launch Data Agent** - Create simplified migrations
4. ⏳ **Launch Backend Agent** - Build RPC functions
5. ⏳ **Launch Frontend Agent** - Build UI components
6. ⏳ **QA & Testing** - Verify all flows
7. ⏳ **Deploy & Launch** - Enable for 5 customers

---

## Design Requirements

### Glassmorphic Style (from existing PromptReviews design system)
- Frosted glass panels: `rgba(255, 255, 255, 0.08)`
- Backdrop blur: `blur(10px)`
- Subtle borders: `rgba(255, 255, 255, 0.18)`
- High contrast text for accessibility

### Admin Post Styling
- Subtle visual enhancement for admin posts
- Purple gradient badge or highlight
- "Prompt Reviews Team" label
- Slightly elevated glassmorphic effect

### Component Patterns
- Follow existing dashboard patterns
- Reuse existing UI components (buttons, inputs, modals)
- Match navigation and layout conventions

---

## Open Questions for Phase 2 Planning

1. **Monthly Summaries**:
   - What data should be included in summaries?
   - Where should they appear in dashboard?
   - What sharing options? (copy link, download image, social share)

2. **Email Notifications**:
   - Which notification types are highest priority? (mentions, replies, digests)
   - Email frequency preferences? (instant, daily digest, weekly)

3. **Saved/Pinned Posts**:
   - Should there be a dedicated "Highlights" view?
   - Who can pin posts? (Admins only or post authors?)

4. **Community Growth**:
   - At what user count should we add industry-specific channels?
   - Should we add community moderators (volunteers) at some threshold?

---

**Document Status**: ✅ Final and Approved
**Ready for Implementation**: Yes
**Next Agent**: Data & RLS Agent (create migrations)

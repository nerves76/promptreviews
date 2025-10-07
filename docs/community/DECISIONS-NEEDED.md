# Community Feature - Critical Decisions Needed

**Date**: 2025-10-06
**Status**: Awaiting Stakeholder Input
**Architecture**: Global Public Community

---

## Overview

The community feature has been redesigned from **per-account isolated communities** to **one global public community** where all PromptReviews customers interact in the same space. This document outlines critical decisions that need stakeholder input before implementation.

---

## 1. Monthly Summary Privacy & Visibility

### The Question
Should monthly performance summaries (review counts, ratings, themes) be visible to all customers when posted to the "Wins" channel?

Yes. But it should be up to users to post these. - Chris B

### Context
Each month, we can auto-generate a summary of each account's review performance:
- 47 new reviews (+12 from last month)
- 4.8 star average rating
- Top positive theme: "Friendly staff"
- Top negative theme: "Long wait times"

- Let's finish the feature before we get to the win summaries.  - Chris B

### Options

I want the summaries to be sharable, not posted automaticaly. I was imagining they would show up in alerts, but now that I think about a dashboard notice would be cool. But again we don't need to figure this out yet. - Chris B

#### Option A: Public by Default (Opt-Out)
- All accounts' monthly summaries posted publicly in "Wins" channel
- Account setting: "Don't share my summaries" to opt out
- **Pros**: Builds transparency, inspires others, creates social proof
- **Cons**: Competitors see each other's numbers, privacy concerns

#### Option B: Private by Default (Opt-In)
- Summaries generated but NOT posted to community
- Account setting: "Share my summaries with community" to enable
- **Pros**: Privacy protected, user control, conservative approach
- **Cons**: Less engagement, "Wins" channel might be empty, defeats purpose

#### Option C: Anonymous Summary Stats
- Post aggregated community stats: "This month, PromptReviews customers collected 5,234 reviews with 4.6 avg rating"
- Individual accounts not identified
- **Pros**: No privacy concerns, still inspiring
- **Cons**: Less personal, less engagement, no context

### Related Questions
- Should we show business names on summaries or anonymize? ("Fireside Bakery" vs "A Bakery in Seattle")
- Can accounts delete their summary posts after they're published?
- Should there be a preview before posting? ("Review & Share" step)

### Recommendation
**Option B: Private by Default (Opt-In)**
- Start conservative, expand based on adoption
- Include preview in product: "Share this summary with the community?"
- Provide sample summary during onboarding to show what would be shared

**Decision Required**: Which option to implement?

---

## 2. Competitive Dynamics & Channel Strategy

### The Question
How do we handle competitors in the same niche/geography interacting in the community?

I do not see this as negative. Let's not address.

### Context
Since the community is global and public, competing businesses will see each other's posts. For example:
- Two bakeries in the same city
- Multiple auto repair shops in adjacent towns
- Competing restaurants in same neighborhood

### Scenarios

#### Scenario 1: Direct Competitors Sharing Tactics
**Example**: Bakery A posts "We increased reviews 50% by offering a free cookie with every Google review"
**Risk**: Bakery B copies the tactic, reduces Bakery A's competitive advantage
**Counter**: Both bakeries benefit from review growth, not zero-sum

#### Scenario 2: Negative Interactions
**Example**: Competitor B posts "Anyone else struggling with negative reviews about wait times?" → implies Competitor A has same issue
**Risk**: Public negativity, competitive jabs, toxic environment
**Mitigation**: Clear guidelines, active moderation, "Be constructive" rule

#### Scenario 3: Niche-Specific Channels
**Example**: "Restaurants" channel, "Auto Repair" channel, "Healthcare" channel
**Benefit**: More relevant discussions, targeted advice
**Risk**: Fragments community, harder to moderate, less cross-pollination

### Options

#### Option A: Single Generic Channels (Current Plan)
- General, Strategy, Google Business, Feature Requests, Wins
- All industries mixed together
- **Pros**: Simple, cross-industry learning, easier moderation
- **Cons**: Less relevant discussions, harder to find niche-specific advice

#### Option B: Industry-Specific Channels
- Restaurants, Auto Repair, Healthcare, Retail, Services, etc.
- **Pros**: More relevant, niche-specific tactics, stronger sub-communities
- **Cons**: Fragments community, exposes competitors, harder to moderate

#### Option C: Geography-Based Channels
- North America, Europe, Asia, etc. or US-West, US-East, etc.
- **Pros**: Regional tactics, reduces direct competition
- **Cons**: Time zone issues, less useful for strategy, harder to moderate

#### Option D: Prompt Reviews Controls Channels
- Start with generic channels
- Add niche channels based on demand and engagement
- Require minimum members (e.g., 50 restaurants) before creating channel
- **Pros**: Data-driven, responsive to needs, controlled growth
- **Cons**: Manual work, slower to respond to needs

### Related Questions
- Should we limit visibility between competitors? (filter posts by geography/niche)
- Should we have a "Promote Your Business" channel where self-promotion is allowed?
- Should we create an "Announcements" channel (admin-only posting) for product updates?

### Recommendation
**Option D: Controlled Channel Expansion**
- Start with 5 generic channels: General, Strategy, Google Business, Feature Requests, Wins
- Add "Promote" channel (self-promotion allowed)
- Add "Announcements" channel (admin-only posting)
- Monitor requests for niche channels, add when justified
- Set guidelines: "Share to help others, not to hurt competitors"

**Decision Required**: Which channel strategy to implement?

Let's do: General, Strategy, Google Business, Feature Requests, Promote
(WIns can go in general, we can expand if it gets too busy) - Chris B

## 3. Moderation Responsibility & Tooling

### The Question
Who moderates the community and what powers do they have?

For now it's just me. But anyone with status admin in the database. - Chris B
### Context
With a global public community, we need clear moderation rules and responsible parties.

### Options

#### Option A: Prompt Reviews Team Only
- Only Prompt Reviews staff can delete posts, ban users, pin content
- **Pros**: Consistent enforcement, liability protection, quality control
- **Cons**: Overhead on team, slow response time, doesn't scale

#### Option B: Community Moderators (Volunteer)
- Select power users as volunteer moderators with limited powers (flag content, temp ban)
- Prompt Reviews team makes final decisions
- **Pros**: Scales better, community ownership, faster response
- **Cons**: Inconsistent enforcement, volunteer burnout, bias risk

#### Option C: Automated + Human Hybrid
- Automated filters for spam, profanity, rate limiting
- Prompt Reviews team handles escalations
- **Pros**: Scales well, reduces overhead, catches obvious issues
- **Cons**: False positives, can't catch nuance, needs tuning

### Moderation Powers Matrix

| Action | Community Moderators | Prompt Reviews Team | Automated |
|--------|---------------------|-------------------|-----------|
| Delete spam post | Yes | Yes | Yes (via rules) |
| Ban user permanently | No | Yes | No |
| Pin post | No | Yes | No |
| Edit post content | No | No | No (author only) |
| Remove from channel | Yes | Yes | No |
| Mark as Prompt Reviews Team | No | Yes | No |

### Related Questions
- What's the escalation process? (Report → Moderator Review → Team Review → Action)
- How do we prevent moderator abuse? (Audit logs, appeals process)
- Should moderators be anonymous or public?
- What training do moderators need?

### Recommendation
**Option A for MVP, Option C for Long-Term**
- Launch: Prompt Reviews team only (small user base, manageable)
- Phase 2: Add automated filters (rate limiting, spam detection)
- Phase 3: Add community moderators if needed (based on volume)

**Decision Required**: Confirm moderation approach for MVP?

---

## 4. Username Immutability & Display Names

### The Question
Can users ever change their community username after it's generated?

### Context
Usernames are generated once: `alex-7h3n`
Display names change based on selected account: "Alex • Fireside Bakery"

### Options

#### Option A: Permanent Usernames (Recommended in Spec)
- Username generated once and never changes
- Ensures consistency across all posts/comments
- **Pros**: Stable identity, no confusion, simpler system
- **Cons**: Users stuck with generated name, no personalization

#### Option B: User-Editable Usernames
- Users can change username once per month/year
- Must remain unique
- **Pros**: User control, personalization, flexibility
- **Cons**: Confusion (old posts show old name?), abuse potential, complexity

#### Option C: Display Name Override
- Username stays immutable (`alex-7h3n`)
- Users can set custom display name ("Alex the Baker")
- Both shown: "alex-7h3n (Alex the Baker) • Fireside Bakery"
- **Pros**: Flexibility + stability, no confusion
- **Cons**: Verbose display, abuse potential (inappropriate names)

### Related Questions
- Should display name override be moderated? (prevent profanity, impersonation)
- Should old posts update if username changes? (historical accuracy vs consistency)
- Should we show username history? (for transparency)

### Recommendation
**Option C: Immutable Username + Optional Display Name Override**
- Username: `alex-7h3n` (permanent, stable, unique)
- Display name override: "Alex the Baker" (optional, moderated)
- Full display: "Alex the Baker (alex-7h3n) • Fireside Bakery"
- Benefits: User control + system stability

- This recomendation is good -Chris B

**Decision Required**: Username mutability policy?

---

## 5. @everyone Broadcast Controls

### The Question
Who can use `@everyone` to broadcast to all community members, and how often?

### Context
`@everyone` sends notification to all active community members. High potential for spam/fatigue.

### Use Cases
- **Product announcements**: "New feature launched: AI review responses"
- **Community events**: "Join our Q&A session tomorrow at 2pm PT"
- **Critical updates**: "Emergency maintenance tonight 11pm-1am"
- **Policy changes**: "Updated community guidelines"

### Options

#### Option A: Prompt Reviews Team Only
- Only admin users can `@everyone`
- No frequency limits
- **Pros**: No spam risk, consistent messaging, professional
- **Cons**: Less community-driven events, top-down communication

#### Option B: Account Owners + Admins
- Account owners can `@everyone` for their community events
- Admins can `@everyone` for product updates
- Frequency limit: 1 per user per week
- **Pros**: Community-driven, encourages events, distributed moderation
- **Cons**: Spam risk, notification fatigue, abuse potential

#### Option C: Request-Based
- Users request `@everyone` broadcast via form
- Admins approve and send on their behalf
- **Pros**: Quality control, prevents spam, appropriate use only
- **Cons**: Overhead on team, slow turnaround, discourages use

### Notification Preferences
Should users be able to opt out of `@everyone` broadcasts?
- **Yes**: User control, prevents fatigue
- **No**: Ensures important updates reach everyone

If yes, what's the default?
- Opt-in: Users must enable broadcast notifications (lower reach)
- Opt-out: Users receive by default but can disable (higher reach)

### Related Questions
- Should there be a "Preview Reach" before sending? ("This will notify 1,247 users")
- Should broadcasts be logged/audited?
- Should there be a cooldown period? (max 1 per day across all users)

### Recommendation
**Option A: Prompt Reviews Team Only for MVP**
- Start restrictive, expand based on need
- Track requests for community broadcasts
- Phase 2: Consider approved user broadcasts (community events, AMAs)
- User preference: Opt-out (enabled by default, can disable in settings)

**Decision Required**: Broadcast permissions and frequency limits?

Only Admin (Me) - Chris B
---

## 6. Email Notifications Strategy
 
 Phase 2 - Chris B
### The Question
Should email notifications be implemented at launch (MVP) or deferred to Phase 2?

### Context
Email notifications can drive engagement but add complexity and costs (email service fees, deliverability management).

### Notification Types

#### 1. @Mention Notifications
- "Alex mentioned you in a post"
- **Value**: High - direct action expected
- **Frequency**: Variable (depends on activity)

#### 2. Reply Notifications
- "Someone replied to your post"
- **Value**: Medium - encourages return visit
- **Frequency**: Variable

#### 3. Digest Notifications
- "Weekly community highlights: 3 new posts in Strategy"
- **Value**: Low-Medium - passive engagement
- **Frequency**: Fixed (weekly)

#### 4. Broadcast Notifications
- "@everyone from Prompt Reviews Team: New feature launched"
- **Value**: High - important updates
- **Frequency**: Low (1-2 per month)

### Options

#### Option A: In-App Only (MVP)
- All notifications shown only in PromptReviews dashboard
- Badge count on community nav link
- Notification bell icon
- **Pros**: No email costs, simpler, no deliverability issues
- **Cons**: Requires login to see, lower engagement, easy to miss

#### Option B: Email for Mentions + Broadcasts (MVP)
- Send email for @mentions and @everyone broadcasts
- All other notifications in-app only
- **Pros**: High-value notifications via email, manageable volume
- **Cons**: Email infrastructure needed, opt-out management

#### Option C: Email for All (Phase 2)
- Full email notification suite
- Digest, mentions, replies, broadcasts
- User preferences to customize
- **Pros**: Maximum engagement, user choice
- **Cons**: High cost, spam risk, complex preferences

### Email Frequency Controls
If implementing email notifications:
- **Instant**: Send immediately (for mentions, broadcasts)
- **Digest**: Batch notifications (daily or weekly summary)
- **Smart Digest**: Only send if unread notifications exist

### Related Questions
- Should email notifications include full content or just link to community?
- Should there be a global "Pause all emails" option?
- How do we handle bounces and unsubscribes?

### Recommendation
**Option A for MVP, Option B for Phase 2**
- MVP: In-app notifications only (simple, fast to ship)
- Track engagement: if low, plan email notifications for Phase 2
- Phase 2: Add email for mentions + broadcasts (high-value only)
- Phase 3: Add full email suite with digest options (if justified by data)

**Decision Required**: Email notification scope for MVP?

---

## 7. Content Visibility & Privacy Controls

Nothing hidden - Chris B
### The Question
Should there be any privacy controls beyond "authenticated users can see everything"?

### Context
Current design: All authenticated users see all posts. No private posts, no hidden channels.

### Edge Cases

#### Case 1: Sensitive Business Information
**Example**: "Our new pricing strategy is to undercut competitors by 20%"
**Risk**: Competitors see pricing strategy, reduces competitive advantage
**Current**: User shouldn't post this (community guidelines)
**Alternative**: Private posts or channels?

#### Case 2: Criticism of Prompt Reviews
**Example**: "The new widget is buggy and losing us reviews"
**Risk**: Public criticism may deter prospects, creates negative perception
**Current**: Allowed (constructive feedback is valuable)
**Alternative**: Private feedback channel?

#### Case 3: Personal Account Information
**Example**: "My account was charged twice this month"
**Risk**: Exposes billing issues publicly, privacy concerns
**Current**: Should contact support, not post publicly
**Alternative**: Auto-detect sensitive topics and warn user?

### Options

#### Option A: Fully Public (Current Design)
- All posts visible to all authenticated users
- No privacy controls beyond account authentication
- **Pros**: Simple, transparent, maximum engagement
- **Cons**: No privacy for sensitive topics, potential misuse

#### Option B: Private Channels (Admin-Only)
- Add "Feedback" channel (visible to Prompt Reviews team only)
- Users can choose public or private when posting
- **Pros**: Safe space for criticism, billing issues, sensitive feedback
- **Cons**: Fragments community, reduces transparency

#### Option C: Ephemeral Posts (24-hour deletion)
- Users can mark posts as "Temporary" (auto-delete after 24h)
- Useful for time-sensitive questions, quick polls
- **Pros**: Reduces clutter, encourages spontaneous posts
- **Cons**: Loses valuable content, archives incomplete

#### Option D: Content Warnings
- Users can mark posts as "Sensitive" (business info, criticism, pricing)
- Warning shown before viewing: "This post contains sensitive business information"
- **Pros**: User control, informed consent, transparency
- **Cons**: Reduces engagement, overused warning becomes noise

### Related Questions
- Should we auto-detect and warn about sensitive keywords? (pricing, revenue, customer names)
- Should there be a "Report as Inappropriate" option for privacy violations?
- Should account owners be able to delete mentions of their business by others?

For future is good idea, not yet - Chris B

### Recommendation
**Option A: Fully Public + Clear Guidelines**
- Keep it simple for MVP
- Community guidelines explicitly state: "Don't share sensitive business info, pricing strategies, or customer names"
- Add FAQ: "Is the community public?" → "Yes, all posts are visible to all PromptReviews customers"
- Phase 2: Consider private feedback channel if needed (based on feedback)

**Decision Required**: Privacy controls beyond authentication?

---

## 8. Launch Rollout Strategy

### The Question
How do we roll out the community feature to customers?

I only have 5 customers - I will tell them - Chris B
### Options

#### Option A: Full Launch (All Customers at Once)
- Flip feature flag, enable for all customers
- Announcement email, in-app banner
- **Pros**: Maximum impact, simple, no favoritism
- **Cons**: Risky, hard to control, support overhead if issues

#### Option B: Phased Rollout (Cohorts)
- Week 1: Internal team + 10 pilot customers
- Week 2: 100 customers (mix of plans)
- Week 3: 500 customers
- Week 4: All customers
- **Pros**: Controlled, collect feedback, iterate before full launch
- **Cons**: Slower, unequal access, requires cohort selection

#### Option C: Opt-In Beta
- Announce beta, customers request access
- Approve in batches (first 100, then 500, then all)
- **Pros**: Self-selected engaged users, controlled growth, feedback from enthusiasts
- **Cons**: Selection bias, slower adoption, manual work

#### Option D: Plan-Based Rollout
- Launch for Maven plan first (highest tier)
- Then Builder plan
- Then Grower plan
- **Pros**: Premium feature perception, upsell opportunity, controlled growth
- **Cons**: Alienates lower tiers, reduces community diversity, feels unfair

### Success Metrics for Rollout

| Metric | Target |
|--------|--------|
| % of users who visit community in first week | 30% |
| % of visitors who post or comment | 15% |
| Posts created in first week | 100+ |
| Unique contributors | 50+ |
| Moderation incidents | <5 |
| Support tickets related to community | <20 |

### Related Questions
- Should we seed the community with Prompt Reviews team posts before launch? (sample content)
- Should we have a "Welcome to the Community" onboarding flow?
- Should we send weekly digest emails during rollout? ("Check out these posts from the community")

### Recommendation
**Option B: Phased Rollout**
- Week 1: Internal team + 10 pilot customers (diverse industries, active users)
- Week 2: 100 customers (invite via email, first-come-first-served or selected for diversity)
- Week 3: All customers (full launch)
- Seed community with 5-10 Prompt Reviews team posts before pilot (examples, conversation starters)
- Onboarding: Guidelines modal + "Create your first post" nudge
- Weekly digest email during pilot (highlight top posts)

**Decision Required**: Rollout strategy and timeline?

---

## Summary of Decisions Needed

| # | Decision | Options | Recommended | Priority |
|---|----------|---------|-------------|----------|
| 1 | Monthly summary privacy | Public, Private, Anonymous | Private (opt-in) | High |
| 2 | Channel strategy | Generic, Industry-specific, Controlled | Controlled expansion | Medium |
| 3 | Moderation responsibility | Team only, Community mods, Hybrid | Team only (MVP) | High |
| 4 | Username mutability | Permanent, Editable, Display override | Display override | Low |
| 5 | @everyone broadcasts | Team only, Account owners, Request-based | Team only (MVP) | Medium |
| 6 | Email notifications | In-app only, Mentions+Broadcasts, All | In-app only (MVP) | Medium |
| 7 | Privacy controls | Fully public, Private channels, Content warnings | Fully public + guidelines | Low |
| 8 | Launch rollout | Full launch, Phased, Opt-in, Plan-based | Phased rollout | High |

---

## Next Steps

1. **Schedule Stakeholder Review**: Review this document with product owner, founders, and key stakeholders
2. **Make Decisions**: For each question, select an option and document rationale
3. **Update Roadmap**: Incorporate decisions into ROADMAP-v2.md
4. **Create Implementation Plan**: Break decisions into actionable tasks for each agent
5. **Begin Phase 1**: Data agent creates migrations based on finalized decisions

---

**Document Owner**: Product Spec Agent
**Last Updated**: 2025-10-06
**Status**: Awaiting Decisions

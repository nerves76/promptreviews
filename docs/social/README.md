# Multi-Platform Social Posting Documentation

Welcome! This directory contains all documentation for the Multi-Platform Social Posting project.

---

## 📚 Documentation Index

### For New Agents (Start Here)
1. **[AGENT_HANDOFF.md](./AGENT_HANDOFF.md)** - Complete onboarding guide
   - Quick start and essential reading
   - Architecture overview
   - Agent roles and responsibilities
   - Development environment setup
   - Common pitfalls to avoid
   - Testing strategy
   - **👉 Start here if you're picking up this project!**

2. **[Master Plan](../../MULTI_PLATFORM_POSTING_PLAN.md)** - Strategic overview
   - Project goals and principles
   - Architecture design
   - Workstreams and milestones
   - AI agent coordination playbook
   - Risks and mitigations

### Daily Work References
3. **[TASKBOARD.md](./TASKBOARD.md)** - Active task tracking
   - Current work items organized by stage
   - Agent assignments and reviewers
   - Immediate next steps by role
   - Workstream summary dashboard
   - **👉 Check this daily for your tasks**

4. **[posting-notes.md](./posting-notes.md)** - Technical knowledge base
   - Platform-specific API notes (Bluesky, Twitter/X, etc.)
   - Architectural decisions log
   - Security guidelines
   - Testing notes
   - Known issues and workarounds
   - Useful commands

5. **[Status Tracker](../status/social-composer.md)** - Project health
   - Overall progress
   - Feature flag status
   - Deployment history
   - Active monitoring and metrics
   - Risk tracking
   - Pre-launch checklist

### Templates
6. **[taskboard-template.md](./taskboard-template.md)** - Board structure reference
   - Column definitions
   - Card template
   - Suggested swimlanes
   - Cadence tips

---

## 🚀 Quick Navigation by Role

### Infrastructure Agent
**Your Docs:**
1. [TASKBOARD.md](./TASKBOARD.md) → "Immediate Next Steps - Infrastructure Agent"
2. [AGENT_HANDOFF.md](./AGENT_HANDOFF.md) → "Infrastructure Agent" section
3. [posting-notes.md](./posting-notes.md) → "Architectural Decisions"

**Your First Tasks:**
- INF-1: Connection Registry Schema
- INF-2: Adapter Registry Service
- API-1: Connection Management Endpoints

### Adapter Agent
**Your Docs:**
1. [TASKBOARD.md](./TASKBOARD.md) → "Immediate Next Steps - Adapter Agent"
2. [AGENT_HANDOFF.md](./AGENT_HANDOFF.md) → "Adapter Agent" section
3. [posting-notes.md](./posting-notes.md) → "Platform-Specific Notes"

**Your First Tasks:**
- ADAPT-1: Bluesky Adapter Implementation
- Research `@atproto/api` authentication

### UI/UX Agent
**Your Docs:**
1. [TASKBOARD.md](./TASKBOARD.md) → "Immediate Next Steps - UI/UX Agent"
2. [AGENT_HANDOFF.md](./AGENT_HANDOFF.md) → "UI/UX Agent" section
3. [Master Plan](../../MULTI_PLATFORM_POSTING_PLAN.md) → "Standalone Multi-Platform Composer"

**Your First Tasks:**
- SPEC-2: Composer UX Requirements
- Review existing dashboard patterns

### Product Strategist Agent
**Your Docs:**
1. [TASKBOARD.md](./TASKBOARD.md) → "Immediate Next Steps - Product Strategist"
2. [AGENT_HANDOFF.md](./AGENT_HANDOFF.md) → "Product Strategist Agent" section
3. [Status Tracker](../status/social-composer.md) → Manage this document

**Your First Tasks:**
- SPEC-1: Plan Tier Matrix & Pricing
- Create feature flag strategy
- Set up status tracking cadence

### QA Agent
**Your Docs:**
1. [TASKBOARD.md](./TASKBOARD.md) → "Immediate Next Steps - QA Agent"
2. [AGENT_HANDOFF.md](./AGENT_HANDOFF.md) → "QA & Reliability Agent" section
3. [posting-notes.md](./posting-notes.md) → "Testing Notes"

**Your First Tasks:**
- Build Google Business regression suite
- Document test scenarios
- Review all PRs for quality gates

---

## 🎯 Project Overview

### What We're Building
A multi-platform social posting system that lets users compose once and publish to:
- Google Business Profile (existing, untouchable)
- Bluesky (Phase 1 - MVP)
- Twitter/X (Phase 2)
- Slack (Phase 2)

### Why Bluesky First?
- No OAuth approval delays (uses app passwords)
- Simpler authentication flow
- Low risk validation of architecture
- Can proceed immediately

### Core Principles
1. **Never break Google Business posting** (sacred rule)
2. **Graceful degradation** (platform failures don't cascade)
3. **Feature-flagged rollout** (safe, gradual launches)
4. **Account-scoped security** (RLS everywhere)

---

## 📋 Document Update Cadence

### Daily
- **[TASKBOARD.md](./TASKBOARD.md)** - Update task status, post blockers in card comments

### Weekly
- **[Status Tracker](../status/social-composer.md)** - Add weekly status summary
- **Team Review** - Async in Task Board comments, led by Product Strategist

### As Needed
- **[posting-notes.md](./posting-notes.md)** - Add API quirks, decisions, learnings
- **[AGENT_HANDOFF.md](./AGENT_HANDOFF.md)** - Update if process changes
- **[Master Plan](../../MULTI_PLATFORM_POSTING_PLAN.md)** - Update if scope/architecture changes

### Pre-Launch
- **All docs** - Comprehensive review to ensure accuracy
- **Status Tracker** - Complete pre-launch checklist
- **AGENT_HANDOFF.md** - Add post-launch learnings

---

## 🔗 External Resources

### APIs & Libraries
- **Bluesky:** https://atproto.com/
- **Twitter/X:** https://developer.twitter.com/
- **Slack:** https://api.slack.com/

### Codebase Context
- **[CLAUDE.md](../../CLAUDE.md)** - Project-wide conventions and context
- **Tech Stack:** Next.js 15, Supabase, Prisma, TypeScript

### Tools
- **Supabase:** https://supabase.com/docs
- **Prisma:** https://www.prisma.io/docs
- **Next.js:** https://nextjs.org/docs

---

## 🆘 Getting Help

### When Blocked
1. Check if your question is answered in these docs
2. Post blocker in Task Board card comments
3. Tag relevant agent for coordination
4. Document decision/resolution in [posting-notes.md](./posting-notes.md)

### Common Questions

**Q: Where do I start?**
A: Read [AGENT_HANDOFF.md](./AGENT_HANDOFF.md) first (30 min), then find your role's tasks in [TASKBOARD.md](./TASKBOARD.md).

**Q: Can I modify Google Business posting code?**
A: No! Existing Google flows are isolated until the new system is proven. See "Never break Google Business posting" in [AGENT_HANDOFF.md](./AGENT_HANDOFF.md).

**Q: How do I track my progress?**
A: Update [TASKBOARD.md](./TASKBOARD.md) daily with task status and blockers.

**Q: Where do I document API quirks?**
A: Add to [posting-notes.md](./posting-notes.md) under "Platform-Specific Notes".

**Q: How do I know if my code is ready to merge?**
A: Follow the checklist in [AGENT_HANDOFF.md](./AGENT_HANDOFF.md) → "Before Submitting for Review" + get QA Agent approval.

**Q: What if I find a security issue?**
A: Disable feature flag immediately, notify all agents, document in [Status Tracker](../status/social-composer.md) → "Known Issues".

---

## ✅ Success Metrics

### Phase 1 (Bluesky MVP)
- [ ] Can connect Bluesky account
- [ ] Can post to Bluesky + Google simultaneously
- [ ] Google Business posting has 0 regressions
- [ ] Failures don't cascade between platforms
- [ ] Clear error messages guide users

### Long-term
- 80%+ of users connect at least one platform
- >90% posting success rate across all platforms
- <5 support tickets per week related to posting
- User satisfaction >4/5

---

## 📝 Contributing to Docs

### When to Update Docs
- **Discovered API behavior:** Update [posting-notes.md](./posting-notes.md)
- **Made architectural decision:** Log it in [posting-notes.md](./posting-notes.md) → "Decision Log"
- **Completed milestone:** Update [Status Tracker](../status/social-composer.md) and [TASKBOARD.md](./TASKBOARD.md)
- **Changed process:** Update [AGENT_HANDOFF.md](./AGENT_HANDOFF.md)
- **Scope change:** Update [Master Plan](../../MULTI_PLATFORM_POSTING_PLAN.md)

### Documentation Standards
- Use clear, concise language
- Add code examples for complex concepts
- Link to related docs (help future agents navigate)
- Include timestamps/dates for chronological entries
- Keep tables and checklists up to date

---

## 🎉 You're All Set!

Everything you need is in this directory. Pick your role, read the handoff doc, and dive into the task board. Let's build something great!

**Questions?** Post in [TASKBOARD.md](./TASKBOARD.md) card comments.

**Feedback on these docs?** Update this README to help the next agent!

---

**Document Index Last Updated:** 2025-10-18
**Project Status:** Foundation phase (0% complete, ready to start)
**Next Review:** After first milestone (INF-1 complete)

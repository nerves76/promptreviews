# Community Feature Status Brief

_Last updated: 2025-10-06_

## Current Phase
- Phase: Phase 0 - Prep (Project Kickoff)
- Feature flags: `community=false`, `community_realtime=false`, `community_digests=false`, `community_broadcasts=false`, `community_sharing=false`

## Highlights
- Project initiated with comprehensive roadmap reviewed
- Multi-agent workflow established per section 11 of master plan
- Documentation structure being set up in `/docs/community`

## Risks / Blockers
- Need to audit existing account-switcher implementation to ensure compatibility
- Must verify Supabase migration workflow aligns with existing DB structure
- Confirm existing `profiles` table schema before adding community columns

## Upcoming Milestones
- Complete Phase 0 prep: PRD validation, UI mockups, success metrics confirmation
- Data model validation against existing schema
- Migration plan with rollback scripts

## Open Questions
- Do we need business-specific private channels in near term?
- Should monthly summaries post in business-specific channels vs global ones?
- Do mentions require email notifications at launch?
- What limits or approvals should apply to `@everyone` broadcasts?
- Should broadcast email opt-out live at user level, account level, or both?

## Handoff Notes
- Owner handing off: Initial setup (Claude)
- Next agent to pick up: Product Spec Agent, Data & RLS Agent (parallel)
- Required follow-up before next handoff: PRD validation, existing schema audit, account-switcher integration plan

# Community Feature Regression Checklist

Quick run-through before expanding community access or shipping major updates. Copy into release issue and check off in PR/QA notes.

## Core Flows
- [ ] Switch between at least two accounts; confirm channel list refreshes correctly.
- [ ] Create, edit, and soft-delete a post; verify only visible in active account.
- [ ] Add comment and reaction; confirm realtime update reaches second session.
- [ ] Mention a teammate; ensure notification badge increments (if enabled).
- [ ] Verify guidelines modal blocks posting until checkbox ticked.

## Phase 2 Items (run when enabled)
- [ ] Monthly digest post appears with correct metrics and share button.
- [ ] Weekly digest (if enabled) schedules and posts on correct day.
- [ ] Trigger `@everyone` broadcast; confirm in-app badge and email only for opted-in users.
- [ ] Save/pin a post; view in saved panel.

## Safety Nets
- [ ] Feature flags (`community`, `community_realtime`, `community_digests`, `community_broadcasts`, `community_sharing`) documented with intended values.
- [ ] Rollback SQL or toggle instructions attached to release notes.

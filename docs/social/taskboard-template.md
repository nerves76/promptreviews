# Social Posting Task Board Template

Use this template to spin up a shared board (Notion, Linear, GitHub Projects, etc.). Each column corresponds to a stage; cards should include owner, reviewers, feature flag, QA checklist, and links to relevant docs/PRs.

## Columns
1. **Backlog**
   - Untriaged ideas & future platform integrations (e.g., Slack, Discord, Circle).
   - Include quick notes on blockers (API access, legal review).

2. **Ready for Spec**
   - Items agreed for near-term work but needing UX/API definition.
   - Owner: Product Strategist. Deliverables: acceptance criteria, flag name, plan tier.

3. **Spec Complete**
   - Approved by Product Strategist + at least one downstream implementer.
   - Cards move to "In Progress" only once necessary design assets/migrations are outlined.

4. **In Progress**
   - Active development tasks. Each card tracks:
     - Assigned agent(s)
     - Code/Doc paths being modified
     - Test plan
     - Feature flag (if any)

5. **Ready for QA**
   - Implementation done; waiting on QA & peer review.
   - Attach links to PRs, migration scripts, manual test notes.

6. **QA/Review**
   - QA Agent executes regression checklist (Google + new platform coverage).
   - Reviewer signs off (non-author). Capture outcomes in card comments.

7. **Ready to Launch**
   - All reviews/tests passed. Awaiting flag flip or deploy window.
   - Include launch checklist link, monitoring plan, and comms notes.

8. **Launched**
   - Work deployed or flag enabled. Record date/time + monitoring results.
   - Document follow-up actions (bug fixes, adoption metrics).

9. **Archived**
   - Completed long ago or superseded. Keep for historical context.

## Card Template
```
Title: [Short descriptive name]
Feature Flag: feature_social_composer (example)
Plan Tier: Core / Upgrade / TBD
Owner: [Agent Name]
Reviewers: [Agent Names]
Docs: [links to plan, design, API specs]
Code Areas: [paths]
Test Plan:
  - Unit: ...
  - Integration: ...
  - Regression: ...
Dependencies:
  - [ ] Migration merged
  - [ ] Token approval from Bluesky
Rollout:
  - Toggle flag in ...
  - Monitor ...
Notes:
  - Open questions
```

## Suggested Swimlanes
- **Workstream**: Discovery, Infrastructure, Composer UI, Adapters, QA/Hardening.
- **Platform**: Google, Bluesky, Slack, etc. (helps keep Google-specific tasks visible).

## Cadence Tips
- Run daily async standups in card comments (status, blockers, next steps).
- Hold a weekly review to move cards out of "In Progress" if no meaningful updates in 5 days.
- After launch, schedule a brief retro; capture insights in the card before moving to "Archived".

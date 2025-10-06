# Community Feature Implementation Docs

This directory contains documentation and artifacts for the Slack-like community feature implementation.

## Directory Structure

- **`/data`** - Database migrations, RLS policies, ER diagrams (Data Agent)
- **`/backend`** - API endpoints, RPC functions, Edge functions (Backend Agent)
- **`/frontend`** - Components, pages, hooks, integration guides (Frontend Agent)
- **`/automation`** - Cron jobs, summary generation, digest workflows (Automation Agent)
- **`/qa`** - Test plans, test data, regression suites (QA Agent)
- **`/handoffs`** - Agent handoff documentation and status

## Agent Workflow

```
Product Spec → Data Agent → Backend Agent → Frontend Agent → Automation Agent → QA Agent → Launch
                    ↓           ↓               ↓                    ↓              ↓
                handoffs/   handoffs/       handoffs/           handoffs/      handoffs/
```

## Quick Links

- [Original Feature Plan](../../slack-like-social%20feature.md)
- [Architecture Decisions](./ARCHITECTURE.md)
- [Current Status](./handoffs/STATUS.md)

## Phase 1 MVP Scope

- ✅ Database schema with RLS
- ✅ Core posting/commenting/reactions
- ✅ Account isolation
- ✅ Username generation
- ✅ Community guidelines modal
- ✅ Basic UI with business logo avatars
- ✅ Four default channels: General, Strategy, Google-Business, Feature-Requests

## Phase 2 (Post-MVP)

- Monthly/weekly summary automation
- Digest sharing
- Pinned/saved posts
- In-app notifications
- Email digests

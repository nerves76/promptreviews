# Google Business Scheduling Implementation Plan

## Overview

This document outlines the architecture and implementation steps required to add scheduled Google Business posts and photo uploads to PromptReviews. The system will let users compose "What's New" posts or general photos, choose target business locations, and select a future date for publication. A daily batch processor will publish or upload media to Google Business Profile while respecting quota limits.

## Goals

- Allow users to schedule Google Business "What's New" posts for multiple locations.
- Allow users to schedule general photo uploads (with captions) for multiple locations.
- Provide a queue view to manage upcoming, past, and failed scheduled tasks.
- Respect Google Business API rate limits (1 request/minute) while remaining simple for a low-volume customer base.
- Automatically manage Supabase storage to avoid indefinite growth.

## Key Constraints & Decisions

- **Granularity**: Scheduling is by date (no time-of-day). All jobs run in a daily batch window (default ~6 AM Pacific, configurable later).
- **Multi-location**: A single scheduled job may target many locations; the processor handles them sequentially.
- **Post Types**: Phase 1 limits to "What's New" posts and general photos. Other post types (Events, Offers, etc.) can be added later.
- **Media Handling**: Use existing compressed uploader. Media stored in Supabase bucket under `social-posts/scheduled/` and removed 7 days after completion/cancel.
- **Recurring schedules**: Explicitly out of scope.

## Data Model Changes

### 1. `google_business_scheduled_posts`

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID | Primary key |
| account_id | UUID | References `accounts` |
| user_id | UUID | References `auth.users` |
| post_kind | `post` \| `photo` | Distinguish between scheduled post vs photo upload |
| post_type | text | e.g., `WHATS_NEW`; nullable for photo jobs |
| content | JSONB | Rich text, CTA, AI metadata, etc. Empty for photo-only |
| caption | text | Optional caption/description for photo uploads |
| scheduled_date | date | The day the job should run |
| timezone | text | Olson timezone string from user (e.g., `America/Los_Angeles`) |
| selected_locations | JSONB | Array of `{ id, name }` used to render queue |
| media_paths | JSONB | Array of stored file paths with metadata |
| status | enum | `pending` (default), `processing`, `completed`, `partial_success`, `failed`, `cancelled` |
| published_at | timestamptz | When processing finished successfully |
| error_log | JSONB | Structured errors for debugging |
| created_at / updated_at | timestamptz | Standard timestamps |

**RLS**: align with existing social posting rules (users can only access their account data). Update Supabase policies + Prisma (if applicable).

### 2. `google_business_scheduled_post_results`

Tracks per-location outcomes to support partial successes.

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID | Primary key |
| scheduled_post_id | UUID | FK to `google_business_scheduled_posts` |
| location_id | text | GBP location id |
| location_name | text | Cached name |
| status | enum | `pending`, `processing`, `success`, `failed` |
| published_at | timestamptz | When the action succeeded |
| error_message | text | Google API error |
| google_resource_id | text | Google post/media id for auditing |
| created_at / updated_at | timestamptz | |

RLS ensures rows are only visible per account.

### 3. Media Metadata

Each entry in `media_paths` should capture:

```json
{
  "path": "social-posts/scheduled/<postId>/...",
  "size": 123456,
  "mime": "image/jpeg",
  "checksum": "...",
  "originalName": "..."
}
```

This supports reporting, clean-up, and future quotas.

## Backend Changes

### 1. Upload Handling

- Reuse `/api/social-posting/upload-image` to upload immediately when scheduling, storing files under `social-posts/scheduled/<postId>/`.
- Enforce compressed output using existing uploader. Reject files above 10 MB post-compression and block more than Google allows (currently 10 MB per image).

### 2. Scheduling API Extensions

- **POST `/api/social-posting/posts`**
  - New payload fields: `publishMode`, `scheduledDate`, `timezone`, `postKind`.
  - When `publishMode === 'scheduled'`:
    - Validate `scheduledDate` is today or future.
    - Ensure at least one location selected.
    - Persist the scheduled post + results rows.
    - Return `{ success: true, scheduledId }`.
  - When `publishMode === 'now'` keep existing behavior.

- **GET `/api/social-posting/scheduled`**
  - Query scheduled posts grouped by status (upcoming, past, failed) with pagination.

- **PATCH `/api/social-posting/scheduled/:id`**
  - Allow editing content, caption, locations, or scheduledDate while status `pending`.

- **DELETE `/api/social-posting/scheduled/:id`**
  - Mark status `cancelled`, clean up queued result entries, and enqueue media deletion in nightly cleanup.

### 3. Daily Processor

- New endpoint: `/api/cron/process-scheduled-posts`
  - Protected by Cron secret header.
  - Runs once per day (e.g., 13:00 UTC ≈ 6:00 AM PT).
  - Steps:
    1. Select `pending` posts where `scheduled_date = today`.
    2. Mark each job `processing` and record start timestamp.
    3. For each selected location:
       - Update result row to `processing`.
       - For `post_kind = 'post'`: call existing publish flow (reuse GoogleBusinessProfileClient `createPost`).
       - For `post_kind = 'photo'`: call photo upload helper (new function wrapping GBP media endpoint) with caption.
       - Respect rate limit by sequential processing; optional `await sleep(65000)` between locations if quota is near limit.
       - Mark result success/failure, storing Google resource id or error message.
    4. Summarize job status: `completed` if all success, `partial_success` if mixed, `failed` if all failed.
    5. For failures, send an alert email/notification (future optional) and leave job visible in queue.

- Logging: use existing logging infra to record each publish attempt.

### 4. Nightly Cleanup

- Endpoint `/api/cron/cleanup-scheduled-media`
  - Delete Supabase storage items for jobs where status ∈ {`completed`, `cancelled`, `failed`} and `published_at` or `updated_at` older than 7 days.
  - Cull stale `processing` jobs older than 48h (set to failed with message) to avoid hang states.

## Frontend Changes

### 1. Dashboard Tab

Add a "Scheduling" tab to `src/app/(app)/dashboard/google-business/page.tsx`:

- **Schedule Content Card**
  - Toggle between `Publish Post` and `Upload Photo`.
  - Post form: reuse existing composer limited to "What's New" fields.
  - Photo form: require at least one image, optional caption field, hide CTA controls.
  - Date picker (no time) defaulting to browser timezone (persist selection locally or in user profile).
  - Multi-location selector (existing component).
  - Display upcoming quota warning (“We publish in our morning batch and may stagger locations to respect Google’s 1/minute limit”).

- **Scheduled Queue Card**
  - Table columns: Date, Type (Post/Photo), Locations count, Status, Actions.
  - Actions: Edit (if pending and date ≥ tomorrow), Cancel, View Details (per-location outcome).
  - Separate sections for Upcoming vs Past/Failed (last 30 days).

### 2. State Sync

- When scheduling, clear form state similar to immediate publishing.
- Update local caches or SWR hooks to refresh queue after create/edit/cancel.

## Testing Strategy

1. **Unit Tests**
   - Validate scheduling payload parsing.
   - Ensure cron processor handles mixed success/failure and updates statuses correctly.
   - Confirm cleanup script removes media and resets stuck jobs.

2. **Integration Tests (Playwright/Mocked API)**
   - Schedule post with multiple locations → run mocked cron → verify published statuses.
   - Schedule photo upload → ensure captions and Google media IDs recorded.

3. **Manual QA**
   - Smoke test on staging with demo mode enabled.
   - Verify storage cleanup after 7 days (or shorter window for test).

## Timeline & Milestones

1. **Data layer migrations & types** – 1 day
2. **Backend APIs + cron processor** – 2–3 days
3. **Frontend scheduling tab** – 2 days
4. **Cleanup job & final polish** – 1 day
5. **Testing & documentation** – 1 day

Total: ~7–8 developer days including QA.

## Future Enhancements

- Time-of-day scheduling with finer cron granularity.
- Support additional GBP post types (Events, Offers).
- Add recurring schedules.
- Introduce notifications on failure/success.
- Expand to other social platforms once adapters support scheduling.

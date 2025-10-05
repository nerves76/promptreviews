# Social Share Feature – Implementation Plan

## Overview
Add social media sharing capability for reviews, allowing users to share reviews across multiple platforms with auto-generated images and pre-populated share text.

## Coordination Charter
- **Program Lead (Human)** – final approvals, privacy sign-off.
- **Research Agent** – maps existing review data, style settings, consent flags.
- **Image Generation Agent** – owns quote card templates and storage pipeline.
- **Share Tracking Agent** – designs schema, APIs, analytics views.
- **UI/UX Agent** – implements share modal, history UI, platform handlers.
- **Security & Privacy Agent** – validates consent logic, data retention, sharing scopes.
- **QA & Release Agent** – orchestrates automated/manual tests, feature flag rollout.
- **Code Review Agent** – enforces review checklist, coordinates with human reviewer when required.

Each phase below lists the primary agent and supporting reviewers. Every deliverable must pass code review (Code Review Agent + Security/Privacy when relevant) and QA sign-off before promotion.

## Features

### Core Functionality
- Share button on each review
- Modal with social platform icons
- Share to: Facebook, LinkedIn, Bluesky, Reddit, X (Twitter), Pinterest, Email, Text/SMS
- Copy link to clipboard option
- Share CTA link defaults to the customer’s business website (editable in app)

### Image Generation
**Priority Logic:**
1. Use existing photo from photo + testimonial feature (if available)
2. Generate quote card image (if no photo exists)

**Quote Card Specifications:**
- Review excerpt: 150-200 characters max (truncate with "..." if longer)
- 5-star rating visualization
- Product/prompt name
- Branding (subtle, corner placement)
- **Style based on user's Prompt Page settings:**
  - Background color/gradient
  - Brand colors
  - Font choices
  - Logo/branding elements
  - Star color

### Share Text Template
```
[Product/Prompt Name]: ⭐⭐⭐⭐⭐
"[Review excerpt]"
[Reviewer name if permitted]
via @promptreviews
[Share CTA URL (defaults to business site, optional override)]
```

**Platform-specific constraints:**
- **X (Twitter):** ~280 characters including URL; account for shortened link length (~23 characters).
- **Bluesky:** ~300 characters; no URL shortening.
- **LinkedIn:** 700 characters recommended for shares.
- **Facebook:** soft limit ~63k characters, but keep under 280 for readability.
- **Reddit:** 300 characters for title/preview; description pulled from CTA page.
- **Email:** subject ≤78 characters; body should include plaintext link + optional HTML when available.
- **SMS/Text:** target ≤160 characters; fallback to copy-link flow where Web Share API unsupported.
- UI must surface character countdowns and platform-specific truncation previews.

### Share Tracking
**What to track:**
- Platform button clicked (Facebook, LinkedIn, X, Bluesky, Reddit, Pinterest, Email, Text, Copy Link)
- Timestamp of click
- Note: Tracking clicks, not verified shares (may include false positives if user doesn't complete share)

**UI on Reviews Page:**
- Button displays "Never shared" when no shares recorded
- Changes to "Shared history" after first share
- Click reveals popover/dropdown with:
  - Platform icons + timestamps
  - Delete option per entry (to remove false positives)

**Analytics Page:**
- "Reviews Shared" stat showing total share events
- Breakdown by platform (optional)
- Most-shared reviews (optional)

## Implementation Phases

### Phase 0: Coordination & Discovery *(Research Agent · Reviewer: Security & Privacy Agent)*
- [ ] Inventory review consent rules, existing reviewer metadata, Prompt Page style settings.
- [ ] Document current review routes, auth requirements, and SEO/meta baselines.
- [ ] Draft rollout plan (feature flag, staged release cohorts, success metrics).
- [ ] Produce architecture brief outlining dependencies for downstream agents.
- **Code review:** Research summary reviewed for data-privacy implications; QA Agent signs off that requirements are testable.

### Phase 1: Share CTA Link & Data Audit *(Research Agent & Share Tracking Agent · Reviewer: Code Review Agent · Support: Security & Privacy Agent)*
**Tasks:**
- [ ] Confirm source of customer business URLs in Supabase; define fallback hierarchy.
- [ ] Add optional override fields (per account/prompt) with validation and UX for editing the CTA link.
- [ ] Document consent rules for reviewer attribution (names, photos) and bake them into share text/image requirements.
- [ ] Update share text builder to inject the default or overridden CTA link; expose preview to users.
- [ ] Capture edge cases (missing website, expired domains) and logging requirements in `/docs/architecture/social-share.md`.
- [ ] Design link builder to support future Prompt Reviews directory URLs (e.g., `https://newdomain/{business}/reviews/{reviewId}`) so we can swap defaults later without reworking the UI.
- **Code review checklist:** data access & validation verified, consent logic approved by Security & Privacy Agent, QA Agent runs override/edit scenarios.

### Phase 2: Image Generation *(Image Generation Agent · Reviewer: Code Review Agent · Support: Security & Privacy Agent, QA Agent)*
**Tasks:**
- [ ] Finalize quote card design spec aligned with Prompt Page branding.
- [ ] Implement generation pipeline (tech choice doc + proof of concept).
- [ ] Integrate Prompt Page style variables, photo extraction, text truncation safeguards.
- [ ] Store/cdn images (define bucket, RLS policies, cache rules).
- [ ] Implement fallback handling (missing branding, failed generation).
- [ ] Write automated tests for selection priority (photo vs generated card).
- **Code review:** verify storage security, performance, and branding fidelity; QA Agent validates rendered outputs on staging.

### Phase 3: Share Tracking System *(Share Tracking Agent · Reviewer: Code Review Agent · Support: Analytics Agent, Security & Privacy Agent)*
**Tasks:**
- [ ] Finalize share events schema (with retention policy + consent considerations).
- [ ] Build API endpoints (POST/GET/DELETE) with Supabase RLS and unit tests.
- [ ] Implement event logging middleware that records before share attempt and handles retries.
- [ ] Provide analytics aggregations (per review, per platform, per time range).
- [ ] Document API contract for UI/analytics teams.
- **Code review:** verify RLS, data retention, GDPR/privacy expectations; QA Agent runs API contract tests.

### Phase 4: Share UI & Functionality *(UI/UX Agent · Reviewer: Code Review Agent · Support: Share Tracking Agent, QA Agent)*
**Tasks:**
- [ ] Implement share button + modal (accessible, keyboard navigable, mobile friendly).
- [ ] Build share history popover with delete controls linked to API.
- [ ] Wire platform handlers, pre-populated text respecting character limits, reviewer consent.
- [ ] Enforce platform-specific share text limits with live validation, previews, and truncation rules.
- [ ] Implement copy link + toast notifications.
- [ ] Surface share analytics components in dashboard (stat cards, optional breakdown).
- [ ] Integrate event logging hooks calling Phase 3 API.
- **Code review:** confirm UI accessibility, analytics integration, and metrics accuracy; QA Agent executes cross-browser/device tests.

### Phase 5: Testing, Privacy, & Rollout *(QA & Release Agent · Reviewer: Security & Privacy Agent · Support: Program Lead, Code Review Agent)*
**Tasks:**
- [ ] Execute full regression suite across platforms/browsers/mobile.
- [ ] Validate share analytics accuracy, deletion flows, cache performance.
- [ ] Run privacy review (reviewer names, opt-outs, retention policy compliance).
- [ ] Performance profiling of image generation + UI (lazy loading, caching strategy review).
- [ ] Configure feature flag rollout (pilot accounts → general availability) with monitoring dashboard.
- [ ] Collect documentation + runbooks for support team (troubleshooting, false positive cleanup).
- **Code review:** release checklist approved; Program Lead signs off once telemetry meets defined success metrics.

## Technical Considerations

### Share Tracking Database Schema
**Share Events Table:**
```
{
  id: string (UUID)
  reviewId: string (foreign key)
  userId: string (foreign key)
  platform: enum ('facebook', 'linkedin', 'twitter', 'bluesky', 'reddit', 'pinterest', 'email', 'text', 'copy_link')
  timestamp: datetime
  createdAt: datetime
  updatedAt: datetime
}
```

**Considerations:**
- Index on reviewId for fast lookups
- Index on userId for analytics queries
- Track clicks, not verified shares (may include false positives)
- User can delete entries to clean up false positives
- Consider data retention policy (how long to keep share history)

### Share CTA Link Handling
- Default CTA points to the business website stored per account; allow prompt-level override with validation (e.g., require https, warn on unreachable domains).
- Provide inline editing UX so teams can swap in campaign URLs (UTM support) before sharing.
- Log and surface missing/invalid URLs, falling back to copy-link-only messaging when necessary.
- Respect prompt/reviewer privacy flags—disable CTA link generation if the prompt is private or the reviewer opted out of public sharing.
- Keep the link builder pluggable so we can later default to Prompt Reviews directory URLs (e.g., `https://{new-domain}/{business}/reviews/{reviewId}`) once that product launches.

### Share Text Constraints
- Maintain a centralized config for platform limits (character counts, reserved URL length, emoji handling).
- Provide helper utilities for truncation with ellipsis and ensure preview mirrors final output.
- Maintain unit tests covering boundary cases per platform.

### Image Storage & Retention
- Use Supabase bucket `share-review-images` for generated quote cards; bucket is currently public, so tighten exposure via explicit RLS/policies and signed URLs.
- Define max generated images per review and cleanup job cadence.
- Track generation success/failure metrics; alert if failure rate exceeds agreed threshold.
- Align retention with Google Business post policy (auto-delete generated quote cards after ~14 days once share occurs).
- Skip deletion for original photos pulled from the photo + testimonial feature; only purge generated assets.

### Web Share & Desktop Fallbacks
- Use Web Share API on supported mobile browsers; fallback to copy-link/modal instructions on desktop or unsupported devices.
- QA matrix should cover iOS Safari, Android Chrome, and desktop browsers.

### Monitoring & Alerting
- Emit structured logs for image generation failures, share API errors, and missing CTA URLs.
- Add dashboards/alerts (e.g., via existing telemetry) for share volume, error rate, and storage consumption.

### Accessibility Requirements
- Share modal and history UI must meet WCAG 2.1 AA (focus trapping, ARIA labels, keyboard navigation).
- Provide accessible descriptions for share icons and toast notifications.

### Image Generation Options
1. **Server-side (Node.js)**
   - Libraries: canvas, sharp, or Puppeteer
   - Full control over rendering
   - Can be resource-intensive

2. **Edge Functions (Vercel OG, Cloudinary)**
   - Template-based
   - Fast, cached
   - Limited customization

3. **Pre-designed Templates**
   - Simpler implementation
   - Less flexible

### Privacy & Permissions
- Respect review visibility settings
- Option to include/exclude reviewer name
- Handle private reviews appropriately

### Fallbacks
- If image generation fails: share text-only
- If platform not supported: copy link
- Progressive enhancement approach

## Future Enhancements
- Share count display on public-facing pages (social proof)
- Preview modal before sharing
- Custom share messages per platform (user-configurable)
- A/B testing different share text templates
- Advanced analytics dashboard (most-shared reviews, trending platforms)
- Verify completed shares (if platform APIs allow)
- Automated share suggestions ("This review would do great on LinkedIn!")
- Bulk share operations

## Success Metrics
- Share button click-through rate
- Share platform clicks per review (by platform)
- Total share events over time
- Most popular platforms
- Reviews with highest share counts
- Traffic from shared links (via UTM parameters or referrer tracking)
- User engagement with shared content (external analytics)

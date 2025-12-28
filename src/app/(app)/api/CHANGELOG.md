# API Changelog

## [2025-12-28]
### Added - Review Matching Feature
**New Endpoints:**
- `POST /api/keywords/[id]/check-reviews` - Manually trigger review matching for a concept
  - Scans all reviews for keyword phrase and alias matches
  - Costs 1 credit (flat rate)
  - Returns: reviewsScanned, matchesFound, exactMatches, aliasMatches
  - Automatic refund on processing failure
  - Account-scoped security validation

- `GET /api/keywords/[id]/check-reviews` - Get current review match statistics
  - Returns match counts and recent matched reviews
  - No credit cost for viewing stats

**Concept Schedule Updates:**
- `POST /api/concept-schedule` - Added `reviewMatchingEnabled` boolean parameter
- `POST /api/concept-schedule/cost-preview` - Added review matching cost to breakdown

**Cron Job Updates:**
- `/api/cron/run-scheduled-concepts` - Added review matching to scheduled checks
  - Runs when `reviewMatchingEnabled: true` on concept schedule
  - Uses same efficient matching logic as manual endpoint

**Credit System:**
- Added `review_matching` to `FeatureType` in `/src/lib/credits/types.ts`
- Review matching costs 1 credit per check (manual or scheduled)

## [2025-12-20]
### Added - Prompt Page Keyword Integration
**New Endpoints:**
- `GET /api/keywords/by-phrase?phrase={phrase}` - Look up keyword by phrase string
  - Returns keyword data with full enrichment details
  - Returns linked prompt pages via junction table
  - Normalizes phrase for case-insensitive matching
  - Account-scoped security validation

- `POST /api/keywords/sync-prompt-page` - Sync keywords from prompt page to library
  - Body: `{ promptPageId: string, keywords: string[] }`
  - Auto-creates keywords in library if they don't exist (no AI enrichment)
  - Creates junction records in `keyword_prompt_page_usage`
  - Removes junction records for removed keywords
  - Returns stats: `{ created, linked, unlinked }`

**Component Updates:**
- All prompt page forms now have `KeywordDetailsSidebar` integration
- Clicking a keyword opens sidebar with full enrichment features
- Forms updated: Universal, Product, Service, Photo, Employee, Event, ReviewBuilder

**Migration:**
- Added `scripts/migrate-prompt-page-keywords.ts` for existing keyword migration
- Usage: `npx ts-node scripts/migrate-prompt-page-keywords.ts --dry-run|--execute`

## [2025-10-04]
### Added - Share Image Generation System
**New Endpoints:**
- `POST /api/review-shares/generate-image` - Generate or retrieve share images for reviews
  - Priority-based selection: existing photo → cached → generated → fallback
  - Automatic caching in Supabase Storage (`share-review-images` bucket)
  - Support for regeneration flag to force new image creation
  - Account-scoped security validation
  - Graceful error handling with text-only fallback

- `GET /api/review-shares/og-image?reviewId={id}` - Dynamic OG image generation
  - Edge runtime for fast performance
  - Uses @vercel/og for server-side rendering
  - Applies Prompt Page and Business styling (colors, fonts, gradients)
  - 1200x630px PNG output (Open Graph standard)
  - Star rating visualization with colored stars
  - Truncated review text (150-200 characters max)
  - Business name and branding
  - Reviewer attribution

- `DELETE /api/review-shares/generate-image?reviewId={id}` - Delete cached images
  - Removes images from Supabase Storage
  - Deletes metadata from review_share_images table
  - Account-scoped deletion for security

**Utilities:**
- `/src/utils/shareImageStyles.ts` - Style extraction and formatting helpers
- `/src/utils/shareImageGeneration.ts` - Client-side API wrapper
- `/src/types/review-share-images.ts` - TypeScript interfaces

**Database:**
- Storage bucket `share-review-images` with RLS policies (public read, auth write)
- Table `review_share_images` for tracking generated images
- Prisma model for type-safe database access

**Dependencies:**
- Added `@vercel/og@^0.8.5` for OG image generation

**Documentation:**
- `/docs/SHARE_IMAGE_GENERATION.md` - Full technical documentation
- `/docs/SHARE_IMAGE_EXAMPLES.md` - Visual examples and specifications
- `/docs/SHARE_IMAGE_QUICK_START.md` - Quick start guide for developers
- `/scripts/test-share-image-generation.js` - Comprehensive test suite

**Security:**
- Bearer token authentication required for generation/deletion
- Review ownership verification (review → business → account)
- Account-scoped data access via RLS policies
- CSRF protection via origin validation
- Public read access for social media compatibility

**Performance:**
- Automatic caching: ~2s first generation, ~100ms cached retrieval
- Edge runtime for fast OG image rendering
- CDN caching for public URLs
- Preloading support for improved UX

## [2025-09-20]
### Fixed - Business Creation Flow
- **Fixed business creation incorrectly updating existing accounts:**
  - When user has existing businesses and creates a new one, system now creates a new additional account
  - New additional accounts properly set `is_additional_account = true` flag
  - Prevents renaming of user's default account when trying to create new business
  - Properly returns new account ID to frontend for account switching

## [2025-09-03]
### Fixed - Loading States Standardization
- **Standardized all loading components:**
  - Updated `AppLoader` to use `StandardLoader` internally for consistency
  - Updated `PageLoader` to use `StandardLoader` internally for consistency
  - Fixed prompt page client (r/[slug]/page-client.tsx) to use single loader instead of duplicating loading UI
  - Removed unused FiveStarSpinner import from business-profile page
  - Fixed ServicePromptPageForm loading text to use white color on gradient background
  - Ensured no pages have multiple FiveStarSpinner components visible simultaneously

### Security - Comprehensive Security Audit Fixes
- **Fixed authentication bypass in AI endpoints:**
  - `/api/fix-grammar` - Added session verification, prevented user_id spoofing
  - `/api/generate-review` - Added authentication and account verification
  - `/api/generate-reviews` - Added complete auth system with ownership checks
  - All AI endpoints now require valid authentication and verify user ownership

- **Fixed public API data exposure:**
  - `/api/prompt-pages/[slug]` - Filtered sensitive business data from public access
  - Only returns necessary display fields (name, styling, social URLs)
  - Excludes emails, phones, addresses, internal settings, API keys
  - Added rate limiting protection

- **Security improvements:**
  - All endpoints use `createServerSupabaseClient()` for proper SSR auth
  - Added comprehensive security logging for violations
  - Implemented proper 401/403 status codes
  - Added account context verification throughout

## [2025-09-02]
### Security
- Fixed critical security vulnerabilities in `/api/fix-grammar` endpoint:
  - Added proper session verification using `createServerSupabaseClient()`
  - Added user_id validation to prevent ID spoofing attacks
  - Added proper error logging for security violations
  - Implemented proper 401/403 status codes for unauthorized/forbidden requests

## [2025-09-01]
### Fixed
- Stripe webhook not processing due to missing stripe listen command
- Webhook now properly updates account plan after checkout.session.completed
- Added proper error message extraction in signup route to avoid empty {} errors
- Signup route no longer sets trial dates during account creation (only when plan selected)

### Changed
- Trial dates now only set when user selects a paid plan, not during signup
- Added is_additional_account flag to distinguish additional accounts from primary accounts

## [Previous]
### Webhook Endpoints
- `/api/stripe-webhook` - Handles Stripe payment events
- `/api/auth/signup` - User registration endpoint
- `/api/accounts/create-additional` - Multi-account support
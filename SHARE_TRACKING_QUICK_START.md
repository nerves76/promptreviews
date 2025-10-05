# Review Share Tracking - Quick Start Guide

**Status:** ✅ Ready for deployment
**Date:** October 4, 2025

## What Was Built

A complete backend system for tracking when users share reviews on social platforms, with analytics and strict account isolation.

## Files Created

### Database
- `/supabase/migrations/20251004121845_create_review_share_events.sql`
  - Creates `review_share_events` table
  - Creates `share_platform` enum (9 platforms)
  - 8 indexes for performance
  - 4 RLS policies for security

### API Endpoints (5 routes)
- `/src/app/(app)/api/review-shares/route.ts`
  - POST: Create share event
  - GET: Get share history by review ID

- `/src/app/(app)/api/review-shares/[id]/route.ts`
  - GET: Get single share event
  - DELETE: Remove share event

- `/src/app/(app)/api/review-shares/analytics/route.ts`
  - GET: Aggregated analytics

### Types & Documentation
- `/src/types/review-shares.ts` - TypeScript types
- `/src/app/(app)/api/review-shares/README.md` - API docs
- `/PHASE1_IMPLEMENTATION_SUMMARY.md` - Full implementation details

## Quick Deployment

```bash
# 1. Deploy database migration
npx supabase db push

# 2. Update Prisma
npx prisma db pull
npx prisma generate

# 3. Commit and push
git add .
git commit -m "Add review share tracking system"
git push origin main
```

## API Usage Examples

### Track a Share
```typescript
POST /api/review-shares
{
  "review_id": "uuid",
  "platform": "facebook"
}
```

### Get Share History
```typescript
GET /api/review-shares?reviewId={uuid}
```

### Get Analytics
```typescript
GET /api/review-shares/analytics?start_date=2025-09-01&limit=10
```

### Delete Share Event
```typescript
DELETE /api/review-shares/{shareEventId}
```

## Supported Platforms

- facebook
- linkedin
- twitter
- bluesky
- reddit
- pinterest
- email
- text
- copy_link

## Security Features

✅ Account isolation via RLS policies
✅ Bearer token authentication required
✅ Review ownership validation
✅ CSRF protection on mutations
✅ Double-check pattern on deletes

## Next Steps

1. **Deploy to production** (see above)
2. **Build Phase 2 UI** - Social sharing buttons and modals
3. **Add analytics dashboard** - Visualize share data
4. **Implement share CTA links** - Use documented 3-tier logic

## Documentation

- Full API docs: `/src/app/(app)/api/review-shares/README.md`
- Complete implementation details: `/PHASE1_IMPLEMENTATION_SUMMARY.md`
- Type definitions: `/src/types/review-shares.ts`

## Share CTA Link Priority

1. `prompt_pages.offer_url` (campaign-specific)
2. `businesses.business_website` (default)
3. `accounts.website_url` (fallback)

## Testing Status

✅ Migration tested locally
✅ Table structure verified
✅ Indexes created
✅ RLS policies active
✅ Enum type working

Ready for API endpoint testing and production deployment.

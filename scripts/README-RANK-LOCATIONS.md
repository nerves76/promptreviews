# Rank Locations Seed Script

## Overview

The `seed-rank-locations.ts` script fetches location codes from the DataForSEO API and populates the `rank_locations` table. This enables the location picker in the rank tracking feature without needing to hit the DataForSEO API for every search.

## Prerequisites

- **Environment Variables** (in `.env.local`):
  - `DATAFORSEO_LOGIN` - Your DataForSEO account login
  - `DATAFORSEO_PASSWORD` - Your DataForSEO account password
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
  - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

## Usage

```bash
npx ts-node scripts/seed-rank-locations.ts
```

## What It Does

1. **Fetches Locations**: Calls DataForSEO `/v3/serp/google/locations` API endpoint
2. **Filters**: Currently filters to US locations only (configurable via `COUNTRY_FILTER` constant)
3. **Enriches**: Builds canonical names by traversing parent hierarchy (e.g., "Portland, Oregon, United States")
4. **Seeds Database**: Batch inserts into `rank_locations` table using upsert (handles duplicates)

## Output

The script will insert ~60,000+ US locations including:
- **Cities**: 18,797 locations
- **Postal Codes**: 31,847 locations
- **Neighborhoods**: 4,848 locations
- **Counties**: 3,098 locations
- **States**: 51 locations
- **DMA Regions**: 210 locations
- **And more...**

## Statistics

```
Total Locations: 60,481
Unique Location Types: 17
API Cost: $0.0000 (cached endpoint)
Processing Time: ~30 seconds
```

## Location Types

- Country
- State
- City
- County
- Municipality
- Postal Code
- Neighborhood
- DMA Region
- Congressional District
- Airport
- University
- National Park
- Borough
- City Region
- District
- Colloquial Area
- Region

## Expanding to Other Countries

To add locations from other countries, modify the `COUNTRY_FILTER` constant:

```typescript
// In seed-rank-locations.ts
const COUNTRY_FILTER = ['US', 'CA', 'GB']; // Add Canada and UK
```

## Updating Locations

The script uses upsert, so you can re-run it anytime to update existing locations or add new ones. DataForSEO occasionally adds new locations or updates existing ones.

## Related Files

- **Migration**: `/supabase/migrations/20251230000000_create_rank_tracking_tables.sql`
- **Table**: `rank_locations` in Supabase database
- **Plan**: `/docs/GOOGLE_RANK_TRACKING_PLAN.md`

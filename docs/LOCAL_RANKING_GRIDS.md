# Local Ranking Grids

## Status: ✅ IMPLEMENTED (December 2024)

Track Google Maps visibility across geographic grid points for business locations.

## Overview

Local Ranking Grids (internally called "geo-grid") allows businesses to monitor their Google Maps ranking across multiple geographic points. The system creates a grid of check points around a business location and queries Google Maps rankings for tracked keywords at each point.

## Features

### Core Functionality
- **Grid Configuration**: Set center point, radius (up to 10 miles), and grid size (3x3, 5x5, 7x7, 9x9)
- **Keyword Tracking**: Track up to 20 keywords per location
- **Manual Checks**: Run on-demand ranking checks
- **Scheduled Checks**: Automatic daily/weekly checks
- **Results Visualization**: Interactive map with ranking heatmap
- **Trend Analysis**: Daily summary and historical comparisons

### Multi-Location Support (Maven Only)
- **Maven accounts**: Up to 10 locations, each with independent grid config
- **Builder/Grower accounts**: Single location only
- **Location selector**: Dropdown to switch between configured locations
- **Independent data**: Each location has its own keywords, results, and schedules

## Technical Architecture

### Database Tables
- `gg_configs` - Grid configuration per account+location
- `gg_tracked_keywords` - Keywords tracked for each config
- `gg_checks` - Individual ranking check results
- `gg_daily_summary` - Aggregated daily statistics

### Key Constraints
- `UNIQUE(account_id, google_business_location_id)` - One config per location per account
- Cascade deletes: Deleting a config removes all related keywords, checks, summaries

### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/geo-grid/config` | GET | Get all configs (array) or single config by ID |
| `/api/geo-grid/config` | POST | Create or update config (tier enforcement) |
| `/api/geo-grid/config` | DELETE | Delete config and cascade related data |
| `/api/geo-grid/results` | GET | Get check results for a config |
| `/api/geo-grid/check` | POST | Run manual ranking check |
| `/api/geo-grid/tracked-keywords` | GET/POST/DELETE | Manage tracked keywords |
| `/api/geo-grid/summary` | GET | Get daily summaries and trends |
| `/api/geo-grid/schedule` | GET/POST | Get/set check schedule |

### Hooks
- `useGeoGridConfig` - Multi-config management, selection, CRUD
- `useGeoGridResults` - Fetch results for selected config
- `useTrackedKeywords` - Manage keywords for selected config
- `useGeoGridSummary` - Daily summaries and trends

### Components
- `GeoGridSetupWizard` - Initial setup and settings editing
- `GeoGridGoogleMap` - Interactive map visualization
- `GeoGridResultsTable` - Tabular results view
- `GeoGridTrendCard` - Summary statistics
- `GeoGridKeywordPicker` - Keyword management
- `GeoGridScheduleSettings` - Schedule configuration
- `LocationSelector` - Reusable location dropdown (for multi-location)

## Credit Integration

### Cost Formula
```
credits = 10 base + (grid_cells) + (keywords × 2)
```

### Examples
| Grid | Keywords | Credits |
|------|----------|---------|
| 3×3 | 1 | 21 |
| 5×5 | 5 | 45 |
| 7×7 | 10 | 79 |
| 9×9 | 20 | 131 |

### Credit Flow
1. User clicks "Run Check"
2. API calculates cost: `checkGeogridCredits(supabase, accountId, gridSize, keywordCount)`
3. If insufficient → 402 response with balance info
4. If sufficient → `debit()` with idempotency key
5. Run DataForSEO API calls
6. If failure → `refundFeature()` compensating credit

## Account Isolation

All data is properly isolated by account:
- API routes use `getRequestAccountId()` from X-Selected-Account header
- All DB queries filter by `account_id`
- Hooks use `apiClient` which includes account headers
- Account switcher triggers data refresh

## Tier Enforcement

| Plan | Max Locations | UI Behavior |
|------|---------------|-------------|
| Grower | 1 | No location selector shown |
| Builder | 1 | No location selector shown |
| Maven | 10 | Location selector + "Add Location" button |

### Enforcement Points
- **API**: POST returns 403 if limit reached, with `upgradeRequired: true`
- **UI**: `canAddMore` flag controls "Add Location" visibility
- **Validation**: Location ownership verified before creating config

## File Locations

### API Routes
```
src/app/(app)/api/geo-grid/
├── config/route.ts
├── results/route.ts
├── check/route.ts
├── tracked-keywords/route.ts
├── summary/route.ts
├── schedule/route.ts
└── geocode/route.ts
```

### Feature Code
```
src/features/geo-grid/
├── components/
│   ├── GeoGridSetupWizard.tsx
│   ├── GeoGridGoogleMap.tsx
│   ├── GeoGridResultsTable.tsx
│   └── ...
├── hooks/
│   ├── useGeoGridConfig.ts
│   ├── useGeoGridResults.ts
│   ├── useTrackedKeywords.ts
│   └── useGeoGridSummary.ts
├── services/
│   ├── rank-checker.ts
│   └── summary-aggregator.ts
└── utils/
    ├── types.ts
    └── transforms.ts
```

### Pages
```
src/app/(app)/dashboard/local-ranking-grids/page.tsx  # User-facing
src/app/(app)/admin/geo-grid/page.tsx                 # Admin view
```

### Shared Components
```
src/components/LocationSelector.tsx  # Reusable location dropdown
```

## Cron Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| `run-scheduled-geogrids` | Hourly | Runs due scheduled checks |
| `send-credit-warnings` | Daily 8am UTC | Warns if insufficient credits for scheduled checks |

## Naming Convention

- **Internal code**: `geo-grid`, `GeoGrid`, `geogrid` (files, functions, DB tables, API routes)
- **Customer-facing UI**: "Local Ranking Grid" or "Local Ranking Grids"

## Future Considerations

### Centralized Locations System
As more features support multi-location businesses, consider adding a central `account_locations` table. Current implementation:
- Keeps FK to `google_business_locations` (no data duplication)
- `LocationSelector` is reusable for other features
- Avoids tight coupling between geo-grid and location data
- Ready to migrate to centralized system later

## Related Documentation
- [Credit System](./CREDIT_SYSTEM_IMPLEMENTATION_PLAN.md) - Credit integration details
- [Multi-Location Plan](../.claude/plans/tidy-hopping-zephyr.md) - Original implementation plan

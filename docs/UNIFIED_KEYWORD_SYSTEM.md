# Unified Keyword System

The Unified Keyword System provides centralized keyword management with usage tracking, grouping, and auto-rotation capabilities.

## Overview

Keywords are used throughout PromptReviews to:
- Guide AI review generation
- Track which keywords appear in customer reviews
- Help businesses optimize their review collection strategy

The unified system consolidates keywords into a central library with:
- **Usage tracking**: Count how often each keyword appears in reviews
- **Grouping**: Organize keywords by category
- **Auto-rotation**: Automatically swap overused keywords for fresh ones
- **Usage indicators**: Visual feedback on keyword health (for 4+ word keywords)

## Architecture

### Database Tables

```
keywords                      # Central keyword library
├── id (uuid)
├── account_id (uuid)
├── phrase (text)             # The keyword itself
├── group_id (uuid)           # Optional grouping
├── word_count (int)          # Cached word count
├── review_usage_count (int)  # How many reviews contain this keyword
├── status (text)             # active/archived
└── created_at, updated_at

keyword_groups                # Keyword organization
├── id (uuid)
├── account_id (uuid)
├── name (text)               # e.g., "Service Quality", "Speed"
├── display_order (int)
└── created_at

keyword_prompt_page_usage     # Links keywords to prompt pages
├── id (uuid)
├── keyword_id (uuid)
├── prompt_page_id (uuid)
├── account_id (uuid)
├── is_in_active_pool (bool)  # For rotation feature
├── rotated_out_at (timestamp)
├── rotated_in_at (timestamp)
└── rotation_count (int)

keyword_review_matches_v2     # Tracks keyword matches in reviews
├── id (uuid)
├── keyword_id (uuid)
├── review_id (uuid)
├── account_id (uuid)
├── match_count (int)         # Times keyword appears in review
└── matched_at (timestamp)

keyword_rotation_log          # Audit trail for rotations
├── id (uuid)
├── account_id (uuid)
├── prompt_page_id (uuid)
├── rotated_out_keyword_id (uuid)
├── rotated_in_keyword_id (uuid)
├── trigger_type (text)       # 'auto' or 'manual'
├── usage_count_at_rotation (int)
├── threshold_at_rotation (int)
└── created_at, created_by
```

### Prompt Page Rotation Settings

Added to `prompt_pages` table:
- `keyword_auto_rotate_enabled` (bool) - Enable auto-rotation
- `keyword_auto_rotate_threshold` (int, default 16) - Rotate after N uses
- `keyword_active_pool_size` (int, default 10) - Max active keywords

## Usage Indicators

Keywords with 4+ words show usage indicators (color-coded bubbles):

| Uses | Color | Meaning |
|------|-------|---------|
| 0-3 | Gray | Fresh, underused |
| 4-7 | Yellow | Getting familiar |
| 8-15 | Orange | Consider rotating |
| 16+ | Red | Overused, rotate |

Why 4+ words only: Short keywords like "great service" are generic and expected to repeat. Long-tail keywords like "exceeded my expectations with their attention to detail" are more unique and their overuse can make reviews seem templated.

## File Structure

```
src/features/keywords/
├── index.ts                    # Main exports
├── keywordUtils.ts             # Utility functions, constants
├── keywordMatchService.ts      # Review-keyword matching logic
├── keywordRotationService.ts   # Rotation algorithms
├── reprocessKeywordMatches.ts  # Batch reprocessing utilities
├── hooks/
│   └── useKeywords.ts          # React hook for CRUD operations
└── components/
    ├── index.ts                # Component exports
    ├── KeywordChip.tsx         # Single keyword display with usage bubble
    ├── KeywordGroupAccordion.tsx # Collapsible group view
    ├── KeywordManager.tsx      # Full management UI
    ├── UnifiedKeywordsInput.tsx # ID-based input (for new forms)
    ├── KeywordsInputLegacyAdapter.tsx # String-based input (backwards compat)
    ├── KeywordRotationPanel.tsx # Rotation management UI
    └── KeywordRotationAlerts.tsx # Alert banners for rotation issues
```

## API Endpoints

### Keywords CRUD
- `GET /api/keywords` - List keywords (with optional filters)
- `POST /api/keywords` - Create keyword
- `PUT /api/keywords/[id]` - Update keyword
- `DELETE /api/keywords/[id]` - Delete keyword

### Keyword Groups
- `GET /api/keyword-groups` - List groups
- `POST /api/keyword-groups` - Create group
- `PUT /api/keyword-groups/[id]` - Update group
- `DELETE /api/keyword-groups/[id]` - Delete group

### Rotation
- `GET /api/keywords/rotate?promptPageId=X` - Get rotation status
- `GET /api/keywords/rotate?promptPageId=X&history=true` - Get rotation history
- `GET /api/keywords/rotate?alerts=true` - Get all rotation alerts for account
- `POST /api/keywords/rotate` - Perform rotation or update settings
  - `action: "rotate"` - Rotate specific keyword
  - `action: "autoRotate"` - Auto-rotate all overused keywords
  - `action: "updateSettings"` - Update rotation settings

### Cron Jobs
- `/api/cron/sync-keyword-usage` - Daily sync of usage counts from matches

## React Hook Usage

```typescript
import { useKeywords, useKeywordDetails } from '@/features/keywords';

function MyComponent() {
  const {
    keywords,           // All keywords for account
    groups,             // All keyword groups
    isLoading,
    error,
    refresh,            // Refetch data
    createKeyword,      // (phrase, groupId?, promptPageId?) => Promise
    updateKeyword,      // (id, updates) => Promise
    deleteKeyword,      // (id) => Promise
    createGroup,        // (name) => Promise
    updateGroup,        // (id, updates) => Promise
    deleteGroup,        // (id) => Promise
  } = useKeywords({ includeUsage: true });

  // Get details for a specific keyword
  const { keyword, promptPages, recentReviews } = useKeywordDetails(keywordId);
}
```

## Component Usage

### KeywordsInputLegacyAdapter (for existing forms)

Drop-in replacement for old KeywordsInput. Works with string arrays:

```tsx
import { KeywordsInputLegacyAdapter as KeywordsInput } from '@/features/keywords/components';

<KeywordsInput
  keywords={formData.keywords}           // string[]
  onChange={(kws) => setFormData({...formData, keywords: kws})}
  businessInfo={businessProfile}         // For AI generation
  promptPageId={promptPage?.id}          // Optional, for linking
  maxKeywords={20}
  disabled={false}
/>
```

### UnifiedKeywordsInput (for new forms using IDs)

```tsx
import { UnifiedKeywordsInput } from '@/features/keywords/components';

<UnifiedKeywordsInput
  promptPageId={promptPage.id}
  selectedKeywordIds={formData.keywordIds}  // string[] of IDs
  onChange={(ids) => setFormData({...formData, keywordIds: ids})}
  maxKeywords={20}
  showLibraryPicker={true}
/>
```

### KeywordRotationPanel

```tsx
import { KeywordRotationPanel } from '@/features/keywords/components';

<KeywordRotationPanel
  promptPageId={promptPage.id}
  onRotationComplete={() => refetchData()}
/>
```

### KeywordRotationAlerts

```tsx
import { KeywordRotationAlerts, KeywordRotationBadge } from '@/features/keywords/components';

// Full alert panel
<KeywordRotationAlerts compact={false} maxAlerts={5} />

// Badge for navigation (shows count)
<KeywordRotationBadge />
```

## Backwards Compatibility

The system maintains backwards compatibility with the legacy approach:

### Legacy Approach (still supported)
- Keywords stored as JSON array in `prompt_pages.keywords`
- Forms use string arrays: `keywords: ["fast service", "quality work"]`

### Unified Approach (new)
- Keywords stored in `keywords` table with IDs
- Junction table links keywords to prompt pages
- Usage counts tracked per keyword

### How They Coexist

The `KeywordsInputLegacyAdapter` bridges both systems:
1. Accepts `string[]` input (legacy format)
2. Displays usage indicators from unified system
3. Syncs new keywords to unified tables
4. Returns `string[]` output (legacy format)

Forms continue saving to `prompt_pages.keywords` as before, while the unified system tracks usage in parallel.

## Troubleshooting

### Keywords not showing usage counts

1. Check if keywords exist in `keywords` table:
```sql
SELECT * FROM keywords WHERE account_id = 'your-account-id';
```

2. Check if matches exist:
```sql
SELECT k.phrase, COUNT(m.id) as match_count
FROM keywords k
LEFT JOIN keyword_review_matches_v2 m ON k.id = m.keyword_id
WHERE k.account_id = 'your-account-id'
GROUP BY k.id, k.phrase;
```

3. Run usage sync manually:
```bash
curl -X POST https://app.promptreviews.app/api/cron/sync-keyword-usage \
  -H "Authorization: Bearer $CRON_SECRET_TOKEN"
```

### Rotation not working

1. Check rotation settings on prompt page:
```sql
SELECT id, name, keyword_auto_rotate_enabled, keyword_auto_rotate_threshold, keyword_active_pool_size
FROM prompt_pages WHERE id = 'your-prompt-page-id';
```

2. Check active/reserve pool:
```sql
SELECT kppu.*, k.phrase, k.review_usage_count
FROM keyword_prompt_page_usage kppu
JOIN keywords k ON k.id = kppu.keyword_id
WHERE kppu.prompt_page_id = 'your-prompt-page-id'
ORDER BY kppu.is_in_active_pool DESC, k.review_usage_count DESC;
```

3. Check rotation history:
```sql
SELECT * FROM keyword_rotation_log
WHERE prompt_page_id = 'your-prompt-page-id'
ORDER BY created_at DESC LIMIT 10;
```

### Form keywords not syncing to unified system

The adapter syncs keywords when:
- User adds a new keyword via the input
- User selects from library picker

It does NOT automatically sync existing `prompt_pages.keywords` on page load. To sync existing keywords, use the migration script:

```bash
npx ts-node scripts/migrate-keywords-to-unified.ts --execute
```

## Migration Script

Located at `/scripts/migrate-keywords-to-unified.ts`

```bash
# Analyze what would be migrated (no changes)
npx ts-node scripts/migrate-keywords-to-unified.ts --analyze

# Dry run (shows what would happen)
npx ts-node scripts/migrate-keywords-to-unified.ts --dry-run

# Execute migration
npx ts-node scripts/migrate-keywords-to-unified.ts --execute
```

The script:
1. Extracts keywords from `prompt_pages.keywords` and `businesses.keywords`
2. Deduplicates and normalizes
3. Creates entries in `keywords` table
4. Creates group assignments
5. Creates `keyword_prompt_page_usage` records

## Database Migrations

- `20251219000000` - Create keywords and keyword_groups tables
- `20251219000001` - Create keyword_prompt_page_usage table
- `20251219000002` - Create keyword_review_matches_v2 table
- `20251219000003` - Add indexes
- `20251219000004` - Add RLS policies
- `20251223000000` - Add rotation settings and keyword_rotation_log table

# Rank Tracking Modals Implementation

This document describes the modal components created for the Google SERP Rank Tracking feature.

## Files Created

### 1. Hooks

#### `/src/features/rank-tracking/hooks/useLocations.ts`
- **Purpose:** Search DataForSEO locations for rank tracking
- **Features:**
  - Debounced search (300ms)
  - Minimum 2 characters required
  - Returns location code, name, country code, and type
- **API Endpoint:** `GET /api/rank-tracking/locations?search={query}`

#### `/src/features/rank-tracking/hooks/useKeywordDiscovery.ts`
- **Purpose:** Keyword research and discovery using DataForSEO
- **Features:**
  - Get keyword volume, CPC, competition data
  - Get keyword suggestions
  - Rate limiting (50 requests/day per account)
  - Handles 429 rate limit responses
- **API Endpoints:**
  - `POST /api/rank-tracking/discovery` - Get keyword data
  - `GET /api/rank-tracking/discovery/suggestions` - Get suggestions

### 2. Components

#### `/src/features/rank-tracking/components/LocationPicker.tsx`
- **Purpose:** Autocomplete dropdown for selecting a location
- **Features:**
  - Debounced search
  - Dropdown with location results
  - Click-outside-to-close
  - Clear selected location
  - Shows location type (City, State, Country)

#### `/src/features/rank-tracking/components/CreateGroupModal.tsx`
- **Purpose:** Modal for creating a new rank tracking group
- **Fields:**
  - Group name (text input)
  - Device (desktop/mobile toggle buttons)
  - Location (LocationPicker component)
- **Features:**
  - Form validation
  - Error display
  - Loading state
  - Headless UI Dialog with transitions

#### `/src/features/rank-tracking/components/AddKeywordsModal.tsx`
- **Purpose:** Modal for adding keywords to a rank tracking group
- **Two Tabs:**

  **Tab 1: Your Library**
  - Shows existing keywords from the account's keyword library
  - Search/filter functionality
  - Multi-select checkboxes
  - Displays phrase and search query

  **Tab 2: Discover**
  - Keyword research using DataForSEO
  - Shows search volume, CPC, competition, trend
  - Displays related keyword suggestions
  - "Add to Library" button creates concept in keyword library
  - Rate limit notice when daily limit reached

- **Features:**
  - Selected count in footer
  - Bulk add functionality
  - Auto-refresh keyword library after adding
  - Headless UI Tabs component

## UI/UX Patterns

### Dialog Pattern
All modals use Headless UI's Dialog component with:
- Backdrop with 30% black opacity
- Enter/leave transitions (300ms ease-out/200ms ease-in)
- Scale and opacity animations
- z-index of 50

### Button Variants
Using the project's Button component:
- `default` - Primary action (Create, Add)
- `outline` - Secondary action (Cancel)
- `sm` - Small buttons for inline actions

### Color Scheme
- Primary: `slate-blue` (#452F9F)
- Borders: `border-gray-200`, `border-gray-300`
- Backgrounds: `bg-gray-50`, `bg-white`
- Text: `text-gray-900`, `text-gray-600`, `text-gray-500`
- Hover states: `hover:bg-gray-50`, `hover:text-gray-600`

## Integration Points

### CreateGroupModal Usage
```typescript
import { CreateGroupModal } from '@/features/rank-tracking/components';

<CreateGroupModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onCreate={async (data) => {
    // API call to create group
    const response = await apiClient.post('/rank-tracking/groups', data);
    return { success: true, group: response.group };
  }}
  onSuccess={() => {
    // Close modal and refresh groups list
    setIsOpen(false);
    refreshGroups();
  }}
/>
```

### AddKeywordsModal Usage
```typescript
import { AddKeywordsModal } from '@/features/rank-tracking/components';

<AddKeywordsModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  groupId={selectedGroupId}
  locationCode={group.locationCode}
  onAdd={async (keywordIds) => {
    // API call to add keywords to group
    const response = await apiClient.post(
      `/rank-tracking/groups/${groupId}/keywords`,
      { keywordIds }
    );
    return { success: true };
  }}
  onSuccess={() => {
    // Close modal and refresh keywords
    setIsOpen(false);
    refreshKeywords();
  }}
/>
```

## Type Exports

All hooks export their types for easy reuse:

```typescript
// From useLocations
import type { Location, UseLocationsReturn } from '@/features/rank-tracking/hooks';

// From useKeywordDiscovery
import type {
  DiscoveryResult,
  KeywordSuggestion,
  UseKeywordDiscoveryReturn
} from '@/features/rank-tracking/hooks';
```

## Dependencies

- `@headlessui/react` - Dialog and Tab components
- `@heroicons/react/24/outline` - Icons
- `@/app/(app)/components/ui/button` - Styled buttons
- `@/utils/apiClient` - Authenticated API wrapper
- `@/features/keywords/hooks/useKeywords` - Keyword library management

## Testing Checklist

- [ ] CreateGroupModal form validation (empty name, no location)
- [ ] CreateGroupModal device toggle selection
- [ ] LocationPicker debounce and search
- [ ] LocationPicker dropdown close on outside click
- [ ] AddKeywordsModal library tab search
- [ ] AddKeywordsModal library tab multi-select
- [ ] AddKeywordsModal discover tab keyword search
- [ ] AddKeywordsModal discover tab rate limit display
- [ ] AddKeywordsModal "Add to Library" creates keyword concept
- [ ] Selected keywords persist when switching tabs
- [ ] Modals close on success and trigger callbacks

## Notes

- The feature index (`/src/features/rank-tracking/index.ts`) does NOT export hooks or components to avoid bundling client-only code in server routes
- Import hooks and components directly from `./hooks` or `./components` in client components
- All modals handle loading and error states
- Discovery tab respects DataForSEO rate limits (50/day per account)

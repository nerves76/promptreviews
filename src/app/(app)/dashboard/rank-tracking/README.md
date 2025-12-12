# Rank Tracking Dashboard

This directory contains the rank tracking feature pages for the PromptReviews dashboard.

## Structure

```
rank-tracking/
├── [groupId]/
│   └── page.tsx        # Group detail page showing keywords and rankings
└── README.md           # This file
```

## Group Detail Page

**Path:** `/dashboard/rank-tracking/[groupId]`

### Features

1. **Group Overview**
   - Group name, device type, location
   - Schedule information
   - Summary statistics (keywords count, avg position, top 10 count, last checked)

2. **Keywords Table**
   - Sortable columns (keyword, position, change)
   - Batch selection and removal
   - Position badges (color-coded by rank)
   - Position change indicators (up/down arrows)
   - Latest URL for each ranking

3. **Actions**
   - Add Keywords modal
   - Schedule Settings modal
   - Run Check button (triggers rank check for all keywords)
   - Back to groups navigation

### Components Used

From `/src/features/rank-tracking`:
- `RankKeywordsTable` - Main table displaying keywords and rankings
- `AddKeywordsModal` - Modal for adding keywords to the group
- `ScheduleSettings` - Modal for configuring automated checks

### Hooks Used

From `/src/features/rank-tracking/hooks`:
- `useRankGroups()` - Fetches all rank groups
- `useGroupKeywords(groupId)` - Fetches and manages keywords for a group
- `useRankHistory(groupId)` - Fetches check results and runs new checks

### Data Flow

1. Page loads and fetches group data via `useRankGroups()`
2. Keywords are fetched via `useGroupKeywords(groupId)`
3. Check results are fetched via `useRankHistory(groupId)`
4. Running a check:
   - Click "Run Check" button
   - Calls `runCheck()` from `useRankHistory`
   - Makes API call to `/rank-tracking/groups/[id]/check`
   - Refreshes keywords to get latest positions
5. Adding keywords:
   - Opens `AddKeywordsModal`
   - User selects keywords
   - Calls `addKeywords()` from `useGroupKeywords`
   - Makes API call to `/rank-tracking/groups/[id]/keywords`
   - Refreshes keyword list

## TODO

- [ ] Implement full AddKeywordsModal functionality
- [ ] Implement full ScheduleSettings functionality
- [ ] Add SERP features display in keywords table
- [ ] Add historical chart showing position changes over time
- [ ] Add competitor analysis section
- [ ] Add export functionality for rank data

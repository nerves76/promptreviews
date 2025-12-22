# Library Tab Consolidation Plan

## Overview
Consolidate the "Rank Tracking" tab functionality into the "Library" tab, creating a unified keyword management experience modeled after the sidebar but with expanded detail.

## Current State

### Tabs
- **Library** - Keyword list with pill/card view
- **Research** - Keyword research tools (KEEP)
- **Rank Tracking** - Concepts view + Table view (REMOVE TAB, MOVE CONTENT)
- **LLM Visibility** - LLM tracking (KEEP)

### Sidebar Sections (the model)
1. Header + Stats (word count, pages, reviews, volume, group)
2. Rank Tracking Status (positions per location/device)
3. Discovered Questions from Google (PAA)
4. AI Generate button
5. Reviews Section (review phrase, aliases)
6. SEO & LLM Tracking (search terms with volume/rank, related questions)
7. Tracking Locations
8. Group selector
9. Prompt Pages
10. Recent Reviews

---

## Target State

### New Library Tab Structure
```
Library Tab
├── View Toggle: [Concepts] [Table]
├── Concepts View (default)
│   └── List of ConceptCards (expanded sidebar-style)
└── Table View
    └── Sortable table with search volume column (NEW)
```

### ConceptCard Component (New)
Each concept card mirrors the sidebar but inline, with collapsible sections:

```
┌─────────────────────────────────────────────────────────────┐
│ ★ "keyword concept phrase"                    [Edit] [⋮]   │
│ Words: 3 | Pages: 2 | Reviews: 5 | Volume: 1.2K | Group: X  │
├─────────────────────────────────────────────────────────────┤
│ ▼ Search terms (3)                                          │
│   ├─ "term 1" ★ canonical                                  │
│   │  Monthly search volume: 500 Portland, OR               │
│   │  Rank: #12 (desktop) Portland, OR                      │
│   ├─ "term 2"                                              │
│   │  Monthly search volume: <10 Portland, OR               │
│   │  Rank: Not in top 100 (desktop) Portland, OR           │
│   └─ [+ Add term...]                                       │
├─────────────────────────────────────────────────────────────┤
│ ▼ Related questions (5)                                     │
│   ├─ Top of funnel                                         │
│   │  └─ "What is...?" [ChatGPT: Cited] [Claude: Not cited] │
│   ├─ Middle of funnel                                      │
│   │  └─ "How do I...?" [Not checked]                       │
│   └─ [+ Add question...]                                   │
├─────────────────────────────────────────────────────────────┤
│ ▸ Reviews (collapsed by default)                           │
│ ▸ Tracking locations (collapsed by default)                │
└─────────────────────────────────────────────────────────────┘
```

### Collapsible Sections
- **Search terms** - Expanded by default
- **Related questions** - Expanded by default
- **Reviews** (review phrase, aliases) - Collapsed by default
- **Tracking locations** - Collapsed by default

---

## Implementation Steps

### Phase 1: Create ConceptCard Component
1. Create `/src/features/keywords/components/ConceptCard.tsx`
2. Model after sidebar sections but inline layout
3. Add collapsible section support
4. Wire up editing (inline for simple fields, sidebar for complex)

### Phase 2: Update Library Page
1. Add view toggle (Concepts | Table)
2. Replace current pill view with ConceptCard list
3. Keep Table view, add search volume column

### Phase 3: Remove Rank Tracking Tab
1. Remove `/dashboard/keywords/rank-tracking` route
2. Update navigation to not show Rank Tracking tab
3. Ensure all functionality is available in Library

### Phase 4: Data Integration
1. Fetch volume data per search term
2. Fetch rank data per search term
3. Fetch LLM visibility data per question
4. Optimize API calls (batch where possible)

---

## Files to Modify

### New Files
- `/src/features/keywords/components/ConceptCard.tsx` - Main expanded card
- `/src/features/keywords/components/CollapsibleSection.tsx` - Reusable collapsible

### Modified Files
- `/src/app/(app)/dashboard/keywords/library/page.tsx` - Add concepts view
- `/src/features/keywords/components/KeywordTable.tsx` - Add volume column
- `/src/app/(app)/dashboard/keywords/layout.tsx` - Remove Rank Tracking tab

### Files to Eventually Remove (Phase 3)
- `/src/app/(app)/dashboard/keywords/rank-tracking/page.tsx`
- `/src/features/rank-tracking/components/ConceptRankAccordion.tsx` (or repurpose)

---

## Data Requirements

### Per Concept
- Keyword data (phrase, wordCount, aliases, etc.)
- Group info
- Prompt page usage count
- Review usage count

### Per Search Term
- Volume data (from keyword_research_results)
- Rank data (from rank_tracking_checks via API)
- CPC, competition level

### Per Question
- LLM visibility results (per provider)
- Check timestamps

---

## Questions to Resolve

1. **Inline vs Sidebar Editing**: Which fields edit inline vs open sidebar?
   - Proposed: Simple toggles/adds inline, complex editing opens sidebar

2. **Performance**: With expanded cards, need to lazy load section data?
   - Proposed: Load core data on mount, fetch section details on expand

3. **Mobile**: How do collapsible sections work on mobile?
   - Proposed: Same pattern, just narrower cards

---

## Migration Notes

- Keep sidebar component unchanged (used elsewhere)
- ConceptRankAccordion can be repurposed or deprecated
- All existing functionality must remain accessible
- Add search volume to Table view as new feature

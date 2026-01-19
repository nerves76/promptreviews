# Modal Standardization Plan

## Executive Summary

This document provides a complete inventory of all 65 modal files in the Prompt Reviews codebase with specific instructions for standardizing close buttons and migrating suitable modals to the centralized Modal component. The goal is to achieve consistent UX while reducing maintenance burden through consolidation.

**Strategy:**
- **19 modals** → Migrate to centralized `Modal` component
- **17 modals** → Keep custom, add standardized close button
- **14 modals** → Already correct or keep as-is
- **8 modals** → Quick size/style fix only
- **7 modals** → Special cases (no close button by design, duplicates to verify)

---

## Phase 0: Modal Component Enhancements

Before migrating modals, enhance the centralized Modal component with new features:

### 0.1 Add `draggable` prop

```tsx
interface ModalProps {
  // ... existing props
  /** Enable drag-to-move functionality */
  draggable?: boolean;
}
```

Implementation: Integrate drag behavior from existing `DraggableModal.tsx` into centralized Modal.

### 0.2 Add `theme` prop for dark mode

```tsx
interface ModalProps {
  // ... existing props
  /** Modal theme - defaults to 'light' */
  theme?: 'light' | 'dark';
}
```

Dark theme styling (for community modals):
```tsx
// Dark theme classes
const darkThemeClasses = 'bg-white/10 backdrop-blur-md border border-white/20 text-white';
const darkCloseButton = 'bg-white/20 border-white/30 hover:bg-white/30';
```

---

## Standard Close Button Specification

All modals should use this close button unless marked as "Keep As-Is":

```tsx
<button
  className="absolute -top-3 -right-3 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 z-50"
  style={{ width: 48, height: 48 }}
  onClick={onClose}
  aria-label="Close modal"
>
  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
</button>
```

**Key Requirements:**
- Size: 48x48px (NOT 36x36)
- Position: `absolute -top-3 -right-3`
- Background: `bg-white` (NOT `bg-white/70`)
- Border: `border-gray-200` (NOT `border-white/40`)
- Icon: Red SVG X (`text-red-600`)
- z-index: `z-50`
- Accessibility: `aria-label="Close modal"`
- Parent: Must have `overflow-visible` or use wrapper pattern

---

## Migration Candidates (19 modals)

These modals have simple structure and should be **migrated to the centralized Modal component**.

### Simple Forms & Selection Modals

| # | File | Size | Notes |
|---|------|------|-------|
| 1 | `/src/app/(app)/components/BulkPromptTypeSelectModal.tsx` | sm | Simple radio selection |
| 2 | `/src/app/(app)/components/UnifiedPromptTypeSelectModal.tsx` | md | Type selection + checkbox |
| 3 | `/src/app/(app)/components/FeedbackModal.tsx` | md | Simple form submission |
| 4 | `/src/app/(app)/dashboard/rss-feeds/components/TestFeedModal.tsx` | md | Input → process → display |
| 5 | `/src/app/(app)/dashboard/social-posting/components/EditScheduleModal.tsx` | sm | Date/text form |
| 6 | `/src/app/(app)/work-manager/components/CreateBoardModal.tsx` | md | Standard form |
| 7 | `/src/app/(app)/work-manager/components/CreateTaskModal.tsx` | lg | Multi-field form |

### Feature Modals - Rank Tracking & LLM

| # | File | Size | Notes |
|---|------|------|-------|
| 8 | `/src/features/keywords/components/BulkDeleteModal.tsx` | md | Confirmation with progress |
| 9 | `/src/features/llm-visibility/components/AddLLMConceptModal.tsx` | md | Standard form |
| 10 | `/src/features/llm-visibility/components/CheckLLMModal.tsx` | md | Provider selection + results |
| 11 | `/src/features/rank-tracking/components/AddKeywordConceptModal.tsx` | md | Standard form |
| 12 | `/src/features/rank-tracking/components/CheckVolumeModal.tsx` | md | Location picker + results |
| 13 | `/src/features/rank-tracking/components/RunAllRankModal.tsx` | md | State machine fits Modal |
| 14 | `/src/features/rank-tracking/components/CheckRankModal.tsx` | md | Simple with nested confirm |
| 15 | `/src/features/geo-grid/components/AddKeywordsToGridModal.tsx` | 2xl | Search + list + create |

### Other Migration Candidates

| # | File | Size | Notes |
|---|------|------|-------|
| 16 | `/src/app/(app)/components/communication/SharePromptPageModal.tsx` | md | Tab switching + clipboard |
| 17 | `/src/app/(app)/components/FunFactsModal.tsx` | md | Simple list, needs `draggable` |
| 18 | `/src/app/(app)/components/KeywordInspirationModal.tsx` | md | Keyword list, needs `draggable` |
| 19 | `/src/components/GoogleBusinessProfile/LocationSelectionModalV2.tsx` | lg | Search + selection list |

---

## Keep Custom - Add Close Button Only (17 modals)

These modals have complex behavior or specialized styling. **Keep as custom, just add standardized floating close button.**

### Complex State/Behavior

| # | File | Reason |
|---|------|--------|
| 1 | `/src/app/(app)/components/ContactMergeModal.tsx` | Complex field-by-field selection, glass styling |
| 2 | `/src/app/(app)/components/KeywordGeneratorModal.tsx` | Large table, glass/gradient styling |
| 3 | `/src/app/(app)/dashboard/rss-feeds/components/BrowseFeedModal.tsx` | Complex scheduling with interdependent settings |
| 4 | `/src/app/(app)/community/components/modals/EditDisplayNameModal.tsx` | Nested modal + image cropping pipeline |
| 5 | `/src/app/(app)/community/components/modals/GuidelinesModal.tsx` | Long prose content, conditional acceptance |
| 6 | `/src/features/llm-visibility/components/RunAllLLMModal.tsx` | Complex scheduling modes + datetime picker |
| 7 | `/src/features/rank-tracking/components/RankHistoryModal.tsx` | Backdrop blur, filter dropdowns, chart |
| 8 | `/src/features/geo-grid/components/GeoGridPointModal.tsx` | Color-coded bucket styling, Hero Icons |
| 9 | `/src/features/concept-schedule/components/ScheduleSettingsModal.tsx` | 8+ state vars, nested warning modal |
| 10 | `/src/app/(app)/dashboard/ai-search/components/RunAllAnalysisModal.tsx` | Complex polling/batch status |
| 11 | `/src/app/(app)/components/communication/CommunicationTrackingModal.tsx` | Multi-step flow with templates |
| 12 | `/src/app/(app)/components/reviews/ShareModal.tsx` | Glass morphism, share history, image gen |
| 13 | `/src/app/(app)/components/BusinessLocationModal.tsx` | Form + nested modals + image cropping |
| 14 | `/src/app/(app)/components/PricingModal.tsx` | Tooltip positioning, conditional offers |
| 15 | `/src/app/(app)/dashboard/widget/components/ReviewManagementModal.tsx` | 1164 lines, tabs, drag reorder, autosave |

### Dark Theme (Community Modals) - Use `theme="dark"` when Modal enhanced

| # | File | Reason |
|---|------|--------|
| 16 | `/src/app/(app)/community/components/modals/EditCommentModal.tsx` | Custom dark theme (community branding) |
| 17 | `/src/app/(app)/community/components/modals/EditPostModal.tsx` | Custom dark theme (community branding) |

---

## Already Correct - No Changes Needed (14 modals)

### Using Centralized Modal (6)

| # | File |
|---|------|
| 1 | `/src/app/(app)/components/prompt-features/FunFactsManagementModal.tsx` |
| 2 | `/src/app/(app)/dashboard/google-business/components/modals/DisconnectConfirmModal.tsx` |
| 3 | `/src/app/(app)/dashboard/google-business/components/modals/FetchLocationsModal.tsx` |
| 4 | `/src/components/billing/SuccessModal.tsx` |
| 5 | `/src/features/concept-schedule/components/OverrideWarningModal.tsx` |
| 6 | `/src/app/(app)/components/ui/modal.tsx` (the component itself) |

### Already Has Correct Close Button (5)

| # | File |
|---|------|
| 1 | `/src/app/(app)/components/EmojiEmbedModal.tsx` |
| 2 | `/src/app/(app)/components/PromptPageEmbedModal.tsx` |
| 3 | `/src/app/(app)/components/RecentReviewsModal.tsx` |
| 4 | `/src/app/(app)/dashboard/rss-feeds/components/FeedFormModal.tsx` |
| 5 | `/src/app/(app)/dashboard/social-posting/components/CreatePostModal.tsx` |

### Keep As-Is - Specialized (3)

| # | File | Reason |
|---|------|--------|
| 1 | `/src/app/(app)/components/GlassSuccessModal.tsx` | Celebratory design - action buttons only |
| 2 | `/src/app/(app)/components/EmojiSentimentModal.tsx` | Selection only - no dismiss by design |
| 3 | `/src/app/components/EmojiSentimentModal.tsx` | Duplicate of above (public routes) |
| 4 | `/src/app/(app)/components/EmojiSentimentDemoModal.tsx` | Selection only - no dismiss by design |
| 5 | `/src/app/(app)/dashboard/widget/components/StyleModal.tsx` | Wrapper for DraggableModal |
| 6 | `/src/app/(app)/dashboard/widget/components/ReviewModal.tsx` | Complex drag/position behavior |
| 7 | `/src/app/(app)/dashboard/style/StyleModalPage.tsx` | Full page component, not a modal |

---

## Quick Fixes - Size/Style Update Only (8 modals)

Update `style={{ width: 36, height: 36 }}` to `style={{ width: 48, height: 48 }}` and fix styling.

| # | File | Current | Fix |
|---|------|---------|-----|
| 1 | `/src/app/(app)/components/QRCodeModal.tsx` | 36x36, white/70 bg | 48x48, white bg |
| 2 | `/src/app/(app)/components/help/HelpModal.tsx` | 36x36, white/70 bg | 48x48, white bg |
| 3 | `/src/app/(app)/components/PromptPageSettingsModal.tsx` | 36x36, white/70 bg | 48x48, white bg |
| 4 | `/src/app/(app)/components/PromptTypeSelectModal.tsx` | 36x36, white/70 bg | 48x48, white bg |
| 5 | `/src/app/(app)/components/prompt-features/KickstartersManagementModal.tsx` | 36x36, white/70 bg | 48x48, white bg |
| 6 | `/src/app/(app)/dashboard/google-business/components/modals/ImportReviewsModal.tsx` | 36x36 | 48x48 |
| 7 | `/src/app/(app)/dashboard/widget/components/DraggableModal.tsx` | 36x36, white/70 bg | 48x48, white bg |
| 8 | `/src/components/billing/PlanTransitionModal.tsx` | 32x32 (w-8 h-8) | 48x48, add red X |

---

## Duplicates to Verify (3 files)

These appear to be duplicates in `/src/app/components/` (public routes). Verify before consolidating:

| # | File | Likely Duplicate Of |
|---|------|---------------------|
| 1 | `/src/app/components/PricingModal.tsx` | `/src/app/(app)/components/PricingModal.tsx` |
| 2 | `/src/app/components/PromptTypeSelectModal.tsx` | `/src/app/(app)/components/PromptTypeSelectModal.tsx` |
| 3 | `/src/app/components/QRCodeModal.tsx` | `/src/app/(app)/components/QRCodeModal.tsx` |

---

## Implementation Phases

### Phase 0: Modal Component Enhancements
- Add `draggable` prop to centralized Modal
- Add `theme` prop with 'light' | 'dark' variants
- Test focus trapping with floating close button

### Phase 1: Quick Fixes
- Update 8 modals with size/style fixes (Category: Quick Fixes)

### Phase 2: Simple Migration Candidates
- Migrate simple form modals (items 1-7 from Migration Candidates)
- These have minimal state and map directly to Modal structure

### Phase 3: Feature Modal Migrations
- Migrate rank-tracking and LLM modals (items 8-15)
- These have moderate complexity but still fit Modal pattern

### Phase 4: Remaining Migrations
- Migrate SharePromptPageModal, FunFactsModal, KeywordInspirationModal, LocationSelectionModalV2
- FunFactsModal and KeywordInspirationModal need `draggable` prop

### Phase 5: Custom Modals - Close Button Updates
- Add floating close button to 17 custom modals
- Community modals (EditCommentModal, EditPostModal) can use `theme="dark"` once available

### Phase 6: Cleanup
- Verify and consolidate duplicate files
- Final QA pass
- Update CLAUDE.md if Modal component API changed

---

## Testing Checklist

For each modal update:

- [ ] Close button is visible (not clipped by overflow)
- [ ] Close button is 48x48px with white background (or dark theme equivalent)
- [ ] Red X icon is visible
- [ ] Button has `aria-label="Close modal"`
- [ ] Click closes the modal
- [ ] Escape key still works
- [ ] Backdrop click still works (if expected)
- [ ] Focus trapping includes close button (keyboard Tab reaches it)
- [ ] No visual regression on modal content
- [ ] Mobile responsive (close button not clipped on small screens)
- [ ] Run `npx tsc --noEmit` - no TypeScript errors

---

## Code Review Guidelines

1. **Verify close button matches spec** - 48x48, white bg, red X, correct position
2. **Check overflow handling** - Close button not clipped
3. **Preserve existing functionality** - Modal behavior unchanged
4. **Accessibility** - `aria-label="Close modal"` present
5. **No inline styles where classes work** - Exception: width/height for 48x48
6. **Remove old close button** - Don't leave duplicate close mechanisms
7. **Migration completeness** - All Dialog/Transition code replaced with Modal component
8. **Props mapping** - Size, title, onClose properly passed to Modal

---

## Summary

| Category | Count | Action |
|----------|-------|--------|
| Migrate to Modal component | 19 | Full migration |
| Keep custom, add close button | 17 | Add floating close button |
| Already correct | 14 | No changes |
| Quick size/style fix | 8 | Update dimensions |
| Keep as-is (no close button) | 4 | No changes |
| Duplicates to verify | 3 | Investigate |
| **Total** | **65** | |

---

*Last updated: 2026-01-18*

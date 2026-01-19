# Modal Standardization Plan

## ✅ IMPLEMENTATION COMPLETED - 2026-01-18

All phases of this plan have been executed successfully. Here's a summary of what was accomplished:

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 0 | Delete dead code, add `draggable` + `theme` props to Modal | ✅ Complete |
| Phase 1 | Quick fixes - standardize 8 close buttons | ✅ Complete |
| Phase 2 | Migrate 7 simple form modals | ✅ Complete |
| Phase 3 | Migrate 6 feature modals | ✅ Complete |
| Phase 4 | Migrate 2 remaining ready modals | ✅ Complete |
| Phase 5 | Fix and migrate CheckRankModal + RunAllLLMModal | ✅ Complete |
| Phase 6 | Migrate 2 draggable modals | ✅ Complete |
| Phase 7 | Add close buttons to custom modals | ✅ Complete |
| Phase 8 | Final cleanup and TypeScript check | ✅ Complete |

**Files Modified:** 30+ modal files standardized
**Files Deleted:** 3 dead code files removed
**TypeScript Check:** ✅ Passing

---

## Executive Summary

This document provides a complete inventory of all 65 modal files in the Prompt Reviews codebase with specific instructions for standardizing close buttons and migrating suitable modals to the centralized Modal component. The goal is to achieve consistent UX while reducing maintenance burden through consolidation.

**Strategy:**
- **15 modals** → Migrate to centralized `Modal` component (ready now)
- **2 modals** → Migrate after addressing issues (CheckRankModal, RunAllRankModal)
- **2 modals** → Migrate after `draggable` prop added (FunFactsModal, KeywordInspirationModal)
- **17 modals** → Keep custom, add standardized close button
- **14 modals** → Already correct or keep as-is
- **8 modals** → Quick size/style fix only
- **3 modals** → Delete (confirmed dead code)
- **4 modals** → Keep as-is (no close button by design)

---

## Phase 0: Modal Component Enhancements

Before migrating modals, enhance the centralized Modal component with new features.

### 0.1 Add `draggable` prop

Port drag functionality from existing `DraggableModal.tsx`:

```tsx
interface ModalProps {
  // ... existing props
  /** Enable drag-to-move functionality */
  draggable?: boolean;
}
```

**Implementation requirements (from DraggableModal analysis):**

| Feature | Details |
|---------|---------|
| **Libraries** | React hooks only (no external drag libraries) |
| **State** | `modalPos: {x, y}`, `isDragging: boolean`, `dragOffset: {x, y}` |
| **Events** | `handleMouseDown`, `handleMouseMove`, `handleMouseUp` |
| **Drag target** | `.modal-header` element with `cursor-move` class |
| **Initial position** | Center on screen: `x = (window.innerWidth - 576) / 2` |
| **Bounds** | Prevents negative positions only (can drag off-screen) |
| **Body scroll** | Lock with `document.body.style.overflow = 'hidden'` |

**Additional DraggableModal props to support:**
- `opaqueBody?: boolean` - Solid white vs glassmorphic body
- `lightBackdrop?: boolean` - Lighter backdrop for public pages

**Current DraggableModal issues to fix during port:**
- Close button is 36x36 → should be 48x48
- z-index is z-20 → should be z-50
- Missing touch event support (mobile)

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

## Migration Candidates - Ready Now (15 modals)

These modals have simple structure and are **ready to migrate immediately**.

### Simple Forms & Selection Modals (7)

| # | File | Size | Dialog Type | Notes |
|---|------|------|-------------|-------|
| 1 | `/src/app/(app)/components/BulkPromptTypeSelectModal.tsx` | md | Headless UI | Simple radio selection |
| 2 | `/src/app/(app)/components/UnifiedPromptTypeSelectModal.tsx` | md | Headless UI | Type selection + checkbox, has local state |
| 3 | `/src/app/(app)/components/FeedbackModal.tsx` | md | Manual div | Easy conversion, standard form |
| 4 | `/src/app/(app)/dashboard/rss-feeds/components/TestFeedModal.tsx` | 2xl | Headless UI | Has internal scroll (max-h-64) |
| 5 | `/src/app/(app)/dashboard/social-posting/components/EditScheduleModal.tsx` | md | Headless UI | Standard date/text form |
| 6 | `/src/app/(app)/work-manager/components/CreateBoardModal.tsx` | md | Manual div | Standard form |
| 7 | `/src/app/(app)/work-manager/components/CreateTaskModal.tsx` | lg | Manual div | Multi-field form, has max-h scroll |

### Feature Modals - Ready (6)

| # | File | Size | Dialog Type | Notes |
|---|------|------|-------------|-------|
| 8 | `/src/features/keywords/components/BulkDeleteModal.tsx` | lg | Headless UI | Scrollable keyword list (max-h-64) |
| 9 | `/src/features/llm-visibility/components/AddLLMConceptModal.tsx` | lg | Manual div | Dynamic question list (up to 10) |
| 10 | `/src/features/llm-visibility/components/CheckLLMModal.tsx` | md | Manual div | Multiple conditional states |
| 11 | `/src/features/rank-tracking/components/AddKeywordConceptModal.tsx` | md | Manual div | Simple form |
| 12 | `/src/features/rank-tracking/components/CheckVolumeModal.tsx` | md | Manual div | LocationPicker + compact result |
| 13 | `/src/features/geo-grid/components/AddKeywordsToGridModal.tsx` | 2xl | Headless UI | Already well-structured, easy swap |

### Other Ready Migrations (2)

| # | File | Size | Dialog Type | Notes |
|---|------|------|-------------|-------|
| 14 | `/src/app/(app)/components/communication/SharePromptPageModal.tsx` | lg | Headless UI | Tab switching + clipboard |
| 15 | `/src/components/GoogleBusinessProfile/LocationSelectionModalV2.tsx` | 3xl | Manual div | Search + selection, needs `allowOverflow` |

---

## Migration Candidates - Need Work First (2 modals)

### ⚠️ CheckRankModal - NESTED DIALOG ISSUE

**File:** `/src/features/rank-tracking/components/CheckRankModal.tsx`

**Problem:** Has a nested confirmation Dialog (lines 228-262) that creates a second z-50 overlay.
- Main modal uses z-50
- Nested dialog uses z-[60] for stacking
- This pattern is incompatible with single Modal structure

**Required fix before migration:**
1. Extract confirmation dialog into separate Modal component, OR
2. Convert to inline confirmation state within main modal body (recommended)

**Migration effort:** Medium-High

---

### ⚠️ RunAllRankModal - COMPLEX STATE MACHINE

**File:** `/src/features/rank-tracking/components/RunAllRankModal.tsx`

**Problem:** Has multiple conditional render states that dramatically change layout:
- Loading → Configuration → Running → Complete
- Backdrop click disabled during running state
- Schedule input fields have custom styling

**Required before migration:**
- Thorough testing of all state transitions
- Verify Modal handles dynamic content height changes

**Migration effort:** Medium

---

## Migration Candidates - Blocked (2 modals)

These require the `draggable` prop to be added to Modal first.

| # | File | Blocker | Notes |
|---|------|---------|-------|
| 17 | `/src/app/(app)/components/FunFactsModal.tsx` | Needs `draggable` | Uses DraggableModal with `opaqueBody`, `lightBackdrop` |
| 18 | `/src/app/(app)/components/KeywordInspirationModal.tsx` | Needs `draggable` | Uses DraggableModal with `opaqueBody`, `lightBackdrop` |

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

### Keep As-Is - Specialized (7)

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

**Code review findings:** 6 modals are consistent (36x36, white/70 bg), 2 have different patterns.

### Consistent Pattern (6 modals) - Same fix for all

Update from:
```tsx
className="... bg-white/70 backdrop-blur-sm border border-white/40 ... z-20"
style={{ width: 36, height: 36 }}
```

To:
```tsx
className="... bg-white border border-gray-200 ... z-50"
style={{ width: 48, height: 48 }}
```

| # | File | Lines | Current |
|---|------|-------|---------|
| 1 | `/src/app/(app)/components/QRCodeModal.tsx` | 203-212 | 36x36, white/70, white/40 border |
| 2 | `/src/app/(app)/components/help/HelpModal.tsx` | 76-83 | 36x36, white/70, white/40 border |
| 3 | `/src/app/(app)/components/PromptPageSettingsModal.tsx` | 301-311 | 36x36, white/70, white/40 border |
| 4 | `/src/app/(app)/components/PromptTypeSelectModal.tsx` | 45-52 | 36x36, white/70, white/40 border |
| 5 | `/src/app/(app)/components/prompt-features/KickstartersManagementModal.tsx` | 289-296 | 36x36, white/70, white/40 border |
| 6 | `/src/app/(app)/dashboard/widget/components/DraggableModal.tsx` | 118-127 | 36x36, white/70, white/40 border |

### Different Pattern - ImportReviewsModal

| # | File | Lines | Current | Notes |
|---|------|-------|---------|-------|
| 7 | `/src/app/(app)/dashboard/google-business/components/modals/ImportReviewsModal.tsx` | 54-63 | 36x36, opaque white, gray-200 border | Already closer to spec, just update size |

### Different Pattern - PlanTransitionModal

| # | File | Lines | Current | Notes |
|---|------|-------|---------|-------|
| 8 | `/src/components/billing/PlanTransitionModal.tsx` | 39-48 | **32x32 (w-8 h-8)**, no border | Needs full restyle + red X icon |

---

## Dead Code - DELETE (3 files)

**Code review confirmed:** All 3 files are not imported anywhere and are obsolete versions.

| # | File | Reason | Action |
|---|------|--------|--------|
| 1 | `/src/app/components/PricingModal.tsx` | 292 lines, no billing toggle, static prices | **DELETE** |
| 2 | `/src/app/components/PromptTypeSelectModal.tsx` | 78 lines, older design without glassmorphism | **DELETE** |
| 3 | `/src/app/components/QRCodeModal.tsx` | 242 lines vs 944 in newer version, basic features only | **DELETE** |

**Root cause:** Codebase restructuring moved authenticated routes into `(app)` route group but old files weren't cleaned up.

---

## Implementation Phases

### Phase 0: Prep Work
1. **Delete dead code** - Remove 3 obsolete modal files
2. **Add `draggable` prop** to centralized Modal (port from DraggableModal)
3. **Add `theme` prop** with 'light' | 'dark' variants
4. **Test focus trapping** with floating close button

### Phase 1: Quick Fixes
- Update 8 modals with size/style fixes
- PlanTransitionModal needs full restyle

### Phase 2: Simple Form Migrations (7 modals)
- BulkPromptTypeSelectModal, UnifiedPromptTypeSelectModal, FeedbackModal
- TestFeedModal, EditScheduleModal, CreateBoardModal, CreateTaskModal
- Start with Headless UI Dialog modals (easier), then manual div modals

### Phase 3: Feature Modal Migrations (6 modals)
- BulkDeleteModal, AddLLMConceptModal, CheckLLMModal
- AddKeywordConceptModal, CheckVolumeModal, AddKeywordsToGridModal

### Phase 4: Remaining Ready Migrations (2 modals)
- SharePromptPageModal, LocationSelectionModalV2

### Phase 5: Fix & Migrate Problem Modals (2 modals)
- **CheckRankModal** - Extract nested dialog first, then migrate
- **RunAllRankModal** - Test all state transitions, then migrate

### Phase 6: Draggable Migrations (2 modals)
- FunFactsModal, KeywordInspirationModal (after Phase 0 `draggable` prop)

### Phase 7: Custom Modals - Close Button Updates (17 modals)
- Add floating close button to all custom modals
- Community modals can use `theme="dark"` once available

### Phase 8: Final Cleanup
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

**For draggable modals:**
- [ ] Drag by header works
- [ ] Modal centers on open
- [ ] Body scroll is locked while open
- [ ] Position resets on close/reopen

**For migrations:**
- [ ] All Dialog/Transition code replaced with Modal component
- [ ] Props mapped correctly (size, title, onClose)
- [ ] State management preserved
- [ ] Footer buttons in Modal.Footer

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
| Migrate to Modal (ready now) | 15 | Full migration |
| Migrate after fixes | 2 | CheckRankModal, RunAllRankModal |
| Migrate after draggable | 2 | FunFactsModal, KeywordInspirationModal |
| Keep custom, add close button | 17 | Add floating close button |
| Already correct | 14 | No changes |
| Quick size/style fix | 8 | Update dimensions |
| Keep as-is (no close button) | 4 | No changes |
| Delete (dead code) | 3 | Remove files |
| **Total** | **65** | |

---

*Last updated: 2026-01-18*
*Code review completed: All categories verified*

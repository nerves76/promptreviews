# Keyword Concepts Components Unification Plan

## Overview
Unify and optimize the `KeywordDetailsSidebar` and `ConceptCard` components by extracting shared components, unifying hooks, and adding missing features to each.

## Files Involved
- `src/features/keywords/components/KeywordDetailsSidebar.tsx` (1919 lines)
- `src/features/keywords/components/ConceptCard.tsx` (1200 lines)
- `src/features/keywords/keywordUtils.ts` (shared utilities)

## Tasks

### Task 1: Extract Shared Utilities to keywordUtils.ts
**File:** `src/features/keywords/keywordUtils.ts`

Add these functions that are currently duplicated:
- `formatVolume(vol: number | null): string` - format volume display (<10, 1.2K, etc.)
- `buildQuestionLLMMap(llmResults)` - build question → provider → result map
- `getCompetitionColor(level: string | null): string` - competition badge colors

### Task 2: Create SearchTermRow Component
**New file:** `src/features/keywords/components/SearchTermRow.tsx`

A shared component for rendering a single search term with:
- Term name with canonical star icon
- Volume data (value, location, age)
- Competition badge
- Rank data per location (if available)
- Action buttons: "Check volume", "Check rank"
- Edit mode: remove button, set canonical button

Props:
```typescript
interface SearchTermRowProps {
  term: SearchTerm;
  volumeData?: ResearchResultData | null;
  rankings?: RankingData[];
  isEditing?: boolean;
  isCanonicalEditable?: boolean;
  onRemove?: () => void;
  onSetCanonical?: () => void;
  onCheckVolume?: () => void;
  onCheckRank?: () => void;
  isCheckingVolume?: boolean;
  disabled?: boolean;
}
```

### Task 3: Create QuestionRow Component
**New file:** `src/features/keywords/components/QuestionRow.tsx`

A shared component for rendering a single AI visibility question with:
- Question text
- Funnel stage badge (editable in edit mode)
- LLM citation status (X/Y cited)
- Last checked date
- Action buttons: "Check" / "Re-check"
- Expandable details showing per-provider results (optional)
- Edit mode: remove button, funnel stage selector

Props:
```typescript
interface QuestionRowProps {
  question: RelatedQuestion;
  index: number;
  llmResults?: Map<LLMProvider, { domainCited: boolean; citationPosition?: number | null; checkedAt: string }>;
  isEditing?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onRemove?: () => void;
  onUpdateFunnel?: (stage: FunnelStage) => void;
  onCheck?: () => void;
  isChecking?: boolean;
  selectedProviders?: LLMProvider[];
}
```

### Task 4: Create FunnelStageGroup Component
**New file:** `src/features/keywords/components/FunnelStageGroup.tsx`

A shared component for rendering questions grouped by funnel stage:
- Stage header with colored badge
- List of QuestionRow components
- Handles the grouping logic

Props:
```typescript
interface FunnelStageGroupProps {
  stage: FunnelStage;
  questions: Array<RelatedQuestion & { originalIndex: number }>;
  llmResultsMap: Map<string, Map<LLMProvider, {...}>>;
  isEditing?: boolean;
  expandedIndex?: number | null;
  onToggleExpand?: (index: number) => void;
  onRemoveQuestion?: (index: number) => void;
  onUpdateFunnel?: (index: number, stage: FunnelStage) => void;
  onCheckQuestion?: (index: number, question: string) => void;
  checkingIndex?: number | null;
  selectedProviders?: LLMProvider[];
}
```

### Task 5: Create DiscoveredQuestionsSection Component
**New file:** `src/features/keywords/components/DiscoveredQuestionsSection.tsx`

Extract the "Questions from Google" section from Sidebar so it can be used in both:
- Shows PAA questions discovered from SERP
- Click to add to tracked questions
- Shows if question is already saved
- Respects 20 question limit

Props:
```typescript
interface DiscoveredQuestionsSectionProps {
  discoveredQuestions: DiscoveredQuestion[];
  existingQuestions: RelatedQuestion[];
  maxQuestions?: number;
  isEditingQuestions?: boolean;
  onAddQuestion: (question: string) => void;
}
```

### Task 6: Create AIEnrichButton Component
**New file:** `src/features/keywords/components/AIEnrichButton.tsx`

Shared AI enrichment button with overwrite warning:
- Shows "Auto-fill with AI (1 credit)" button
- If data exists, shows overwrite warning with options:
  - "Fill empty only"
  - "Replace all"
  - "Cancel"
- Loading and error states

Props:
```typescript
interface AIEnrichButtonProps {
  hasExistingData: boolean;
  hasEmptyFields: boolean;
  isEnriching: boolean;
  enrichError?: string | null;
  enrichSuccess?: boolean;
  onEnrich: (fillEmptyOnly: boolean) => void;
  className?: string;
}
```

### Task 7: Update ConceptCard to Use Shared Components
**File:** `src/features/keywords/components/ConceptCard.tsx`

Changes:
1. Import and use `SearchTermRow` instead of inline rendering
2. Import and use `QuestionRow` and `FunnelStageGroup` instead of inline rendering
3. Import and use `AIEnrichButton` instead of inline button
4. Add `DiscoveredQuestionsSection` (need to get discovered questions from enrichedData)
5. Use `useRelatedQuestions` hook instead of manual state
6. Use shared utilities from `keywordUtils.ts`

### Task 8: Update KeywordDetailsSidebar to Use Shared Components
**File:** `src/features/keywords/components/KeywordDetailsSidebar.tsx`

Changes:
1. Import and use `SearchTermRow` instead of inline rendering
2. Import and use `QuestionRow` and `FunnelStageGroup` instead of inline rendering
3. Import and use `AIEnrichButton` with overwrite warning (currently missing)
4. Import and use `DiscoveredQuestionsSection` instead of inline rendering
5. Use shared utilities from `keywordUtils.ts`

### Task 9: Update EnrichmentData Type to Include Discovered Questions
**File:** `src/features/keywords/components/KeywordManager.tsx` (or types file)

Update `EnrichmentData` interface to include:
```typescript
interface EnrichmentData {
  volumeData: ResearchResultData[];
  rankStatus: RankStatusData | null;
  llmResults: LLMVisibilityResult[];
  discoveredQuestions?: DiscoveredQuestion[]; // Add this
}
```

Ensure the parent component fetches discovered questions as part of enrichment.

### Task 10: Consider Section-Based Editing for ConceptCard (Optional)
**File:** `src/features/keywords/components/ConceptCard.tsx`

Evaluate adding section-based editing similar to sidebar:
- `isEditingSearchTerms`
- `isEditingQuestions`
- `isEditingReviews`

This would allow users to edit one section without affecting others. May add complexity - implement if UX testing shows it's needed.

## Execution Order

**Phase 1: Foundations (can run in parallel)**
- Task 1: Extract shared utilities
- Task 2: Create SearchTermRow
- Task 3: Create QuestionRow
- Task 4: Create FunnelStageGroup
- Task 5: Create DiscoveredQuestionsSection
- Task 6: Create AIEnrichButton

**Phase 2: Integration (sequential, after Phase 1)**
- Task 9: Update EnrichmentData type
- Task 7: Update ConceptCard
- Task 8: Update Sidebar

**Phase 3: Polish (after Phase 2)**
- Task 10: Evaluate section-based editing
- Test both components work correctly
- Verify no regressions

## Success Criteria
- [ ] Both components render identically to before (no visual regressions)
- [ ] Shared components work in both contexts
- [ ] ConceptCard has discovered questions feature
- [ ] Sidebar has overwrite warning for AI enrichment
- [ ] Both use `useRelatedQuestions` hook
- [ ] Code is DRY - no duplicated logic between components
- [ ] TypeScript compiles with no errors

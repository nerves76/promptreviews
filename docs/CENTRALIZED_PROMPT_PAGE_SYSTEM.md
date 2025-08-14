# Centralized Prompt Page System

## Overview

The centralized prompt page system provides a unified approach to managing prompt page forms with shared features, consistent loading states, and improved maintainability. This document outlines the system architecture, implementation details, and current status.

## System Architecture

### Core Components

#### 1. Base Form Component (`BasePromptPageForm.tsx`)
- **Purpose**: Provides a foundational structure for all prompt page forms
- **Features**: 
  - Common form layout and styling
  - Shared state management
  - Standardized save/publish functionality
  - Loading state management
  - Error handling

#### 2. Shared Feature Components
Located in `src/app/components/prompt-features/`:

- **`PersonalizedNoteFeature.tsx`**: Handles friendly note popup functionality
- **`EmojiSentimentFeature.tsx`**: Manages emoji sentiment flow configuration
- **`FallingStarsFeature.tsx`**: Controls falling stars animation settings
- **`AISettingsFeature.tsx`**: Manages AI generation toggles
- **`OfferFeature.tsx`**: Handles special offer display
- **`ReviewPlatformsFeature.tsx`**: Manages review platform configuration
- **`KickstartersFeature.tsx`**: Manages review inspiration questions
- **`RecentReviewsFeature.tsx`**: Manages recent reviews display

#### 3. Enhanced ReviewWriteSection
- **Loading State**: Added `aiGeneratingIndex` prop for AI generation loading
- **Visual Feedback**: Spinner animation and "Generating..." text
- **Disabled State**: Prevents multiple simultaneous generations

## Current Implementation Status

### ✅ Completed Components

#### ServicePromptPageForm
- **File**: `src/app/components/ServicePromptPageForm.tsx`
- **Features**:
  - ✅ Business profile service pre-population
  - ✅ Conflict modal for popup features
  - ✅ AI generation loading states
  - ✅ Service inheritance from business profile
  - ✅ Comprehensive error handling
  - ✅ Fixed React Hook errors (moved hooks before early returns)

#### ProductPromptPageForm
- **File**: `src/app/components/ProductPromptPageForm.tsx`
- **Features**:
  - ✅ AI generation loading states
  - ✅ Standardized form structure
  - ✅ Enhanced user feedback

#### PhotoPromptPageForm
- **File**: `src/app/components/PhotoPromptPageForm.tsx`
- **Features**:
  - ✅ Integrated shared feature components
  - ✅ AI generation loading states
  - ✅ Enhanced user feedback
  - ✅ Emoji sentiment functionality

#### EventPromptPageForm
- **File**: `src/app/components/EventPromptPageForm.tsx`
- **Features**:
  - ✅ AI generation loading states
  - ✅ Shared feature components integration
  - ✅ Standardized form structure

#### EmployeePromptPageForm
- **File**: `src/app/components/EmployeePromptPageForm.tsx`
- **Features**:
  - ✅ AI generation loading states
  - ✅ Shared feature components integration
  - ✅ Standardized form structure

#### ReviewWriteSection
- **File**: `src/app/dashboard/edit-prompt-page/components/ReviewWriteSection.tsx`
- **Features**:
  - ✅ Loading state management (`aiGeneratingIndex`)
  - ✅ Visual feedback during AI generation
  - ✅ Disabled state during processing
  - ✅ Consistent styling across all forms

### 🔄 Partially Completed Components

#### UniversalPromptPageForm
- **File**: `src/app/dashboard/edit-prompt-page/universal/UniversalPromptPageForm.tsx`
- **Current Status**: **PARTIALLY STANDARDIZED**
- **Completed Features**:
  - ✅ Uses shared prompt-features components
  - ✅ AI generation loading states
  - ✅ Standardized form structure
  - ✅ Business defaults fallback logic
- **Remaining Issues**:
  - ❌ Still uses `useImperativeHandle` (line 206)
  - ❌ Custom ref-based form submission
  - ❌ Different state initialization patterns
  - ❌ Custom hooks like `useFallingStars`

**Note**: The Universal prompt page has been partially migrated to use shared components but still retains some legacy architecture patterns. See `docs/UNIVERSAL_PROMPT_PAGE_STANDARDIZATION_PLAN.md` for the complete standardization plan.

### System Benefits Achieved

- **Consistency**: Most forms now have uniform loading states and user feedback
- **Maintainability**: Shared components reduce code duplication
- **Performance**: Optimized loading states prevent multiple simultaneous AI generations
- **Developer Experience**: Clear patterns and reusable components
- **User Experience**: Consistent visual feedback across most forms

### 🔄 Remaining Work

#### Universal Prompt Page Standardization
**Priority**: High
**Estimated Effort**: 1-2 days

**Required Changes**:
1. Remove `useImperativeHandle` and ref-based submission
2. Implement standard form submission pattern
3. Remove custom `useFallingStars` hook
4. Use standard state initialization patterns
5. Complete integration with shared components

**Benefits After Completion**:
- Complete architectural consistency
- Easier maintenance and updates
- Better error handling
- Improved user experience

## Implementation Details

### Shared Feature Components Usage

All standardized forms use the same shared components:

```tsx
import { 
  OfferFeature,
  EmojiSentimentFeature,
  FallingStarsFeature,
  AISettingsFeature,
  PersonalizedNoteFeature,
  KickstartersFeature,
  RecentReviewsFeature
} from "@/app/components/prompt-features";

// Usage in forms
<OfferFeature 
  enabled={offerEnabled}
  onEnabledChange={setOfferEnabled}
  title={offerTitle}
  onTitleChange={setOfferTitle}
  // ... other props
/>
```

### AI Generation Loading States

All forms implement consistent AI generation loading:

```tsx
const [aiGeneratingIndex, setAiGeneratingIndex] = useState<number | null>(null);

const handleGenerateAIReview = async (index: number) => {
  setAiGeneratingIndex(index);
  try {
    // AI generation logic
  } finally {
    setAiGeneratingIndex(null);
  }
};

// In ReviewWriteSection
<ReviewWriteSection 
  aiGeneratingIndex={aiGeneratingIndex}
  onGenerateReview={handleGenerateAIReview}
  // ... other props
/>
```

### Business Defaults Fallback Logic

Universal and other forms implement consistent fallback logic:

```tsx
const mergedOfferEnabled = 
  universalPage.offerEnabled ?? businessProfile.default_offer_enabled;
const mergedOfferTitle = 
  universalPage.offerTitle || businessProfile.default_offer_title;
const mergedReviewPlatforms = universalPage.reviewPlatforms?.length
  ? universalPage.reviewPlatforms
  : businessProfile.review_platforms;
```

## Migration Status Summary

### ✅ Fully Standardized (5 forms)
- ServicePromptPageForm
- ProductPromptPageForm
- PhotoPromptPageForm
- EventPromptPageForm
- EmployeePromptPageForm

### 🔄 Partially Standardized (1 form)
- UniversalPromptPageForm (uses shared components but retains legacy patterns)

### 📊 Progress Metrics
- **Total Forms**: 6
- **Fully Standardized**: 5 (83%)
- **Partially Standardized**: 1 (17%)
- **Overall Progress**: 90% complete

## Next Steps

### Immediate Priority
1. **Complete Universal Prompt Page Standardization**
   - Remove `useImperativeHandle`
   - Implement standard form submission
   - Remove custom hooks
   - Test thoroughly

### Future Enhancements
1. **Add New Shared Features**
   - Additional prompt page features as needed
   - Enhanced AI generation options
   - More customization options

2. **Performance Optimizations**
   - Lazy loading for feature components
   - Optimized state management
   - Better error boundaries

## Testing and Validation

### Standardization Checklist
For each form, verify:
- [ ] Uses shared prompt-features components
- [ ] Implements AI generation loading states
- [ ] Uses standard form submission patterns
- [ ] Implements business defaults fallback
- [ ] Has consistent error handling
- [ ] Passes all visual regression tests

### Performance Validation
- [ ] AI generation doesn't block UI
- [ ] Loading states provide clear feedback
- [ ] Form submission is reliable
- [ ] No memory leaks from state management

---

**Last Updated**: January 2025  
**Overall Progress**: 90% Complete  
**Next Priority**: Universal Prompt Page Standardization  
**Estimated Completion**: 1-2 days 
# Universal Prompt Page Standardization Plan

## Executive Summary

The Universal prompt page currently uses **completely different architecture** than other prompt page types, creating maintenance overhead, bugs, and inconsistent user experience. This plan outlines the refactoring needed to standardize the Universal page with the existing modular prompt page system.

## Current Architectural Problems

### Universal Prompt Page (Broken Architecture)
- **Location**: `src/app/dashboard/edit-prompt-page/universal/UniversalPromptPageForm.tsx`
- **Architecture**: Custom standalone form with:
  - ❌ **Custom save logic** with direct database mapping
  - ❌ **useImperativeHandle** and **ref-based** form submission  
  - ❌ **Different state initialization** patterns
  - ❌ **Custom hooks** like `useFallingStars`
  - ❌ **Separate form structure** from all other forms
  - ❌ **Business defaults fallback** handled differently

### Individual Prompt Pages (Correct Architecture)
- **Examples**: `ServicePromptPageForm.tsx`, `EventPromptPageForm.tsx`, `ProductPromptPageForm.tsx`
- **Architecture**: Standardized modular system with:
  - ✅ **Consistent form submission** using standard patterns
  - ✅ **Shared prompt-features components** (OfferFeature, EmojiSentimentFeature, etc.)
  - ✅ **BasePromptPageForm** architecture for common functionality
  - ✅ **Standard state management** patterns
  - ✅ **Consistent save/publish flow** using `mapToDbColumns` function
  - ✅ **Modular sections** for easy maintenance

## Proposed Solution: Create UniversalPromptPageForm.tsx (Standardized)

### Step 1: Create New Standardized Universal Form

**Location**: `src/app/components/UniversalPromptPageForm.tsx`

**Architecture**: Follow the same pattern as other forms:

```typescript
interface UniversalPromptPageFormProps {
  mode: "create" | "edit";
  initialData: any;
  onSave: (data: any) => void;
  onPublish?: (data: any) => void;
  pageTitle: string;
  supabase: any;
  businessProfile: any;
  isUniversal?: boolean;
  onPublishSuccess?: (slug: string) => void;
  campaignType: string;
  onGenerateReview?: (index: number) => void;
}

export default function UniversalPromptPageForm({
  mode,
  initialData,
  onSave,
  onPublish,
  pageTitle,
  supabase,
  businessProfile,
  isUniversal = true, // Always true for universal forms
  onPublishSuccess,
  campaignType = 'public', // Universal is always public
  onGenerateReview,
}: UniversalPromptPageFormProps) {
  // Standard state management using same patterns as other forms
  // Use shared prompt-features components
  // Standard form submission flow
}
```

### Step 2: Universal-Specific Features

The Universal form should include sections relevant to universal pages:

#### Core Universal Sections:
1. **Basic Information** (same as others)
   - Page title/description (handled by parent component)

2. **Shared Prompt Features** (using existing components):
   - `OfferFeature` - Special offers
   - `EmojiSentimentFeature` - Emoji sentiment flow
   - `FallingStarsFeature` - Falling stars animation
   - `AISettingsFeature` - AI generation settings
   - `PersonalizedNoteFeature` - Friendly note popup
   - `KickstartersFeature` - Review inspiration questions
   - `RecentReviewsFeature` - Recent reviews display

3. **Review Platforms Section**:
   - Use existing `ReviewWriteSection` component
   - Business defaults fallback for platforms

4. **Business Defaults Fallback Logic**:
   - Implement same fallback pattern as other forms
   - Use business profile values when universal values are null/empty

### Step 3: Remove Custom Hooks and Logic

**Current Issues to Fix**:
- ❌ Remove `useImperativeHandle` and ref-based submission
- ❌ Remove custom `useFallingStars` hook (use standard feature component)
- ❌ Remove direct database mapping in form component
- ❌ Remove custom state initialization patterns

**Replace With**:
- ✅ Standard form submission using parent component's `onSave` callback
- ✅ Use `FallingStarsFeature` component instead of custom hook
- ✅ Use `mapToDbColumns` function for data mapping (handled by parent)
- ✅ Standard state initialization patterns from other forms

### Step 4: Update Parent Page Component

**File**: `src/app/dashboard/edit-prompt-page/universal/page.tsx`

**Changes Needed**:
1. **Remove ref-based submission**:
   ```typescript
   // Remove:
   const formRef = useRef<any>(null);
   const handleFormSave = () => {
     if (formRef.current) {
       formRef.current.handleSubmit();
     }
   };
   
   // Replace with standard callback:
   const handleFormSave = (formData: any) => {
     // Standard save logic using mapToDbColumns
   };
   ```

2. **Use mapToDbColumns function**:
   ```typescript
   import { mapToDbColumns } from '@/utils/promptPageMapping';
   
   const handleFormSave = async (formData: any) => {
     const dbData = mapToDbColumns(formData, 'universal');
     // Save to database
   };
   ```

3. **Standard form props**:
   ```typescript
   <UniversalPromptPageForm
     mode={mode}
     initialData={initialData}
     onSave={handleFormSave}
     onPublish={handleFormPublish}
     pageTitle="Universal Prompt Page"
     supabase={supabase}
     businessProfile={businessProfile}
     isUniversal={true}
     campaignType="public"
   />
   ```

## Implementation Plan

### Phase 1: Create New Universal Form (2-3 hours)
1. **Create** `src/app/components/UniversalPromptPageForm.tsx`
2. **Copy structure** from `ServicePromptPageForm.tsx` as template
3. **Implement universal-specific sections** using existing prompt-features
4. **Add business defaults fallback logic**
5. **Remove universal-specific logic** (no customer details, no campaign naming)

### Phase 2: Update Parent Component (1 hour)
1. **Modify** `src/app/dashboard/edit-prompt-page/universal/page.tsx`
2. **Remove ref-based submission logic**
3. **Add standard save/publish callbacks**
4. **Import and use new UniversalPromptPageForm**

### Phase 3: Add Universal Routing (30 minutes)
1. **Update** `src/app/components/PromptPageForm.tsx` (main router)
2. **Add universal routing logic**:
   ```typescript
   if (formData.review_type === "universal" || isUniversal) {
     return <UniversalPromptPageForm ... />
   }
   ```

### Phase 4: Testing & Cleanup (1 hour)
1. **Test universal page creation/editing**
2. **Verify business defaults fallback**
3. **Test all prompt features work correctly**
4. **Remove old UniversalPromptPageForm.tsx**
5. **Update any imports/references**

### Phase 5: Documentation Update (30 minutes)
1. **Update PROMPT_PAGE_REFACTORING_README.md**
2. **Add universal form to completed components**
3. **Update architectural documentation**

## Business Defaults Fallback Implementation

The new Universal form should implement the same fallback pattern as other forms:

```typescript
// For each feature, use business profile as fallback
const getValueWithFallback = (universalValue: any, businessValue: any) => {
  return universalValue !== null && universalValue !== undefined && universalValue !== '' 
    ? universalValue 
    : businessValue;
};

// Example usage:
const offerTitle = getValueWithFallback(
  initialData?.offerTitle,
  businessProfile?.default_offer_title
);
```

## Benefits of Standardization

### 1. **Consistent Maintenance**
- ✅ All forms use same architecture
- ✅ Bug fixes apply to all forms
- ✅ New features can be added globally

### 2. **Reduced Complexity**
- ✅ Remove custom hooks and imperative logic
- ✅ Standard state management patterns
- ✅ Consistent form submission flow

### 3. **Better Testing**
- ✅ Same testing patterns for all forms
- ✅ Shared component testing
- ✅ Consistent user experience

### 4. **Easier Feature Development**
- ✅ New prompt features work across all forms
- ✅ Shared component library
- ✅ Consistent business defaults handling

## Files That Will Be Modified

### New Files:
- `src/app/components/UniversalPromptPageForm.tsx`

### Modified Files:
- `src/app/dashboard/edit-prompt-page/universal/page.tsx`
- `src/app/components/PromptPageForm.tsx` (router)
- `PROMPT_PAGE_REFACTORING_README.md`

### Deprecated Files:
- `src/app/dashboard/edit-prompt-page/universal/UniversalPromptPageForm.tsx`

## Risk Mitigation

### 1. **Backup Current Implementation**
- Keep old file as backup during development
- Test new implementation thoroughly before removal

### 2. **Gradual Migration**
- Implement new form first
- Test alongside old implementation
- Switch over only when fully working

### 3. **Business Logic Preservation**
- Carefully migrate business defaults fallback logic
- Ensure all existing features are preserved
- Test with real business profile data

## Success Criteria

### ✅ **Architecture Consistency**
- Universal form uses same structure as Service/Event/Product forms
- No more ref-based submission or custom hooks
- Standard save/publish flow

### ✅ **Feature Parity**  
- All existing universal features work correctly
- Business defaults fallback preserved
- No regression in functionality

### ✅ **Code Quality**
- Follows same patterns as other forms
- Uses shared prompt-features components
- Clean, maintainable code structure

### ✅ **User Experience**
- Same editing experience as other prompt pages
- Consistent behavior and styling
- Improved performance and reliability

## Timeline Estimate

**Total Time**: 5-6 hours

- **Phase 1**: 2-3 hours (New form creation)
- **Phase 2**: 1 hour (Parent component update)  
- **Phase 3**: 30 minutes (Router update)
- **Phase 4**: 1 hour (Testing & cleanup)
- **Phase 5**: 30 minutes (Documentation)

This refactoring will eliminate the architectural inconsistency that has caused multiple bugs and will significantly improve the maintainability of the prompt page system.
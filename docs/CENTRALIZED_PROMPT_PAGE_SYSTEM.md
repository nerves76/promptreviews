# Centralized Prompt Page System

## Overview

The new centralized prompt page system provides a unified approach to managing prompt page forms with shared features, consistent loading states, and improved maintainability. This document outlines the system architecture, implementation details, and rollout plan.

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

#### ReviewWriteSection
- **File**: `src/app/dashboard/edit-prompt-page/components/ReviewWriteSection.tsx`
- **Features**:
  - ✅ Loading state management (`aiGeneratingIndex`)
  - ✅ Visual feedback during AI generation
  - ✅ Disabled state during processing
  - ✅ Consistent styling across all forms

### 🎉 Migration Complete!

All prompt page forms have been successfully migrated to the centralized system:

1. **PhotoPromptPageForm** - ✅ **COMPLETED**
   - Integrated shared feature components (PersonalizedNoteFeature, EmojiSentimentFeature, etc.)
   - Added AI generation loading states
   - Updated form submission to include all new state variables

2. **EventPromptPageForm** - ✅ **COMPLETED**
   - Added AI generation loading states
   - Updated ReviewWriteSection with aiGeneratingIndex prop

3. **EmployeePromptPageForm** - ✅ **COMPLETED**
   - Added AI generation loading states
   - Updated ReviewWriteSection with aiGeneratingIndex prop

4. **UniversalPromptPageForm** - ✅ **COMPLETED**
   - Added AI generation loading states
   - Added handleGenerateAIReview function

### System Benefits Achieved

- **Consistency**: All forms now have uniform loading states and user feedback
- **Maintainability**: Shared components reduce code duplication
- **Performance**: Optimized loading states prevent multiple simultaneous AI generations
- **Developer Experience**: Clear patterns and reusable components
- **User Experience**: Consistent visual feedback across all forms

### 🔄 Pending Implementation

#### Forms Requiring Updates
1. **PhotoPromptPageForm** (`src/app/components/PhotoPromptPageForm.tsx`) - ✅ **COMPLETED**
   - ✅ Added AI generation loading states
   - ✅ Integrated shared feature components
   - ✅ Added emoji sentiment functionality
   - ✅ Updated form submission to include all new state variables

2. **EventPromptPageForm** (`src/app/components/EventPromptPageForm.tsx`) - ✅ **COMPLETED**
   - ✅ Added AI generation loading states
   - ✅ Updated ReviewWriteSection with aiGeneratingIndex prop

3. **EmployeePromptPageForm** (`src/app/components/EmployeePromptPageForm.tsx`) - ✅ **COMPLETED**
   - ✅ Added AI generation loading states
   - ✅ Updated ReviewWriteSection with aiGeneratingIndex prop

4. **UniversalPromptPageForm** (`src/app/dashboard/edit-prompt-page/universal/UniversalPromptPageForm.tsx`) - ✅ **COMPLETED**
   - ✅ Added AI generation loading states
   - ✅ Added handleGenerateAIReview function

## Rollout Plan

### Phase 1: Analysis and Preparation

#### Step 1: Audit Current Forms
```bash
# Identify all prompt page forms
find src/app/components -name "*PromptPageForm.tsx"
find src/app/dashboard/edit-prompt-page -name "*PromptPageForm.tsx"
```

#### Step 2: Document Current State
For each form, document:
- Current feature implementations
- Unique functionality
- Dependencies and imports
- State management patterns

### Phase 2: Standardization

#### Step 1: Add Loading States
For each form, implement:
```typescript
// Add loading state
const [aiGeneratingIndex, setAiGeneratingIndex] = useState<number | null>(null);

// Update handleGenerateAIReview function
const handleGenerateAIReview = async (idx: number) => {
  setAiGeneratingIndex(idx);
  try {
    // ... existing generation logic
  } catch (error) {
    console.error("Failed to generate AI review:", error);
  } finally {
    setAiGeneratingIndex(null);
  }
};

// Update ReviewWriteSection call
<ReviewWriteSection
  value={formData.review_platforms || []}
  onChange={(platforms) => updateFormData('review_platforms', platforms)}
  onGenerateReview={handleGenerateAIReview}
  hideReviewTemplateFields={campaignType === 'public'}
  aiGeneratingIndex={aiGeneratingIndex}
/>
```

#### Step 2: Implement Shared Features
For each form, replace custom implementations with shared components:

```typescript
// Replace custom personalized note section with:
<PersonalizedNoteFeature
  enabled={formData.show_friendly_note}
  onToggle={() => updateFormData('show_friendly_note', !formData.show_friendly_note)}
  content={formData.friendly_note}
  onContentChange={(content) => updateFormData('friendly_note', content)}
  disabled={emojiSentimentEnabled}
/>

// Replace custom emoji sentiment section with:
<EmojiSentimentFeature
  enabled={emojiSentimentEnabled}
  onToggle={() => setEmojiSentimentEnabled(!emojiSentimentEnabled)}
  // ... other props
  disabled={formData.show_friendly_note}
/>

// Replace custom falling stars section with:
<FallingStarsFeature
  enabled={formData.fallingEnabled}
  onToggle={() => updateFormData('fallingEnabled', !formData.fallingEnabled)}
  icon={formData.falling_icon}
  onIconChange={(icon) => updateFormData('falling_icon', icon)}
  color={formData.falling_icon_color}
  onColorChange={(color) => updateFormData('falling_icon_color', color)}
/>

// Replace custom AI settings section with:
<AISettingsFeature
  aiGenerationEnabled={formData.aiButtonEnabled}
  fixGrammarEnabled={fixGrammarEnabled}
  onAIEnabledChange={(enabled) => updateFormData('aiButtonEnabled', enabled)}
  onGrammarEnabledChange={setFixGrammarEnabled}
/>

// Replace custom offer section with:
<OfferFeature
  enabled={formData.offer_enabled}
  onToggle={() => updateFormData('offer_enabled', !formData.offer_enabled)}
  title={formData.offer_title}
  onTitleChange={(title) => updateFormData('offer_title', title)}
  description={formData.offer_body}
  onDescriptionChange={(body) => updateFormData('offer_body', body)}
  url={formData.offer_url}
  onUrlChange={(url) => updateFormData('offer_url', url)}
/>

// Replace custom review platforms section with:
<ReviewPlatformsFeature
  platforms={formData.review_platforms || []}
  onPlatformsChange={(platforms) => updateFormData('review_platforms', platforms)}
  onGenerateReview={handleGenerateAIReview}
  aiGeneratingIndex={aiGeneratingIndex}
/>
```

### Phase 3: Migration Strategy

#### Step 1: Create Migration Scripts
```typescript
// scripts/migrate-prompt-page-form.ts
export function migratePromptPageForm(formName: string) {
  console.log(`Migrating ${formName}...`);
  
  // 1. Add loading state
  // 2. Replace custom sections with shared components
  // 3. Update imports
  // 4. Test functionality
  // 5. Update documentation
}
```

#### Step 2: Implement Form-Specific Features

##### PhotoPromptPageForm
- **Unique Features**: Photo upload, photo-specific AI generation
- **Migration Tasks**:
  - Add loading states for photo AI generation
  - Integrate shared components
  - Maintain photo-specific functionality

##### EventPromptPageForm
- **Unique Features**: Event details, date handling
- **Migration Tasks**:
  - Add loading states
  - Integrate shared components
  - Preserve event-specific logic

##### EmployeePromptPageForm
- **Unique Features**: Employee details, team member selection
- **Migration Tasks**:
  - Add loading states
  - Integrate shared components
  - Maintain employee-specific features

##### UniversalPromptPageForm
- **Unique Features**: Universal campaign settings
- **Migration Tasks**:
  - Add loading states
  - Integrate shared components
  - Preserve universal campaign logic

### Phase 4: Testing and Validation

#### Step 1: Unit Tests
```typescript
// tests/prompt-page-features.test.ts
describe('Shared Prompt Page Features', () => {
  test('PersonalizedNoteFeature handles conflicts correctly', () => {
    // Test conflict modal functionality
  });
  
  test('EmojiSentimentFeature validates required fields', () => {
    // Test validation logic
  });
  
  test('FallingStarsFeature updates color correctly', () => {
    // Test color picker functionality
  });
  
  test('AI generation shows loading state', () => {
    // Test loading state management
  });
});
```

#### Step 2: Integration Tests
```typescript
// tests/prompt-page-integration.test.ts
describe('Prompt Page Integration', () => {
  test('ServicePromptPageForm pre-populates services', () => {
    // Test service inheritance
  });
  
  test('All forms show AI generation loading', () => {
    // Test loading states across all forms
  });
  
  test('Conflict modals work consistently', () => {
    // Test conflict handling across forms
  });
});
```

### Phase 5: Documentation and Training

#### Step 1: Update Developer Documentation
- Document shared component usage
- Provide migration guides
- Create troubleshooting guides

#### Step 2: Create User Documentation
- Update user guides for new features
- Document loading state expectations
- Provide troubleshooting information

## Implementation Checklist

### For Each Form Migration

#### ✅ Pre-Migration
- [ ] Audit current form functionality
- [ ] Document unique features
- [ ] Identify dependencies
- [ ] Create backup of current implementation

#### ✅ Core Updates
- [ ] Add `aiGeneratingIndex` state
- [ ] Update `handleGenerateAIReview` with loading logic
- [ ] Pass `aiGeneratingIndex` to `ReviewWriteSection`
- [ ] Test AI generation loading states

#### ✅ Shared Component Integration
- [ ] Replace custom personalized note with `PersonalizedNoteFeature`
- [ ] Replace custom emoji sentiment with `EmojiSentimentFeature`
- [ ] Replace custom falling stars with `FallingStarsFeature`
- [ ] Replace custom AI settings with `AISettingsFeature`
- [ ] Replace custom offer with `OfferFeature`
- [ ] Replace custom review platforms with `ReviewPlatformsFeature`

#### ✅ Form-Specific Features
- [ ] Preserve unique functionality
- [ ] Update form-specific validation
- [ ] Maintain custom business logic
- [ ] Test form-specific features

#### ✅ Testing and Validation
- [ ] Test all shared features
- [ ] Validate form-specific functionality
- [ ] Test loading states
- [ ] Verify conflict handling
- [ ] Test save/publish functionality

#### ✅ Documentation
- [ ] Update component documentation
- [ ] Document form-specific features
- [ ] Update user guides
- [ ] Create migration notes

## Benefits of Centralized System

### 1. Consistency
- Uniform user experience across all prompt page types
- Consistent loading states and error handling
- Standardized feature implementations

### 2. Maintainability
- Single source of truth for shared features
- Easier bug fixes and feature updates
- Reduced code duplication

### 3. Performance
- Optimized loading states prevent multiple requests
- Shared components reduce bundle size
- Consistent error handling improves reliability

### 4. Developer Experience
- Clear component interfaces
- Reusable feature components
- Standardized patterns across forms

## Migration Timeline

### Week 1: Analysis and Planning
- Audit all prompt page forms
- Document current implementations
- Create detailed migration plan

### Week 2: Core Updates
- Add loading states to all forms
- Update ReviewWriteSection usage
- Test basic functionality

### Week 3: Shared Component Integration
- Migrate PhotoPromptPageForm
- Migrate EventPromptPageForm
- Test shared features

### Week 4: Final Migration
- Migrate EmployeePromptPageForm
- Migrate UniversalPromptPageForm
- Comprehensive testing

### Week 5: Documentation and Cleanup
- Update documentation
- Create user guides
- Final testing and validation

## Success Metrics

### Technical Metrics
- [ ] All forms have consistent loading states
- [ ] Zero code duplication for shared features
- [ ] 100% test coverage for shared components
- [ ] All forms pass integration tests

### User Experience Metrics
- [ ] Consistent loading feedback across all forms
- [ ] Improved error handling and user feedback
- [ ] Reduced user confusion during AI generation
- [ ] Faster development of new prompt page types

## Troubleshooting Guide

### Common Issues

#### Loading State Not Working
```typescript
// Check if aiGeneratingIndex is being passed correctly
<ReviewWriteSection
  aiGeneratingIndex={aiGeneratingIndex} // Ensure this is passed
  // ... other props
/>
```

#### Conflict Modal Not Appearing
```typescript
// Ensure conflict acknowledgment is reset when state changes
setConflictAcknowledged(false);
```

#### Services Not Pre-populating
```typescript
// Check business profile services format
const processedServices = processBusinessServices(businessProfile.services_offered);
```

### Debug Commands
```bash
# Check for unused imports after migration
npm run lint

# Test all prompt page forms
npm run test:prompt-pages

# Validate shared components
npm run test:shared-components
```

## Conclusion

The centralized prompt page system provides a robust foundation for consistent, maintainable, and user-friendly prompt page forms. By following this migration plan, we can ensure all forms benefit from the improved loading states, shared features, and enhanced user experience while preserving their unique functionality.

The system is designed to be extensible, allowing for easy addition of new prompt page types while maintaining consistency and reducing development overhead. 
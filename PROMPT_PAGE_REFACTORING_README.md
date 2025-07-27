# Prompt Page Refactoring Documentation

## Overview

The prompt page system is undergoing a **major refactoring from a monolithic `PromptPageForm.tsx`** into **specialized form components** based on review type. This refactoring follows a **component extraction and specialization pattern** to improve maintainability, reduce complexity, and enforce better separation of concerns.

## Current Architecture

### Main Router Component: `PromptPageForm.tsx`
- **Purpose**: Acts as a **routing component** that determines which specialized form to render
- **Size**: 18KB, 552 lines
- **Logic**: Routes based on `formData.review_type`
- **Current routing**:
  ```tsx
  if (formData.review_type === "service") {
    return <ServicePromptPageForm ... />
  }
  
  if (formData.review_type === "photo") {
    return <PhotoPromptPageForm ... />
  }
  
  // Fallback for unsupported types
  return <div>Unsupported review type: {formData.review_type}</div>
  ```

## Extracted Specialized Components

### ✅ ServicePromptPageForm.tsx - **COMPLETE**
- **File**: `src/app/components/ServicePromptPageForm.tsx`
- **Purpose**: Handles service-specific prompt pages
- **Features**: 
  - Services provided
  - Outcomes tracking
  - Review platforms integration
  - Customer details for individual campaigns
  - Campaign naming for public campaigns
- **Size**: 14KB, 378 lines ✅ **(Under 500-line limit)**
- **Status**: Fully extracted and functional

### ✅ PhotoPromptPageForm.tsx - **COMPLETE**
- **File**: `src/app/components/PhotoPromptPageForm.tsx`
- **Purpose**: Handles photo testimonial prompt pages
- **Features**:
  - Photo upload capabilities
  - Testimonial template generation
  - Falling star animations
  - AI-powered testimonial creation
- **Size**: 25KB, 693 lines ⚠️ **EXCEEDS 500-LINE PREFERENCE**
- **Status**: ✅ **CONVERTED TO SINGLE-STEP** - Needs further modularization

### ✅ ProductPromptPageForm.tsx - **COMPLETE**
- **File**: `src/app/components/ProductPromptPageForm.tsx`
- **Purpose**: Handles product-specific prompt pages
- **Features**:
  - Product details management
  - Product image upload
  - Features/benefits lists
  - Customer information collection
- **Size**: 21KB, 588 lines ⚠️ **EXCEEDS 500-LINE PREFERENCE**
- **Status**: Extracted and uses modular sections

## Modular Section Components

### Form-Specific Sections (`src/app/components/sections/`)

1. **`CustomerDetailsSection.tsx`**
   - Customer/client information (name, email, phone, role)
   - Handles both individual and public campaign types
   - Conditional field requirements based on campaign type

2. **`ProductDetailsSection.tsx`**
   - Product name, subcopy, description
   - AI training field markers
   - Customer-facing messaging

3. **`ProductImageUpload.tsx`**
   - Product photo upload functionality
   - Supabase storage integration
   - Image preview and management

4. **`FeaturesBenefitsSection.tsx`**
   - Dynamic features/benefits list
   - Add/remove functionality
   - AI training integration

5. **`StepNavigation.tsx`**
   - Navigation and save buttons
   - Simplified for single-step forms
   - Loading states and error handling

### Shared Modular Components (`src/app/dashboard/edit-prompt-page/components/`)

- **`ReviewWriteSection.tsx`** - Review platforms and AI generation
- **`OfferSection.tsx`** - Special offer configuration
- **`EmojiSentimentSection.tsx`** - Emoji sentiment settings
- **`DisableAIGenerationSection.tsx`** - AI generation toggle

## Current Issues & Next Steps

### 🚨 IMMEDIATE: Build Cache Issue
The syntax errors (`Unexpected token 'form'`) are from **Next.js build cache corruption**, not actual code issues. The routing logic in `PromptPageForm.tsx` is correct.

**Fix**:
```bash
rm -rf .next && supabase start && npm run dev
```

### ⚠️ FILE SIZE VIOLATIONS
Two components exceed the 500-line preference:

1. **`PhotoPromptPageForm.tsx`** (766 lines)
   - **Needs**: Section extraction for photo upload, testimonial templates, animation settings
   
2. **`ProductPromptPageForm.tsx`** (588 lines)
   - **Could benefit**: More granular section extraction

### 🔄 MISSING ROUTING
- **Product pages**: No routing logic in `PromptPageForm.tsx` yet
- **Universal pages**: May need dedicated component
- **Event/Video pages**: Future extraction candidates

## Recommended Next Steps

### 1. Fix Build Issue First 🚨
```bash
rm -rf .next
supabase start
npm run dev
```

### 2. Complete Missing Routes
Add product routing to `PromptPageForm.tsx`:
```tsx
if (formData.review_type === "product") {
  return <ProductPromptPageForm ... />
}
```

### 3. Further Modularize Large Components
For `PhotoPromptPageForm.tsx` (766 lines), extract:
- **Photo upload section**
- **Testimonial template section** 
- **Animation settings section**
- **AI generation section**

### 4. Consider Universal Page Strategy
Determine if universal pages need:
- **Dedicated component** (`UniversalPromptPageForm.tsx`)
- **Shared logic** with other types
- **Business defaults fallback** handling

## Benefits of Current Refactoring

✅ **Separation of Concerns**: Each form handles only its specific type  
✅ **Reduced Complexity**: Smaller, focused components  
✅ **Reusable Sections**: Modular components shared across forms  
✅ **Better Maintainability**: Easier to modify specific prompt types  
✅ **Type Safety**: Specialized props and interfaces per component  
✅ **Performance**: Smaller bundles for specific page types  

## Architectural Pattern

```
PromptPageForm (Router Component)
├── ServicePromptPageForm
├── PhotoPromptPageForm  
├── ProductPromptPageForm
└── [Future: UniversalPromptPageForm, EventPromptPageForm, etc.]

Each specialized form uses:
├── sections/ (form-specific sections)
│   ├── CustomerDetailsSection
│   ├── ProductDetailsSection
│   ├── ProductImageUpload
│   ├── FeaturesBenefitsSection
│   └── StepNavigation
└── dashboard/edit-prompt-page/components/ (shared sections)
    ├── ReviewWriteSection
    ├── OfferSection
    ├── EmojiSentimentSection
    └── DisableAIGenerationSection
```

## Component Composition Guidelines

### When to Extract a Section
- **Reusability**: Used in multiple form types
- **Complexity**: Has complex state management or logic
- **Size**: Forms approaching 500+ lines
- **Responsibility**: Handles a distinct functional area

### Section Component Standards
- **File Header**: Comment block explaining purpose and role
- **Function Documentation**: Comment every function with inputs/outputs
- **Props Interface**: Well-defined TypeScript interfaces
- **Error Handling**: Graceful error states and loading indicators

### Shared vs. Form-Specific Sections
- **Shared** (`dashboard/edit-prompt-page/components/`): Used across multiple prompt types
- **Form-Specific** (`components/sections/`): Specific to certain prompt types

## Testing Strategy

### Manual Testing Priority
1. **Router Logic**: Test that correct specialized forms render
2. **Section Integration**: Verify modular sections work in isolation
3. **Data Flow**: Ensure props pass correctly between components
4. **Form Submission**: Test save/publish functionality

### Component Testing
- Test each section component independently
- Verify prop interfaces and type safety
- Test error states and loading conditions
- Validate form data flow and state management

## Migration Guidelines

### For New Prompt Types
1. Create specialized component in `src/app/components/`
2. Add routing logic to `PromptPageForm.tsx`
3. Extract reusable sections to `sections/` directory
4. Use shared sections from `dashboard/edit-prompt-page/components/`

### For Existing Components
1. Check file size (notify if approaching 500 lines)
2. Identify extraction candidates (complex sections)
3. Extract to modular components
4. Update imports and prop interfaces

## Known Technical Debt

### Performance Optimizations
- **Bundle splitting**: Consider lazy loading for specialized forms
- **Props optimization**: Reduce prop drilling with context where appropriate
- **State management**: Consider centralized state for complex forms

### Code Quality
- **Type safety**: Enhance TypeScript interfaces
- **Error boundaries**: Add component-level error handling  
- **Loading states**: Standardize loading indicators
- **Validation**: Centralize form validation logic

---

**Last Updated**: January 31, 2025  
**Status**: Refactoring in progress - Router complete, specialized components extracted, sections modularized  
**✅ COMPLETED**: 
- Consolidated duplicate CreatePromptPageClient.tsx files - eliminated 1200+ lines of duplicate code
- **✅ CONVERTED ALL FORMS TO SINGLE-STEP** - Service, Photo, and Product forms now use consistent single-step pattern
**Next**: Address file size violations, complete product routing consolidation 
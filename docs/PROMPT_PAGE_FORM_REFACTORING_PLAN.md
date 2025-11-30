# Prompt Page Form Refactoring Plan

## Executive Summary

The prompt page forms system currently has **7 specialized form components** that duplicate ~500+ lines of shared feature handling code. Only `ReviewBuilderPromptPageForm` properly uses the `BasePromptPageForm` component. This document outlines a plan to migrate all forms to use the base component pattern, reducing code duplication and making future feature additions trivial.

**Current State:** Adding a new feature (like Motivational Nudge) requires updating 7+ files with nearly identical code.

**Target State:** Adding a new feature requires updating only `BasePromptPageForm` - all forms inherit it automatically.

---

## Current Architecture

### Form Hierarchy

```
PromptPageForm.tsx (Router)
├── ServicePromptPageForm.tsx      ❌ Standalone (duplicates features)
├── ProductPromptPageForm.tsx      ❌ Standalone (duplicates features)
├── PhotoPromptPageForm.tsx        ❌ Standalone (duplicates features)
├── EmployeePromptPageForm.tsx     ❌ Standalone (duplicates features)
├── EventPromptPageForm.tsx        ❌ Standalone (duplicates features)
├── UniversalPromptPageForm.tsx    ❌ Standalone (duplicates features)
└── ReviewBuilderPromptPageForm.tsx ✅ Uses BasePromptPageForm
```

### Shared Features (Duplicated in 6 Forms)

| Feature | Lines of Code | Forms Using It |
|---------|---------------|----------------|
| PersonalizedNote | ~40 | All 7 |
| EmojiSentiment | ~60 | All 7 |
| FallingStars | ~30 | All 7 |
| AISettings | ~20 | All 7 |
| Offer | ~50 | All 7 |
| ReviewPlatforms | ~40 | All 7 |
| Kickstarters | ~40 | 6 of 7 |
| MotivationalNudge | ~30 | All 7 |
| RecentReviews | ~20 | 5 of 7 |
| KeywordInspiration | ~30 | 5 of 7 |

**Total Duplicated Code:** ~360 lines × 6 forms = ~2,160 lines that could be eliminated

### Type-Specific Fields by Form

| Form | Unique Fields |
|------|---------------|
| ServicePromptPageForm | None (generic) |
| ProductPromptPageForm | product_name, product_description, product_photo, features_or_benefits |
| PhotoPromptPageForm | None (just uses shared features differently) |
| EmployeePromptPageForm | emp_first_name, emp_last_name, emp_pronouns, emp_headshot_url, emp_position, emp_location, emp_years_at_business, emp_bio, emp_fun_facts |
| EventPromptPageForm | eve_name, eve_date, eve_type, eve_location, eve_description, eve_duration, eve_capacity, eve_organizer, eve_special_features, eve_review_guidance |
| UniversalPromptPageForm | None (public campaign, no customer details) |
| ReviewBuilderPromptPageForm | builder_questions, keywords_required |

---

## Target Architecture

### Form Hierarchy (After Refactoring)

```
PromptPageForm.tsx (Router)
└── BasePromptPageForm.tsx (Handles ALL shared features)
    ├── ServicePromptPageForm.tsx      ✅ Only type-specific fields
    ├── ProductPromptPageForm.tsx      ✅ Only type-specific fields
    ├── PhotoPromptPageForm.tsx        ✅ Only type-specific fields
    ├── EmployeePromptPageForm.tsx     ✅ Only type-specific fields
    ├── EventPromptPageForm.tsx        ✅ Only type-specific fields
    ├── UniversalPromptPageForm.tsx    ✅ Only type-specific fields
    └── ReviewBuilderPromptPageForm.tsx ✅ Already correct
```

### BasePromptPageForm Responsibilities

1. **Shared Feature State Management**
   - PersonalizedNote (show_friendly_note, friendly_note)
   - EmojiSentiment (emoji_sentiment_enabled, emoji_sentiment_question, etc.)
   - FallingStars (falling_enabled, falling_icon, falling_icon_color)
   - AISettings (ai_button_enabled, fix_grammar_enabled)
   - Offer (offer_enabled, offer_title, offer_body, offer_url, offer_timelock)
   - ReviewPlatforms (review_platforms array)
   - Kickstarters (kickstarters_enabled, selected_kickstarters)
   - MotivationalNudge (motivational_nudge_enabled, motivational_nudge_text)
   - RecentReviews (recent_reviews_enabled, recent_reviews_scope)
   - KeywordInspiration (keyword_inspiration_enabled, selected_keyword_inspirations)

2. **Shared Behaviors**
   - localStorage autosave with debounce
   - Business defaults fallback chain
   - Popup conflict detection (PersonalizedNote vs EmojiSentiment)
   - Form validation
   - Save/publish handlers
   - Unsaved changes warning

3. **Feature Toggle System**
   ```typescript
   enabledFeatures?: {
     personalizedNote?: boolean;
     emojiSentiment?: boolean;
     fallingStars?: boolean;
     aiSettings?: boolean;
     offer?: boolean;
     reviewPlatforms?: boolean;
     kickstarters?: boolean;
     motivationalNudge?: boolean;
     recentReviews?: boolean;
     keywordInspiration?: boolean;
   }
   ```

4. **Children Composition**
   - Type-specific fields passed as `children` prop
   - Rendered before shared features

### Specialized Form Responsibilities

Each form only needs to:
1. Define its unique fields and state
2. Pass unique fields as `children` to BasePromptPageForm
3. Set `enabledFeatures` to control which shared features appear
4. Wrap the save handler to add type-specific data

---

## Migration Plan

### Phase 1: Enhance BasePromptPageForm

**Duration:** 1-2 hours

**Tasks:**
1. Add missing features to BasePromptPageForm:
   - RecentReviews feature
   - KeywordInspiration feature
   - Keywords state management

2. Add to `enabledFeatures` interface:
   ```typescript
   enabledFeatures?: {
     // ... existing
     recentReviews?: boolean;
     keywordInspiration?: boolean;
   }
   ```

3. Add to `BaseFormState` interface:
   ```typescript
   // Recent Reviews
   recent_reviews_enabled: boolean;
   recent_reviews_scope: string;

   // Keyword Inspiration
   keyword_inspiration_enabled: boolean;
   selected_keyword_inspirations: string[];
   keywords: string[];
   ```

4. Add feature components to render:
   ```typescript
   {enabledFeatures.recentReviews && (
     <RecentReviewsFeature ... />
   )}
   {enabledFeatures.keywordInspiration && (
     <KeywordInspirationFeature ... />
   )}
   ```

**Files to Modify:**
- `/src/app/(app)/components/BasePromptPageForm.tsx`
- `/src/app/(app)/components/prompt-features/index.ts` (if needed)

### Phase 2: Create Type-Specific Section Components

**Duration:** 2-3 hours

**Tasks:**
1. Create section components for each form's unique fields:

```
/src/app/(app)/components/sections/
├── CustomerDetailsSection.tsx      (already exists)
├── ProductDetailsSection.tsx       (already exists)
├── ProductImageUpload.tsx          (already exists)
├── FeaturesBenefitsSection.tsx     (already exists)
├── EmployeeDetailsSection.tsx      (NEW - extract from EmployeePromptPageForm)
├── EventDetailsSection.tsx         (NEW - extract from EventPromptPageForm)
├── ReviewBuilderQuestionsSection.tsx (NEW - extract from ReviewBuilderPromptPageForm)
└── StepNavigation.tsx              (already exists)
```

2. Each section component should:
   - Accept value and onChange props
   - Handle only its specific fields
   - Be reusable and testable

**Example: EmployeeDetailsSection.tsx**
```typescript
interface EmployeeDetailsProps {
  data: {
    emp_first_name: string;
    emp_last_name: string;
    emp_pronouns: string;
    emp_headshot_url: string;
    emp_position: string;
    emp_location: string;
    emp_years_at_business: string;
    emp_bio: string;
    emp_fun_facts: string[];
  };
  onChange: (field: string, value: any) => void;
  businessProfile: any;
  supabase: any;
}

export default function EmployeeDetailsSection({
  data,
  onChange,
  businessProfile,
  supabase
}: EmployeeDetailsProps) {
  // Render employee-specific fields
  // Handle headshot upload
  // Handle fun facts array
}
```

### Phase 3: Migrate Forms (One at a Time)

**Duration:** 4-6 hours total (~45 min per form)

**Migration Order (simplest to most complex):**
1. UniversalPromptPageForm (no unique fields)
2. ServicePromptPageForm (no unique fields)
3. PhotoPromptPageForm (minimal unique fields)
4. ProductPromptPageForm (product fields + steps)
5. EmployeePromptPageForm (employee fields)
6. EventPromptPageForm (event fields)

**Migration Template for Each Form:**

```typescript
// BEFORE: ServicePromptPageForm.tsx (~400 lines)
export default function ServicePromptPageForm({
  mode, initialData, onSave, ...
}) {
  // 50+ lines of shared state management
  const [offerEnabled, setOfferEnabled] = useState(...);
  const [emojiSentimentEnabled, setEmojiSentimentEnabled] = useState(...);
  // ... more shared state

  // 100+ lines of shared feature rendering
  return (
    <form>
      <CustomerDetailsSection ... />
      <ReviewWriteSection ... />
      <OfferFeature ... />
      <EmojiSentimentFeature ... />
      <FallingStarsFeature ... />
      <AISettingsFeature ... />
      <MotivationalNudgeFeature ... />
      {/* ... more shared features */}
    </form>
  );
}

// AFTER: ServicePromptPageForm.tsx (~50 lines)
export default function ServicePromptPageForm({
  mode, initialData, onSave, businessProfile, supabase, ...rest
}) {
  // Only form-specific state (none for service)

  const handleSave = useCallback((baseFormData: any) => {
    return onSave({
      ...baseFormData,
      review_type: "service",
    });
  }, [onSave]);

  return (
    <BasePromptPageForm
      mode={mode}
      initialData={initialData}
      onSave={handleSave}
      businessProfile={businessProfile}
      supabase={supabase}
      campaignType={rest.campaignType || "individual"}
      enabledFeatures={{
        personalizedNote: true,
        emojiSentiment: true,
        fallingStars: true,
        aiSettings: true,
        offer: true,
        reviewPlatforms: true,
        kickstarters: true,
        motivationalNudge: true,
        recentReviews: true,
        keywordInspiration: true,
      }}
      {...rest}
    >
      {/* Customer details for individual campaigns */}
      {rest.campaignType !== "public" && (
        <CustomerDetailsSection
          data={initialData}
          onChange={(field, value) => {/* handled by base */}}
        />
      )}
    </BasePromptPageForm>
  );
}
```

### Phase 4: Update Parent Page Component

**Duration:** 1-2 hours

**Tasks:**
1. Simplify `handleGeneralSave` and `handleProductSave`:
   - BasePromptPageForm now handles field mapping
   - Page only needs to add page-level fields (id, account_id, status)

2. Remove duplicate column validation:
   - BaseFormState already defines valid fields
   - Page only filters for database-specific columns

3. Consolidate `mapToDbColumns`:
   - Move to shared utility or BasePromptPageForm
   - Handle camelCase to snake_case consistently

**Files to Modify:**
- `/src/app/(app)/dashboard/edit-prompt-page/[slug]/page.tsx`

### Phase 5: Testing & Cleanup

**Duration:** 2-3 hours

**Tasks:**
1. Test each form type:
   - Create new page of each type
   - Edit existing page of each type
   - Verify all features save/load correctly
   - Test business defaults fallback
   - Test localStorage autosave

2. Remove dead code:
   - Delete unused state variables from migrated forms
   - Remove duplicate feature imports
   - Clean up unused handlers

3. Update documentation:
   - Add JSDoc comments to BasePromptPageForm
   - Document the composition pattern
   - Add examples for adding new features

---

## Detailed Migration: UniversalPromptPageForm

This is the simplest migration since Universal has no unique fields.

### Current Code Analysis

```typescript
// Current: ~470 lines
// - 120 lines of shared state initialization
// - 60 lines of AI review generation
// - 50 lines of save handler
// - 240 lines of JSX with shared features
```

### Migration Steps

1. **Remove shared state** (lines 73-123):
   ```typescript
   // DELETE all of these - BasePromptPageForm handles them
   const [formData, setFormData] = useState({
     review_platforms: ...,
     offer_enabled: ...,
     offer_title: ...,
     // ... 20+ more shared fields
   });
   ```

2. **Keep only universal-specific logic**:
   ```typescript
   // KEEP: AI generation handler (uses business profile only)
   const handleGenerateAIReview = async (index: number) => {
     // Universal pages use simplified context
   };
   ```

3. **Wrap with BasePromptPageForm**:
   ```typescript
   return (
     <BasePromptPageForm
       mode={mode}
       initialData={{
         ...initialData,
         review_type: "universal",
         is_universal: true,
         campaign_type: "public",
       }}
       onSave={handleSave}
       businessProfile={businessProfile}
       supabase={supabase}
       campaignType="public"
       onGenerateReview={handleGenerateAIReview}
       enabledFeatures={{
         personalizedNote: true,
         emojiSentiment: true,
         fallingStars: true,
         aiSettings: true,
         offer: true,
         reviewPlatforms: true,
         kickstarters: true,
         motivationalNudge: true,
         recentReviews: true,
         keywordInspiration: true,
       }}
     >
       {/* Universal has no unique fields - just a title/header */}
       <div className="mb-6">
         <h2 className="text-xl font-semibold">Universal Prompt Page</h2>
         <p className="text-gray-600">
           This page uses your business profile defaults.
         </p>
       </div>
     </BasePromptPageForm>
   );
   ```

4. **Simplify save handler**:
   ```typescript
   const handleSave = useCallback((baseFormData: any) => {
     return onSave({
       ...baseFormData,
       review_type: "universal",
       is_universal: true,
       campaign_type: "public",
     });
   }, [onSave]);
   ```

### Expected Result

- **Before:** 470 lines
- **After:** ~80 lines
- **Reduction:** 390 lines (83%)

---

## Detailed Migration: EmployeePromptPageForm

More complex due to employee-specific fields.

### Current Code Analysis

```typescript
// Current: ~950 lines
// - 150 lines of shared + employee state initialization
// - 100 lines of handlers
// - 200 lines of save logic
// - 500 lines of JSX
```

### Unique Fields to Preserve

```typescript
interface EmployeeFields {
  emp_first_name: string;
  emp_last_name: string;
  emp_pronouns: string;
  emp_headshot_url: string;
  emp_position: string;
  emp_location: string;
  emp_years_at_business: string;
  emp_bio: string;
  emp_fun_facts: string[];
}
```

### Migration Steps

1. **Create EmployeeDetailsSection component**:
   ```typescript
   // /src/app/(app)/components/sections/EmployeeDetailsSection.tsx
   export default function EmployeeDetailsSection({
     data,
     onChange,
     businessProfile,
     supabase,
   }) {
     return (
       <div className="space-y-6">
         {/* Employee name and pronouns */}
         <div className="grid grid-cols-2 gap-4">
           <Input
             label="First Name"
             value={data.emp_first_name}
             onChange={(e) => onChange('emp_first_name', e.target.value)}
           />
           <Input
             label="Last Name"
             value={data.emp_last_name}
             onChange={(e) => onChange('emp_last_name', e.target.value)}
           />
         </div>

         {/* Pronouns */}
         <Input
           label="Pronouns"
           value={data.emp_pronouns}
           onChange={(e) => onChange('emp_pronouns', e.target.value)}
         />

         {/* Headshot upload */}
         <ImageUpload
           label="Employee Headshot"
           value={data.emp_headshot_url}
           onChange={(url) => onChange('emp_headshot_url', url)}
           supabase={supabase}
         />

         {/* Position, location, years */}
         {/* Bio */}
         {/* Fun facts array */}
       </div>
     );
   }
   ```

2. **Refactor EmployeePromptPageForm**:
   ```typescript
   export default function EmployeePromptPageForm({
     mode, initialData, onSave, businessProfile, supabase, ...rest
   }) {
     // Only employee-specific state
     const [employeeData, setEmployeeData] = useState({
       emp_first_name: initialData?.emp_first_name || '',
       emp_last_name: initialData?.emp_last_name || '',
       emp_pronouns: initialData?.emp_pronouns || '',
       emp_headshot_url: initialData?.emp_headshot_url || '',
       emp_position: initialData?.emp_position || '',
       emp_location: initialData?.emp_location || '',
       emp_years_at_business: initialData?.emp_years_at_business || '',
       emp_bio: initialData?.emp_bio || '',
       emp_fun_facts: initialData?.emp_fun_facts || [],
     });

     const handleEmployeeChange = (field: string, value: any) => {
       setEmployeeData(prev => ({ ...prev, [field]: value }));
     };

     const handleSave = useCallback((baseFormData: any) => {
       return onSave({
         ...baseFormData,
         ...employeeData,
         review_type: "employee",
       });
     }, [onSave, employeeData]);

     return (
       <BasePromptPageForm
         mode={mode}
         initialData={initialData}
         onSave={handleSave}
         businessProfile={businessProfile}
         supabase={supabase}
         campaignType={rest.campaignType || "individual"}
         enabledFeatures={{
           personalizedNote: true,
           emojiSentiment: true,
           fallingStars: true,
           aiSettings: true,
           offer: true,
           reviewPlatforms: true,
           kickstarters: true,
           motivationalNudge: true,
           recentReviews: true,
           keywordInspiration: true,
         }}
         {...rest}
       >
         {/* Customer details for individual campaigns */}
         {rest.campaignType !== "public" && (
           <CustomerDetailsSection ... />
         )}

         {/* Employee-specific fields */}
         <EmployeeDetailsSection
           data={employeeData}
           onChange={handleEmployeeChange}
           businessProfile={businessProfile}
           supabase={supabase}
         />
       </BasePromptPageForm>
     );
   }
   ```

### Expected Result

- **Before:** 950 lines
- **After:** ~150 lines (form) + ~200 lines (section component)
- **Net Reduction:** 600 lines (63%)

---

## Risk Mitigation

### Risk 1: Breaking Existing Functionality

**Mitigation:**
- Migrate one form at a time
- Test thoroughly before moving to next form
- Keep old code commented out until verified
- Use feature flags if needed

### Risk 2: Save/Load Data Mismatch

**Mitigation:**
- Document all field name mappings (camelCase vs snake_case)
- Add validation in BasePromptPageForm
- Test with existing database records
- Verify localStorage restoration works

### Risk 3: Business Defaults Not Applied

**Mitigation:**
- BasePromptPageForm already handles this correctly
- Verify fallback chain: `initialData → businessProfile → hardcoded default`
- Test with new pages (no initialData)

### Risk 4: Feature Flags Breaking Features

**Mitigation:**
- Default all `enabledFeatures` to `true` in BasePromptPageForm
- Only set `false` when intentionally disabling
- Document which features each form type needs

---

## Success Metrics

1. **Code Reduction:** ~1,500+ lines removed across all forms
2. **Feature Addition Time:** New features added in 1 file instead of 7+
3. **Bug Fix Coverage:** Fixing a shared feature bug fixes all forms
4. **Test Coverage:** Easier to test BasePromptPageForm once
5. **Developer Experience:** Clear separation of concerns

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Enhance BasePromptPageForm | 1-2 hours | None |
| Phase 2: Create Section Components | 2-3 hours | Phase 1 |
| Phase 3: Migrate Forms | 4-6 hours | Phase 1, 2 |
| Phase 4: Update Parent Page | 1-2 hours | Phase 3 |
| Phase 5: Testing & Cleanup | 2-3 hours | Phase 4 |
| **Total** | **10-16 hours** | |

---

## Appendix: File Inventory

### Files to Modify

| File | Action | Effort |
|------|--------|--------|
| `BasePromptPageForm.tsx` | Enhance | Medium |
| `ServicePromptPageForm.tsx` | Refactor | Low |
| `ProductPromptPageForm.tsx` | Refactor | Medium |
| `PhotoPromptPageForm.tsx` | Refactor | Low |
| `EmployeePromptPageForm.tsx` | Refactor | High |
| `EventPromptPageForm.tsx` | Refactor | High |
| `UniversalPromptPageForm.tsx` | Refactor | Low |
| `edit-prompt-page/[slug]/page.tsx` | Simplify | Medium |

### Files to Create

| File | Purpose |
|------|---------|
| `sections/EmployeeDetailsSection.tsx` | Employee-specific fields |
| `sections/EventDetailsSection.tsx` | Event-specific fields |

### Files to Delete (After Migration)

| File | Reason |
|------|--------|
| `ServicePromptPageFormRefactored.tsx` | Unused draft |
| Any `.bak` or duplicate files | Cleanup |

---

## Appendix: Feature Toggle Reference

### Default Configuration (All Features Enabled)

```typescript
const defaultEnabledFeatures = {
  personalizedNote: true,
  emojiSentiment: true,
  fallingStars: true,
  aiSettings: true,
  offer: true,
  reviewPlatforms: true,
  kickstarters: true,
  motivationalNudge: true,
  recentReviews: true,
  keywordInspiration: true,
};
```

### Per-Form Configurations

| Form | Disabled Features | Reason |
|------|-------------------|--------|
| ReviewBuilder | personalizedNote, emojiSentiment, aiSettings, reviewPlatforms, kickstarters | Uses wizard flow instead |
| Universal | (none) | Uses all features |
| Service | (none) | Uses all features |
| Product | (none) | Uses all features |
| Photo | (none) | Uses all features |
| Employee | (none) | Uses all features |
| Event | (none) | Uses all features |

---

## Appendix: Database Column Reference

### Shared Columns (Handled by BasePromptPageForm)

```sql
-- Personalized Note
show_friendly_note BOOLEAN DEFAULT false
friendly_note TEXT

-- Emoji Sentiment
emoji_sentiment_enabled BOOLEAN DEFAULT false
emoji_sentiment_question TEXT
emoji_feedback_message TEXT
emoji_thank_you_message TEXT
emoji_feedback_popup_header TEXT
emoji_feedback_page_header TEXT

-- Falling Stars
falling_enabled BOOLEAN DEFAULT true
falling_icon TEXT DEFAULT 'star'
falling_icon_color TEXT DEFAULT '#fbbf24'

-- AI Settings
ai_button_enabled BOOLEAN DEFAULT true
fix_grammar_enabled BOOLEAN DEFAULT true

-- Offer
offer_enabled BOOLEAN DEFAULT false
offer_title TEXT
offer_body TEXT
offer_url TEXT
offer_timelock BOOLEAN DEFAULT false

-- Review Platforms
review_platforms JSONB DEFAULT '[]'

-- Kickstarters
kickstarters_enabled BOOLEAN DEFAULT false
selected_kickstarters JSONB DEFAULT '[]'

-- Motivational Nudge
motivational_nudge_enabled BOOLEAN DEFAULT true
motivational_nudge_text TEXT

-- Recent Reviews
recent_reviews_enabled BOOLEAN DEFAULT false
recent_reviews_scope TEXT DEFAULT 'current_page'

-- Keyword Inspiration
keyword_inspiration_enabled BOOLEAN DEFAULT false
selected_keyword_inspirations JSONB DEFAULT '[]'
keywords JSONB DEFAULT '[]'
```

### Type-Specific Columns

```sql
-- Employee
emp_first_name TEXT
emp_last_name TEXT
emp_pronouns TEXT
emp_headshot_url TEXT
emp_position TEXT
emp_location TEXT
emp_years_at_business TEXT
emp_bio TEXT
emp_fun_facts JSONB DEFAULT '[]'

-- Event
eve_name TEXT
eve_date TEXT
eve_type TEXT
eve_location TEXT
eve_description TEXT
eve_duration TEXT
eve_capacity TEXT
eve_organizer TEXT
eve_special_features JSONB DEFAULT '[]'
eve_review_guidance TEXT

-- Product
product_name TEXT
product_description TEXT
product_photo TEXT
features_or_benefits JSONB DEFAULT '[]'

-- Review Builder
builder_questions JSONB DEFAULT '[]'
keywords_required BOOLEAN DEFAULT true
```

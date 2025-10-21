# AI Keyword Generator Feature

## Overview
This feature adds an AI-powered keyword generation button to the Keywords module in Prompt Pages and individual Prompt Page settings. It generates location-specific, SEO-optimized keyword suggestions using GPT-4o-mini.

## Feature Components

### 1. AI Endpoint (`/api/ai/generate-keywords`)
**File:** `/src/app/(app)/api/ai/generate-keywords/route.ts`

- **Model:** GPT-4o-mini (cost-effective for keyword generation)
- **Authentication:** Required (authenticated users only)
- **Rate Limiting:** 10 generations per account per month
- **Security:** Account ownership validation before generation

#### Request Format:
```json
{
  "businessName": "Acme Dental",
  "businessType": "Dental Practice",
  "city": "Portland",
  "state": "OR",
  "accountId": "uuid",
  "aboutUs": "Family-owned dental practice serving Portland since 1995...",
  "differentiators": "Gentle care, same-day appointments, latest technology...",
  "yearsInBusiness": "28",
  "servicesOffered": "General dentistry, cosmetic dentistry, emergency care...",
  "industriesServed": "car accidents" // Optional - helps AI generate more targeted keywords
}
```

#### Response Format:
```json
{
  "keywords": [
    {
      "keyword": "best family dentist near me",
      "intent": "Transactional",
      "motivation": "Looking for a trusted dentist for the whole family",
      "suggestedPageType": "Service page"
    }
  ],
  "usage": {
    "current": 5,
    "limit": 10,
    "remaining": 5
  }
}
```

### 2. Database Schema Changes

**Migration:** `/supabase/migrations/20251220000000_add_keyword_generation_tracking.sql`

Added columns to `ai_usage` table:
- `account_id` (UUID) - Links usage to specific account
- `feature_type` (TEXT) - Identifies AI feature type (e.g., "keyword_generation")

**Indexes added:**
- `idx_ai_usage_account_id` - For account-based queries
- `idx_ai_usage_feature_type` - For feature-based queries
- `idx_ai_usage_account_feature` - Composite index for monthly usage checks

**Prisma Schema Updated:**
- `/prisma/schema.prisma` - Added new fields and relations

### 3. UI Components

#### KeywordGeneratorModal
**File:** `/src/app/(app)/components/KeywordGeneratorModal.tsx`

Features:
- **Glassmorphic design** with transparent backgrounds and blur effects
- Live generation with loading states and spinner animations
- Interactive table with selectable keywords
- Intent-based color coding with glassmorphic badges:
  - Transactional: Green (bg-green-500/30, text-green-200)
  - Informational: Blue (bg-blue-500/30, text-blue-200)
  - Review: Purple (bg-purple-500/30, text-purple-200)
  - Navigational: White/gray (bg-white/20, text-white)
- Checkbox selection for choosing which keywords to add
- Regeneration capability
- Usage statistics display (current/limit/remaining)
- All text in white for visibility on glassmorphic background
- Glassmorphic buttons with backdrop blur and semi-transparent backgrounds

#### MissingBusinessDetailsModal
**File:** `/src/app/(app)/components/MissingBusinessDetailsModal.tsx`

Features:
- **Glassmorphic warning modal** with transparent backgrounds and blur
- Clear list of missing fields with bullet icons
- Direct link to Business Profile page
- Educational content about why details matter for keyword generation
- All text in white (text-white, text-white/90) for visibility
- Glassmorphic info boxes with border and backdrop blur
- Icon: FaExclamationTriangle (warning icon in white)
- Glassmorphic buttons matching the main modal design

#### Updated KeywordsInput Component
**File:** `/src/app/(app)/components/KeywordsInput.tsx`

Added:
- "Generate with AI" button (gradient indigo-to-purple)
- Integration with KeywordGeneratorModal
- Business validation before opening modal
- Automatic keyword merging (no duplicates)

### 4. Business Validation

**File:** `/src/utils/businessValidation.ts`

Required fields for keyword generation:
- Business Name
- Business Type/Industry
- City
- State
- About Us
- Differentiators
- Years in Business (must be > 0)
- Services Offered (at least one service)

Functions:
- `validateBusinessForKeywordGeneration()` - Validates required fields
- `getMissingFieldsMessage()` - Generates user-friendly error messages

### 5. Integration Points

The keyword generator is integrated into all prompt page forms:
- `ServicePromptPageForm.tsx`
- `ProductPromptPageForm.tsx`
- `UniversalPromptPageForm.tsx`
- `EventPromptPageForm.tsx`
- `EmployeePromptPageForm.tsx`
- `PhotoPromptPageForm.tsx`

Each form passes `businessInfo` prop to `KeywordsInput`:
```typescript
businessInfo={{
  name: businessProfile?.name,
  industry: businessProfile?.industry,
  address_city: businessProfile?.address_city,
  address_state: businessProfile?.address_state,
  accountId: businessProfile?.account_id,
  about_us: businessProfile?.about_us,
  differentiators: businessProfile?.differentiators,
  years_in_business: businessProfile?.years_in_business,
  services_offered: businessProfile?.services_offered
}}
```

## Usage Limits

### Current Limits
- **10 keyword generations per account per month**
- Limit resets on the 1st of each month
- Usage tracked per account, not per user
- Limit check happens before AI call (prevents unnecessary API costs)

### Error Handling
- **429 status** when monthly limit reached
- Clear error message with current usage and limit
- User-friendly modal for missing business details
- Account access validation

## Cost Considerations

### GPT-4o-mini Pricing (2025)
- Input: $0.00015 per 1K tokens
- Output: $0.0006 per 1K tokens

### Average Cost per Generation
Approximately $0.002 - $0.005 per keyword generation (10 keywords)

### Monthly Cost Estimate
- 100 accounts × 10 generations = 1,000 generations/month
- Estimated cost: $2-5/month
- Very low cost feature due to GPT-4o-mini efficiency

## AI Prompt Strategy

The prompt is designed to generate:
1. **10 long-tail keywords** - More specific, less competitive
2. **Location modifiers** - "near me", neighborhoods, landmarks, zip codes
3. **Intent mixing** - Informational, transactional, review-based, navigational
4. **Natural language** - How real customers search, not marketing-speak
5. **Service + intent + location combos** - e.g., "teeth whitening before wedding Portland OR"
6. **Review-style phrases** - Can appear in Google Reviews/testimonials

### Example Output Quality
For a dental practice in Portland, OR:
- "best family dentist near downtown Portland"
- "emergency dental care SE Portland OR"
- "teeth whitening before wedding Portland"
- "gentle dentist for anxious patients NW Portland"
- "best teeth cleaning I've ever had in Portland" (review-style)

## Security Measures

1. **Authentication Required** - Only logged-in users can generate keywords
2. **Account Ownership Validation** - User must belong to the account
3. **Rate Limiting** - 10 generations per account per month
4. **Input Validation** - All required fields validated before API call
5. **SQL Injection Protection** - Using Prisma/Supabase parameterized queries

## Future Enhancements (Potential)

1. **Tiered Limits by Plan**
   - Free: 3/month
   - Grower: 10/month
   - Builder: 25/month
   - Maven: 50/month

2. **Keyword Performance Tracking**
   - Track which generated keywords perform best
   - A/B testing suggestions

3. **Competitor Analysis**
   - Analyze competitor keywords
   - Gap analysis

4. **Keyword Grouping**
   - Automatically group keywords by theme
   - Suggest page structure based on keywords

5. **Search Volume Data**
   - Integration with keyword research APIs
   - Show estimated search volumes

## Testing Checklist

- [ ] Test with complete business info - should generate keywords
- [ ] Test with missing business name - should show missing fields modal
- [ ] Test with missing city - should show missing fields modal
- [ ] Test with missing state - should show missing fields modal
- [ ] Test with missing industry - should show missing fields modal
- [ ] Test keyword generation UI - verify 10 keywords display
- [ ] Test keyword selection - verify checkboxes work
- [ ] Test "Add Selected" button - keywords should merge without duplicates
- [ ] Test monthly limit - after 10 generations, should see 429 error
- [ ] Test regeneration - should create new suggestions
- [ ] Test across all prompt page types (service, product, event, employee, photo, universal)
- [ ] Verify usage tracking in database - check ai_usage table
- [ ] Test with multiple accounts - verify account isolation

## Files Changed/Created

### New Files
- `/src/app/(app)/api/ai/generate-keywords/route.ts`
- `/src/app/(app)/components/KeywordGeneratorModal.tsx`
- `/src/app/(app)/components/MissingBusinessDetailsModal.tsx`
- `/src/utils/businessValidation.ts`
- `/supabase/migrations/20251220000000_add_keyword_generation_tracking.sql`
- `/docs/KEYWORD_GENERATOR_FEATURE.md`

### Modified Files
- `/src/app/(app)/components/KeywordsInput.tsx`
- `/src/app/(app)/components/ServicePromptPageForm.tsx`
- `/src/app/(app)/components/ProductPromptPageForm.tsx`
- `/src/app/(app)/components/UniversalPromptPageForm.tsx`
- `/src/app/(app)/components/EventPromptPageForm.tsx`
- `/src/app/(app)/components/EmployeePromptPageForm.tsx`
- `/src/app/(app)/components/PhotoPromptPageForm.tsx`
- `/prisma/schema.prisma`

## Deployment Notes

1. **Apply database migration** - Already applied via `npx supabase db push`
2. **Generate Prisma types** - Already done via `npx prisma generate`
3. **Environment variables** - No new variables required (uses existing OPENAI_API_KEY)
4. **No breaking changes** - Feature is opt-in, won't affect existing workflows
5. **Backward compatible** - `businessInfo` prop is optional on KeywordsInput

## Support & Troubleshooting

### Common Issues

**Issue:** "Generate with AI" button doesn't appear
- **Solution:** Ensure `businessInfo` prop is passed to KeywordsInput component

**Issue:** Monthly limit error
- **Solution:** Explain to user that limit resets on 1st of month, or increase limit

**Issue:** Poor keyword quality
- **Solution:** Ensure business profile has detailed, accurate information

**Issue:** Modal doesn't close after adding keywords
- **Solution:** Check browser console for errors, verify onChange callback is working

## Analytics & Monitoring

Track these metrics:
- Keyword generations per month
- Most common business types using feature
- Average keywords selected per generation
- Regeneration rate
- Monthly limit hit rate
- Error rate

## Related Documentation

- [Prompt Pages Documentation](./PROMPT_PAGES.md)
- [AI Features Overview](./AI_FEATURES.md)
- [Business Profile Setup](./BUSINESS_PROFILE.md)
- [Database Schema](../supabase/migrations/CHANGELOG.md)

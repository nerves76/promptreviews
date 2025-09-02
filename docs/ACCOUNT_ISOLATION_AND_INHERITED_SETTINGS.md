# Account Isolation and Inherited Settings Documentation

## Critical Security Issue: Cross-Account Data Leakage

### Problem Summary
Prompt pages inherit default settings from the business profile. When users have multiple accounts and switch between them, there's a risk of settings from one account's business profile being used in another account's prompt pages.

### Affected Components
1. **Universal Prompt Page** (`/dashboard/edit-prompt-page/universal/page.tsx`)
2. **Service Prompt Pages** (`/dashboard/edit-prompt-page/[slug]/page.tsx`)
3. **Any future prompt page types that inherit business defaults**

## Business Settings That Get Inherited

### Currently Used in Prompt Pages
These settings are actively inherited from the business profile:

#### Universal Prompt Page
- `default_offer_enabled` - Whether special offer is enabled
- `default_offer_title` - Title for the offer
- `default_offer_body` - Body text for the offer
- `default_offer_url` - URL for the offer
- `review_platforms` - List of review platforms

#### Service Prompt Pages
- `industry` - Business industry categories
- `industry_other` - Custom industry description
- `services_offered` - List of services
- `features_or_benefits` - Features/benefits list
- `review_platforms` - List of review platforms

### Available But Not Yet Used
These settings exist in the business table and could be inherited:

#### Emoji Sentiment Settings
- `emoji_sentiment_enabled`
- `emoji_sentiment_question`
- `emoji_feedback_message`
- `emoji_thank_you_message`
- `emoji_feedback_popup_header`
- `emoji_feedback_page_header`
- `emoji_sentiment_selected`

#### Falling Stars Animation
- `falling_enabled` / `falling_stars_enabled`
- `falling_icon`
- `falling_icon_color`
- `falling_stars_theme`

#### AI Features
- `ai_button_enabled`
- `fix_grammar_enabled`

#### Kickstarters
- `kickstarters_enabled`
- `selected_kickstarters`
- `kickstarters_background_design`

#### Recent Reviews
- `recent_reviews_enabled` / `default_recent_reviews_enabled`
- `recent_reviews_scope`
- `recent_reviews_count`

#### Personalized Note
- `personalized_note_enabled` / `show_friendly_note`
- `personalized_note_text` / `friendly_note`

#### Offer Settings
- `default_offer_timelock` - Whether to add timer to offers

## Security Measures Implemented

### 1. Account ID Verification
All prompt page components now verify that:
- The business profile belongs to the selected account
- The prompt page itself belongs to the selected account

### 2. Null/Undefined vs Empty Array Distinction
For array fields like `review_platforms`:
- `null`/`undefined` = Never saved, use business defaults
- Empty array `[]` = Explicitly cleared, respect user's choice

### 3. Error Handling
When account mismatch is detected:
- Log detailed error with affected settings
- Reject the mismatched data
- Show user-friendly error message
- Prevent any data from wrong account being used

## Code Patterns for Safe Inheritance

### DO: Verify Account Before Using Business Data
```javascript
// Fetch business with account ID
const { data: businessData } = await supabase
  .from("businesses")
  .select("*")
  .eq("account_id", accountId);

// CRITICAL: Verify account match
if (businessData && businessData.account_id !== accountId) {
  console.error("Account mismatch!");
  // Don't use this data
  return;
}
```

### DO: Respect Explicit Empty Values
```javascript
// Check if field has been explicitly set (even if empty)
const platformsToUse = (promptPage?.review_platforms !== null && 
                        promptPage?.review_platforms !== undefined)
  ? promptPage.review_platforms  // Use saved value (even if empty)
  : business.review_platforms;    // Only fallback if never saved
```

### DON'T: Use Simple Fallback Logic
```javascript
// BAD - This will use business data even when user cleared the field
const platforms = promptPage.review_platforms || business.review_platforms;

// BAD - This treats empty array same as null
const platforms = promptPage.review_platforms?.length 
  ? promptPage.review_platforms 
  : business.review_platforms;
```

## Testing Checklist

When testing account isolation:

1. **Multiple Account Test**
   - Create two accounts with different business settings
   - Switch between accounts using account switcher
   - Verify correct settings appear for each account

2. **Empty Values Test**
   - Clear all platforms in universal page
   - Save and refresh
   - Verify platforms stay empty (don't reload from business)

3. **Console Monitoring**
   - Open browser console
   - Look for "ACCOUNT ISOLATION BREACH" errors
   - Check logged account IDs match expected values

4. **Cross-Contamination Test**
   - Set distinct values in each account (e.g., "Account A Platform" vs "Account B Platform")
   - Switch accounts rapidly
   - Verify no values from Account A appear in Account B

## Future Considerations

1. **Service Role Queries**: Consider using service role client with explicit account filtering for critical operations

2. **Centralized Validation**: Create a utility function to validate account ownership for all entities

3. **Audit Logging**: Log all cross-account access attempts for security monitoring

4. **Migration Strategy**: When adding new inherited settings, always consider account isolation

## Related Files
- `/src/app/(app)/dashboard/edit-prompt-page/universal/page.tsx`
- `/src/app/(app)/dashboard/edit-prompt-page/[slug]/page.tsx`
- `/src/auth/utils/accounts.ts` (contains problematic `getAccountIdForUser`)
- `/supabase/migrations/*` (business table schema)

## Last Updated
2025-09-02 - Added comprehensive account isolation checks and documentation
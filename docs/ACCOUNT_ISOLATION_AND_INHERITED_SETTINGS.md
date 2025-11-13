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

## Security Fixes Applied (2025-09-03)

### Critical Vulnerabilities Fixed:

1. **AI Endpoints Security**
   - `fix-grammar/route.ts`: Added session verification, prevented user_id spoofing
   - `generate-review/route.ts`: Added authentication and account verification
   - `generate-reviews/route.ts`: Added complete auth system with ownership checks
   - Public pages (`r/[slug]/page-client.tsx`): AI features now require authentication and account ownership

2. **Kickstarters Component Security**
   - Added `accountId` prop throughout component chain (10+ files)
   - `KickstartersManagementModal` now requires and validates account context
   - All database operations properly scoped to correct account

3. **Public API Data Filtering**
   - `prompt-pages/[slug]/route.ts`: Filters out sensitive business data
   - Only returns necessary display fields (name, styling, social URLs)
   - Excludes: emails, phones, addresses, internal settings, API keys

4. **Business Default Inheritance Completed**
   - Added inheritance for `show_friendly_note` and `friendly_note`
   - Added inheritance for `kickstarters_enabled` and `selected_kickstarters`
   - Added inheritance for `recent_reviews_enabled` and `recent_reviews_scope`
   - All features now properly fall back to business defaults when appropriate

### Files Modified:
- 19 source files updated with security enhancements
- All changes committed to main branch

## Security Fixes Applied (2025-01-13)

### Additional Account Isolation Issues Fixed:

1. **Communication System**
   - `communication/records/route.ts`: Changed from using `user.id` to `getRequestAccountId()`
   - `communication/reminders/route.ts`: Changed from using `session.user.id` to `getRequestAccountId()`
   - Added account_id filters to all reminder queries and updates
   - `CommunicationHistory.tsx`: Switched from bare fetch to `apiClient` with auth headers
   - `UpcomingReminders.tsx`: Switched from bare fetch to `apiClient` with auth headers

2. **Contacts System**
   - `dashboard/contacts/page.tsx`: Added `.eq("account_id", selectedAccountId)` to all queries
   - `contacts/find-duplicates/route.ts`: Changed from `user.id` to `getRequestAccountId()`
   - `contacts/export/route.ts`: Changed from query params to `getRequestAccountId()`

3. **Social Posting**
   - `google-business-profile/save-selected-locations/route.ts`: Changed from `getAccountIdForUser()` to `getRequestAccountId()`
   - `improve-with-ai/route.ts`: Changed from `getAccountIdForUser()` to `getRequestAccountId()`

4. **Account APIs**
   - `accounts/payment-status/route.ts`: Updated fallback to use `getRequestAccountId()`
   - `accounts/navigation-target/route.ts`: Updated fallback to use `getRequestAccountId()`
   - `account/status-labels/route.ts`: Changed from `createClient()` to `createServerSupabaseClient()`

### Known Issue Not Fixed:
- **PromptPageCard Sharing**: Share modal opens mailto:/sms: links without CRM tracking. Requires major refactoring to integrate CommunicationTrackingModal.

## Last Updated
2025-01-13 - Fixed comprehensive account isolation issues in communication, contacts, and social posting systems
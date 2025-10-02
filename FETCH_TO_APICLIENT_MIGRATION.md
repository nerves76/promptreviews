# Fetch to apiClient Migration Plan

## Overview
This document tracks the migration of direct `fetch()` calls to the standardized `apiClient` utility for consistent header management and account isolation.

## Why Migrate?
- **Consistent Authentication**: apiClient automatically manages bearer tokens via TokenManager
- **Account Isolation**: Automatically injects `X-Selected-Account` header with fallback to token extraction
- **Error Handling**: Standardized error handling and retry logic
- **Prevent Regressions**: Centralized header management prevents future account isolation bugs

## Migration Pattern

### Before (Direct fetch)
```typescript
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify(data),
});
const result = await response.json();
```

### After (apiClient)
```typescript
import { apiClient } from '@/utils/apiClient';

const result = await apiClient.post('/endpoint', data);
```

## Priority Levels

### HIGH PRIORITY (Security-Sensitive)
These endpoints handle sensitive data or cross-account access. Migrate first.

1. **Admin Pages** (2 files)
   - `src/app/(app)/admin/page.tsx` - Admin dashboard
   - `src/app/(app)/admin/free-accounts/page.tsx` - Account management

2. **Account Management** (2 files)
   - `src/app/account/page.tsx:94` - Create additional account
   - `src/app/(app)/dashboard/account/page.tsx` - Account settings

3. **Contact Management** (1 file)
   - `src/app/(app)/components/ManualContactForm.tsx:200` - Create contact

### MEDIUM PRIORITY (User-Facing Features)
These are user-facing features but don't expose cross-account data.

4. **Dashboard Pages**
   - `src/app/(app)/dashboard/plan/page.tsx` - Plan management
   - `src/app/(app)/dashboard/page.tsx` - Main dashboard
   - `src/app/(app)/dashboard/contacts/page.tsx` - Contacts list
   - `src/app/(app)/dashboard/upload-contacts/page.tsx` - Bulk upload

5. **Google Business Integration**
   - `src/app/(app)/dashboard/google-business/page.tsx`
   - `src/app/(embed)/embed/google-business-optimizer/GoogleBusinessOptimizerEmbed.tsx`
   - `src/app/(app)/components/GoogleBusinessProfile/Scheduler/GoogleBusinessScheduler.tsx`

6. **Component Features**
   - `src/app/(app)/components/ReviewManagement.tsx`
   - `src/app/(app)/components/PhotoManagement.tsx`
   - `src/app/(app)/components/BusinessInfoEditor.tsx`
   - `src/app/(app)/components/ServicesEditor.tsx`

### LOW PRIORITY (Internal/Test Files)
These are less critical or test-only code.

7. **Test Pages**
   - `src/app/test-sentry/page.tsx`
   - `src/app/(app)/test-google-oauth-simple/page.tsx`
   - `src/app/(app)/test-auth-browser/page.tsx`

8. **Utility Functions**
   - `src/utils/onboardingTasks.ts`
   - `src/utils/criticalFunctionMonitoring.ts`
   - `src/utils/ai/google-business/reviewResponseGenerator.ts`
   - `src/utils/ai/google-business/businessDescriptionAnalyzer.ts`

9. **Help/FAQ Components**
   - `src/app/(app)/components/help/TutorialsTabNew.tsx`
   - `src/app/(app)/components/help/TutorialsTab.tsx`
   - `src/app/(app)/components/help/IssuesTab.tsx`
   - `src/app/(app)/components/help/FAQsTab.tsx`

## Files to Migrate (51 total)

### Complete List
1. src/app/(app)/r/[slug]/page-client.tsx
2. src/app/(app)/dashboard/style/StyleModalPage.tsx
3. src/app/(app)/components/help/TutorialsTabNew.tsx
4. src/app/(embed)/embed/google-business-optimizer/GoogleBusinessOptimizerEmbed.tsx
5. src/app/(app)/dashboard/google-business/page.tsx
6. src/app/(app)/components/help/TutorialsTab.tsx
7. src/app/(app)/components/GoogleBusinessProfile/Scheduler/GoogleBusinessScheduler.tsx
8. src/app/(app)/components/ServicesEditor.tsx
9. src/app/(app)/components/ReviewManagement.tsx
10. src/app/(app)/components/PhotoManagement.tsx
11. src/app/(app)/components/BusinessInfoEditor.tsx
12. src/app/test-sentry/page.tsx
13. src/app/account/page.tsx ⚠️ HIGH PRIORITY
14. src/app/(app)/dashboard/plan/page.tsx
15. src/app/(app)/dashboard/page.tsx
16. src/app/(app)/dashboard/contacts/page.tsx
17. src/app/(app)/dashboard/components/SimpleBusinessForm.tsx
18. src/app/(app)/dashboard/account/page.tsx ⚠️ HIGH PRIORITY
19. src/app/(app)/dashboard/upload-contacts/page.tsx
20. src/utils/onboardingTasks.ts
21. src/utils/criticalFunctionMonitoring.ts
22. src/utils/ai/google-business/reviewResponseGenerator.ts
23. src/utils/ai/google-business/businessDescriptionAnalyzer.ts
24. src/app/(app)/test-google-oauth-simple/page.tsx
25. src/app/(app)/test-auth-browser/page.tsx
26. src/app/(app)/team/accept/page.tsx
27. src/app/(app)/r/[slug]/utils/helperFunctions.ts
28. src/app/(app)/prompt-pages/individual/page.tsx
29. src/app/(app)/dashboard/widget/components/PhotoUpload.tsx
30. src/app/(app)/components/photos/LoadPhotosButton.tsx
31. src/app/(app)/components/help/IssuesTab.tsx
32. src/app/(app)/components/help/FAQsTab.tsx
33. src/app/(app)/components/communication/UpcomingReminders.tsx
34. src/app/(app)/components/business-info/ServiceItemsEditor.tsx
35. src/app/(app)/components/business-info/LoadBusinessInfoButton.tsx
36. src/app/(app)/components/ServiceDescriptionGenerator.tsx
37. src/app/(app)/components/ReviewResponseGenerator.tsx
38. src/app/(app)/components/ManualContactForm.tsx ⚠️ HIGH PRIORITY
39. src/app/(app)/components/GettingStarted.tsx
40. src/app/(app)/components/FeedbackModal.tsx
41. src/app/(app)/components/EmojiSentimentModal.tsx
42. src/app/(app)/components/EmailTemplatesSection.tsx
43. src/app/(app)/components/BusinessDescriptionAnalyzer.tsx
44. src/app/(app)/auth/sign-up/page.tsx
45. src/app/(app)/auth/sign-in/page.tsx
46. src/app/(app)/api/monitoring/critical-error/route.ts
47. src/app/(app)/admin/page.tsx ⚠️ HIGH PRIORITY
48. src/app/(app)/admin/metadata-templates/page.tsx
49. src/app/(app)/admin/free-accounts/page.tsx ⚠️ HIGH PRIORITY
50. src/app/(app)/admin/email-templates/page.tsx
51. src/utils/ai.ts

## Migration Status

- [ ] HIGH PRIORITY (5 files)
  - [ ] src/app/account/page.tsx
  - [ ] src/app/(app)/dashboard/account/page.tsx
  - [ ] src/app/(app)/components/ManualContactForm.tsx
  - [ ] src/app/(app)/admin/page.tsx
  - [ ] src/app/(app)/admin/free-accounts/page.tsx

- [ ] MEDIUM PRIORITY (46 files)

## Testing Checklist

After migrating each file:
1. ✅ Verify authentication still works
2. ✅ Verify X-Selected-Account header is sent
3. ✅ Test with multi-account users
4. ✅ Test account switching
5. ✅ Test error handling
6. ✅ Verify no regressions in functionality

## Notes

- The `apiClient` is located at `/src/utils/apiClient.ts`
- It automatically handles:
  - Bearer token via TokenManager
  - X-Selected-Account header (with fallback to token extraction)
  - Retry on 401 errors
  - Consistent error formatting
- Some endpoints may intentionally use `skipAuth: true` for public access
- Widget embed endpoints may need special handling (check if they should use apiClient)

## Completion Date
Target: TBD
Completed: N/A

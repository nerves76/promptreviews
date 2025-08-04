# PromptReviews Analytics System Analysis & Recommendations

## Overview

PromptReviews has a dual analytics system with two distinct tracking mechanisms:
1. **Google Analytics 4** - External analytics via `utils/analytics.ts`
2. **Internal Analytics** - Custom event tracking via `analytics_events` table

This analysis focuses on the internal analytics system which powers the dashboard analytics page.

## Current Architecture

### Database Tables

#### 1. `analytics_events` Table
**Purpose**: Tracks user interactions and events  
**Schema**:
```sql
CREATE TABLE analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt_page_id UUID,
    event_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    platform TEXT,
    session_id TEXT,
    user_agent TEXT,
    ip_address TEXT,
    CONSTRAINT valid_event_type CHECK (event_type IN (
        'view', 'copy_submit', 'ai_generate', 'login', 
        'prompt_page_created', 'contacts_uploaded', 
        'review_submitted', 'save_for_later', 
        'unsave_for_later', 'time_spent', 'feature_used'
    ))
);
```

#### 2. `review_submissions` Table
**Purpose**: Stores actual review data and metadata  
**Schema**:
```sql
CREATE TABLE review_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt_page_id UUID NOT NULL,
    platform TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('clicked', 'submitted')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    review_content TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    business_id UUID,
    verified BOOLEAN DEFAULT false,
    -- ... many more fields
);
```

### API Endpoints

#### 1. `/api/track-event` (Anonymous Users Only)
- **Purpose**: Tracks analytics events for anonymous users
- **Critical Issue**: Only tracks events when `!currentUser` (anonymous)
- **Events Tracked**: view, copy_submit, ai_generate, emoji_sentiment, etc.
- **Authentication**: Excludes logged-in users to "avoid duplicate tracking"

#### 2. `/api/track-review` (All Users)
- **Purpose**: Records review submissions and creates analytics events
- **Tracking**: Creates both `review_submissions` record AND `analytics_events` entry
- **Events Created**: `review_submitted` type in `analytics_events`
- **Authentication**: Works for all users (anonymous + authenticated)

### Event Flow

```mermaid
graph TD
    A[User visits prompt page] --> B[Page loads]
    B --> C[sendAnalyticsEvent called]
    C --> D{User authenticated?}
    D -->|No| E[/api/track-event]
    D -->|Yes| F[Event ignored - no tracking]
    E --> G[Insert into analytics_events]
    
    H[User clicks Copy & Submit] --> I{User authenticated?}
    I -->|No| J[sendAnalyticsEvent copy_submit]
    I -->|Yes| K[No copy_submit tracking]
    J --> L[/api/track-event]
    L --> M[Insert copy_submit event]
    
    N[Review submission] --> O[/api/track-review]
    O --> P[Insert into review_submissions]
    O --> Q[Insert review_submitted into analytics_events]
```

## Major Issues Identified

### 1. 🚨 **Copy & Submit Tracking Broken**
**Problem**: `copy_submit` events are not matching `review_submitted` events
**Impact**: Sou Wester shows 1 copy_submit event but 11 reviews
**Root Cause**: There's a disconnect between when `copy_submit` events are triggered vs when reviews are actually recorded

**Possible causes**:
- `copy_submit` event not firing reliably
- JavaScript errors preventing event tracking
- Network issues when sending to `/api/track-event`
- Timing issues between button click and event send

### 2. 📊 **Inconsistent Metrics**
**Problem**: "Copy & Submit Events" ≠ "Review Submissions"
- Copy & Submit: From `analytics_events` table (anonymous only)
- Review Submissions: From `review_submissions` table (all users)
- These should be the same number but aren't

### 2. 🔄 **Duplicate Event Types**
**Problem**: Same events tracked differently
- `copy_submit` (analytics_events) vs review submission (review_submissions)
- Both should represent the same user action

### 3. 🎯 **Analytics Dashboard Logic Issues**
**Current calculations**:
```typescript
// Copy & Submit count
analyticsData.copySubmits = filteredEvents.filter(e => e.event_type === "copy_submit").length;

// Review Submissions count  
analyticsData.reviewSubmitsAll = filteredEvents.filter(e => e.event_type === "review_submitted").length;
```

**Issue**: These should be the same number but `copy_submit` events aren't firing consistently

## Event Types Reference

### Currently Supported Events
| Event Type | Source | Triggered When | User Type |
|------------|--------|----------------|-----------|
| `view` | /api/track-event | Page visit | Anonymous only |
| `copy_submit` | /api/track-event | Copy & Submit clicked | Anonymous only |
| `ai_generate` | /api/track-event | AI generation used | Anonymous only |
| `review_submitted` | /api/track-review | Review actually submitted | All users |
| `emoji_sentiment` | /api/track-event | Emoji clicked | Anonymous only |
| `emoji_sentiment_choice` | /api/track-event | Public/private choice | Anonymous only |
| `feature_used` | /api/track-event | Generic feature usage | Anonymous only |

### Google Analytics Events (Separate System)
These are sent to GA4 and don't affect dashboard analytics:
- `sign_up`, `sign_in`, `widget_created`, `business_created`, etc.

## Recommendations

### Priority 1: Debug Copy & Submit Tracking

#### Option A: Add Debugging (Recommended)
```typescript
// Add logging to understand why events aren't firing
if (!currentUser && promptPage?.id && promptPage.review_platforms?.[idx]) {
  console.log("🔍 Sending copy_submit event for", promptPage.id);
  sendAnalyticsEvent({
    promptPageId: promptPage.id,
    eventType: "copy_submit",
    platform: promptPage.review_platforms[idx].platform || promptPage.review_platforms[idx].name,
  });
} else {
  console.log("❌ Copy submit not tracked:", { 
    currentUser: !!currentUser, 
    promptPageId: promptPage?.id,
    platform: promptPage.review_platforms?.[idx]
  });
}
```

#### Option B: Error Handling
```typescript
// Add error handling to sendAnalyticsEvent
export async function sendAnalyticsEvent(event: Record<string, any>) {
  try {
    console.log("📊 Sending analytics event:", event);
    const response = await fetch("/api/track-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    if (!response.ok) {
      console.error("Analytics event failed:", response.status);
    }
  } catch (e) {
    console.error("Analytics error:", e);
  }
}
```

### Priority 2: Simplify Dashboard Metrics

#### Option A: Remove Copy & Submit Events
- Remove confusing metric from dashboard
- Only show "Review Submissions" (more accurate)
- Use `review_submissions` table count instead of analytics events

#### Option B: Unify Tracking
- Make `copy_submit` and `review_submitted` represent the same action
- Ensure both are tracked consistently for all users

### Priority 3: Investigate Event Timing Issues

**Potential Issues**:
- `copy_submit` event fires before review is fully processed
- Race conditions between button click and API calls
- Browser navigation interrupting event sending

**Recommendations**:
- Ensure `copy_submit` event is sent AFTER successful review submission
- Add retry logic for failed analytics requests
- Use `navigator.sendBeacon()` for events that might be interrupted

### Priority 4: Add Debugging & Monitoring

1. **Add logging** to track event success/failure rates
2. **Dashboard metrics** showing event tracking health
3. **Alerts** when tracking discrepancies occur

### Priority 5: Schema Improvements

#### Add User Context to analytics_events
```sql
ALTER TABLE analytics_events ADD COLUMN user_id UUID;
ALTER TABLE analytics_events ADD COLUMN user_type TEXT CHECK (user_type IN ('anonymous', 'authenticated', 'admin'));
```

#### Improve Metadata Structure
```sql
-- Example metadata structure
{
  "user_type": "anonymous|authenticated",
  "session_duration": 120,
  "referrer": "google.com",
  "device_type": "mobile|desktop|tablet"
}
```

## Implementation Plan

### Phase 1: Critical Debugging (Immediate)
1. Add debugging logs to copy_submit tracking
2. Test with Sou Wester's prompt page
3. Identify why events aren't firing consistently

### Phase 2: Dashboard Improvements (1-2 weeks)
1. Update analytics dashboard to use unified metrics
2. Add user type breakdown if needed
3. Remove confusing "Copy & Submit Events" metric

### Phase 3: Enhanced Analytics (1 month)
1. Add user context tracking
2. Implement session tracking
3. Add debugging dashboard for admins

### Phase 4: Long-term Enhancements (2+ months)
1. Unify Google Analytics and internal analytics
2. Add conversion funnel tracking
3. Implement real-time analytics

## Testing Strategy

### 1. Anonymous User Testing
- Clear browser data completely
- Visit prompt page (should track `view`)
- Click Copy & Submit (should track `copy_submit`)
- Submit review (should track `review_submitted`)

### 2. Event Reliability Testing
- Test multiple copy & submit actions
- Check browser console for errors
- Verify events reach `/api/track-event`

### 3. Production Validation
- Compare copy_submit counts to review_submissions counts
- Should be equal after fixes

## Monitoring & Alerts

### Key Metrics to Monitor
1. **Event tracking ratio**: copy_submit vs review_submitted should be ~1:1
2. **Event success rate**: % of analytics requests that succeed
3. **Event drop-off**: Users who view but don't submit
4. **Platform distribution**: Web vs other platforms

### Recommended Alerts
- Alert if copy_submit events < 80% of review submissions
- Alert if analytics API error rate > 5%
- Alert if analytics events fail to insert

---

## Files Requiring Changes

### Immediate Investigation
- `src/app/r/[slug]/page-client.tsx` - Add debugging to copy_submit tracking
- `src/app/r/[slug]/utils/helperFunctions.ts` - Add error handling to sendAnalyticsEvent

### Future Enhancements
- `src/app/api/track-event/route.ts` - Add user type tracking
- `supabase/migrations/` - Schema improvements
- `src/app/dashboard/analytics/page.tsx` - Enhanced dashboard

This analysis should provide a clear roadmap for fixing the analytics discrepancies and improving the overall system reliability.
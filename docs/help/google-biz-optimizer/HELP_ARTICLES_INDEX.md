# Google Biz Optimizer™ - Help Articles Index

## Article Structure & Integration Points

This document maps help articles to specific UI components where they'll be linked via question mark icons.

## Completed Articles

### Main Overview
- ✅ `overview.md` - Main help center landing page

### OverviewStats Component Integration
Located in: `/src/components/GoogleBusinessProfile/OverviewStats.tsx`

1. ✅ **Total Reviews**
   - File: `metrics/total-reviews.md`
   - Link from: Total reviews count display
   - Key Topics: Review importance, benchmarks, growth strategies

2. ✅ **Average Rating**
   - File: `metrics/average-rating.md`
   - Link from: Star rating display
   - Key Topics: Rating psychology, conversion impact, improvement tactics

3. ✅ **Review Trend**
   - File: `metrics/review-trends.md`
   - Link from: Trend percentage indicator
   - Key Topics: Velocity importance, maintaining momentum, recovery strategies

4. ✅ **Monthly Review Chart**
   - File: `metrics/monthly-patterns.md`
   - Link from: Bar chart area
   - Key Topics: Seasonal patterns, reading trends, optimization timing

### BusinessHealthMetrics Component Integration
Located in: `/src/components/GoogleBusinessProfile/BusinessHealthMetrics.tsx`

#### Profile Completeness Section
5. ✅ **SEO Score**
   - File: `optimization/seo-score.md`
   - Link from: SEO score percentage
   - Key Topics: Score factors, improvement strategies, industry benchmarks

6. ✅ **Categories**
   - File: `optimization/categories.md`
   - Link from: Categories used count
   - Key Topics: Category selection, primary vs secondary, ranking impact

7. ✅ **Services**
   - File: `optimization/services.md`
   - Link from: Services count
   - Key Topics: Service descriptions, keyword optimization, completeness

8. 🔄 **Business Description** (Pending)
   - File: `optimization/business-description.md`
   - Link from: Description character count
   - Key Topics: Writing compelling descriptions, keyword placement

9. ✅ **Photos**
   - File: `optimization/photos.md`
   - Link from: Photo coverage display
   - Key Topics: Photo categories, upload frequency, quality guidelines

#### Customer Engagement Section
10. ✅ **Review Responses**
    - File: `engagement/review-responses.md`
    - Link from: Unresponded reviews count
    - Key Topics: Response templates, timing, impact on rankings

11. ✅ **Questions & Answers**
    - File: `engagement/questions-answers.md`
    - Link from: Unanswered questions count
    - Key Topics: Q&A importance, proactive FAQs, response strategies

12. ✅ **Google Posts**
    - File: `engagement/posts.md`
    - Link from: Recent posts count
    - Key Topics: Post types, frequency, content ideas

#### Performance Metrics Section
13. 🔄 **Profile Views** (Pending)
    - File: *(planned)* `performance/views.md`
    - Link from: Monthly views count
    - Key Topics: View types, discovery vs direct, improvement tactics

14. ✅ **Customer Actions**
    - File: `performance/customer-actions.md`
    - Link from: Actions breakdown
    - Key Topics: Action types, conversion optimization, tracking

15. 🔄 **Search Queries** (Pending)
    - File: *(planned)* `performance/search-queries.md`
    - Link from: Top search queries list
    - Key Topics: Query types, keyword research, optimization

#### Optimization Opportunities Section
16. ✅ **Quick Wins**
    - File: `optimization/quick-wins.md`
    - Link from: Priority tasks list
    - Key Topics: Task prioritization, impact vs effort, implementation

## Implementation Plan

### Phase 1: Core Metrics (COMPLETED)
- ✅ Total Reviews
- ✅ Average Rating
- ✅ Review Trends
- ✅ SEO Score
- ✅ Review Responses

### Phase 2: Profile Optimization (TODO)
- 🔄 Categories
- 🔄 Services
- 🔄 Business Description
- 🔄 Photos

### Phase 3: Engagement & Performance (In Progress)
- ✅ Questions & Answers
- ✅ Google Posts
- ✅ Customer Actions
- 🔄 Profile Views
- 🔄 Search Queries

### Phase 4: Supporting Content (Ongoing)
- ✅ Monthly Patterns
- ✅ Quick Wins
- 🔄 Video tutorials
- 🔄 Industry-specific guides

## Integration Code Pattern

For adding help icons to components:

```tsx
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

// In the component
<div className="flex items-center gap-2">
  <span>Total Reviews</span>
  <button
    onClick={() => openHelp('metrics/total-reviews')}
    className="text-gray-400 hover:text-gray-600 transition-colors"
    aria-label="Learn more about total reviews"
  >
    <QuestionMarkCircleIcon className="w-4 h-4" />
  </button>
</div>
```

## Content Guidelines

Each article should:
1. Be 200-400 words (optimal for modals)
2. Include actionable tips
3. Show industry benchmarks
4. Provide "Quick Win" section
5. Link to related articles
6. Include contact CTA for consultation

## SEO Considerations

Articles are optimized for:
- "Google Business Profile [metric]"
- "How to improve [metric]"
- "GBP optimization tips"
- "Local SEO [topic]"
- "Google My Business help"

## Notes

- Articles use markdown for flexibility
- Can be displayed in modals (embed) or full page (help center)
- Include both educational content and promotional CTAs
- Focus on value-first approach to build trust

---
*Last updated: January 2025*

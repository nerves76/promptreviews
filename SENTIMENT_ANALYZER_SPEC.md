# Sentiment Analyzer Feature Specification

## Overview

The Sentiment Analyzer highlights what customers are saying right now so teams can act quickly. Version 1 focuses on three practical outputs drawn straight from recent reviews:
- Overall sentiment score with positive / mixed / negative breakdown
- Top three themes, split between strengths and areas to improve, each grounded by real quotes
- Three improvement ideas tied to the surfaced themes

This keeps implementation lightweight while still surfacing actionable guidance without over-promising deep NLP sophistication.

**Location in App:** Dashboard → Get Reviews → Sentiment Analyzer

## Business Rules

### Usage Limits (Plan-Based)
- **Grower Plan**: 1 analysis per month, analyzes up to 50 most recent reviews
- **Builder Plan**: 3 analyses per month, analyzes up to 100 most recent reviews
- **Maven Plan**: 10 analyses per month, analyzes up to 500 most recent reviews

### Requirements
- **Minimum Reviews**: Must have at least 10 reviews in database to run analysis
- **Review Source**: Analyzes most recent reviews up to plan limit
- **Monthly Reset**: Usage limits reset on the 1st of each month
- **Review Selection**: If account has more reviews than plan limit, system automatically selects the most recent ones

### Tracking
- Store analysis runs in `sentiment_analysis_runs` table
- Track: `account_id`, `run_date`, `review_count_analyzed`, `plan_at_time`, `results_json`
- Display usage quota in UI: "You've used 2 of 3 analyses this month"

## User Experience Flow

### 1. Access & Eligibility Check
```
Dashboard → Get Reviews → Sentiment Analyzer
↓
Check: Does user have ≥10 reviews?
  NO → Show message: "You need at least 10 reviews to run sentiment analysis. Keep collecting reviews!"
  YES → Continue
↓
Check: Has user exceeded monthly limit?
  YES → Show message: "You've used all X analyses this month. Resets on [date]"
  NO → Show "Run Analysis" button
```

### 2. Analysis Initiation
```
User clicks "Run Analysis" button
↓
Show info message: "Analyzing your [X] most recent reviews..."
  (where X = 50/100/500 based on plan)
↓
Show loading state with progress indicators:
  - "Collecting your reviews..."
  - "Analyzing sentiment patterns..."
  - "Identifying key themes..."
  - "Summarizing what customers said..."
  - "Preparing improvement ideas..."
↓
Display results (estimated time: 15-20s for 50 reviews, 30-45s for 100, 60-90s for 500)
```

### 3. Results Display
Present findings in three concise sections:
1. Sentiment Summary (score, distribution, 1–2 sentence takeaway)
2. Themes Spotlight (up to three cards showing strengths or improvements with quotes)
3. Improvement Ideas (up to three next steps tied to the themes)

## Data Structure

### Input Data
```typescript
interface AnalysisInput {
  accountId: string;
  reviewCount: number;
  reviews: Array<{
    id: string;
    content: string;
    rating: number;
    created_at: string;
    platform?: string;
    reviewer_name?: string;
  }>;
  dateRange: {
    earliest: string;
    latest: string;
  };
}
```

### Output Data Structure
```typescript
interface SentimentAnalysisResult {
  metadata: {
    analysisId: string;
    runDate: string;
    reviewCount: number;
    reviewLimit: number; // plan-based limit (50/100/500)
    totalReviewsInAccount: number;
    dateRangeAnalyzed: { start: string; end: string };
    analysisVersion: string; // e.g., "1.0"
  };

  sentimentSummary: {
    overallLabel: 'positive' | 'mixed' | 'negative';
    sentimentScore: number; // 0-100
    breakdown: Record<'positive' | 'mixed' | 'negative', {
      count: number;
      percentage: number;
    }>;
    shortSummary: string; // single sentence takeaway
  };

  themes: Array<{
    name: string; // e.g., "Customer Service"
    sentiment: 'strength' | 'improvement';
    mentionCount: number;
    supportingQuotes: Array<{
      reviewId: string;
      excerpt: string; // <= 80 characters
    }>; // up to 2 quotes per theme
  }>;

  improvementIdeas: Array<{
    title: string;
    description: string; // 1-2 sentences
    sourceThemes: string[]; // reference theme names
  }>; // up to 3 ideas

  limitations?: string; // optional note when signal is weak or inconsistent
}
```

**Validation rules:**
- Limit `themes` to a maximum of three entries with at least one strength and one improvement when possible.
- Limit `improvementIdeas` to three items and ensure each references at least one `sourceThemes` entry.
- Reject or flag analyses when fewer than 10 reviews pass eligibility or when the model returns empty quotes/ideas.

## AI Prompt Structure

### System Prompt
```
You are an insights analyst who reviews customer feedback and produces concise,
actionable summaries. Stay within the provided schema, ground every claim in the
review data, and avoid guessing beyond the evidence. If the reviews do not
support an insight or improvement idea, leave it out or use the `limitations`
field to explain why.
```

### Analysis Prompt Template
```
You are analyzing the {reviewCount} most recent reviews (out of {totalReviews})
for [Business Name]. Focus on what customers are praising and where they are
asking for improvements.

REVIEW DATA:
{reviewsJson}

TASKS:
1. Sentiment Summary:
   - Label overall sentiment as positive, mixed, or negative.
   - Count how many reviews are positive, mixed, and negative.
   - Produce a 0-100 sentiment score where >66 is positive, 34-66 is mixed, <34 is negative.
   - Write a one-sentence summary grounded in the reviews.

2. Themes Spotlight:
   - Identify up to three recurring themes present in the reviews.
   - Mark each theme as either a strength or an improvement area.
   - Provide the mention count and up to two short supporting quotes (≤80 characters) with their review IDs.

3. Improvement Ideas:
   - Suggest up to three ideas that would improve customer experience.
   - Each idea must reference at least one of the themes and explain how it helps.

4. Limitations:
   - If feedback volume is too small or signals conflict, use the `limitations`
     field to explain instead of guessing.

OUTPUT:
- Return JSON that exactly matches the SentimentAnalysisResult interface.
- Do not invent data or entities not evidenced in the reviews.
- If eligibility requirements are not met (e.g., <10 reviews), return an
  object containing only `metadata` and a `limitations` message.
```

### Follow-up Enhancement Prompt (Optional)
```
Create a shareable summary based on the analysis results:
1. Two-sentence headline recap covering sentiment score and standout theme.
2. One quick win improvement idea drawn from `improvementIdeas`.
3. One strength highlight drawn from `themes`.

Stay conversational and point back to evidence from the analysis.
```

## UI Components

### 1. Analyzer Dashboard Page
**Route:** `/dashboard/get-reviews/sentiment-analyzer`

**Components:**
- `SentimentAnalyzerPage.tsx` - Main page component
- `AnalysisQuotaCard.tsx` - Shows usage and limits (prominent at top)
- `RunAnalysisButton.tsx` - Initiates analysis
- `AnalysisHistoryList.tsx` - Past analysis runs
- `AnalysisResultsView.tsx` - Results display

#### Page Layout Overview
```tsx
<SentimentAnalyzerPage>
  {/* Header Section */}
  <PageHeader>
    <h1>Sentiment Analyzer</h1>
    <p>Get AI-powered insights from your customer reviews</p>
  </PageHeader>

  {/* Quota Card - Always visible at top */}
  <AnalysisQuotaCard
    plan={userPlan}
    usageThisMonth={usageThisMonth}
    usageLimit={usageLimit}
    reviewCount={totalReviews}
    reviewLimit={reviewLimit}
    nextResetDate={nextResetDate}
  />

  {/* Main Content Area */}
  {hasResults ? (
    <AnalysisResultsView results={latestResults} />
  ) : (
    <>
      <EmptyState />
      <AnalysisHistoryList analyses={pastAnalyses} />
    </>
  )}
</SentimentAnalyzerPage>
```

### 2. Analysis Quota Card (Always Visible)

```tsx
<AnalysisQuotaCard className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6 mb-6">
  <div className="flex items-start justify-between">
    <div className="flex-1">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Your Analysis Limits
      </h3>

      {/* Plan Information */}
      <div className="flex items-center gap-3 mb-4">
        <PlanBadge plan={plan}>
          {plan === 'grower' && '🌱 Grower Plan'}
          {plan === 'builder' && '🏗️ Builder Plan'}
          {plan === 'maven' && '🎯 Maven Plan'}
        </PlanBadge>
        <UpgradeLink href="/dashboard/plan">
          Upgrade for more analyses →
        </UpgradeLink>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Analyses Per Month */}
        <StatCard>
          <StatLabel>Monthly Analyses</StatLabel>
          <StatValue>
            <span className={usageThisMonth >= usageLimit ? 'text-red-600' : 'text-green-600'}>
              {usageThisMonth}
            </span>
            <span className="text-gray-400"> / {usageLimit}</span>
          </StatValue>
          <ProgressBar
            value={usageThisMonth}
            max={usageLimit}
            className={usageThisMonth >= usageLimit ? 'bg-red-500' : 'bg-green-500'}
          />
        </StatCard>

        {/* Review Limit */}
        <StatCard>
          <StatLabel>Reviews Per Analysis</StatLabel>
          <StatValue>Up to {reviewLimit}</StatValue>
          <StatHelp>Most recent reviews analyzed</StatHelp>
        </StatCard>

        {/* Resets On */}
        <StatCard>
          <StatLabel>Resets On</StatLabel>
          <StatValue>{formatDate(nextResetDate)}</StatValue>
          <StatHelp>{daysUntilReset} days remaining</StatHelp>
        </StatCard>
      </div>

      {/* Current Status Message */}
      {usageThisMonth >= usageLimit ? (
        <Alert variant="warning" className="mt-4">
          <AlertIcon>⚠️</AlertIcon>
          <AlertText>
            You've used all {usageLimit} analyses this month.
            Your limit resets on {formatDate(nextResetDate)}.
            <UpgradeButton>Upgrade to get more analyses</UpgradeButton>
          </AlertText>
        </Alert>
      ) : reviewCount < 10 ? (
        <Alert variant="info" className="mt-4">
          <AlertIcon>ℹ️</AlertIcon>
          <AlertText>
            You need at least 10 reviews to run sentiment analysis.
            You currently have {reviewCount} review{reviewCount !== 1 ? 's' : ''}.
            <Link href="/dashboard/get-reviews">Collect more reviews →</Link>
          </AlertText>
        </Alert>
      ) : (
        <Alert variant="success" className="mt-4">
          <AlertIcon>✅</AlertIcon>
          <AlertText>
            Ready to analyze! You have {usageLimit - usageThisMonth} analysis
            {usageLimit - usageThisMonth !== 1 ? 'es' : ''} remaining this month.
            {reviewCount > reviewLimit && (
              <span> We'll analyze your {reviewLimit} most recent reviews (out of {reviewCount} total).</span>
            )}
          </AlertText>
        </Alert>
      )}
    </div>

    {/* Info Icon with Tooltip */}
    <Tooltip content={getTooltipContent(plan)}>
      <InfoIcon className="text-indigo-500 cursor-help" />
    </Tooltip>
  </div>
</AnalysisQuotaCard>

// Tooltip content helper
function getTooltipContent(plan: string) {
  return `
    ${plan === 'grower' ? '🌱 Grower Plan' : plan === 'builder' ? '🏗️ Builder Plan' : '🎯 Maven Plan'}

    • Run ${plan === 'grower' ? '1' : plan === 'builder' ? '3' : '10'} analysis per month
    • Analyze up to ${plan === 'grower' ? '50' : plan === 'builder' ? '100' : '500'} recent reviews
    • Resets on the 1st of each month
    • Upgrade anytime for more analyses
  `;
}
```

### 3. Results Sections

#### Sentiment Summary Card
```tsx
<SentimentSummaryCard
  score={sentimentSummary.sentimentScore}
  label={sentimentSummary.overallLabel}
  reviewCount={metadata.reviewCount}
>
  {metadata.totalReviewsInAccount > metadata.reviewLimit && (
    <InfoBanner>
      Analyzed your {metadata.reviewCount} most recent reviews (out of
      {metadata.totalReviewsInAccount} total)
    </InfoBanner>
  )}
  <ScoreGauge value={sentimentSummary.sentimentScore} />
  <p className="mt-4 text-gray-700">{sentimentSummary.shortSummary}</p>
  <DistributionBar breakdown={sentimentSummary.breakdown} />
</SentimentSummaryCard>
```

#### Themes Spotlight
```tsx
<ThemesSpotlight themes={themes}>
  {themes.map(theme => (
    <ThemeCard key={theme.name} variant={theme.sentiment}>
      <header className="flex items-center justify-between">
        <h3>{theme.name}</h3>
        <Badge>{theme.sentiment === 'strength' ? 'Strength' : 'Improve'}</Badge>
      </header>
      <p className="text-sm text-gray-600">{theme.mentionCount} mentions</p>
      <div className="mt-3 space-y-2">
        {theme.supportingQuotes.map(q => (
          <blockquote key={q.reviewId} className="text-sm italic text-gray-700">
            “{q.excerpt}”
          </blockquote>
        ))}
      </div>
    </ThemeCard>
  ))}
</ThemesSpotlight>
```

#### Improvement Ideas List
```tsx
<ImprovementIdeas ideas={improvementIdeas}>
  {improvementIdeas.map(idea => (
    <IdeaCard key={idea.title}>
      <h4>{idea.title}</h4>
      <p className="text-sm text-gray-700">{idea.description}</p>
      <small className="text-xs text-gray-500">
        Based on: {idea.sourceThemes.join(', ')}
      </small>
    </IdeaCard>
  ))}
</ImprovementIdeas>
```

#### Limitations Alert (conditional)
- If `limitations` exists, render a neutral alert above the results explaining the constraint and collapse the themes/ideas sections to avoid stretching thin signals.

## Database Schema

### New Table: `sentiment_analysis_runs`
```sql
CREATE TABLE sentiment_analysis_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  run_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  review_count_analyzed INTEGER NOT NULL,
  date_range_start TIMESTAMP WITH TIME ZONE NOT NULL,
  date_range_end TIMESTAMP WITH TIME ZONE NOT NULL,
  plan_at_time VARCHAR(50) NOT NULL, -- grower, builder, maven
  results_json JSONB NOT NULL, -- Full SentimentAnalysisResult
  analysis_version VARCHAR(20) DEFAULT '1.0',
  processing_time_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes
  CONSTRAINT sentiment_analysis_runs_account_id_idx
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);

CREATE INDEX idx_sentiment_runs_account_date
  ON sentiment_analysis_runs(account_id, run_date DESC);

CREATE INDEX idx_sentiment_runs_account_month
  ON sentiment_analysis_runs(account_id, DATE_TRUNC('month', run_date));
```

### Update `accounts` table (if needed)
```sql
-- Add column to track sentiment analyzer usage
ALTER TABLE accounts
ADD COLUMN sentiment_analyses_this_month INTEGER DEFAULT 0,
ADD COLUMN sentiment_last_reset_date DATE DEFAULT CURRENT_DATE;
```

## API Endpoints

### 1. Check Eligibility
```typescript
GET /api/sentiment-analyzer/eligibility

Response: {
  eligible: boolean;
  reason?: string; // if not eligible
  reviewCount: number;
  reviewLimit: number; // Based on plan (50/100/500)
  minReviewsRequired: number; // Always 10
  usageThisMonth: number;
  usageLimit: number; // Based on plan (1/3/10)
  nextResetDate: string;
  plan: 'grower' | 'builder' | 'maven';
  daysUntilReset: number;
}

Example Responses:

// Eligible
{
  "eligible": true,
  "reviewCount": 127,
  "reviewLimit": 100,
  "minReviewsRequired": 10,
  "usageThisMonth": 1,
  "usageLimit": 3,
  "nextResetDate": "2025-04-01T00:00:00Z",
  "plan": "builder",
  "daysUntilReset": 12
}

// Not eligible - insufficient reviews
{
  "eligible": false,
  "reason": "insufficient_reviews",
  "reviewCount": 7,
  "reviewLimit": 50,
  "minReviewsRequired": 10,
  "usageThisMonth": 0,
  "usageLimit": 1,
  "nextResetDate": "2025-04-01T00:00:00Z",
  "plan": "grower",
  "daysUntilReset": 12
}

// Not eligible - quota exceeded
{
  "eligible": false,
  "reason": "quota_exceeded",
  "reviewCount": 85,
  "reviewLimit": 50,
  "minReviewsRequired": 10,
  "usageThisMonth": 1,
  "usageLimit": 1,
  "nextResetDate": "2025-04-01T00:00:00Z",
  "plan": "grower",
  "daysUntilReset": 12
}
```

### 2. Run Analysis
```typescript
POST /api/sentiment-analyzer/analyze

Request: {
  accountId: string;
}

Response: {
  success: boolean;
  analysisId: string;
  results: SentimentAnalysisResult;
  reviewsAnalyzed: number;
  reviewsSkipped: number; // If total > limit
}

Errors:
- 400: Not enough reviews
- 429: Monthly limit exceeded
- 500: Analysis failed

Implementation Logic:
1. Get user's plan (grower/builder/maven)
2. Determine review limit (50/100/500)
3. Fetch most recent N reviews (ORDER BY created_at DESC LIMIT N)
4. Send to OpenAI for analysis
5. Store results with metadata about total vs analyzed
```

### 3. Get Analysis History
```typescript
GET /api/sentiment-analyzer/history?accountId={accountId}&limit=10

Response: {
  analyses: Array<{
    id: string;
    runDate: string;
    reviewCount: number;
    overallLabel: 'positive' | 'mixed' | 'negative';
    sentimentScore: number;
  }>;
  total: number;
}
```

### 4. Get Single Analysis
```typescript
GET /api/sentiment-analyzer/analysis/{analysisId}

Response: {
  results: SentimentAnalysisResult;
}
```

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Create database schema and migrations
- [ ] Build API endpoints for eligibility check
- [ ] Implement plan-based usage tracking
- [ ] Create AnalysisQuotaCard component with full limit display
- [ ] Create basic UI shell for analyzer page
- [ ] Add plan limit constants (PLAN_ANALYSIS_LIMITS, PLAN_REVIEW_LIMITS)

### Phase 2: AI Integration (Week 2)
- [ ] Finalize evidence-focused AI prompt and schema contract
- [ ] Integrate OpenAI API for analysis
- [ ] Implement data transformation layer
- [ ] Add error handling and retries
- [ ] Test with sample reviews

### Phase 3: Results Display (Week 3)
- [ ] Build sentiment summary card with gauge and distribution bar
- [ ] Implement themes spotlight cards with supporting quotes
- [ ] Create improvement ideas list tied to themes
- [ ] Handle limitations state (weak signal / not enough data)

### Phase 4: Polish & Enhancement (Week 4)
- [ ] Add analysis history view (score + timestamp)
- [ ] Wire up quota reminders and empty states
- [ ] Add lightweight loading/progress messaging
- [ ] Monitor token usage and add guardrails for large payloads

### Phase 5: Testing & Launch (Week 5)
- [ ] End-to-end testing with real data
- [ ] Performance testing (100+ reviews)
- [ ] User acceptance testing
- [ ] Documentation and help articles
- [ ] Soft launch to beta users
- [ ] Full launch with announcement

## Technical Considerations

### Performance
- **Review Limits**: Hard caps at 50/100/500 reviews prevent runaway costs and timeouts
- **Caching**: Cache results for 24 hours to allow re-viewing without reprocessing
- **Queue System**: Use background job queue (BullMQ/Redis) for analyses with 100+ reviews
- **Timeout Handling**: Set timeouts based on review count:
  - 50 reviews: 30 seconds
  - 100 reviews: 60 seconds
  - 500 reviews: 120 seconds
- **Progressive Processing**: For Maven (500 reviews), process in 2 batches of 250

### Cost Management
- **Review Caps**: Plan-based limits (50/100/500) control maximum token usage per analysis
- **Token Optimization**: Compress review data sent to OpenAI, remove redundant info
- **Model Selection**: Use GPT-4-turbo for better cost/performance ratio
- **Estimated Costs per Analysis**:
  - Grower (50 reviews): ~$0.15-0.25
  - Builder (100 reviews): ~$0.30-0.50
  - Maven (500 reviews): ~$1.50-2.50
- **Rate Limiting**: Monthly usage caps prevent runaway costs
- **Monitoring**: Track API costs per analysis run and alert if anomalies detected

### Data Privacy
- **Anonymization**: Strip personally identifiable information from reviews before analysis
- **Data Retention**: Keep analysis results for 90 days, then archive or delete
- **Access Control**: Only account owners can run and view analyses

### Error Handling
```typescript
try {
  // Run analysis
} catch (error) {
  if (error.code === 'insufficient_reviews') {
    // Show friendly message
  } else if (error.code === 'quota_exceeded') {
    // Show upgrade prompt
  } else if (error.code === 'openai_timeout') {
    // Retry mechanism
  } else {
    // Log to Sentry and show generic error
  }
}
```

## Success Metrics

### Product Metrics
- **Adoption Rate**: % of eligible accounts that run at least 1 analysis
- **Repeat Usage**: Average analyses per account per month
- **Time to Insight**: Average time from clicking "Run Analysis" to viewing results
- **User Satisfaction**: NPS score for the feature

### Business Metrics
- **Upgrade Impact**: % of users who upgrade plan for more analyses
- **Retention Impact**: Change in retention rate for users who use analyzer
- **Support Reduction**: Decrease in "how to improve" support tickets

### Technical Metrics
- **Analysis Success Rate**: % of analyses that complete successfully
- **Average Processing Time**: Time to complete analysis
- **API Cost per Analysis**: OpenAI API cost per run
- **Error Rate**: % of failed analyses

## Future Enhancements

### V1.1 (Q2 2025)
- Competitor comparison (if integrated with multiple platforms)
- Custom theme creation (let users define their own categories)
- Automated monitoring (alert when sentiment drops)
- Review response suggestions

### V1.2 (Q3 2025)
- Multi-location analysis (for businesses with multiple locations)
- Team sharing (share insights with team members)
- Integration with CRM/support tools
- Sentiment forecasting

### V2.0 (Q4 2025)
- Real-time sentiment dashboard
- AI-powered automated responses to reviews
- Predictive analytics (predict review trends)
- Custom report templates

## Documentation Requirements

### User Documentation
- [ ] "What is Sentiment Analyzer?" help article
- [ ] "How to interpret your sentiment analysis" guide
- [ ] "Turning improvement ideas into action" best practices
- [ ] Video tutorial (3-5 minutes)
- [ ] FAQ section

### Developer Documentation
- [ ] API endpoint documentation
- [ ] Prompt engineering guide
- [ ] Database schema documentation
- [ ] Testing procedures
- [ ] Monitoring and alerting setup

## Appendix

### Sample Analysis Result Preview
```
📊 Sentiment Snapshot
Generated: March 15, 2025 | Reviews Analyzed: 100 (most recent)
Total Reviews in Account: 247

🎯 Sentiment Summary
Overall: Positive | Score: 73/100
"Customers rave about the support team but continue to flag inconsistent
product quality. Tighten QA to unlock higher satisfaction."

Distribution
• Positive: 68 reviews (54%)
• Mixed: 31 reviews (24%)
• Negative: 28 reviews (22%)

🌟 Themes Spotlight
- Strength — Customer Support (45 mentions)
  "The support team went above and beyond..."
- Improvement — Product Quality (22 mentions)
  "Item arrived damaged, had to return it"
- Improvement — Website Navigation (14 mentions)
  "Takes forever to find the product I want"

🛠️ Improvement Ideas
1. Harden packaging before shipment to cut damaged orders (Product Quality)
2. Streamline navigation with clearer categories and search (Website Navigation)
3. Share support playbook across teams to keep service bar high (Customer Support)
```

---

**Document Version:** 1.0
**Last Updated:** [Current Date]
**Author:** Product Team
**Status:** Draft for Review

# Sentiment Analyzer Feature Specification

## Overview

The Sentiment Analyzer is an AI-powered analytics tool that provides businesses with deep insights into customer feedback by analyzing reviews in their database. It goes beyond simple sentiment classification to identify actionable improvement opportunities, trends, and strengths/weaknesses based on what customers are actually saying.

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
  - "Generating insights..."
  - "Preparing recommendations..."
↓
Display results (estimated time: 15-20s for 50 reviews, 30-45s for 100, 60-90s for 500)
```

### 3. Results Display
Present findings in organized sections with both data and interpretation:
1. Executive Summary
2. Sentiment Overview (charts + numbers)
3. Key Themes & Topics
4. Strengths & Weaknesses
5. Actionable Recommendations
6. Trend Analysis (if multiple runs exist)

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
    totalReviewsInAccount: number; // Total reviews user has
    reviewLimit: number; // Plan-based limit (50/100/500)
    dateRangeAnalyzed: { start: string; end: string };
    analysisVersion: string; // e.g., "1.0"
  };

  executiveSummary: {
    overallSentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
    sentimentScore: number; // 0-100
    keyTakeaway: string;
    urgentIssues: number;
    strengthsCount: number;
  };

  sentimentBreakdown: {
    positive: {
      count: number;
      percentage: number;
      confidenceAvg: number;
      granularSentiments: {
        delighted: number;
        satisfied: number;
        impressed: number;
        grateful: number;
      };
    };
    negative: {
      count: number;
      percentage: number;
      confidenceAvg: number;
      granularSentiments: {
        frustrated: number;
        disappointed: number;
        angry: number;
        concerned: number;
      };
    };
    neutral: {
      count: number;
      percentage: number;
    };
    mixed: {
      count: number;
      percentage: number;
    };
  };

  themes: Array<{
    name: string; // e.g., "Product Quality", "Customer Service"
    mentionCount: number;
    sentimentScore: number; // -100 to +100
    sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
    confidence: number; // 0-1
    keyPhrases: string[]; // Top 5-10 phrases related to this theme
    exampleReviews: string[]; // 2-3 review excerpts
    severity?: 'high' | 'medium' | 'low'; // For negative themes
  }>;

  entities: Array<{
    name: string; // e.g., "delivery", "staff", specific product name
    type: 'product' | 'service' | 'feature' | 'person' | 'department';
    mentionCount: number;
    sentimentScore: number;
    sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  }>;

  strengths: Array<{
    title: string;
    description: string;
    supportingData: {
      mentionCount: number;
      positivePercentage: number;
      exampleQuotes: string[];
    };
    impactLevel: 'high' | 'medium' | 'low';
  }>;

  weaknesses: Array<{
    title: string;
    description: string;
    supportingData: {
      mentionCount: number;
      negativePercentage: number;
      exampleQuotes: string[];
    };
    severity: 'high' | 'medium' | 'low';
    potentialRootCause?: string;
  }>;

  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string; // e.g., "Customer Service", "Product"
    title: string;
    description: string;
    specificActions: string[];
    estimatedImpact: 'high' | 'medium' | 'low';
    metricsToTrack: string[];
    relatedThemes: string[];
  }>;

  linguisticInsights: {
    sarcasmDetected: number;
    negationsHandled: number;
    domainTermsIdentified: string[];
    implicitSentimentCount: number;
  };

  temporalData?: {
    // Only available if account has multiple analysis runs
    sentimentTrend: 'improving' | 'declining' | 'stable';
    previousScore: number;
    currentScore: number;
    changePercentage: number;
    trendHistory: Array<{
      date: string;
      score: number;
      reviewCount: number;
    }>;
  };
}
```

## AI Prompt Structure

### System Prompt
```
You are an expert business analytics AI specializing in customer feedback analysis.
Your role is to analyze customer reviews and provide actionable insights that help
businesses improve their products and services.

You have access to advanced sentiment analysis capabilities including:
- Multi-layered sentiment classification (positive, negative, neutral, mixed)
- Granular emotion detection
- Sarcasm and irony detection
- Theme and entity extraction
- Root cause analysis
- Trend identification

Your analysis should be:
- Data-driven with specific numbers and percentages
- Actionable with concrete recommendations
- Balanced, highlighting both strengths and areas for improvement
- Clear and accessible to non-technical business owners
```

### Analysis Prompt Template
```
Analyze the following {reviewCount} customer reviews for [Business Name] and provide
comprehensive sentiment analysis and actionable insights.

NOTE: These are the {reviewCount} most recent reviews from a total of {totalReviews} reviews.
Focus on current trends and recent customer sentiment.

REVIEW DATA:
{reviewsJson}

ANALYSIS REQUIREMENTS:

1. SENTIMENT CATEGORIZATION:
   - Classify each review into: Positive, Negative, Neutral, or Mixed
   - Identify granular sentiments (e.g., delighted, frustrated, disappointed)
   - Assign confidence scores (0-1) for each classification
   - Handle negations, sarcasm, and irony appropriately

2. THEME AND ENTITY EXTRACTION:
   - Identify key themes (e.g., product quality, customer service, pricing)
   - Extract specific entities (product names, features, departments)
   - Determine attribute-level sentiment for each theme/entity
   - Identify domain-specific terminology

3. CONTEXTUAL UNDERSTANDING:
   - Detect sarcasm and ironic language
   - Process negations accurately
   - Identify implicit sentiment
   - Assess severity for negative feedback

4. INSIGHTS GENERATION:
   - Identify top 5 strengths with supporting data
   - Identify top 5 weaknesses with severity assessment
   - Infer potential root causes for recurring issues
   - Highlight unique or unusual feedback patterns

5. ACTIONABLE RECOMMENDATIONS:
   - Provide 5-10 prioritized recommendations
   - Include specific implementable actions
   - Estimate potential impact
   - Suggest monitoring metrics

OUTPUT FORMAT:
Return a structured JSON object matching the SentimentAnalysisResult interface.
Ensure all percentages add up to 100% and all data is consistent.

IMPORTANT:
- Be specific with numbers and percentages
- Provide exact quote excerpts from reviews (keep them under 100 characters)
- Prioritize recommendations by impact and feasibility
- Be honest about both positive and negative findings
```

### Follow-up Enhancement Prompt (Optional)
```
Based on the analysis results, generate:
1. A concise executive summary (2-3 sentences) suitable for sharing
2. Top 3 "Quick Wins" - easy improvements with high impact
3. One "Hidden Gem" - a unique positive insight that might be overlooked
4. One "Watch Out" - an emerging issue that needs attention

Keep it conversational and actionable.
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

#### Executive Summary Card
```tsx
<div className="bg-white rounded-lg shadow p-6">
  <h2>Executive Summary</h2>
  {metadata.totalReviewsInAccount > metadata.reviewLimit && (
    <InfoBanner>
      Analyzed your {metadata.reviewCount} most recent reviews
      (out of {metadata.totalReviewsInAccount} total)
    </InfoBanner>
  )}
  <div className="sentiment-score-gauge">
    {/* Circular gauge showing 0-100 score */}
  </div>
  <p className="key-takeaway">{summary.keyTakeaway}</p>
  <div className="quick-stats">
    <Stat label="Overall Sentiment" value={summary.overallSentiment} />
    <Stat label="Reviews Analyzed" value={metadata.reviewCount} />
    <Stat label="Urgent Issues" value={summary.urgentIssues} highlight />
  </div>
</div>
```

#### Sentiment Breakdown Chart
- Pie chart showing positive/negative/neutral/mixed distribution
- Bar chart showing granular sentiments
- Confidence score indicators

#### Themes & Topics Table
```
| Theme              | Mentions | Sentiment | Score | Severity |
|--------------------|----------|-----------|-------|----------|
| Customer Service   | 45       | Positive  | +72   | -        |
| Product Quality    | 38       | Mixed     | +12   | Low      |
| Delivery Speed     | 28       | Negative  | -45   | High     |
```

#### Strengths List (Expandable Cards)
```tsx
<StrengthCard>
  <Title>Exceptional Customer Service</Title>
  <ImpactBadge level="high" />
  <Description>
    Customers consistently praise your support team's responsiveness
    and helpfulness.
  </Description>
  <SupportingData>
    • 45 mentions (38% of reviews)
    • 93% positive sentiment
  </SupportingData>
  <Quotes>
    "The support team went above and beyond..."
    "Quick response and actually solved my issue!"
  </Quotes>
</StrengthCard>
```

#### Weaknesses List (Expandable Cards)
```tsx
<WeaknessCard severity="high">
  <Title>Inconsistent Product Quality</Title>
  <SeverityBadge level="high" />
  <Description>
    Multiple customers report receiving damaged or defective items.
  </Description>
  <SupportingData>
    • 22 mentions (18% of reviews)
    • 86% negative sentiment
  </SupportingData>
  <RootCause>
    Potential issues with packaging or quality control in fulfillment.
  </RootCause>
  <Quotes>
    "Item arrived damaged, had to return it"
    "Quality not as advertised in photos"
  </Quotes>
</WeaknessCard>
```

#### Recommendations Section
```tsx
<RecommendationCard priority="high">
  <PriorityBadge>High Priority</PriorityBadge>
  <Category>Product Quality</Category>
  <Title>Implement Pre-Shipment Quality Checks</Title>
  <Description>
    Add a quality control checkpoint before items leave your facility
    to reduce damaged/defective shipments.
  </Description>
  <Actions>
    1. Create inspection checklist for common issues
    2. Train fulfillment staff on quality standards
    3. Add protective packaging for fragile items
  </Actions>
  <EstimatedImpact>
    Could reduce negative reviews related to quality by 60-70%
  </EstimatedImpact>
  <MetricsToTrack>
    • Defect rate per 100 shipments
    • Quality-related returns
    • Customer satisfaction scores
  </MetricsToTrack>
</RecommendationCard>
```

#### Sentiment Over Time Chart (if available)
```tsx
{/* Only show if user has run analysis 2+ times */}
<SentimentOverTimeSection>
  <h3>Sentiment Over Time</h3>
  <LineChart
    data={temporalData.trendHistory}
    xAxis="date"
    yAxis="score"
    yAxisLabel="Sentiment Score"
  />
  <TrendIndicator
    direction={temporalData.sentimentTrend}
    change={`${temporalData.changePercentage > 0 ? '+' : ''}${temporalData.changePercentage}%`}
  />
  <Insights>
    {temporalData.sentimentTrend === 'improving' && (
      <p>✅ Your sentiment score has improved by {temporalData.changePercentage}%
         since your last analysis. Keep up the great work!</p>
    )}
    {temporalData.sentimentTrend === 'declining' && (
      <p>⚠️ Your sentiment score has declined by {Math.abs(temporalData.changePercentage)}%
         since your last analysis. Review the weaknesses section for action items.</p>
    )}
    {temporalData.sentimentTrend === 'stable' && (
      <p>📊 Your sentiment score has remained stable. Focus on the recommendations
         to reach the next level.</p>
    )}
  </Insights>
</SentimentOverTimeSection>
```

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
    overallSentiment: string;
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
- [ ] Develop comprehensive AI prompt
- [ ] Integrate OpenAI API for analysis
- [ ] Implement data transformation layer
- [ ] Add error handling and retries
- [ ] Test with sample reviews

### Phase 3: Results Display (Week 3)
- [ ] Build executive summary component
- [ ] Create sentiment breakdown charts
- [ ] Implement themes and topics table
- [ ] Build strengths/weaknesses cards
- [ ] Create recommendations section

### Phase 4: Polish & Enhancement (Week 4)
- [ ] Add analysis history view
- [ ] Implement trend comparison (multi-run)
- [ ] Add export functionality (PDF/CSV)
- [ ] Optimize performance for large review sets
- [ ] Add loading states and animations
- [ ] Implement caching for repeated analyses

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
- [ ] "Acting on recommendations" best practices
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
📊 Sentiment Analysis Report
Generated: March 15, 2025 | Reviews Analyzed: 100 (most recent)
Total Reviews in Account: 247

🎯 EXECUTIVE SUMMARY
Overall Sentiment: Positive (Score: 73/100)
Your customers love your customer service but have concerns about
product consistency. Focus on quality control to reach the next level.

📈 SENTIMENT BREAKDOWN
✅ Positive: 68 reviews (54%)
⚠️ Mixed: 31 reviews (24%)
❌ Negative: 28 reviews (22%)

🔑 TOP THEMES
1. Customer Service → +82 (Excellent!)
2. Product Quality → -12 (Needs attention)
3. Delivery Speed → +45 (Good)
4. Value for Money → +28 (Satisfactory)
5. User Experience → +56 (Good)

💪 YOUR STRENGTHS
1. Exceptional Customer Support (45 mentions, 93% positive)
   "The support team went above and beyond..."

2. Fast Shipping (32 mentions, 89% positive)
   "Arrived even faster than expected!"

3. Easy Returns Process (18 mentions, 85% positive)
   "No hassle returns, very smooth"

⚠️ AREAS FOR IMPROVEMENT
1. [HIGH] Product Quality Consistency (22 mentions, 86% negative)
   → Issue: Damaged/defective items arriving
   → Root Cause: Possible packaging or QC issues

2. [MEDIUM] Website Navigation (14 mentions, 71% negative)
   → Issue: Hard to find specific products

3. [LOW] Limited Product Variety (8 mentions, 62% negative)
   → Issue: Customers want more options

🎯 RECOMMENDED ACTIONS
[HIGH PRIORITY] Implement pre-shipment quality checks
  → Reduce defective shipments by 60-70%
  → Actions: Create inspection checklist, train staff, improve packaging
  → Track: Defect rate, quality-related returns

[MEDIUM PRIORITY] Redesign website navigation
  → Improve product discovery by 40-50%
  → Actions: User testing, improve search, add filters
  → Track: Time to find product, bounce rate

[LOW PRIORITY] Expand product line
  → Increase customer satisfaction by 15-20%
  → Actions: Survey for desired products, competitor analysis
  → Track: New product sales, repeat purchase rate
```

---

**Document Version:** 1.0
**Last Updated:** [Current Date]
**Author:** Product Team
**Status:** Draft for Review

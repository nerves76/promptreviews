# Sentiment Analyzer - Quick Start Guide

**TL;DR**: Import, call function, get insights. That's it.

## Installation

Already installed. Just import and use.

## Basic Usage (Copy & Paste)

```typescript
import { analyzeSentiment } from '@/lib/sentiment-analyzer';

// Your reviews from database
const reviews = await getReviewsFromDB(accountId, 100);

// Run analysis
const { result, metrics } = await analyzeSentiment(
  reviews,
  'Your Business Name',
  totalReviewsInAccount
);

// Use results
console.log('Score:', result.sentimentSummary.sentimentScore);
console.log('Themes:', result.themes);
console.log('Ideas:', result.improvementIdeas);
console.log('Cost:', `$${metrics.tokenUsage.estimatedCost.toFixed(4)}`);
```

## API Endpoint Example

```typescript
// /api/sentiment-analyzer/analyze/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { analyzeSentiment } from '@/lib/sentiment-analyzer';
import { createServerSupabaseClient } from '@/auth/providers/supabase';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get account and check quota
    const { accountId } = await request.json();
    const canAnalyze = await checkQuota(accountId);
    if (!canAnalyze) {
      return NextResponse.json({ error: 'Quota exceeded' }, { status: 429 });
    }

    // 3. Fetch reviews
    const { data: reviews } = await supabase
      .from('widget_reviews')
      .select('id, content, rating, created_at, platform, reviewer_name')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(100); // Plan-based limit

    if (reviews.length < 10) {
      return NextResponse.json(
        { error: 'Minimum 10 reviews required' },
        { status: 400 }
      );
    }

    // 4. Get business name
    const { data: account } = await supabase
      .from('accounts')
      .select('business_name')
      .eq('id', accountId)
      .single();

    // 5. Run analysis
    const { result, metrics } = await analyzeSentiment(
      reviews,
      account.business_name,
      reviews.length
    );

    // 6. Save to database
    await supabase.from('sentiment_analysis_runs').insert({
      account_id: accountId,
      review_count_analyzed: reviews.length,
      date_range_start: reviews[reviews.length - 1].created_at,
      date_range_end: reviews[0].created_at,
      plan_at_time: account.plan,
      results_json: result,
      processing_time_seconds: Math.floor(metrics.durationMs / 1000),
    });

    // 7. Return results
    return NextResponse.json({
      success: true,
      result,
      metrics,
    });

  } catch (error) {
    console.error('Analysis failed:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

## Frontend Usage Example

```typescript
// Component: AnalyzeButton.tsx

'use client';

import { useState } from 'react';
import type { SentimentAnalysisResult } from '@/lib/sentiment-analyzer';

export function AnalyzeButton({ accountId }: { accountId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SentimentAnalysisResult | null>(null);

  async function runAnalysis() {
    setLoading(true);
    try {
      const response = await fetch('/api/sentiment-analyzer/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={runAnalysis} disabled={loading}>
        {loading ? 'Analyzing...' : 'Run Analysis'}
      </button>

      {result && (
        <div>
          <h2>Results</h2>
          <p>Score: {result.sentimentSummary.sentimentScore}/100</p>
          <p>Label: {result.sentimentSummary.overallLabel}</p>

          <h3>Themes</h3>
          {result.themes.map(theme => (
            <div key={theme.name}>
              <strong>{theme.name}</strong> ({theme.sentiment})
              {theme.supportingQuotes.map(q => (
                <p key={q.reviewId}>"{q.excerpt}"</p>
              ))}
            </div>
          ))}

          <h3>Improvement Ideas</h3>
          {result.improvementIdeas.map(idea => (
            <div key={idea.title}>
              <strong>{idea.title}</strong>
              <p>{idea.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Cost Estimation Before Analysis

```typescript
import { estimateTokenCost } from '@/lib/sentiment-analyzer';

// Show user estimated cost
const estimate = estimateTokenCost(reviewCount);
console.log(`Estimated cost: $${estimate.minCost} - $${estimate.maxCost}`);

// Proceed if acceptable
if (estimate.maxCost < 1.00) {
  await analyzeSentiment(...);
}
```

## Error Handling Template

```typescript
try {
  const { result } = await analyzeSentiment(reviews, businessName, totalReviews);
  // Success!
} catch (error) {
  if (error.message.includes('Minimum 10 reviews')) {
    // Show: "Need more reviews"
  } else if (error.message.includes('rate limit')) {
    // Show: "Try again in a few minutes"
  } else if (error.message.includes('timed out')) {
    // Show: "Analysis took too long, try with fewer reviews"
  } else {
    // Show: "Something went wrong, contact support"
  }
}
```

## Testing with Sample Data

```typescript
import { sampleReviews } from '@/lib/sentiment-analyzer/__tests__/sample-reviews';

// Quick test
const { result } = await analyzeSentiment(
  sampleReviews,
  'Test Business',
  100
);

console.log('Test passed:', result.sentimentSummary.sentimentScore > 0);
```

## Environment Setup

Add to `.env.local`:

```bash
OPENAI_API_KEY=sk-your-api-key-here
```

## Common Issues

### "OPENAI_API_KEY is missing"
➜ Add to `.env.local` and restart dev server

### "Minimum 10 reviews required"
➜ Check your database query returns at least 10 reviews

### "rate limit exceeded"
➜ Wait a few minutes or contact OpenAI to increase limits

### "timeout"
➜ Reduce number of reviews or increase timeout in config

## Configuration Options

```typescript
await analyzeSentiment(reviews, businessName, totalReviews, {
  model: 'gpt-4-turbo-preview',  // Model to use
  temperature: 0.3,               // 0-1, lower = more consistent
  maxTokens: 2500,                // Max response length
  timeout: 60000,                 // Milliseconds (60s default)
});
```

## Type Definitions

```typescript
import type {
  SentimentAnalysisResult,
  ReviewForAnalysis,
  AnalysisMetrics,
  TokenUsage,
} from '@/lib/sentiment-analyzer';
```

## Quick Reference

| Function | Purpose | Returns |
|----------|---------|---------|
| `analyzeSentiment()` | Run analysis | `{ result, metrics }` |
| `estimateTokenCost()` | Estimate cost | `{ minCost, maxCost }` |
| `validateAnalysisResult()` | Validate data | `{ valid, errors }` |

## Cost Quick Reference

| Reviews | Cost | Time |
|---------|------|------|
| 50 | ~$0.09 | 15-20s |
| 100 | ~$0.14 | 25-35s |
| 500 | ~$0.56 | 60-90s |

## Next Steps

1. ✅ Copy API endpoint code above
2. ✅ Add to `/api/sentiment-analyzer/analyze/route.ts`
3. ✅ Create database table (see spec)
4. ✅ Test with sample data
5. ✅ Test with real data
6. ✅ Deploy

## Full Documentation

- **Complete guide**: `README.md`
- **Cost analysis**: `COST_ANALYSIS.md`
- **Implementation details**: `IMPLEMENTATION_SUMMARY.md`
- **Code examples**: `example.ts`

## Support

Questions? Check the docs or look at `example.ts` for more examples.

---

**That's it!** You're ready to analyze sentiment. 🚀

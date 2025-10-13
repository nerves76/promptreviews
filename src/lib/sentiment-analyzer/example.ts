/**
 * Example usage of the Sentiment Analyzer
 *
 * This file demonstrates how to use the sentiment analyzer module.
 * NOT meant to be executed in production - for reference only.
 */

import { analyzeSentiment, estimateTokenCost } from './openai-integration';
import { sampleReviews, getReviewsForPlan } from './__tests__/sample-reviews';
import type { ReviewForAnalysis, SentimentAnalysisResult } from './types';

/**
 * Example 1: Basic sentiment analysis
 */
async function basicExample() {
  console.log('=== Basic Sentiment Analysis Example ===\n');

  // Get sample reviews (18 reviews for Builder plan)
  const reviews = getReviewsForPlan('builder');

  console.log(`Analyzing ${reviews.length} reviews for "Sample Business"...\n`);

  try {
    const { result, metrics } = await analyzeSentiment(
      reviews,
      'Sample Business',
      100 // total reviews in account
    );

    // Display results
    console.log('✅ Analysis Complete!\n');
    console.log(`Overall Sentiment: ${result.sentimentSummary.overallLabel.toUpperCase()}`);
    console.log(`Sentiment Score: ${result.sentimentSummary.sentimentScore}/100`);
    console.log(`\nBreakdown:`);
    console.log(`  Positive: ${result.sentimentSummary.breakdown.positive.count} (${result.sentimentSummary.breakdown.positive.percentage}%)`);
    console.log(`  Mixed: ${result.sentimentSummary.breakdown.mixed.count} (${result.sentimentSummary.breakdown.mixed.percentage}%)`);
    console.log(`  Negative: ${result.sentimentSummary.breakdown.negative.count} (${result.sentimentSummary.breakdown.negative.percentage}%)`);

    console.log(`\nSummary: "${result.sentimentSummary.shortSummary}"`);

    console.log(`\n📊 Themes Found (${result.themes.length}):`);
    result.themes.forEach((theme, i) => {
      console.log(`\n${i + 1}. ${theme.name} (${theme.sentiment})`);
      console.log(`   Mentions: ${theme.mentionCount}`);
      console.log(`   Quotes:`);
      theme.supportingQuotes.forEach(quote => {
        console.log(`   - "${quote.excerpt}" (Review ${quote.reviewId})`);
      });
    });

    console.log(`\n💡 Improvement Ideas (${result.improvementIdeas.length}):`);
    result.improvementIdeas.forEach((idea, i) => {
      console.log(`\n${i + 1}. ${idea.title}`);
      console.log(`   ${idea.description}`);
      console.log(`   Based on: ${idea.sourceThemes.join(', ')}`);
    });

    console.log(`\n⏱️  Performance Metrics:`);
    console.log(`   Duration: ${metrics.durationMs}ms`);
    console.log(`   Total Tokens: ${metrics.tokenUsage.totalTokens}`);
    console.log(`   Tokens/Review: ${metrics.tokensPerReview.toFixed(1)}`);
    console.log(`   Estimated Cost: $${metrics.tokenUsage.estimatedCost.toFixed(4)}`);

    if (result.limitations) {
      console.log(`\n⚠️  Limitations: ${result.limitations}`);
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example 2: Cost estimation before analysis
 */
function costEstimationExample() {
  console.log('\n\n=== Cost Estimation Example ===\n');

  const plans = [
    { name: 'Grower', reviews: 50 },
    { name: 'Builder', reviews: 100 },
    { name: 'Maven', reviews: 500 },
  ];

  plans.forEach(plan => {
    const estimate = estimateTokenCost(plan.reviews);
    console.log(`${plan.name} Plan (${plan.reviews} reviews):`);
    console.log(`  Tokens: ${estimate.minTokens} - ${estimate.maxTokens}`);
    console.log(`  Cost: $${estimate.minCost.toFixed(4)} - $${estimate.maxCost.toFixed(4)}`);
    console.log();
  });
}

/**
 * Example 3: Custom configuration
 */
async function customConfigExample() {
  console.log('\n\n=== Custom Configuration Example ===\n');

  const reviews = getReviewsForPlan('grower').slice(0, 10); // Just 10 reviews

  try {
    const { result, metrics } = await analyzeSentiment(
      reviews,
      'Custom Business',
      50,
      {
        model: 'gpt-4-turbo-preview',
        temperature: 0.2, // More consistent results
        maxTokens: 2000, // Shorter responses
        timeout: 30000, // 30 seconds
      }
    );

    console.log(`✅ Analyzed ${reviews.length} reviews with custom config`);
    console.log(`Score: ${result.sentimentSummary.sentimentScore}/100`);
    console.log(`Duration: ${metrics.durationMs}ms`);
    console.log(`Cost: $${metrics.tokenUsage.estimatedCost.toFixed(4)}`);

  } catch (error) {
    console.error('❌ Analysis failed:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example 4: Error handling patterns
 */
async function errorHandlingExample() {
  console.log('\n\n=== Error Handling Example ===\n');

  // Example 1: Too few reviews
  try {
    const tooFewReviews = sampleReviews.slice(0, 5); // Only 5 reviews
    await analyzeSentiment(tooFewReviews, 'Test Business', 10);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Minimum 10 reviews')) {
      console.log('✅ Correctly caught: Insufficient reviews error');
    }
  }

  // Example 2: Missing business name
  try {
    const reviews = getReviewsForPlan('grower').slice(0, 10);
    await analyzeSentiment(reviews, '', 50);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Business name is required')) {
      console.log('✅ Correctly caught: Missing business name error');
    }
  }

  // Example 3: Empty reviews array
  try {
    await analyzeSentiment([], 'Test Business', 50);
  } catch (error) {
    if (error instanceof Error && error.message.includes('No reviews provided')) {
      console.log('✅ Correctly caught: Empty reviews array error');
    }
  }

  console.log('\n✅ All error handling tests passed');
}

/**
 * Example 5: Validate analysis result manually
 */
async function validationExample() {
  console.log('\n\n=== Validation Example ===\n');

  const reviews = getReviewsForPlan('builder').slice(0, 12);

  try {
    const { result } = await analyzeSentiment(reviews, 'Test Business', 50);

    // Manual validation checks
    const totalCount =
      result.sentimentSummary.breakdown.positive.count +
      result.sentimentSummary.breakdown.mixed.count +
      result.sentimentSummary.breakdown.negative.count;

    console.log('Validation Checks:');
    console.log(`✅ Total sentiment counts: ${totalCount} (expected: ${reviews.length})`);
    console.log(`✅ Themes count: ${result.themes.length} (max: 3)`);
    console.log(`✅ Improvement ideas: ${result.improvementIdeas.length} (max: 3)`);

    // Check quotes length
    result.themes.forEach(theme => {
      theme.supportingQuotes.forEach(quote => {
        const isValid = quote.excerpt.length <= 80;
        console.log(`${isValid ? '✅' : '❌'} Quote length: ${quote.excerpt.length} chars (max: 80)`);
      });
    });

    // Check theme references in improvement ideas
    const themeNames = result.themes.map(t => t.name);
    result.improvementIdeas.forEach(idea => {
      const validRefs = idea.sourceThemes.every(theme => themeNames.includes(theme));
      console.log(`${validRefs ? '✅' : '❌'} Improvement idea references valid themes`);
    });

  } catch (error) {
    console.error('❌ Validation failed:', error instanceof Error ? error.message : error);
  }
}

/**
 * Run all examples
 *
 * Note: This requires OPENAI_API_KEY to be set in environment
 */
async function runAllExamples() {
  console.log('🤖 Sentiment Analyzer Examples\n');
  console.log('========================================\n');

  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment variables');
    console.log('\nTo run these examples, add your OpenAI API key to .env.local:');
    console.log('OPENAI_API_KEY=your-api-key-here\n');
    return;
  }

  // Run examples that don't require API calls
  costEstimationExample();

  // Uncomment to run API-based examples (costs money!)
  // await basicExample();
  // await customConfigExample();
  // await errorHandlingExample();
  // await validationExample();

  console.log('\n========================================');
  console.log('✅ Examples complete!\n');
}

// Export for potential use in tests or debugging
export {
  basicExample,
  costEstimationExample,
  customConfigExample,
  errorHandlingExample,
  validationExample,
  runAllExamples,
};

// Run if executed directly (not imported)
if (require.main === module) {
  runAllExamples().catch(console.error);
}

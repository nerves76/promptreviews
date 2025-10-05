/**
 * Test script for Help Modal CMS Integration
 * Tests the /api/docs/contextual endpoint and article loading
 */

const testRoutes = [
  { route: '/dashboard', name: 'Dashboard Home' },
  { route: '/dashboard/widget', name: 'Widget Management' },
  { route: '/dashboard/contacts', name: 'Contacts' },
  { route: '/dashboard/team', name: 'Team Management' },
  { route: '/dashboard/reviews', name: 'Reviews' },
  { route: '/dashboard/business-profile', name: 'Business Profile' },
  { route: '/dashboard/edit-prompt-page/universal', name: 'Universal Prompt Page' },
  { route: '/dashboard/prompt-pages', name: 'Prompt Pages' }
];

const testResults = {
  contextualTests: [],
  articleTests: [],
  performanceMetrics: [],
  errors: []
};

// Base URL for testing
const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

/**
 * Test the contextual API endpoint
 */
async function testContextualAPI(route, routeName) {
  const startTime = Date.now();

  try {
    const response = await fetch(`${BASE_URL}/api/docs/contextual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ route, limit: 6 })
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      route,
      routeName,
      success: true,
      responseTime,
      articleCount: data.articles?.length || 0,
      articles: data.articles?.map(a => ({
        slug: a.slug,
        title: a.title,
        category: a.metadata?.category || 'unknown'
      })) || [],
      source: data.source
    };
  } catch (error) {
    return {
      route,
      routeName,
      success: false,
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * Test loading a specific article
 */
async function testArticleLoading(slug) {
  const startTime = Date.now();

  try {
    const response = await fetch(`${BASE_URL}/api/docs/articles/${encodeURIComponent(slug)}`);
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      slug,
      success: true,
      responseTime,
      hasContent: !!data.article?.content,
      contentLength: data.article?.content?.length || 0,
      title: data.article?.title,
      source: data.source
    };
  } catch (error) {
    return {
      slug,
      success: false,
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 Starting Help Modal CMS Integration Tests...\n');
  console.log(`Testing against: ${BASE_URL}\n`);
  console.log('='.repeat(80));

  // Test 1: Contextual API for each route
  console.log('\n📍 Test 1: Contextual Article API\n');

  for (const { route, name } of testRoutes) {
    process.stdout.write(`Testing ${name.padEnd(30)} ... `);
    const result = await testContextualAPI(route, name);
    testResults.contextualTests.push(result);

    if (result.success) {
      console.log(`✅ ${result.articleCount} articles (${result.responseTime}ms)`);
      testResults.performanceMetrics.push({
        type: 'contextual',
        route,
        responseTime: result.responseTime
      });
    } else {
      console.log(`❌ FAILED: ${result.error}`);
      testResults.errors.push({ test: 'contextual', route, error: result.error });
    }
  }

  // Test 2: Article content loading
  console.log('\n📄 Test 2: Article Content Loading\n');

  // Collect unique article slugs from contextual tests
  const articleSlugs = new Set();
  testResults.contextualTests.forEach(test => {
    if (test.success && test.articles) {
      test.articles.forEach(article => articleSlugs.add(article.slug));
    }
  });

  const slugsToTest = Array.from(articleSlugs).slice(0, 10); // Test first 10 unique articles

  for (const slug of slugsToTest) {
    process.stdout.write(`Loading ${slug.substring(0, 40).padEnd(40)} ... `);
    const result = await testArticleLoading(slug);
    testResults.articleTests.push(result);

    if (result.success) {
      console.log(`✅ ${(result.contentLength / 1024).toFixed(1)}KB (${result.responseTime}ms)`);
      testResults.performanceMetrics.push({
        type: 'article',
        slug,
        responseTime: result.responseTime
      });
    } else {
      console.log(`❌ FAILED: ${result.error}`);
      testResults.errors.push({ test: 'article', slug, error: result.error });
    }
  }

  // Generate summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Test Summary\n');

  const contextualSuccess = testResults.contextualTests.filter(t => t.success).length;
  const contextualTotal = testResults.contextualTests.length;
  const articleSuccess = testResults.articleTests.filter(t => t.success).length;
  const articleTotal = testResults.articleTests.length;

  console.log(`Contextual API Tests: ${contextualSuccess}/${contextualTotal} passed`);
  console.log(`Article Loading Tests: ${articleSuccess}/${articleTotal} passed`);
  console.log(`Total Errors: ${testResults.errors.length}`);

  // Performance metrics
  if (testResults.performanceMetrics.length > 0) {
    const contextualMetrics = testResults.performanceMetrics.filter(m => m.type === 'contextual');
    const articleMetrics = testResults.performanceMetrics.filter(m => m.type === 'article');

    if (contextualMetrics.length > 0) {
      const avgContextual = contextualMetrics.reduce((sum, m) => sum + m.responseTime, 0) / contextualMetrics.length;
      const maxContextual = Math.max(...contextualMetrics.map(m => m.responseTime));
      const minContextual = Math.min(...contextualMetrics.map(m => m.responseTime));

      console.log(`\n⏱️  Contextual API Performance:`);
      console.log(`   Average: ${avgContextual.toFixed(0)}ms`);
      console.log(`   Min: ${minContextual}ms`);
      console.log(`   Max: ${maxContextual}ms`);
    }

    if (articleMetrics.length > 0) {
      const avgArticle = articleMetrics.reduce((sum, m) => sum + m.responseTime, 0) / articleMetrics.length;
      const maxArticle = Math.max(...articleMetrics.map(m => m.responseTime));
      const minArticle = Math.min(...articleMetrics.map(m => m.responseTime));

      console.log(`\n⏱️  Article Loading Performance:`);
      console.log(`   Average: ${avgArticle.toFixed(0)}ms`);
      console.log(`   Min: ${minArticle}ms`);
      console.log(`   Max: ${maxArticle}ms`);
    }
  }

  // Article distribution
  console.log('\n📚 Articles by Route:\n');
  testResults.contextualTests
    .filter(t => t.success)
    .forEach(test => {
      console.log(`${test.routeName}:`);
      if (test.articles && test.articles.length > 0) {
        test.articles.forEach(article => {
          console.log(`  - ${article.title} (${article.category})`);
        });
      } else {
        console.log('  (No articles)');
      }
      console.log('');
    });

  // Errors
  if (testResults.errors.length > 0) {
    console.log('\n❌ Errors:\n');
    testResults.errors.forEach((err, idx) => {
      console.log(`${idx + 1}. [${err.test}] ${err.route || err.slug}`);
      console.log(`   ${err.error}\n`);
    });
  }

  return testResults;
}

// Run tests and save results
runTests()
  .then(results => {
    // Save detailed results to JSON
    const fs = require('fs');
    const resultsPath = './test-results.json';
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Detailed results saved to: ${resultsPath}`);

    // Exit with appropriate code
    const hasErrors = results.errors.length > 0;
    const allContextualPassed = results.contextualTests.every(t => t.success);
    const allArticlesPassed = results.articleTests.every(t => t.success);

    if (hasErrors || !allContextualPassed || !allArticlesPassed) {
      console.log('\n❌ Some tests failed');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('\n💥 Test runner crashed:', error);
    process.exit(1);
  });

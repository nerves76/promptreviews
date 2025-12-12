/**
 * DataForSEO SERP Client - Test & Usage Examples
 *
 * Run with: npx tsx src/features/rank-tracking/api/dataforseo-serp-client.test.ts
 *
 * Make sure you have these environment variables set:
 * - DATAFORSEO_LOGIN
 * - DATAFORSEO_PASSWORD
 */

import {
  searchGoogleSerp,
  checkRankForDomain,
  getKeywordVolume,
  getKeywordSuggestions,
  getAvailableLocations,
  testConnection,
} from './dataforseo-serp-client';

// ============================================
// Test Configuration
// ============================================

const TEST_CONFIG = {
  keyword: 'pizza delivery',
  domain: 'dominos.com',
  locationCode: 2840, // USA
  languageCode: 'en',
  device: 'desktop' as const,
};

// ============================================
// Test Functions
// ============================================

async function testConnectionTest() {
  console.log('\n🧪 Testing API Connection...\n');

  const result = await testConnection();

  if (result.success) {
    console.log(`✅ Connection successful!`);
    console.log(`   Message: ${result.message}`);
    console.log(`   Cost: $${result.cost}`);
  } else {
    console.log(`❌ Connection failed: ${result.message}`);
  }

  return result.success;
}

async function testSearchGoogleSerp() {
  console.log('\n🧪 Testing searchGoogleSerp...\n');

  const result = await searchGoogleSerp({
    keyword: TEST_CONFIG.keyword,
    locationCode: TEST_CONFIG.locationCode,
    languageCode: TEST_CONFIG.languageCode,
    device: TEST_CONFIG.device,
    depth: 20, // Top 20 results
  });

  if (result.success) {
    console.log(`✅ Search successful!`);
    console.log(`   Found: ${result.items.length} organic results`);
    console.log(`   Cost: $${result.cost}`);
    console.log('\n   Top 5 Results:');

    result.items.slice(0, 5).forEach((item) => {
      console.log(`   ${item.position}. ${item.title}`);
      console.log(`      URL: ${item.url}`);
      console.log(`      Domain: ${item.domain}`);
      console.log(`      Features: ${JSON.stringify(item.serpFeatures)}`);
      console.log('');
    });
  } else {
    console.log(`❌ Search failed: ${result.error}`);
  }

  return result.success;
}

async function testCheckRankForDomain() {
  console.log('\n🧪 Testing checkRankForDomain...\n');

  const result = await checkRankForDomain({
    keyword: TEST_CONFIG.keyword,
    locationCode: TEST_CONFIG.locationCode,
    targetDomain: TEST_CONFIG.domain,
    device: TEST_CONFIG.device,
    depth: 100,
  });

  console.log(`✅ Rank check complete!`);
  console.log(`   Domain: ${TEST_CONFIG.domain}`);
  console.log(`   Found: ${result.found ? 'Yes' : 'No'}`);

  if (result.found) {
    console.log(`   Position: #${result.position}`);
    console.log(`   URL: ${result.url}`);
    console.log(`   Title: ${result.title}`);
  }

  console.log(`   Cost: $${result.cost}`);
  console.log(`\n   Top 5 Competitors:`);

  result.topCompetitors.slice(0, 5).forEach((competitor) => {
    console.log(`   ${competitor.position}. ${competitor.domain}`);
    console.log(`      ${competitor.title}`);
  });

  return true;
}

async function testGetKeywordVolume() {
  console.log('\n🧪 Testing getKeywordVolume...\n');

  const keywords = [
    'pizza delivery',
    'pizza near me',
    'best pizza',
    'pizza restaurant',
    'order pizza online',
  ];

  const results = await getKeywordVolume({
    keywords,
    locationCode: TEST_CONFIG.locationCode,
    languageCode: TEST_CONFIG.languageCode,
  });

  if (results.length > 0) {
    console.log(`✅ Volume data retrieved!`);
    console.log(`   Keywords analyzed: ${results.length}`);
    console.log('\n   Results:');

    results.forEach((result) => {
      console.log(`   "${result.keyword}"`);
      console.log(`      Search Volume: ${result.searchVolume.toLocaleString()}/month`);
      console.log(`      CPC: ${result.cpc ? `$${result.cpc.toFixed(2)}` : 'N/A'}`);
      console.log(`      Competition: ${result.competitionLevel || 'N/A'} (${result.competition || 'N/A'})`);

      if (result.monthlySearches.length > 0) {
        const recent = result.monthlySearches.slice(0, 3);
        console.log(`      Recent Trend: ${recent.map((m) => `${m.year}-${m.month}: ${m.searchVolume}`).join(', ')}`);
      }

      console.log('');
    });
  } else {
    console.log(`❌ No volume data retrieved`);
  }

  return results.length > 0;
}

async function testGetKeywordSuggestions() {
  console.log('\n🧪 Testing getKeywordSuggestions...\n');

  const results = await getKeywordSuggestions({
    seedKeyword: 'pizza',
    locationCode: TEST_CONFIG.locationCode,
    limit: 20,
  });

  if (results.length > 0) {
    console.log(`✅ Suggestions retrieved!`);
    console.log(`   Total suggestions: ${results.length}`);
    console.log('\n   Top 10 Suggestions by Volume:');

    const topByVolume = results
      .sort((a, b) => b.searchVolume - a.searchVolume)
      .slice(0, 10);

    topByVolume.forEach((suggestion, index) => {
      console.log(`   ${index + 1}. "${suggestion.keyword}"`);
      console.log(`      Volume: ${suggestion.searchVolume.toLocaleString()}/month`);
      console.log(`      CPC: ${suggestion.cpc ? `$${suggestion.cpc.toFixed(2)}` : 'N/A'}`);
      console.log(`      Competition: ${suggestion.competitionLevel || 'N/A'}`);
    });
  } else {
    console.log(`❌ No suggestions retrieved`);
  }

  return results.length > 0;
}

async function testGetAvailableLocations() {
  console.log('\n🧪 Testing getAvailableLocations...\n');

  const locations = await getAvailableLocations();

  if (locations.length > 0) {
    console.log(`✅ Locations retrieved!`);
    console.log(`   Total locations: ${locations.length}`);
    console.log('\n   Sample US Locations:');

    const usLocations = locations
      .filter((loc) => loc.countryIsoCode === 'US')
      .slice(0, 10);

    usLocations.forEach((loc) => {
      console.log(`   ${loc.locationCode}: ${loc.locationName} (${loc.locationType})`);
    });

    console.log('\n   Sample International Locations:');

    const intlLocations = locations
      .filter((loc) => loc.countryIsoCode !== 'US')
      .slice(0, 10);

    intlLocations.forEach((loc) => {
      console.log(`   ${loc.locationCode}: ${loc.locationName}, ${loc.countryIsoCode} (${loc.locationType})`);
    });
  } else {
    console.log(`❌ No locations retrieved`);
  }

  return locations.length > 0;
}

// ============================================
// Main Test Runner
// ============================================

async function runAllTests() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║   DataForSEO SERP Client - Comprehensive Test Suite  ║');
  console.log('╚═══════════════════════════════════════════════════════╝');

  const tests = [
    { name: 'Connection Test', fn: testConnectionTest },
    { name: 'Search Google SERP', fn: testSearchGoogleSerp },
    { name: 'Check Rank for Domain', fn: testCheckRankForDomain },
    { name: 'Get Keyword Volume', fn: testGetKeywordVolume },
    { name: 'Get Keyword Suggestions', fn: testGetKeywordSuggestions },
    { name: 'Get Available Locations', fn: testGetAvailableLocations },
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${test.name}`);
    console.log('='.repeat(60));

    try {
      const success = await test.fn();
      results.push({ name: test.name, success, error: null });
    } catch (error) {
      console.error(`\n❌ Test "${test.name}" threw an error:`);
      console.error(error);
      results.push({
        name: test.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Delay between tests to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n\n╔═══════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                       ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  results.forEach((result) => {
    const icon = result.success ? '✅' : '❌';
    const status = result.success ? 'PASSED' : 'FAILED';
    console.log(`${icon} ${result.name}: ${status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  const passed = results.filter((r) => r.success).length;
  const total = results.length;

  console.log(`\nTotal: ${passed}/${total} tests passed`);

  return results;
}

// ============================================
// Run Tests
// ============================================

if (require.main === module) {
  runAllTests()
    .then((results) => {
      const allPassed = results.every((r) => r.success);
      process.exit(allPassed ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runAllTests };

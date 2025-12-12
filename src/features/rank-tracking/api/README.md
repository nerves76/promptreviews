# DataForSEO SERP Client

Comprehensive client for DataForSEO's organic search (SERP) and keyword research APIs.

## Overview

This client provides five main functions for rank tracking and keyword research:

1. **searchGoogleSerp** - Search Google organic results
2. **checkRankForDomain** - Find a domain's position for a keyword
3. **getKeywordVolume** - Get search volume data for keywords
4. **getKeywordSuggestions** - Get related keyword ideas
5. **getAvailableLocations** - Fetch all available location codes

## Setup

### Environment Variables

```bash
DATAFORSEO_LOGIN=your_login
DATAFORSEO_PASSWORD=your_password
```

### Installation

```bash
npm install
```

## Usage Examples

### 1. Search Google SERP

Get organic search results for a keyword:

```typescript
import { searchGoogleSerp } from '@/features/rank-tracking/api/dataforseo-serp-client';

const result = await searchGoogleSerp({
  keyword: 'pizza delivery',
  locationCode: 2840, // USA
  languageCode: 'en',
  device: 'desktop',
  depth: 100, // Top 100 results
});

if (result.success) {
  console.log(`Found ${result.items.length} results`);
  console.log(`Cost: $${result.cost}`);

  result.items.forEach((item) => {
    console.log(`${item.position}. ${item.title}`);
    console.log(`   ${item.url}`);
    console.log(`   Features:`, item.serpFeatures);
  });
}
```

### 2. Check Rank for Domain

Find where a specific domain ranks:

```typescript
import { checkRankForDomain } from '@/features/rank-tracking/api/dataforseo-serp-client';

const result = await checkRankForDomain({
  keyword: 'pizza delivery',
  locationCode: 2840, // USA
  targetDomain: 'dominos.com',
  device: 'desktop',
  depth: 100,
});

if (result.found) {
  console.log(`Domain ranks at position #${result.position}`);
  console.log(`URL: ${result.url}`);
  console.log(`Title: ${result.title}`);
} else {
  console.log('Domain not found in top 100 results');
}

// View competitors
result.topCompetitors.forEach((competitor) => {
  console.log(`${competitor.position}. ${competitor.domain}`);
});
```

### 3. Get Keyword Volume

Get search volume and CPC data:

```typescript
import { getKeywordVolume } from '@/features/rank-tracking/api/dataforseo-serp-client';

const results = await getKeywordVolume({
  keywords: [
    'pizza delivery',
    'pizza near me',
    'best pizza',
  ],
  locationCode: 2840, // USA
  languageCode: 'en',
});

results.forEach((keyword) => {
  console.log(`"${keyword.keyword}"`);
  console.log(`  Volume: ${keyword.searchVolume}/month`);
  console.log(`  CPC: $${keyword.cpc}`);
  console.log(`  Competition: ${keyword.competitionLevel}`);

  // Monthly trend data
  keyword.monthlySearches.forEach((month) => {
    console.log(`  ${month.year}-${month.month}: ${month.searchVolume}`);
  });
});
```

### 4. Get Keyword Suggestions

Find related keywords:

```typescript
import { getKeywordSuggestions } from '@/features/rank-tracking/api/dataforseo-serp-client';

const suggestions = await getKeywordSuggestions({
  seedKeyword: 'pizza',
  locationCode: 2840, // USA
  limit: 50,
});

// Sort by search volume
const topSuggestions = suggestions
  .sort((a, b) => b.searchVolume - a.searchVolume)
  .slice(0, 10);

topSuggestions.forEach((keyword) => {
  console.log(`"${keyword.keyword}"`);
  console.log(`  Volume: ${keyword.searchVolume}/month`);
  console.log(`  CPC: $${keyword.cpc}`);
});
```

### 5. Get Available Locations

Fetch all location codes:

```typescript
import { getAvailableLocations } from '@/features/rank-tracking/api/dataforseo-serp-client';

const locations = await getAvailableLocations();

// Find US locations
const usLocations = locations.filter(loc => loc.countryIsoCode === 'US');

// Find specific city
const newYork = locations.find(loc =>
  loc.locationName === 'New York,New York,United States'
);

console.log(`Location code for NYC: ${newYork?.locationCode}`);
```

## Common Location Codes

| Location | Code |
|----------|------|
| United States | 2840 |
| United Kingdom | 2826 |
| Canada | 2124 |
| Australia | 2036 |
| New York, NY | 1023191 |
| Los Angeles, CA | 1023768 |
| Chicago, IL | 1023854 |
| London, UK | 1006886 |
| Toronto, Canada | 1009277 |

## SERP Features

The client detects these SERP features:

- **featuredSnippet** - Featured snippet/answer box
- **siteLinks** - Site link extensions
- **faq** - FAQ/People Also Ask boxes
- **images** - Image pack
- **videos** - Video results
- **mapPack** - Local map pack
- **aiOverview** - AI-generated overview (SGE)

## Response Types

### SerpItem

```typescript
interface SerpItem {
  position: number;          // Rank position (1-100)
  url: string;               // Full URL
  domain: string;            // Extracted domain
  title: string;             // Page title
  description: string;       // Meta description
  breadcrumb: string;        // URL breadcrumb
  serpFeatures: SerpFeatures; // SERP features
}
```

### KeywordVolumeResult

```typescript
interface KeywordVolumeResult {
  keyword: string;
  searchVolume: number;       // Monthly searches
  cpc: number | null;         // Cost per click ($)
  competition: number | null; // 0-100 scale
  competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  monthlySearches: MonthlySearchData[]; // 12-month trend
}
```

## Cost Information

DataForSEO charges per API call:

- **Organic SERP**: ~$0.01 per search
- **Keyword Volume**: ~$0.01 per 100 keywords
- **Keyword Suggestions**: ~$0.05 per request
- **Locations**: Free (cached)

All functions return the actual cost in the response.

## Error Handling

All functions return structured error responses:

```typescript
const result = await searchGoogleSerp({ ... });

if (!result.success) {
  console.error('Error:', result.error);
  console.log('Cost:', result.cost); // Cost is still tracked even on error
}
```

## Rate Limits

DataForSEO has rate limits based on your plan:

- **Free**: 100 calls/day
- **Paid**: Varies by plan

The client includes automatic timeout handling (30 seconds) and detailed error logging.

## Testing

Run the comprehensive test suite:

```bash
npx tsx src/features/rank-tracking/api/dataforseo-serp-client.test.ts
```

This will test all five functions with real API calls.

## Logging

The client uses emoji-prefixed logging:

- `🔍 [DataForSEO SERP]` - Info messages
- `✅ [DataForSEO SERP]` - Success messages
- `❌ [DataForSEO SERP]` - Error messages

## Integration Examples

### Track Multiple Keywords

```typescript
const keywords = ['pizza delivery', 'pizza near me', 'best pizza'];
const domain = 'dominos.com';

const rankings = await Promise.all(
  keywords.map(keyword =>
    checkRankForDomain({
      keyword,
      locationCode: 2840,
      targetDomain: domain,
      depth: 100,
    })
  )
);

rankings.forEach((rank, index) => {
  console.log(`${keywords[index]}: ${rank.found ? `#${rank.position}` : 'Not ranked'}`);
});
```

### Keyword Research Workflow

```typescript
// 1. Get suggestions
const suggestions = await getKeywordSuggestions({
  seedKeyword: 'pizza',
  limit: 100,
});

// 2. Get volume data for top suggestions
const topKeywords = suggestions
  .slice(0, 20)
  .map(s => s.keyword);

const volumeData = await getKeywordVolume({
  keywords: topKeywords,
  locationCode: 2840,
});

// 3. Filter by volume and competition
const targetKeywords = volumeData.filter(kw =>
  kw.searchVolume > 1000 &&
  kw.competitionLevel === 'LOW'
);

console.log('Target keywords:', targetKeywords);
```

## API Documentation

For detailed API documentation, see:

- [Organic SERP API](https://docs.dataforseo.com/v3/serp/google/organic/live/advanced/)
- [Keyword Volume API](https://docs.dataforseo.com/v3/keywords_data/google_ads/search_volume/live/)
- [Keyword Suggestions API](https://docs.dataforseo.com/v3/dataforseo_labs/google/keyword_suggestions/live/)
- [Locations API](https://docs.dataforseo.com/v3/serp/google/locations/)

## Related Files

- `/src/features/geo-grid/api/dataforseo-client.ts` - Google Maps SERP client (local pack)
- `/src/features/rank-tracking/api/dataforseo-serp-client.ts` - This file (organic SERP)
- `/src/features/rank-tracking/api/dataforseo-serp-client.test.ts` - Test suite

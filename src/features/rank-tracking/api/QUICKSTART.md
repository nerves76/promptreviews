# DataForSEO SERP Client - Quick Start

## 5-Minute Setup Guide

### 1. Environment Setup

Add to your `.env.local`:

```bash
DATAFORSEO_LOGIN=your_login
DATAFORSEO_PASSWORD=your_password
```

### 2. Basic Usage

```typescript
import {
  searchGoogleSerp,
  checkRankForDomain,
  getKeywordVolume,
} from '@/features/rank-tracking/api/dataforseo-serp-client';

// Check where your domain ranks
const rankResult = await checkRankForDomain({
  keyword: 'pizza delivery',
  locationCode: 2840, // USA
  targetDomain: 'yoursite.com',
  depth: 100,
});

console.log(`Position: #${rankResult.position}`);
console.log(`Cost: $${rankResult.cost}`);
```

### 3. Common Tasks

#### Track Rankings

```typescript
// Single keyword
const rank = await checkRankForDomain({
  keyword: 'your keyword',
  locationCode: 2840,
  targetDomain: 'yoursite.com',
});

if (rank.found) {
  console.log(`Ranked #${rank.position}`);
}
```

#### Get Search Volume

```typescript
// Batch volume check
const volumes = await getKeywordVolume({
  keywords: ['keyword 1', 'keyword 2', 'keyword 3'],
  locationCode: 2840,
});

volumes.forEach(kw => {
  console.log(`${kw.keyword}: ${kw.searchVolume}/month`);
});
```

#### Find Related Keywords

```typescript
// Keyword research
const suggestions = await getKeywordSuggestions({
  seedKeyword: 'pizza',
  limit: 50,
});

// Sort by volume
const best = suggestions
  .filter(k => k.competitionLevel === 'LOW')
  .sort((a, b) => b.searchVolume - a.searchVolume);
```

### 4. Run Test Suite

```bash
npx tsx src/features/rank-tracking/api/dataforseo-serp-client.test.ts
```

### 5. Common Location Codes

| Location | Code |
|----------|------|
| United States | 2840 |
| New York, NY | 1023191 |
| Los Angeles, CA | 1023768 |
| London, UK | 1006886 |

Use `getAvailableLocations()` to find more.

### 6. Error Handling

```typescript
const result = await searchGoogleSerp({
  keyword: 'test',
  locationCode: 2840,
});

if (!result.success) {
  console.error('Error:', result.error);
  console.log('Cost incurred:', result.cost);
} else {
  console.log('Success!', result.items);
}
```

### 7. Cost Information

Approximate costs per call:
- `searchGoogleSerp()`: ~$0.01
- `checkRankForDomain()`: ~$0.01
- `getKeywordVolume()`: ~$0.01/100 keywords
- `getKeywordSuggestions()`: ~$0.05
- `getAvailableLocations()`: Free

All functions return actual cost in response.

### 8. Next Steps

- Read full docs: `api/README.md`
- See examples: `api/dataforseo-serp-client.test.ts`
- Build rank tracking dashboard
- Create keyword research tool

### 9. Integration Example

```typescript
// Track all your target keywords
const keywords = [
  'pizza delivery',
  'best pizza near me',
  'order pizza online',
];

const rankings = await Promise.all(
  keywords.map(keyword =>
    checkRankForDomain({
      keyword,
      locationCode: 2840,
      targetDomain: 'yoursite.com',
      depth: 100,
    })
  )
);

// Create ranking report
rankings.forEach((rank, i) => {
  const keyword = keywords[i];
  if (rank.found) {
    console.log(`✅ "${keyword}" - #${rank.position}`);
  } else {
    console.log(`❌ "${keyword}" - Not in top 100`);
  }
});
```

### 10. Troubleshooting

**"Credentials not configured"**
- Add `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD` to `.env.local`

**"Request timeout"**
- Normal for some requests, retry or increase depth

**High costs**
- Use `depth` parameter to limit results
- Cache location data (only fetch once)
- Batch keyword volume checks

## Ready to Build?

This client gives you everything needed for:
- Rank tracking dashboards
- Keyword research tools
- Competitor analysis
- SERP feature monitoring
- SEO automation

See the full README for advanced patterns and integrations.

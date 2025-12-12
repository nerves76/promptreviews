# DataForSEO: SERP Client vs Maps Client

## Overview

PromptReviews now has **two** DataForSEO clients for different ranking types:

1. **SERP Client** (`/features/rank-tracking/api/`) - Organic search rankings
2. **Maps Client** (`/features/geo-grid/api/`) - Local pack rankings

## When to Use Each

### Use SERP Client For:
✅ **Organic Search Rankings**
- Track position in main Google search results
- National/broad ranking tracking
- Keyword research and discovery
- Competitor analysis in organic results
- SERP feature opportunities
- SEO performance monitoring

**Example:** "Where does dominos.com rank for 'pizza delivery' nationwide?"

### Use Maps Client For:
✅ **Local Pack Rankings**
- Track position in Google Maps results
- Local SEO at specific coordinates
- Multi-location businesses
- Geographic grid analysis
- Proximity-based rankings
- Google Business Profile optimization

**Example:** "Where does Domino's on Main St rank in the local pack at 123 Main St?"

## Feature Comparison

| Feature | SERP Client | Maps Client |
|---------|-------------|-------------|
| **Search Type** | Organic SERP | Local Pack (Maps) |
| **Results** | Websites | Business Listings |
| **Identifier** | Domain | Place ID |
| **Location** | Country/City Code | Lat/Lng Coordinates |
| **Depth** | Up to 100 | Up to 20 |
| **SERP Features** | Yes (7 types) | No |
| **Keyword Research** | Yes | No |
| **Search Volume** | Yes | No |
| **Competitors** | Domains | Businesses |
| **Rating Data** | No | Yes |

## API Endpoints

### SERP Client
```
/v3/serp/google/organic/live/advanced
/v3/keywords_data/google_ads/search_volume/live
/v3/dataforseo_labs/google/keyword_suggestions/live
/v3/serp/google/locations
```

### Maps Client
```
/v3/serp/google/maps/live/advanced
```

## Code Examples

### SERP Client - Check Organic Rank
```typescript
import { checkRankForDomain } from '@/features/rank-tracking/api/dataforseo-serp-client';

const rank = await checkRankForDomain({
  keyword: 'pizza delivery',
  locationCode: 2840, // USA
  targetDomain: 'dominos.com',
  depth: 100,
});

console.log(`Organic rank: #${rank.position}`);
console.log(`Competitors: ${rank.topCompetitors.length}`);
```

### Maps Client - Check Local Pack Rank
```typescript
import { checkRankForBusiness } from '@/features/geo-grid/api/dataforseo-client';

const rank = await checkRankForBusiness({
  keyword: 'pizza delivery',
  lat: 40.7128,
  lng: -74.0060, // NYC coordinates
  targetPlaceId: 'ChIJexample',
});

console.log(`Local pack rank: #${rank.position}`);
console.log(`Our rating: ${rank.ourRating}`);
console.log(`Competitors: ${rank.topCompetitors.length}`);
```

## Location Handling

### SERP Client
Uses **location codes** (city/country level):

```typescript
// Location codes (from getAvailableLocations())
2840        // United States (national)
1023191     // New York, NY (city)
1023768     // Los Angeles, CA (city)
```

### Maps Client
Uses **coordinates** (exact location):

```typescript
// Lat/Lng coordinates (from geocoding)
{ lat: 40.7128, lng: -74.0060 }  // Empire State Building
{ lat: 34.0522, lng: -118.2437 } // Los Angeles City Hall
```

## Search Depth

### SERP Client
- Default: 100 results
- Maximum: 100+ (varies by plan)
- Use case: "Am I on page 1? Page 2?"

### Maps Client
- Default: 20 results
- Maximum: 20
- Use case: "Am I in the top 3? Top 10?"

## Cost Comparison

### SERP Client Costs
| Function | Cost |
|----------|------|
| `searchGoogleSerp()` | ~$0.01 |
| `checkRankForDomain()` | ~$0.01 |
| `getKeywordVolume()` | ~$0.01/100 keywords |
| `getKeywordSuggestions()` | ~$0.05 |
| `getAvailableLocations()` | Free |

### Maps Client Costs
| Function | Cost |
|----------|------|
| `searchGoogleMaps()` | ~$0.01 |
| `checkRankForBusiness()` | ~$0.01 |

## Data Returned

### SERP Client Returns
```typescript
{
  position: 3,
  url: 'https://dominos.com/delivery',
  title: 'Pizza Delivery | Domino\'s',
  domain: 'dominos.com',
  serpFeatures: {
    featuredSnippet: false,
    siteLinks: true,
    faq: false,
    images: false,
    videos: false,
    mapPack: false,
    aiOverview: false,
  },
  topCompetitors: [
    { position: 1, domain: 'pizzahut.com', ... },
    { position: 2, domain: 'papajohns.com', ... },
  ]
}
```

### Maps Client Returns
```typescript
{
  position: 2,
  businessFound: true,
  ourRating: 4.3,
  ourReviewCount: 847,
  topCompetitors: [
    {
      position: 1,
      name: 'Joe\'s Pizza',
      rating: 4.5,
      reviewCount: 1203,
      placeId: 'ChIJexample1',
    },
    {
      position: 3,
      name: 'Pizza Palace',
      rating: 4.2,
      reviewCount: 654,
      placeId: 'ChIJexample2',
    },
  ]
}
```

## Use Case Examples

### National Brand Tracking (SERP)
```typescript
// Track organic rankings across major cities
const cities = [
  { name: 'New York', code: 1023191 },
  { name: 'Los Angeles', code: 1023768 },
  { name: 'Chicago', code: 1023854 },
];

for (const city of cities) {
  const rank = await checkRankForDomain({
    keyword: 'pizza delivery',
    locationCode: city.code,
    targetDomain: 'dominos.com',
  });

  console.log(`${city.name}: #${rank.position}`);
}
```

### Multi-Location Business Tracking (Maps)
```typescript
// Track local pack at each store location
const stores = [
  { name: 'Main St', lat: 40.7128, lng: -74.0060 },
  { name: 'Broadway', lat: 40.7589, lng: -73.9851 },
  { name: 'Queens', lat: 40.7282, lng: -73.7949 },
];

for (const store of stores) {
  const rank = await checkRankForBusiness({
    keyword: 'pizza delivery',
    lat: store.lat,
    lng: store.lng,
    targetPlaceId: store.placeId,
  });

  console.log(`${store.name}: #${rank.position} (${rank.ourRating}★)`);
}
```

### Keyword Research (SERP Only)
```typescript
// Find related keywords with volume
const suggestions = await getKeywordSuggestions({
  seedKeyword: 'pizza',
  limit: 100,
});

const volumes = await getKeywordVolume({
  keywords: suggestions.map(s => s.keyword),
});

const opportunities = volumes.filter(kw =>
  kw.searchVolume > 1000 &&
  kw.competitionLevel === 'LOW'
);

console.log('Keyword opportunities:', opportunities);
```

### Geographic Grid Analysis (Maps Only)
```typescript
// Check rankings at 9 points around a location
const center = { lat: 40.7128, lng: -74.0060 };
const radius = 0.01; // ~1km

const grid = [
  { lat: center.lat - radius, lng: center.lng - radius }, // SW
  { lat: center.lat - radius, lng: center.lng },          // S
  { lat: center.lat - radius, lng: center.lng + radius }, // SE
  { lat: center.lat, lng: center.lng - radius },          // W
  { lat: center.lat, lng: center.lng },                   // Center
  { lat: center.lat, lng: center.lng + radius },          // E
  { lat: center.lat + radius, lng: center.lng - radius }, // NW
  { lat: center.lat + radius, lng: center.lng },          // N
  { lat: center.lat + radius, lng: center.lng + radius }, // NE
];

const ranks = await Promise.all(
  grid.map(point => checkRankForBusiness({
    keyword: 'pizza',
    lat: point.lat,
    lng: point.lng,
    targetPlaceId: myPlaceId,
  }))
);

console.log('Average rank:', ranks.reduce((sum, r) => sum + (r.position || 21), 0) / ranks.length);
```

## When to Use Both

### Comprehensive Local SEO Strategy
```typescript
// 1. Check organic rank in the city (SERP)
const organicRank = await checkRankForDomain({
  keyword: 'pizza delivery new york',
  locationCode: 1023191, // NYC
  targetDomain: 'myrestaurant.com',
});

// 2. Check local pack rank at store location (Maps)
const localRank = await checkRankForBusiness({
  keyword: 'pizza delivery',
  lat: 40.7128,
  lng: -74.0060,
  targetPlaceId: 'ChIJmyPlaceId',
});

console.log(`
  Organic rank: #${organicRank.position}
  Local pack rank: #${localRank.position}

  Strategy: ${
    organicRank.position > 10 && localRank.position <= 3
      ? 'Focus on content/links for organic'
      : 'Focus on GBP optimization'
  }
`);
```

## Summary

| Aspect | SERP Client | Maps Client |
|--------|-------------|-------------|
| **Purpose** | Organic SEO | Local SEO |
| **Scope** | National/broad | Hyperlocal |
| **Identifier** | Domain | Place ID |
| **Location** | City/country codes | GPS coordinates |
| **Features** | Keyword research | Rating tracking |
| **Best For** | Websites | Brick & mortar |

## Both Clients Share

- ✅ Same authentication pattern
- ✅ 30-second timeout handling
- ✅ Cost tracking
- ✅ Emoji logging (🔍, ✅, ❌)
- ✅ Structured error responses
- ✅ TypeScript type safety
- ✅ Competitor analysis

---

**Choose the right tool for your ranking type!**

- **Tracking organic rankings?** → Use SERP Client
- **Tracking local pack rankings?** → Use Maps Client
- **Doing both?** → Use both clients together!

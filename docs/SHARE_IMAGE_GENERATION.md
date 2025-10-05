# Share Image Generation System

## Overview

The share image generation system creates social media-ready quote card images for reviews. It follows a priority-based approach to ensure the best image is used for sharing.

## Architecture

### Priority Logic

1. **Existing Photo** (Highest Priority)
   - If review has a photo from the photo + testimonial feature, use that
   - No generation needed, instant response
   - Preserves original quality and user intent

2. **Cached Quote Card** (Medium Priority)
   - If quote card was previously generated, use cached version
   - Stored in Supabase Storage (`share-review-images` bucket)
   - Fast retrieval, consistent results

3. **Generated Quote Card** (Fallback)
   - Generate new quote card using @vercel/og
   - Apply Prompt Page styling (colors, fonts, branding)
   - Store in Supabase Storage for future use
   - Returns public URL for sharing

4. **Text-Only Fallback** (Error State)
   - If all image methods fail, gracefully fallback to text-only sharing
   - User can still share via social platforms
   - No broken experience

## API Endpoints

### 1. Generate/Retrieve Image

**Endpoint:** `POST /api/review-shares/generate-image`

**Request Body:**
```json
{
  "review_id": "uuid",
  "regenerate": false  // Optional: force new generation
}
```

**Response (Success):**
```json
{
  "success": true,
  "image_url": "https://...",
  "source": "existing_photo" | "cached_quote_card" | "generated_quote_card",
  "message": "Description of what happened"
}
```

**Response (Error with Fallback):**
```json
{
  "success": false,
  "fallback": true,
  "message": "Use text-only share",
  "error": "Error details"
}
```

### 2. OG Image Generation

**Endpoint:** `GET /api/review-shares/og-image?reviewId={id}`

**Returns:** PNG image (1200x630px)

**Features:**
- Dynamic styling from Prompt Page/Business settings
- Truncated review text (150-200 chars)
- Star rating visualization
- Business name and branding
- Reviewer name

### 3. Delete Generated Images

**Endpoint:** `DELETE /api/review-shares/generate-image?reviewId={id}`

**Response:**
```json
{
  "success": true,
  "deleted_count": 1,
  "message": "Successfully deleted share images"
}
```

## Storage

### Bucket Configuration

- **Bucket Name:** `share-review-images`
- **Public Access:** Yes (required for social media previews)
- **File Size Limit:** 5MB
- **Allowed Types:** image/png, image/jpeg, image/jpg, image/webp

### RLS Policies

1. **Upload:** Authenticated users only
2. **Read:** Public access (for social media crawlers)
3. **Update:** Authenticated users only
4. **Delete:** Authenticated users only (account-scoped)

### Naming Convention

- **Standard:** `{review_id}.png`
- **Regenerated:** `{review_id}-{timestamp}.png`

## Styling System

### Style Extraction

Styling is extracted from:
1. Prompt Page settings (if available)
2. Business default settings
3. App default fallbacks

### Customizable Elements

- **Background:**
  - Solid color or gradient
  - Gradient with start/middle/end colors

- **Colors:**
  - Primary color (for business name, stars)
  - Secondary color (for reviewer name)
  - Text color (for review content)

- **Fonts:**
  - Primary font (heading/business name)
  - Secondary font (body text)

- **Branding:**
  - Business logo (if available)
  - Business name
  - Subtle PromptReviews watermark

### Quote Card Layout

```
┌──────────────────────────────────────────┐
│                                          │
│  Background (solid or gradient)          │
│                                          │
│    ┌────────────────────────────┐        │
│    │                            │        │
│    │     ★★★★★ (5 stars)        │        │
│    │                            │        │
│    │  "Truncated review text    │        │
│    │   goes here with proper    │        │
│    │   formatting and..."       │        │
│    │                            │        │
│    │     — Reviewer Name        │        │
│    │                            │        │
│    │     Business Name          │        │
│    │                            │        │
│    └────────────────────────────┘        │
│                                          │
│                   via PromptReviews ↗    │
└──────────────────────────────────────────┘
```

## Client-Side Usage

### Basic Usage

```typescript
import { generateShareImage } from '@/utils/shareImageGeneration';

const result = await generateShareImage(reviewId, {
  authToken: session.access_token,
});

if (result.success) {
  // Use result.image_url for sharing
  shareToSocialMedia(result.image_url);
} else if (result.fallback) {
  // Fallback to text-only sharing
  shareTextOnly();
}
```

### Preloading (Performance Optimization)

```typescript
import { preloadShareImage } from '@/utils/shareImageGeneration';

// Preload when user hovers over share button
<button onMouseEnter={() => preloadShareImage(reviewId, token)}>
  Share
</button>
```

### Regeneration

```typescript
const result = await generateShareImage(reviewId, {
  regenerate: true,  // Force new generation
  authToken: session.access_token,
});
```

### Cleanup

```typescript
import { deleteShareImage } from '@/utils/shareImageGeneration';

await deleteShareImage(reviewId, authToken);
```

## Error Handling

### Common Errors

1. **Review Not Found**
   - Status: 404
   - Action: Verify review ID exists

2. **Permission Denied**
   - Status: 403
   - Action: Verify review belongs to user's account

3. **Image Generation Failed**
   - Status: 500
   - Fallback: Text-only sharing
   - Log error for investigation

4. **Storage Upload Failed**
   - Status: 500
   - Fallback: Text-only sharing
   - Check Supabase Storage status

### Graceful Degradation

The system is designed to never completely fail:

```
Try: Existing Photo
  ↓ (not found)
Try: Cached Quote Card
  ↓ (not found)
Try: Generate New Quote Card
  ↓ (failed)
Fallback: Text-Only Sharing ✓
```

## Performance Considerations

### Caching Strategy

1. **First Request:** Generate and store (slower, ~2-3s)
2. **Subsequent Requests:** Retrieve from storage (fast, ~100ms)
3. **CDN Edge Caching:** Public URLs are CDN-cached

### Optimization Tips

1. **Preload on hover:** Start generation before user clicks share
2. **Background generation:** Generate during review submission
3. **Batch cleanup:** Periodic job to remove old/unused images

## Database Schema

### review_share_images Table

```sql
CREATE TABLE review_share_images (
    id TEXT PRIMARY KEY,
    review_id UUID NOT NULL,
    account_id UUID NOT NULL,
    image_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    image_type TEXT DEFAULT 'quote_card',
    generated_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
```

**Indexes:**
- `review_id` - Fast lookups by review
- `account_id` - Account-scoped queries
- `generated_at` - Cleanup queries

## Testing

### Manual Testing Steps

1. **Test Existing Photo Priority:**
   ```
   - Create review with photo
   - Call generate-image API
   - Verify it returns existing photo URL
   ```

2. **Test Quote Card Generation:**
   ```
   - Create review without photo
   - Call generate-image API
   - Verify quote card is generated and stored
   ```

3. **Test Caching:**
   ```
   - Call generate-image API twice
   - Verify second call uses cached version
   ```

4. **Test Regeneration:**
   ```
   - Call with regenerate: true
   - Verify new image is generated
   ```

5. **Test Styling:**
   ```
   - Create reviews with different business styling
   - Verify quote cards match business branding
   ```

6. **Test Error Handling:**
   ```
   - Test with invalid review ID
   - Test with unauthenticated request
   - Verify proper error responses
   ```

## Future Enhancements

1. **Image Variants:**
   - Generate multiple sizes (Instagram, Facebook, Twitter)
   - Optimize for each platform's requirements

2. **Advanced Styling:**
   - Support for custom templates
   - Multiple layout options
   - Logo positioning controls

3. **Cleanup Jobs:**
   - Automated deletion of old/unused images
   - Retention policy enforcement (14-day default)

4. **Analytics:**
   - Track image generation success rate
   - Monitor storage usage
   - Performance metrics

5. **A/B Testing:**
   - Test different quote card designs
   - Optimize for engagement

## Troubleshooting

### Image Not Generating

1. Check Supabase Storage bucket exists
2. Verify RLS policies are correct
3. Check @vercel/og is installed
4. Review server logs for errors

### Style Not Applying

1. Verify business has styling configured
2. Check Prompt Page settings
3. Ensure color values are valid hex codes
4. Review style extraction logic

### Storage Issues

1. Verify bucket public access
2. Check file size limits
3. Ensure correct MIME types
4. Review RLS policies

## Related Documentation

- `/docs/SOCIAL_SHARE_FEATURE.md` - Overall social sharing system
- `/docs/PROMPT_PAGE_STYLING.md` - Styling configuration guide
- `/supabase/migrations/` - Database migrations

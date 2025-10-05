# Share Image Generation - Quick Start Guide

## 🚀 5-Minute Integration

### Step 1: Import the Utility

```typescript
import { generateShareImage } from '@/utils/shareImageGeneration';
```

### Step 2: Generate Image

```typescript
const result = await generateShareImage(reviewId, {
  authToken: session.access_token,
});
```

### Step 3: Handle Response

```typescript
if (result.success) {
  // Use the image URL
  const imageUrl = result.image_url;
  shareToSocial({ imageUrl, text });
} else if (result.fallback) {
  // Fallback to text-only
  shareTextOnly(text);
}
```

That's it! The system handles everything else automatically.

---

## 📖 Common Use Cases

### 1. Share Button Click

```typescript
const ShareButton = ({ reviewId }) => {
  const { session } = useAuth();

  const handleShare = async () => {
    const image = await generateShareImage(reviewId, {
      authToken: session.access_token,
    });

    if (image.success) {
      // Open share modal with image
      openShareModal({
        imageUrl: image.image_url,
        reviewId,
      });
    }
  };

  return <button onClick={handleShare}>Share</button>;
};
```

### 2. Preload on Hover

```typescript
<button
  onMouseEnter={() => preloadShareImage(reviewId, token)}
  onClick={handleShare}
>
  Share Review
</button>
```

### 3. OG Meta Tags

```typescript
import { getOgImageUrl } from '@/utils/shareImageGeneration';

export function ReviewPage({ reviewId }) {
  const ogImage = getOgImageUrl(reviewId);

  return (
    <>
      <Head>
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
      </Head>
      {/* ... */}
    </>
  );
}
```

### 4. Force Regeneration

```typescript
const handleRegenerate = async () => {
  // First delete old image
  await deleteShareImage(reviewId, token);

  // Then generate new one
  const result = await generateShareImage(reviewId, {
    regenerate: true,
    authToken: token,
  });
};
```

---

## 🎨 How Styling Works

### Automatic Styling

The system automatically applies your business branding:

1. **Reads from your Business Settings:**
   - Background color/gradient
   - Primary & secondary colors
   - Fonts
   - Logo (future)

2. **Fallback Chain:**
   ```
   Prompt Page Settings
         ↓ (if not set)
   Business Default Settings
         ↓ (if not set)
   App Defaults
   ```

3. **No Configuration Needed:**
   - Just set your business colors once
   - All quote cards inherit that styling

### Customizing Business Styling

```typescript
// In your business settings form
await updateBusiness({
  primary_color: '#4F46E5',
  secondary_color: '#818CF8',
  background_type: 'gradient',
  gradient_start: '#4F46E5',
  gradient_middle: '#818CF8',
  gradient_end: '#C7D2FE',
});

// Quote cards will automatically use these colors
```

---

## 🔧 API Reference

### generateShareImage()

```typescript
function generateShareImage(
  reviewId: string,
  options?: {
    regenerate?: boolean;  // Force new generation
    authToken?: string;    // User auth token
  }
): Promise<GenerateImageResponse>
```

**Response:**
```typescript
interface GenerateImageResponse {
  success: boolean;
  image_url?: string;
  source?: 'existing_photo' | 'cached_quote_card' | 'generated_quote_card';
  message: string;
  fallback?: boolean;
  error?: string;
}
```

### preloadShareImage()

```typescript
function preloadShareImage(
  reviewId: string,
  authToken?: string
): Promise<void>
```

Fire-and-forget preloading for better UX.

### deleteShareImage()

```typescript
function deleteShareImage(
  reviewId: string,
  authToken?: string
): Promise<DeleteImageResponse>
```

### getOgImageUrl()

```typescript
function getOgImageUrl(
  reviewId: string,
  baseUrl?: string
): string
```

Returns direct URL to OG image endpoint.

---

## ⚡ Performance Tips

### 1. Preload on Interaction

```typescript
// Start loading when user shows intent
<div
  onMouseEnter={() => preloadShareImage(reviewId)}
  onClick={handleShare}
>
  {/* Share UI */}
</div>
```

### 2. Cache Aggressively

```typescript
// First load: ~2 seconds (generation)
// Second load: ~100ms (cached)
// Third+ load: ~50ms (CDN cached)
```

The system caches automatically - no work needed!

### 3. Background Generation

```typescript
// Generate during review submission
onReviewSubmit(async (review) => {
  // Save review first
  await saveReview(review);

  // Generate image in background (async)
  generateShareImage(review.id).catch(console.error);
});
```

---

## 🐛 Troubleshooting

### "Review not found" Error

**Issue:** Review ID doesn't exist or wrong format

**Solution:**
```typescript
// Ensure UUID format
const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reviewId);
```

### "Authentication required" Error

**Issue:** Missing or invalid auth token

**Solution:**
```typescript
const { session } = useAuth();
if (!session) {
  // Redirect to login
  return;
}

await generateShareImage(reviewId, {
  authToken: session.access_token,
});
```

### Image Not Loading

**Issue:** Network error or storage issue

**Solution:**
```typescript
const result = await generateShareImage(reviewId);

if (result.fallback) {
  // Use text-only sharing
  showNotification('Image unavailable, sharing text only');
  shareTextOnly();
}
```

### Styling Doesn't Match

**Issue:** Business settings not configured

**Solution:**
1. Go to Business Profile settings
2. Configure colors and fonts
3. Regenerate image:
   ```typescript
   generateShareImage(reviewId, { regenerate: true })
   ```

---

## 🧪 Testing

### Quick Test

```bash
# Test with a real review ID
node scripts/test-share-image-generation.js <REVIEW_ID> <AUTH_TOKEN>
```

### Visual Testing

```
# 1. Open in browser:
http://localhost:3002/api/review-shares/og-image?reviewId=<REVIEW_ID>

# 2. Should display a PNG image
# 3. Check that styling matches your business
```

### Social Media Testing

```
# Facebook Debugger
https://developers.facebook.com/tools/debug/

# LinkedIn Inspector
https://www.linkedin.com/post-inspector/

# Paste your review share URL and verify image appears
```

---

## 📱 Platform-Specific Notes

### Facebook
- Uses OG image tags
- 1200x630 is perfect
- No additional work needed

### LinkedIn
- Same as Facebook
- Caches aggressively (use regenerate if needed)

### Twitter/X
- Uses OG image
- May show smaller
- Consider future platform-specific sizes

### Email
- Include image URL in body
- Fallback to text if image fails

---

## 🔒 Security Notes

### Public vs Private

**Public:**
- Generated quote card images (must be public for social media)
- OG image endpoint (no auth required)

**Private:**
- Generation API (auth required)
- Image deletion (auth required)
- Review data access (account-scoped)

### Data Access

```typescript
// System ensures:
1. User is authenticated
2. Review belongs to user's business
3. Business belongs to user's account
4. Images are account-scoped
```

---

## 💡 Pro Tips

### Tip 1: Optimize for Sharing

```typescript
// Show preview before sharing
const preview = await generateShareImage(reviewId);
showPreviewModal({
  imageUrl: preview.image_url,
  onConfirm: () => shareToSocial(),
});
```

### Tip 2: Handle Edge Cases

```typescript
// Always provide fallback
const shareReview = async () => {
  try {
    const image = await generateShareImage(reviewId);
    return image.success ? image.image_url : null;
  } catch (error) {
    console.error('Image generation failed:', error);
    return null; // Share without image
  }
};
```

### Tip 3: Monitor Performance

```typescript
console.time('image-generation');
const result = await generateShareImage(reviewId);
console.timeEnd('image-generation');

// First time: ~2000ms
// Cached: ~100ms
```

---

## 📚 Learn More

- **Full Documentation:** `/docs/SHARE_IMAGE_GENERATION.md`
- **Visual Examples:** `/docs/SHARE_IMAGE_EXAMPLES.md`
- **Implementation Summary:** `/SHARE_IMAGE_IMPLEMENTATION_SUMMARY.md`
- **Test Script:** `/scripts/test-share-image-generation.js`

---

## ✅ Checklist for Integration

- [ ] Import utilities from `/src/utils/shareImageGeneration`
- [ ] Add share button to review UI
- [ ] Call `generateShareImage()` on click
- [ ] Handle success and fallback cases
- [ ] Optional: Add preloading on hover
- [ ] Optional: Add OG meta tags
- [ ] Test with real review ID
- [ ] Verify styling matches business branding

---

## 🎉 You're Ready!

The image generation system is production-ready. Start integrating it into your share UI and enjoy beautiful, branded review cards across social media!

**Questions?** Check the full documentation or review the implementation summary.

# Share Image Generation - Visual Examples

## Quote Card Specifications

### Dimensions
- **Size:** 1200px × 630px (optimized for social media)
- **Format:** PNG
- **Aspect Ratio:** 1.91:1 (Open Graph standard)

### Layout Components

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│          [Dynamic Background - Solid or Gradient]                 │
│                                                                    │
│    ┌──────────────────────────────────────────────────────┐       │
│    │                                                      │       │
│    │              [Transparent White Card]               │       │
│    │                                                      │       │
│    │                 ★ ★ ★ ★ ★                           │       │
│    │              [Star Rating - 5 stars]                │       │
│    │                                                      │       │
│    │  "This is an amazing service! The team went        │       │
│    │   above and beyond to make sure everything         │       │
│    │   was perfect. Highly recommend to anyone          │       │
│    │   looking for quality and..."                      │       │
│    │                                                      │       │
│    │              [Review Text - Truncated]              │       │
│    │                                                      │       │
│    │                  — John Smith                       │       │
│    │              [Reviewer Name]                        │       │
│    │                                                      │       │
│    │              Acme Business Solutions                │       │
│    │              [Business Name]                        │       │
│    │                                                      │       │
│    └──────────────────────────────────────────────────────┘       │
│                                                                    │
│                                  via PromptReviews ↗              │
│                                  [Branding]                       │
└────────────────────────────────────────────────────────────────────┘
```

## Example 1: Gradient Background

**Business:** Tech Startup
**Styling:**
- Background: Linear gradient (Purple → Indigo → Light Purple)
- Primary Color: #4F46E5 (Indigo)
- Secondary Color: #818CF8 (Light Indigo)
- Text Color: #1F2937 (Dark Gray)
- Font: Sans-serif (Inter)

**Visual Description:**
```
Background: Purple gradient (vibrant)
Card: White with subtle shadow
Stars: Gold/Indigo (#4F46E5)
Review Text: Dark gray, 32px, centered
Reviewer Name: Light indigo (#818CF8), 24px
Business Name: Indigo (#4F46E5), bold, 20px
Branding: Bottom right, white text with transparency
```

**Sample Review:**
> "Working with this team was an absolute pleasure! They delivered beyond our expectations and the results speak for themselves. Would definitely work with them again!"
>
> — Sarah Johnson
> **TechCorp Solutions**
> ⭐⭐⭐⭐⭐

---

## Example 2: Solid Background

**Business:** Professional Services
**Styling:**
- Background: Solid white (#FFFFFF)
- Primary Color: #2563EB (Blue)
- Secondary Color: #60A5FA (Light Blue)
- Text Color: #111827 (Near Black)
- Font: Sans-serif (Inter)

**Visual Description:**
```
Background: Clean white
Card: Light gray (#F9FAFB) with border
Stars: Blue (#2563EB)
Review Text: Near black, professional look
Reviewer Name: Light blue (#60A5FA)
Business Name: Deep blue (#2563EB), prominent
Branding: Subtle, bottom corner
```

**Sample Review:**
> "Excellent service from start to finish. The attention to detail and professionalism was outstanding. I highly recommend their services to anyone..."
>
> — Michael Chen
> **Elite Consulting Group**
> ⭐⭐⭐⭐⭐

---

## Example 3: Photo + Testimonial (Existing Photo Priority)

When a review has an existing photo from the photo + testimonial feature:

**Priority Logic:**
✓ Use existing photo (no quote card generated)

**Visual:**
```
[Actual customer photo - not a generated quote card]
```

The system will return the `photo_url` directly without generating a quote card, preserving the original quality and user intent.

---

## Example 4: Long Review (Truncation)

**Original Review (320 characters):**
> "I can't say enough good things about this company. From the initial consultation to the final delivery, everything was handled with such care and attention to detail. The team was responsive, professional, and went above and beyond to ensure we were completely satisfied with the results. I would absolutely recommend them to anyone looking for top-quality service and exceptional customer care."

**Truncated for Quote Card (180 characters):**
> "I can't say enough good things about this company. From the initial consultation to the final delivery, everything was handled with such care and attention to..."

**Truncation Rules:**
- Max: 180 characters
- Break at word boundary if possible
- Add ellipsis (...) to indicate truncation
- Preserve quotes if present

---

## Styling Variables Reference

### Colors

| Variable | Default | Purpose |
|----------|---------|---------|
| `background_color` | #FFFFFF | Solid background color |
| `background_type` | gradient | "solid" or "gradient" |
| `gradient_start` | #4F46E5 | Gradient start color |
| `gradient_middle` | #818CF8 | Gradient middle color |
| `gradient_end` | #C7D2FE | Gradient end color |
| `primary_color` | #4F46E5 | Business name, stars |
| `secondary_color` | #818CF8 | Reviewer name |
| `text_color` | #1F2937 | Review text |

### Fonts

| Variable | Default | Purpose |
|----------|---------|---------|
| `primary_font` | Inter | Business name |
| `secondary_font` | Inter | Review text |

### Typography Scale

| Element | Font Size | Weight | Color Variable |
|---------|-----------|--------|----------------|
| Stars | 36px | Normal | `primary_color` |
| Review Text | 32px | Normal | `text_color` |
| Reviewer Name | 24px | 600 | `secondary_color` |
| Business Name | 20px | 700 | `primary_color` |
| Branding | 16px | Normal | rgba(255,255,255,0.8) |

### Spacing

```
Card Padding: 60px
Card Border Radius: 24px
Card Shadow: 0 20px 60px rgba(0,0,0,0.3)
Card Background: rgba(255,255,255,0.95)

Star Margin Bottom: 32px
Text Margin Bottom: 32px
Name Margin Bottom: 24px
```

---

## Testing Generated Images

### Manual Testing Checklist

1. **Visual Quality**
   - [ ] Text is readable and properly sized
   - [ ] Colors match business branding
   - [ ] Star rating is clear and prominent
   - [ ] No text overflow or clipping
   - [ ] Gradient renders smoothly (if applicable)

2. **Content Accuracy**
   - [ ] Review text is properly truncated
   - [ ] Reviewer name displays correctly
   - [ ] Business name is accurate
   - [ ] Star count matches review rating

3. **Technical Validation**
   - [ ] Image dimensions are 1200x630px
   - [ ] File size is reasonable (<500KB)
   - [ ] Format is PNG
   - [ ] Image is publicly accessible
   - [ ] URL returns proper Content-Type header

4. **Social Media Testing**
   - [ ] Facebook preview shows image correctly
   - [ ] LinkedIn displays with proper dimensions
   - [ ] Twitter/X card renders properly
   - [ ] Image loads quickly (<2 seconds)

### Browser Testing

Test the OG image URL in these contexts:

1. **Direct Browser Visit:**
   ```
   https://app.promptreviews.app/api/review-shares/og-image?reviewId={id}
   ```
   Should display the PNG image directly

2. **Social Media Debuggers:**
   - Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
   - LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
   - Twitter Card Validator: https://cards-dev.twitter.com/validator

3. **Performance Testing:**
   - First load: ~2-3 seconds (generation time)
   - Cached load: ~100-200ms (from Supabase Storage)
   - CDN cached: ~50ms (from edge cache)

---

## Accessibility Considerations

### Alt Text
When using generated quote cards, always provide descriptive alt text:

```html
<img
  src="https://storage.../quote-card.png"
  alt="5-star review from Sarah Johnson: 'Working with this team was an absolute pleasure...'"
/>
```

### Text Contrast
All quote cards maintain WCAG AA contrast ratios:
- Review text on white: 12:1 (AAA)
- Secondary text: 4.5:1 minimum (AA)
- Star icons: Clear visual distinction

---

## Common Issues & Solutions

### Issue: Colors Don't Match Business Branding

**Cause:** Business settings not configured

**Solution:**
1. Go to Business Profile settings
2. Set primary_color, secondary_color, background_type
3. Save and regenerate image with `regenerate: true` flag

### Issue: Text is Cut Off

**Cause:** Review text too long

**Solution:**
- System automatically truncates to 180 characters
- Uses word boundaries for clean breaks
- If still issues, check font rendering

### Issue: Gradient Not Appearing

**Cause:** `background_type` set to "solid"

**Solution:**
1. Update business settings: `background_type = "gradient"`
2. Set gradient_start, gradient_middle, gradient_end colors
3. Regenerate image

### Issue: Image Generation Slow

**Cause:** First generation (no cache)

**Solutions:**
- Implement preloading on share button hover
- Background generation during review submission
- Second+ loads will be fast (cached)

---

## Future Enhancements

### Planned Features

1. **Multiple Layouts**
   - Vertical card option
   - Minimal text-only design
   - Photo + quote overlay

2. **Platform-Specific Variants**
   - Instagram Stories (1080x1920)
   - Twitter Card (800x418)
   - Pinterest (1000x1500)

3. **Advanced Styling**
   - Custom font uploads
   - Logo positioning controls
   - Background image support
   - Custom templates

4. **Dynamic Elements**
   - Animated star ratings (GIF/WebP)
   - QR codes for direct review links
   - Business location badges

---

## Related Documentation

- [Share Image Generation System](/docs/SHARE_IMAGE_GENERATION.md)
- [Social Sharing Feature](/docs/SOCIAL_SHARE_FEATURE.md)
- [Prompt Page Styling Guide](/docs/PROMPT_PAGE_STYLING.md)

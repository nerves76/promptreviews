# CORRECT GLASSMORPHIC SETTINGS

## Database Values That Must Be Set

```sql
UPDATE businesses 
SET 
  -- Colors
  primary_color = '#2563EB',
  secondary_color = '#2563EB',
  gradient_start = '#2563EB',
  gradient_middle = '#7864C8',
  gradient_end = '#914AAE',
  
  -- Card Settings
  card_bg = '#FFFFFF',
  card_text = '#FFFFFF',
  card_transparency = 0.70,  -- 70% opaque, 30% transparent
  
  -- Border Settings
  card_border_color = '#FFFFFF',
  card_border_width = 1,  -- or 2 for more visible
  card_border_transparency = 0.5,  -- 50% opacity on border
  
  -- Shadow Settings (for frosted glass effect)
  card_inner_shadow = true,
  card_shadow_color = '#FFFFFF',
  card_shadow_intensity = 0.30,
  
  -- Background
  background_type = 'gradient',
  background_color = '#FFFFFF'
  
WHERE id = '9a9bf954-04bd-4812-8bf6-dfbf68805b85';
```

## Files With Hardcoded Defaults That Override Database

### 1. `/src/app/(app)/r/[slug]/components/ReviewPlatformCard.tsx`
- Line 83: `borderColor` fallback should be `'#FFFFFF'` not `'#222222'`
- Line 85: `borderOpacity` fallback should be `0.5` not `1`
- Line 112: `card_transparency` fallback should be `0.70` not `0.95`
- Line 122: `card_shadow_color` fallback should be `'#FFFFFF'` not `'#222222'`
- Line 137: Icon background transparency should be `0.70` not `0.30`

### 2. `/src/app/(app)/r/[slug]/page-client.tsx`
- Line 209: `card_transparency` fallback should be `0.70` not `0.30`
- Line 211: `card_border_color` fallback should be `'#FFFFFF'` not `'#E5E7EB'`
- Line 238: Default card_transparency should be `0.70`
- Line 240: Default card_border_color should be `'#FFFFFF'`
- Line 243-245: Inner shadow defaults should be true, white, 0.30
- Line 506, 508, 551, 553: All card_transparency should be `0.70`
- Line 1835: Save for Later button transparency should use `businessProfile?.card_transparency ?? 0.70` without adding anything

### 3. `/src/app/(app)/r/[slug]/page.tsx` (Server-side)
- Line 90: `card_transparency: 0.70`
- Line 92: `card_border_color: '#FFFFFF'`
- Line 231: Same as above in fallback business object

### 4. `/src/app/(app)/dashboard/style/StyleModalPage.tsx`
- Line 127: Glassy preset `card_transparency: 0.70`
- Line 197: Default settings `card_transparency: 0.70`
- Line 249, 322, 532: All card_transparency fallbacks should be `0.70`

### 5. `/src/app/(app)/api/businesses/route.ts`
- Line 234: `card_transparency: 0.70` (not 0.30, must meet database constraint)

## Why It Keeps Reverting

1. **Database constraint**: card_transparency must be between 0.50 and 1.00
2. **Multiple fallback locations**: Each component has its own fallback values
3. **Server/Client mismatch**: Server renders with one set of defaults, client hydrates with different ones
4. **API caching**: The API might be caching old values

## The Correct Values Summary

- **Primary/Secondary Color**: `#2563EB` (Slate Blue)
- **Gradient**: Start `#2563EB` → Middle `#7864C8` → End `#914AAE`
- **Card Transparency**: `0.70` (70% opaque, 30% see-through)
- **Card Border**: `#FFFFFF` (White), 1-2px width, 50% opacity
- **Card Text**: `#FFFFFF` (White)
- **Inner Shadow**: White (`#FFFFFF`) at 30% intensity
- **Card Background**: `#FFFFFF` (White)

## To Fix Once and For All

1. Run the SQL UPDATE statement above in Supabase dashboard
2. Search and replace all wrong fallback values in the files listed
3. Clear any caches (browser, Next.js, etc.)
4. Make sure all values match between server and client components
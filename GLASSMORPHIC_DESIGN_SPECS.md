# Glassmorphic Design Specifications for PromptReviews

## Core Design Values (DO NOT CHANGE)

### Colors
- **Primary Color**: `#2563EB` (Slate Blue)
- **Secondary Color**: `#2563EB` (Slate Blue) 
- **Gradient Start**: `#2563EB` (Slate Blue)
- **Gradient Middle**: `#7864C8` (Purple)
- **Gradient End**: `#914AAE` (Pink-Purple)
- **Card Background**: `#FFFFFF` (White)
- **Card Text**: `#FFFFFF` (White)
- **Card Border Color**: `#FFFFFF` (White)
- **Card Placeholder Color**: `#9CA3AF` (Gray)

### Transparency & Effects
- **Card Transparency**: `0.70` (70% - makes cards 30% see-through)
- **Card Border Width**: `1`
- **Card Border Transparency**: `0.5`
- **Card Inner Shadow**: `true` (enabled for frosted glass effect)
- **Card Shadow Color**: `#FFFFFF` (white)
- **Card Shadow Intensity**: `0.30` (30%)
- **Backdrop Blur**: `5px` on cards and buttons
- **Icon Background Blur**: `5px`

## Component-Specific Settings

### Review Platform Cards
- Background: 30% transparency (inherits card transparency)
- Border: White, 1px width
- Text: White color for labels and content
- Input fields: 70% transparency (card transparency + 0.4)
- Input fields: Inset shadow, NO borders

### Platform Icon (Top-Left of Cards)
- Background: Matches card transparency (30%)
- Blur: 5px backdrop filter
- Position: -20px top, -20px left
- Border: Inherits card border style

### Generate with AI Button
- Style: **OUTLINE** (not filled)
- Background: `rgba(255, 255, 255, 0.1)` (10% white - nearly transparent)
- Border: Primary color (#2563EB)
- Text: Primary color (#2563EB)
- Hover: Fills with primary color, text becomes white/black based on contrast

### Copy & Submit Button
- Style: **FILLED**
- Background: Secondary color (#2563EB)
- Border: Secondary color (#2563EB)
- Text: Dynamic (white/black based on contrast)
- Hover: Inverts (transparent background, colored text)

### Save for Later Button
- Background: 70% transparency (card transparency + 0.4 for better readability)
- Border: White, matches card border
- Text & Icon: Primary color (#2563EB)
- Icon hover: Red (existing behavior)
- Blur: 5px backdrop filter

### Process Indicator (1-2-3 Steps)
- Position: Centered on card
- Circle backgrounds: Inherit card transparency
- Text color: Inherits card text color
- Spacing: gap-2 on mobile, gap-0 on desktop

### Business Info Card
- Logo border: 2px solid white with 80% opacity
- Logo background ring: 24px blur effect
- City/State text: Uses card text color

### Input Fields (Name, Role, Review Text)
- Background: 70% transparency (card transparency + 0.4)
- Border: NONE (removed)
- Shadow: Inset shadow for depth (`inset 0 2px 4px 0 rgba(0,0,0,0.2), inset 0 1px 2px 0 rgba(0,0,0,0.15)`)
- Placeholder text: Gerald McGrew (first name), McGrew (last name), Zoo Director (role)

## Style Modal Reset Defaults

When "Reset" is clicked, these values should be applied:
```javascript
{
  primary_font: "Inter",
  secondary_font: "Roboto",
  primary_color: "#2563EB",
  secondary_color: "#2563EB",
  background_type: "gradient",
  background_color: "#FFFFFF",
  gradient_start: "#2563EB",
  gradient_middle: "#7864C8",
  gradient_end: "#914AAE",
  card_bg: "#FFFFFF",
  card_text: "#FFFFFF",
  card_placeholder_color: "#9CA3AF",
  card_inner_shadow: true,
  card_shadow_color: "#FFFFFF",
  card_shadow_intensity: 0.30,
  card_transparency: 0.70,
  card_border_width: 1,
  card_border_color: "#FFFFFF",
  card_border_transparency: 0.5,
  kickstarters_background_design: false,
}
```

## Database Values (businesses table)

These should be set for business ID `9a9bf954-04bd-4812-8bf6-dfbf68805b85`:
```sql
UPDATE businesses SET 
  primary_color = '#2563EB',
  secondary_color = '#2563EB',
  gradient_start = '#2563EB',
  gradient_middle = '#7864C8',
  gradient_end = '#914AAE',
  card_transparency = 0.30,
  card_border_width = 1,
  card_border_color = '#FFFFFF',
  card_text = '#FFFFFF',
  card_border_transparency = 0.5,
  card_inner_shadow = true,
  card_shadow_color = '#FFFFFF',
  card_shadow_intensity = 0.30
WHERE id = '9a9bf954-04bd-4812-8bf6-dfbf68805b85';
```

## Files That Must Have Consistent Defaults

1. `/src/app/(app)/api/businesses/route.ts` - Business creation defaults
2. `/src/app/(app)/dashboard/style/StyleModalPage.tsx` - Reset function and fallbacks
3. `/src/app/(app)/r/[slug]/page.tsx` - Fallback values for missing data
4. `/src/app/(app)/r/[slug]/page-client.tsx` - Component defaults

## Common Issues & Fixes

### Issue: Values keep reverting to old defaults
**Old values to watch for:**
- Primary: `#6366F1` (wrong, should be `#2563EB`)
- Card transparency: `0.95` (wrong, should be `0.30`)
- Card border: `#E5E7EB` (wrong, should be `#FFFFFF`)
- Card text: `#1A1A1A` (wrong, should be `#FFFFFF`)

**Fix**: Update all files listed above with correct defaults

### Issue: Buttons not styled correctly
- Generate with AI: Should be outline/transparent, NOT filled
- Copy & Submit: Should be filled with secondary color
- Save for Later: Should be semi-transparent with primary color text

### Issue: Components not inheriting transparency
- Check for missing `?` in `businessProfile?.card_transparency`
- Ensure `applyCardTransparency` is imported and used
- Verify businessProfile is being passed to components

## Testing Checklist
- [ ] Reset button applies glassmorphic defaults
- [ ] Cards show 30% transparency
- [ ] White borders visible on cards
- [ ] Text is white and readable
- [ ] Generate with AI button is outline style
- [ ] Save for Later button is semi-transparent with primary color
- [ ] Platform icon matches card transparency
- [ ] Input fields are less transparent than cards
- [ ] Process indicator circles inherit transparency
- [ ] Gradient background shows slate blue to purple

## Quick SQL Reset
```sql
-- Run this to force glassmorphic design
UPDATE businesses SET 
  primary_color = '#2563EB',
  secondary_color = '#2563EB', 
  gradient_start = '#2563EB',
  card_transparency = 0.30,
  card_border_color = '#FFFFFF',
  card_text = '#FFFFFF',
  card_inner_shadow = true,
  card_shadow_color = '#FFFFFF',
  card_shadow_intensity = 0.30
WHERE id = '9a9bf954-04bd-4812-8bf6-dfbf68805b85';
```
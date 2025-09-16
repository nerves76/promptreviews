# Infographic Embed System Documentation

## Overview
The PromptReviews infographic can be embedded on external websites via an iframe-based widget system. The infographic is served from a minimal embed page that hides all application chrome (navigation, help bubbles, etc.) to provide a clean embedded experience.

## Architecture

### Components

#### 1. Main Infographic Component
**Location:** `/src/app/components/AnimatedInfographic.tsx`
- **Size:** ~1,455 lines
- **Features:**
  - Animated customer journey visualization
  - Tool icons with rotation animations
  - Review platform cards
  - Performance optimizations (Intersection Observer, GPU acceleration)
  - Mobile responsive (w-64 on mobile to prevent narrowing)

#### 2. Embed Page
**Location:** `/src/app/infographic/embed/`
- `page.tsx` - Client component that renders the infographic
- `layout.tsx` - Minimal layout that bypasses app wrapper

**Key Features:**
- Aggressive CSS to hide all app chrome
- Transparent background
- PostMessage communication for iframe height adjustment
- 85% scale for better fit

#### 3. Widget Script API
**Location:** `/src/app/api/infographic-widget/route.ts`
- Serves JavaScript that creates and manages the iframe
- Handles DOM ready detection
- Sets up message listeners for height adjustments
- Security: Origin verification for postMessage

#### 4. Middleware Configuration
**Location:** `/src/middleware.ts` (lines 31-42)
- Allows iframe embedding by removing X-Frame-Options
- Sets permissive Content-Security-Policy for frame-ancestors

## How to Embed

Users add this to their website:

```html
<!-- Where the infographic should appear -->
<div id="promptreviews-infographic"></div>

<!-- Load the widget script (place before </body>) -->
<script src="https://app.promptreviews.app/api/infographic-widget"></script>
```

## Known Issues & Limitations

### 1. Navigation HTML Overhead (76KB)
**Problem:** Next.js 15 App Router always includes the root layout, even with route groups or custom layouts.

**Current Solution:** CSS hides navigation and app components with `display: none`

**Impact:** ~76KB of unnecessary HTML is loaded but hidden

**Attempted Solutions:**
- Route groups `(embed)` - Still includes root layout
- Custom layouts returning raw HTML - Next.js wraps it anyway
- API routes serving HTML - Loses React functionality

**Future Options:**
- Deploy separate minimal Next.js app for embeds
- Use different framework for embed endpoint
- Accept the overhead (current approach)

### 2. Component Size
The AnimatedInfographic component is 1,455 lines. A modular structure was started but not completed:

```
/src/app/components/AnimatedInfographic/
├── data.ts          # Tool and platform data/types
├── Features.tsx     # Features grid component
├── CustomerSection.tsx  # Customer figure component
└── index.tsx        # Re-exports for gradual refactoring
```

## Performance Optimizations

### Intersection Observer
Animations pause when component is off-screen:
```typescript
const [isVisible, setIsVisible] = useState(false)
const observer = new IntersectionObserver(
  ([entry]) => setIsVisible(entry.isIntersecting),
  { threshold: 0.1, rootMargin: '50px' }
)
```

### Animation Intervals
- Tool rotation: 3 seconds per tool
- Platform highlights: 2 seconds per platform  
- Only run when `isVisible === true`

### CSS Optimizations
- GPU acceleration via `transform` and `will-change`
- No layout thrashing
- Efficient animation keyframes

## CSS Hiding Strategy

The embed page uses aggressive CSS to hide app elements:

```css
/* Hide navigation, headers, help components */
header, nav, [role="navigation"],
[aria-label*="Help"],
[class*="FeedbackBubble"],
[class*="HelpModal"] {
  display: none !important;
}

/* Force transparent backgrounds */
html, body, body > div {
  background: transparent !important;
}

/* Hide fixed/absolute positioned elements */
div[style*="position: fixed"] {
  display: none !important;
}
```

## Development & Testing

### Local Testing
1. Start dev server: `npm run dev`
2. Visit: `http://localhost:3002/infographic/embed`
3. Test embed script: Create an HTML file:
```html
<!DOCTYPE html>
<html>
<body>
  <div id="promptreviews-infographic"></div>
  <script src="http://localhost:3002/api/infographic-widget"></script>
</body>
</html>
```

### Debugging Tips
- Check browser console for postMessage events
- Verify iframe src URL matches environment
- Check CSP headers in Network tab
- Look for "PromptReviews Infographic: Container element" errors

## File Structure
```
/src/app/
├── components/
│   └── AnimatedInfographic.tsx     # Main component (1,455 lines)
├── infographic/
│   ├── page.tsx                     # Standard page with navigation
│   └── embed/
│       ├── layout.tsx               # Minimal layout
│       └── page.tsx                 # Embed page with CSS hiding
└── api/
    └── infographic-widget/
        └── route.ts                 # Widget JavaScript API
```

## Security Considerations

1. **Origin Verification:** Widget script checks postMessage origin
2. **CSP Headers:** Frame-ancestors allows embedding from any domain
3. **No Sensitive Data:** Infographic is public content
4. **Sandboxed Context:** Runs in iframe isolation

## Future Improvements

### Priority 1: Reduce HTML Overhead
- Consider static HTML generation for embed
- Explore edge function serving minimal HTML
- Investigate alternative frameworks for embed endpoint

### Priority 2: Component Modularization  
- Complete splitting AnimatedInfographic into smaller files
- Lazy load animation sections
- Create reusable animation hooks

### Priority 3: Enhanced Embed Features
- Add configuration options (theme, size, sections)
- Support for multiple infographics per page
- Analytics tracking for embed views

## Deployment Notes

### Vercel Configuration
- Builds trigger on push to main branch
- Environment variables needed:
  - `NEXT_PUBLIC_APP_URL` - Used in widget script for iframe src

### Production URLs
- Embed page: `https://app.promptreviews.app/infographic/embed`
- Widget script: `https://app.promptreviews.app/api/infographic-widget`

## Common Issues & Solutions

### Issue: "Container element not found"
**Cause:** Script runs before DOM ready
**Solution:** Already handled with DOM ready detection in widget script

### Issue: Embed shows navigation
**Cause:** CSS not aggressive enough or new app components added
**Solution:** Update CSS selectors in embed/page.tsx

### Issue: Iframe height incorrect
**Cause:** Content loads after initial height calculation
**Solution:** Multiple sendHeight calls with delays (already implemented)

### Issue: Cross-origin errors
**Cause:** Incorrect origin in postMessage verification
**Solution:** Update origin check in widget script for production URL

## Contact & Support
For questions about the embed system:
1. Check this documentation
2. Review git history for context: `git log --oneline src/app/infographic/`
3. Test locally before deploying changes

## Recent Changes Log
- **2024-08-27:** Removed all app chrome from embed with aggressive CSS
- **2024-08-27:** Added Intersection Observer for performance
- **2024-08-27:** Widened mobile components from w-52 to w-64
- **2024-08-27:** Fixed widget DOM ready detection
- **2024-08-27:** Created embed system with iframe approach
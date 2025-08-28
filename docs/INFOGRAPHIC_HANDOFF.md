# Infographic Embed - Developer Handoff Document

## Current Status (as of August 27, 2024)

The animated infographic component has been successfully migrated from a flexbox layout to CSS Grid to solve positioning issues. The component now displays correctly with stable animations and proper beam/socket alignment.

### What's Working
- ✅ CSS Grid layout for desktop (5-column grid)
- ✅ Beam animations with proper timing
- ✅ Socket connectors aligned with cards
- ✅ Customer phone pulse animation (2 pulses)
- ✅ Prompt Page animation sequence (Generate → Fill text → Copy & Submit)
- ✅ Review Platform animation sequence (Paste → Stars → Submit → Success)
- ✅ Dark blue background for testing visibility
- ✅ Stable rendering (fixed re-render loop issue)

### Key Files
- **Main Component**: `/src/app/(app)/components/AnimatedInfographic.tsx`
- **Embed Page**: `/src/app/(embed)/infographic-embed/page.tsx`
- **Embed Styles**: `/src/app/globals-embed.css`

## Remaining Tasks

### 1. Add Features/Icon Bar
The features bar needs to be integrated into the infographic. Currently exists at bottom but needs:
- [ ] Fix overlap issues with mobile version
- [ ] Ensure proper z-index layering
- [ ] Test embedding with features visible
- [ ] Consider if features should be optional in embed

### 2. Fix Mobile/Desktop Layout Separation
Currently both layouts exist in DOM causing overlap issues:
- [ ] Implement proper mobile layout (currently empty div with mb-32)
- [ ] Ensure mobile and desktop don't interfere with each other
- [ ] Mobile should stack elements vertically
- [ ] Test responsive breakpoint switching (md breakpoint)
- [ ] Fix overlap with features bar on mobile

### 3. Remove Temporary Elements
- [ ] Remove dark blue background (`backgroundColor: '#1e3a5f'`)
- [ ] Remove version indicator (`v3-BLUE-GRID`)
- [ ] Clean up debugging code

### 4. Embed Code Generator
Need to make it easy for users to embed the infographic:
- [ ] Add copy-to-clipboard for embed code
- [ ] Generate proper iframe snippet with correct dimensions
- [ ] Provide instructions for embedding
- [ ] Consider offering different size options

### 5. Production Readiness
- [ ] Test in actual iframe on marketing site
- [ ] Verify transparent background works correctly
- [ ] Test cross-origin messaging for height adjustment
- [ ] Optimize bundle size for embedding
- [ ] Add loading states
- [ ] Handle error cases gracefully

## Technical Details

### Current Grid Structure
```css
/* Desktop: 5 columns */
grid-template-columns: [200px_150px_260px_150px_260px] /* md */
grid-template-columns: [220px_180px_280px_180px_280px] /* lg */
```

Column layout:
1. Customer (right-aligned)
2. Beam channel (150-180px)
3. Prompt Page (center)
4. Beam channel (150-180px)
5. Review Platform (left-aligned)

### Animation Timing
- **Interval**: 50ms
- **Increment**: 0.3 units per tick (6 units/second)
- **Full cycle**: ~15.8 seconds (95 units total)
- **Key positions**:
  - 0-20: Initial pause
  - 20-30: First beam travels
  - 30-50: Prompt Page animations
  - 50-60: Second beam travels
  - 60-90: Review Platform animations
  - 90-95: End pause

### Known Issues & Solutions

#### Issue 1: Infographic Reverting
**Problem**: Component would revert to old state randomly
**Solution**: Added `data-infographic-container` attribute and forced styles in embed page. Removed problematic cache-busting mechanisms.

#### Issue 2: Beam Positioning
**Problem**: Beams would drift or disconnect when embedded
**Solution**: Switched from absolute positioning to CSS Grid. Beams are now grid items with predictable positions.

#### Issue 3: Re-render Loop
**Problem**: Component re-rendering constantly
**Solution**: Removed `new Date()` calls from render, fixed animation timing logic.

### Socket Positions (Current)
```javascript
// Left socket on Prompt Page
left: '-7px'

// Right socket on Prompt Page  
right: '17px'

// Left socket on Review Platform
left: '-7px'
```

### Beam Configuration
```javascript
// Both beams
transform: 'translateX(-58px) translateY(-40px)'
width: 'calc(100% + 53px)'
height: 'h-2' (0.5rem)
```

## Testing Checklist

Before deployment, ensure:
- [ ] Test in Chrome, Firefox, Safari, Edge
- [ ] Test on actual marketing site iframe
- [ ] Test mobile devices (iOS Safari, Chrome Android)
- [ ] Verify animations run smoothly
- [ ] Check memory usage (no leaks)
- [ ] Validate accessibility (motion preferences)
- [ ] Test with slow network connections
- [ ] Verify embed code works on external sites

## Embedding Instructions

Current embed method:
```html
<iframe 
  src="https://app.promptreviews.app/infographic-embed"
  width="100%"
  height="600"
  frameborder="0"
  style="background: transparent;"
></iframe>
```

The page includes PostMessage communication for dynamic height adjustment.

## Developer Notes

1. **CSS Grid is Critical**: Don't switch back to flexbox. The grid layout solved major positioning issues.

2. **Animation Timing**: The current timing (0.3 units/50ms) provides good pacing. The phone needs 10-30 position range to complete 2 pulses.

3. **Z-Index Layers**:
   - Beams: z-10
   - Cards: z-20  
   - Sockets: z-30

4. **Overflow Hidden**: Beams have `overflow-hidden` to keep light effects within channels.

5. **Testing State**: Currently has dark blue background for testing. Remove before production.

## Contact

For questions about implementation decisions or architecture, check:
- Git commit history (extensive debugging history from Aug 27)
- `/docs/DESIGN_GUIDELINES.md` for general UI patterns
- `/docs/WIDGET_REFRESH_FIX.md` for similar state management issues

## Next Steps Priority

1. **High**: Remove debug elements (blue background, version indicator)
2. **High**: Implement mobile layout
3. **Medium**: Add features bar integration
4. **Medium**: Create text/embed code generator
5. **Low**: Add configuration options (speed, colors, etc.)

---

*Last updated: August 27, 2024*
*Component version: v3-BLUE-GRID (CSS Grid implementation)*
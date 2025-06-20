# Single Widget Development Guide

## Overview
This directory contains the embeddable Single Widget implementation. The widget is designed to be embedded on customer websites to display reviews in a single large card format.

## File Structure
- `widget-embed.js` - **Development version** (non-minified, used for preview)
- `widget-embed.min.js` - **Production version** (minified, used for customer embeds)
- `single-widget.css` - Styles for the widget
- `README.md` - This file

## Development Workflow

### 1. Development (Non-Minified)
- **Preview**: The dashboard preview at `/dashboard/widget` uses `widget-embed.js`
- **Editing**: Make changes to `widget-embed.js` for instant feedback
- **Testing**: Use the dashboard preview to test the widget

### 2. Production (Minified)
- **Customer Embeds**: Use `widget-embed.min.js` for better performance
- **Build Process**: Run `npm run build:single-widget` to minify changes
- **Auto-Build**: Run `npm run watch:widget` to auto-minify on file changes

## Build Commands

```bash
# Build single widget minified version once
npm run build:single-widget

# Build all widgets (multi + single)
npm run build:widget

# Watch for changes and auto-build
npm run watch:widget
```

## CSS Isolation
The widget uses several techniques to prevent conflicts with host websites:

1. **CSS Namespacing**: All styles are prefixed with `.pr-single-widget`
2. **CSS Reset**: `all: revert` resets inherited styles from host websites
3. **Scoped Variables**: CSS custom properties prevent style conflicts

## Key Differences from Multi Widget

### Design
- **Larger Cards**: Max-width 600px vs 420px for multi widget
- **Single Display**: Shows one card at a time (no carousel)
- **Larger Text**: 1.125rem vs 1rem for review text
- **More Spacing**: Increased padding and margins

### Layout
- **Single Card Focus**: Designed to highlight one review prominently
- **Simplified Navigation**: Basic prev/next arrows
- **Larger Buttons**: More prominent submit review button

## Best Practices

### Performance
- ✅ Use minified version for production embeds
- ✅ Async script loading prevents blocking
- ✅ Optimized CSS with proper namespacing

### Security & Isolation
- ✅ CSS isolation prevents host website interference
- ✅ Namespaced JavaScript prevents global conflicts
- ✅ Self-contained widget with minimal dependencies

### Development
- ✅ Non-minified version for instant preview updates
- ✅ Automated build process for production
- ✅ Dashboard preview for testing

## Embed Code
The embed code provided to customers uses the minified version:

```html
<!-- PromptReviews.app Widget Type: single -->
<div class="promptreviews-widget" data-widget="WIDGET_ID" data-widget-type="single"></div>
<script src="https://yourdomain.com/widgets/single/widget-embed.min.js" async></script>
```

## Troubleshooting

### Widget Not Loading
1. Check browser console for errors
2. Verify script URL is accessible
3. Check widget ID exists in database

### Styling Issues
1. Check CSS isolation is working
2. Verify CSS variables are set correctly
3. Test in different host environments

### Performance Issues
1. Ensure minified version is being used
2. Check script is loading asynchronously
3. Monitor network performance

## Future Improvements
- [ ] Shadow DOM for complete isolation
- [ ] Web Components for better encapsulation
- [ ] Service Worker for offline functionality
- [ ] Advanced caching strategies 
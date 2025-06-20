# Multi Widget Development Guide

## Overview
This directory contains the embeddable Multi Widget implementation. The widget is designed to be embedded on customer websites to display reviews in a carousel format.

## File Structure
- `widget-embed.js` - **Development version** (non-minified, used for preview)
- `widget-embed.min.js` - **Production version** (minified, used for customer embeds)
- `multi-widget.css` - Styles for the widget
- `embed-test.html` - Test page for development
- `debug-widgets.html` - Debug page for troubleshooting

## Development Workflow

### 1. Development (Non-Minified)
- **Preview**: The dashboard preview at `/dashboard/widget` uses `widget-embed.js`
- **Editing**: Make changes to `widget-embed.js` for instant feedback
- **Testing**: Use `embed-test.html` to test the widget in isolation

### 2. Production (Minified)
- **Customer Embeds**: Use `widget-embed.min.js` for better performance
- **Build Process**: Run `npm run build:widget` to minify changes
- **Auto-Build**: Run `npm run watch:widget` to auto-minify on file changes

## Build Commands

```bash
# Build minified version once
npm run build:widget

# Watch for changes and auto-build
npm run watch:widget
```

## CSS Isolation
The widget uses several techniques to prevent conflicts with host websites:

1. **CSS Namespacing**: All styles are prefixed with `.pr-multi-widget`
2. **CSS Reset**: `all: revert` resets inherited styles from host websites
3. **Scoped Variables**: CSS custom properties prevent style conflicts

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
- ✅ Test pages for isolated development

## Embed Code
The embed code provided to customers uses the minified version:

```html
<!-- PromptReviews.app Widget -->
<div class="promptreviews-widget" data-widget="WIDGET_ID" data-widget-type="multi"></div>
<script src="https://yourdomain.com/widgets/multi/widget-embed.min.js" async></script>
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
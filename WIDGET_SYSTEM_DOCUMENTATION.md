# PromptReviews Widget System - Complete Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Widget Architecture](#widget-architecture)
3. [Build Process](#build-process)
4. [Development Workflow](#development-workflow)
5. [Troubleshooting Guide](#troubleshooting-guide)
6. [Common Issues & Solutions](#common-issues--solutions)
7. [Performance Optimization](#performance-optimization)
8. [Security Considerations](#security-considerations)

---

## System Overview

The PromptReviews widget system consists of three main widget types, each designed for different use cases:

### Widget Types
1. **Single Widget** (`/public/widgets/single/`) - Single large review card
2. **Multi Widget** (`/public/widgets/multi/`) - Multiple review cards in carousel
3. **Photo Widget** (`/public/widgets/photo/`) - Photo-based testimonials

### Key Characteristics
- **Vanilla JavaScript**: No framework dependencies for maximum compatibility
- **Self-contained**: CSS and JS bundled together for easy embedding
- **Responsive**: Works across all device sizes
- **Isolated**: Prevents conflicts with host websites
- **Lightweight**: Optimized for fast loading

---

## Widget Architecture

### File Structure
```
public/widgets/
├── single/
│   ├── widget-embed.js          # Development version (non-minified)
│   ├── widget-embed.min.js      # Production version (minified)
│   ├── single-widget.css        # Source CSS styles
│   ├── embed-test.html          # Test page
│   └── README.md               # Widget-specific docs
├── multi/
│   ├── widget-embed.js          # Development version
│   ├── widget-embed.min.js      # Production version
│   ├── multi-widget.css         # Source CSS styles
│   └── test-*.html             # Various test pages
└── photo/
    ├── widget-embed.js          # Development version
    ├── widget-embed.min.js      # Production version
    ├── photo-widget.css         # Source CSS styles
    └── test-*.html             # Test pages
```

### Core Components

#### 1. JavaScript Structure
Each widget follows this pattern:
```javascript
(function() {
  'use strict';
  
  // Global state management
  const widgetState = {};
  
  // Main initialization function
  window.PromptReviews[WidgetType] = {
    initializeWidget: function(containerId, reviews, design, businessSlug) {
      // Widget initialization logic
    }
  };
  
  // Auto-initialization for embedded widgets
  async function autoInitializeWidgets() {
    // Find widgets on page and initialize them
  }
  
  // Self-executing initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitializeWidgets);
  } else {
    autoInitializeWidgets();
  }
})();
```

#### 2. CSS Architecture
- **Namespaced Classes**: All styles prefixed with `.pr-[widget-type]-`
- **CSS Variables**: Dynamic theming via CSS custom properties
- **Isolation**: `all: revert` to prevent host website interference
- **Responsive Design**: Mobile-first approach with media queries

#### 3. State Management
- **Carousel State**: Tracks current position, total items, auto-advance settings
- **Design State**: Stores theming variables and configuration
- **Widget Registry**: Maps widget IDs to their state objects

---

## Build Process

### Build Scripts
Located in `scripts/` directory:

#### Single Widget Build (`scripts/build-single-widget.js`)
```javascript
// 1. Read source files
const jsContent = fs.readFileSync(jsPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');

// 2. Convert CSS to Base64
const base64Css = Buffer.from(cssContent).toString('base64');

// 3. Replace placeholder with CSS injection
const finalJsContent = jsContent.replace(
  "// __REPLACE_WITH_DECODED_CSS__",
  `try { style.innerHTML = atob('${base64Css}'); } catch(e) { console.error('PR WIDGET CSS DECODE FAILED', e) }`
);

// 4. Write temporary file for minification
fs.writeFileSync(tempJsPath, finalJsContent);
```

#### Package.json Scripts
```json
{
  "build:single-widget": "node scripts/build-single-widget.js && terser public/widgets/single/widget-embed.temp.js -o public/widgets/single/widget-embed.min.js --compress --mangle && rm public/widgets/single/widget-embed.temp.js",
  "build:multi-widget": "terser public/widgets/multi/widget-embed.js -o public/widgets/multi/widget-embed.min.js --compress --mangle",
  "build:photo-widget": "node scripts/build-photo-widget.js && terser public/widgets/photo/widget-embed.temp.js -o public/widgets/photo/widget-embed.min.js --compress --mangle && rm public/widgets/photo/widget-embed.temp.js",
  "build:widget": "terser public/widgets/multi/widget-embed.js -o public/widgets/multi/widget-embed.min.js --compress --mangle && terser public/widgets/single/widget-embed.js -o public/widgets/single/widget-embed.min.js --compress --mangle && terser public/widgets/photo/widget-embed.js -o public/widgets/photo/widget-embed.min.js --compress --mangle",
  "watch:widget": "nodemon --watch public/widgets/multi/widget-embed.js --watch public/widgets/single/widget-embed.js --watch public/widgets/photo/widget-embed.js --exec 'npm run build:widget'"
}
```

### Build Process Steps

1. **CSS Injection**: CSS content is Base64 encoded and injected into JavaScript
2. **Placeholder Replacement**: Build script replaces `// __REPLACE_WITH_DECODED_CSS__` with actual CSS
3. **Temporary File Creation**: Combined JS+CSS written to `.temp.js` file
4. **Minification**: Terser compresses and mangles the code
5. **Cleanup**: Temporary files are removed

### CSS Injection Strategy

#### Why Base64?
- **Reliability**: Avoids string escaping issues
- **Simplicity**: Single string replacement
- **Error Handling**: Built-in decode error catching

#### Injection Method
```javascript
function injectCSS() {
  const styleId = 'promptreviews-[widget-type]-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  
  // Build script replaces this line
  try { style.innerHTML = atob('BASE64_CSS_CONTENT'); } catch(e) { console.error('PR WIDGET CSS DECODE FAILED', e) }
  
  document.head.appendChild(style);
}
```

---

## Development Workflow

### 1. Development Mode
- **Edit**: `widget-embed.js` (non-minified source)
- **Preview**: Dashboard at `/dashboard/widget` uses development version
- **Instant Feedback**: Changes appear immediately without rebuild

### 2. Production Build
```bash
# Build single widget
npm run build:single-widget

# Build all widgets
npm run build:widget

# Watch for changes
npm run watch:widget
```

### 3. Testing
- **Dashboard Preview**: Test in React environment
- **Standalone Test**: Use `embed-test.html` files
- **Cross-browser**: Test in different browsers
- **Responsive**: Test on different screen sizes

### 4. Deployment
- **Minified Files**: `widget-embed.min.js` served to customers
- **CDN**: Files served from `/public/widgets/` directory
- **Version Control**: Track both source and minified files

---

## Troubleshooting Guide

### Common Error Patterns

#### 1. "ReferenceError: state is not defined"
**Cause**: State initialization missing or incorrect
**Solution**: Ensure `single_initCarouselState()` is called before using state
```javascript
// CORRECT
single_initCarouselState(widgetId, reviews, design);
const state = carouselState[widgetId];

// INCORRECT
const state = carouselState[widgetId]; // state might be undefined
```

#### 2. "Widget container not found"
**Cause**: Element ID mismatch or timing issue
**Solution**: Verify container exists and has correct ID
```javascript
const widgetElement = document.getElementById(containerId);
if (!widgetElement) {
  console.error('Widget container not found:', containerId);
  return;
}
```

#### 3. "CSS not loading"
**Cause**: Build process failed or CSS injection error
**Solution**: Check build script output and CSS injection
```javascript
// Check if CSS was injected
const styleElement = document.getElementById('promptreviews-single-widget-styles');
if (!styleElement) {
  console.error('CSS not injected');
}
```

#### 4. "Carousel not working"
**Cause**: DOM elements not found or event listeners not attached
**Solution**: Verify carousel initialization sequence
```javascript
// Ensure proper initialization order
1. Create HTML structure
2. Initialize state
3. Attach event listeners
4. Update carousel display
```

### Debugging Steps

#### 1. Console Logging
```javascript
console.log('🚀 Widget initialization started');
console.log('📊 Widget data:', { containerId, reviewsCount: reviews?.length });
console.log('🎨 Design config:', design);
```

#### 2. Element Inspection
```javascript
// Check if container exists
console.log('Container element:', document.getElementById(containerId));

// Check if carousel elements exist
console.log('Carousel track:', widgetElement.querySelector('.pr-single-carousel-track'));
console.log('Navigation buttons:', widgetElement.querySelectorAll('.pr-single-prev-btn, .pr-single-next-btn'));
```

#### 3. State Verification
```javascript
// Check state initialization
console.log('Carousel state:', carouselState[widgetId]);
console.log('Current index:', state?.currentIndex);
console.log('Total items:', state?.totalItems);
```

#### 4. CSS Verification
```javascript
// Check if CSS was injected
const styleElement = document.getElementById('promptreviews-single-widget-styles');
console.log('CSS element:', styleElement);
console.log('CSS content length:', styleElement?.textContent?.length);
```

### Build Process Debugging

#### 1. Check Build Script Output
```bash
npm run build:single-widget
# Look for:
# - "Starting single widget build..."
# - "Reading JS from: ..."
# - "Reading CSS from: ..."
# - "Writing temporary file to: ..."
# - "Single widget build process completed successfully."
```

#### 2. Verify File Sizes
```bash
ls -la public/widgets/single/
# Check that widget-embed.min.js exists and has reasonable size
```

#### 3. Check Placeholder Replacement
```bash
# Search for placeholder in source
grep -n "__REPLACE_WITH_DECODED_CSS__" public/widgets/single/widget-embed.js

# Search for placeholder in minified (should not exist)
grep -n "__REPLACE_WITH_DECODED_CSS__" public/widgets/single/widget-embed.min.js
```

---

## Common Issues & Solutions

### Issue 1: Widget Not Loading on External Sites

**Symptoms**: Widget appears broken or unstyled on customer websites
**Root Cause**: CSS not being injected properly
**Solution**: 
1. Check build process completed successfully
2. Verify CSS injection in browser console
3. Check for JavaScript errors preventing execution

### Issue 2: Carousel Navigation Not Working

**Symptoms**: Previous/next buttons don't respond
**Root Cause**: Event listeners not attached or state not initialized
**Solution**:
1. Ensure state initialization happens before event listener attachment
2. Verify DOM elements exist when attaching listeners
3. Check for JavaScript errors in console

### Issue 3: Widget Styling Conflicts

**Symptoms**: Widget looks different on different websites
**Root Cause**: Host website CSS interfering with widget styles
**Solution**:
1. Ensure CSS isolation with `all: revert`
2. Use more specific CSS selectors
3. Add `!important` declarations for critical styles

### Issue 4: Performance Issues

**Symptoms**: Widget loads slowly or causes page lag
**Root Cause**: Large file size or inefficient code
**Solution**:
1. Use minified version for production
2. Optimize CSS and JavaScript
3. Implement lazy loading for images
4. Use efficient DOM manipulation

### Issue 5: Responsive Issues

**Symptoms**: Widget doesn't adapt to different screen sizes
**Root Cause**: Missing or incorrect media queries
**Solution**:
1. Test on different devices and screen sizes
2. Add appropriate media queries
3. Use relative units (rem, em, %) instead of fixed pixels

---

## Performance Optimization

### File Size Optimization
- **Minification**: Use Terser for JavaScript compression
- **CSS Optimization**: Remove unused styles and compress
- **Base64 Encoding**: Efficient for small CSS files
- **Gzip Compression**: Enable on server for additional compression

### Loading Optimization
- **Async Loading**: Prevent blocking page render
- **Lazy Initialization**: Only initialize when needed
- **Efficient DOM Queries**: Cache element references
- **Debounced Events**: Prevent excessive function calls

### Runtime Optimization
- **Event Delegation**: Use single event listener for multiple elements
- **Efficient State Updates**: Batch DOM updates
- **Memory Management**: Clean up event listeners and intervals
- **Caching**: Cache computed values and DOM elements

---

## Security Considerations

### XSS Prevention
- **Content Sanitization**: Sanitize review content before display
- **CSP Compliance**: Ensure widget works with Content Security Policy
- **Input Validation**: Validate all user inputs

### Isolation
- **CSS Isolation**: Prevent style conflicts with host websites
- **JavaScript Isolation**: Use IIFE to prevent global pollution
- **Namespace Protection**: Use unique prefixes for all identifiers

### Data Protection
- **HTTPS Only**: Serve widgets over secure connections
- **API Security**: Validate API requests and responses
- **Error Handling**: Don't expose sensitive information in errors

---

## Best Practices

### Code Organization
1. **Modular Functions**: Break code into small, focused functions
2. **Clear Naming**: Use descriptive variable and function names
3. **Consistent Structure**: Follow same pattern across all widgets
4. **Documentation**: Comment complex logic and important decisions

### Error Handling
1. **Graceful Degradation**: Widget should work even if some features fail
2. **User-Friendly Messages**: Show helpful error messages
3. **Logging**: Log errors for debugging but don't expose to users
4. **Fallbacks**: Provide alternative behavior when features fail

### Testing
1. **Cross-Browser Testing**: Test in all major browsers
2. **Responsive Testing**: Test on different screen sizes
3. **Performance Testing**: Monitor loading times and memory usage
4. **Integration Testing**: Test with different host websites

### Maintenance
1. **Version Control**: Track all changes in git
2. **Backup Strategy**: Keep backups of working versions
3. **Rollback Plan**: Ability to quickly revert to previous versions
4. **Monitoring**: Monitor widget performance and errors in production

---

## Conclusion

The PromptReviews widget system is designed to be robust, performant, and easy to maintain. By following the patterns and best practices outlined in this documentation, developers can effectively build, debug, and maintain the widget system.

For specific issues not covered in this guide, refer to the individual widget README files and the main project documentation in `promptreviews.md`.

**Key Takeaways:**
- Always test changes thoroughly before deploying
- Use the development workflow for quick iteration
- Monitor production performance and errors
- Keep documentation updated as the system evolves
- Follow established patterns for consistency 
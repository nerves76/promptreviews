# Widget Embed System

This folder contains the client-side implementation of the review widgets. These files are specifically designed for embedding reviews on external websites, not for use in the dashboard.

## Purpose

The widget-embed system provides a lightweight, standalone version of the review widgets that can be embedded on any website. It's designed to be:
- Self-contained
- Lightweight
- Easy to integrate
- Independent of the dashboard

## Structure

```
widget-embed/
├── index.tsx           # Main entry point and initialization
├── MultiWidget.tsx     # Multi-review carousel implementation
├── PhotoWidget.tsx     # Photo-focused review implementation
└── SingleWidget.tsx    # Single review implementation
```

## Usage

1. **Include the Widget Script**
   ```html
   <script src="https://your-domain.com/widgets/multi/widget-embed.js"></script>
   ```

2. **Initialize the Widget**
   ```html
   <div id="review-widget"></div>
   <script>
     window.ReviewWidget.init({
       widgetId: 'your-widget-id',
       type: 'multi', // or 'photo' or 'single'
       container: '#review-widget'
     });
   </script>
   ```

## Implementation Details

1. **Widget Types**
   - `multi`: Carousel of multiple reviews
   - `photo`: Grid of photo reviews
   - `single`: Single featured review

2. **Design Customization**
   - Colors
   - Typography
   - Layout
   - All settings are managed through the dashboard

3. **Data Flow**
   - Widgets fetch data from the API
   - Updates are pushed through WebSocket
   - Caching is handled automatically

## Development Notes

1. **Keep it Lightweight**
   - Minimize dependencies
   - Use vanilla JavaScript where possible
   - Avoid framework-specific code

2. **Browser Compatibility**
   - Support modern browsers
   - Graceful degradation
   - Mobile-friendly

3. **Performance**
   - Lazy load images
   - Minimize DOM operations
   - Cache API responses

4. **Security**
   - Sanitize all data
   - Validate inputs
   - Use HTTPS

## Important Notes

1. This folder is separate from the dashboard implementation
2. Changes here don't affect the dashboard
3. Keep widget-specific code in the dashboard components
4. This is for client-side embedding only

Last updated: March 19, 2024 
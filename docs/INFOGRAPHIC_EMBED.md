# Embedding the PromptReviews Infographic

## Quick Start (Recommended)

The easiest way to embed the infographic on your marketing site is using an iframe that loads from your app:

```html
<iframe 
  src="https://app.promptreviews.app/infographic/embed"
  width="100%" 
  height="1200" 
  frameborder="0"
  style="border: none; overflow: hidden;"
  title="PromptReviews Animated Infographic"
></iframe>
```

## Responsive Container

For better responsive behavior, wrap the iframe in a container:

```html
<div style="width: 100%; overflow-x: auto; background: #000;">
  <iframe 
    src="https://app.promptreviews.app/infographic/embed"
    width="100%" 
    height="1200" 
    frameborder="0"
    style="border: none; min-width: 1000px; display: block;"
    title="PromptReviews Animated Infographic"
  ></iframe>
</div>
```

## What's Included

The embedded infographic includes:
- Full animations and interactive features
- All 9 prompt page features with popups
- Customer journey visualization
- Review platform integrations
- Responsive design (works on mobile and desktop)
- Dark gradient background

## Technical Details

### Required Resources
The infographic loads these resources from your app domain:
- React components and Next.js runtime
- Icon sprite (`/icons-sprite.svg`)
- Tailwind CSS styles
- Animation logic

### Security Headers
The `/infographic/embed` route is configured to allow iframe embedding by removing X-Frame-Options and setting permissive Content-Security-Policy headers.

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- JavaScript must be enabled
- Cookies not required

## Customization Options

### Size
- **Minimum width**: 1000px (will scale down on smaller screens)
- **Recommended height**: 1200px
- **Maximum width**: No limit (fills container)

### Background
The embed includes its own gradient background. To match your site, you can set the iframe container background:

```html
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
  <iframe ...></iframe>
</div>
```

## Testing

### Local Testing
1. Visit: http://localhost:3002/infographic/embed
2. Check that animations work
3. Test popup interactions
4. Verify responsive behavior

### Production Testing
1. Deploy your changes to production
2. Visit: https://app.promptreviews.app/infographic/embed
3. Test embedding on your marketing site
4. Verify all features work correctly

## Troubleshooting

### Infographic not loading
- Check that your app is deployed and running
- Verify the URL is correct
- Check browser console for errors
- Ensure JavaScript is enabled

### Cut off on sides
- Increase container width or add horizontal scroll
- The infographic needs ~1200px width for optimal display

### Not centered
- The embed page handles centering automatically
- If issues persist, adjust iframe container styles

## Alternative: Static Hosting

If you need to host the infographic separately from your app, you would need to:
1. Export the React component as a static build
2. Bundle all dependencies
3. Host on a CDN

This is more complex and not recommended. The iframe approach is simpler and always stays up-to-date with your app.

## Support

For issues or questions:
- Check browser console for errors
- Ensure your app is running
- Test the direct URL first: https://app.promptreviews.app/infographic/embed
- Contact support if problems persist
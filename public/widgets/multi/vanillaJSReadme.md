# Multi Widget (Vanilla JS Version)

## Overview
This directory contains a standalone, embeddable review widget built with vanilla JavaScript and CSS. The goal is to provide a visually appealing, interactive review carousel that can be dropped into any HTML page without dependencies on React, Next.js, or any build tools.

- **Directory:** `public/widgets/multi/`
- **Main demo & test file:** `multi.html` (the single source of truth for demo and development)
- **Widget JS:** `widget-embed.min.js`
- **Widget CSS:** `widget-embed.min.css`

## Features
- Responsive review carousel using [Swiper.js](https://swiperjs.com/)
- Customizable accent color and hover color
- Modern, clean design with accessible markup
- No framework dependencies (vanilla JS)
- Easy to embed in any static or dynamic site

## File Structure
```
public/widgets/multi/
├── multi.html               # Standalone demo/test page for the widget (single source of truth)
├── widget-embed.min.js      # Minified JavaScript for the widget
├── widget-embed.min.css     # Minified CSS for the widget
```

## How to Use (Standalone)
1. **Open `multi.html` directly in your browser.**
   - You do NOT need to run a server or Next.js to test the widget. Just double-click `multi.html` or open it via your browser's File > Open menu.
   - All dependencies (Swiper, CSS, JS) are loaded via CDN or relative paths.

2. **Widget Customization:**
   - The widget is initialized in `multi.html` with sample data. You can edit the `widgetData` object in the `<script>` tag to change reviews, colors, etc.
   - The widget expects an array of reviews and a design object (see the sample in `multi.html`).

3. **Embedding in Other Sites:**
   - Copy `widget-embed.min.js` and `widget-embed.min.css` to your project.
   - Add the following to your HTML:
     ```html
     <link rel="stylesheet" href="/path/to/widget-embed.min.css">
     <script src="/path/to/widget-embed.min.js"></script>
     <div id="widget-container"></div>
     <script>
       // See multi.html for a sample widgetData object
       document.addEventListener('DOMContentLoaded', function() {
         PromptReviews.renderMultiWidget(document.getElementById('widget-container'), widgetData);
       });
     </script>
     ```

## Development Notes
- **No build step required.** All files are ready to use as-is.
- **To update styles or JS:**
  - Edit the source files (if available), then re-minify as needed.
- **Swiper.js** is loaded via CDN in `multi.html`. If you want to bundle it, update the JS accordingly.
- **Only `multi.html` is used for demo/testing.** The previous `test.html` file has been removed to avoid confusion. All development and testing should be done using `multi.html`.

## Troubleshooting
- If the widget does not appear:
  - Check the browser console for errors.
  - Make sure the paths to `widget-embed.min.js` and `widget-embed.min.css` are correct.
  - Ensure Swiper is loaded before the widget JS.
- For local development, you can use a simple static server (like `python -m http.server` or `npx serve`) if you want to test relative paths.

## Next Steps
- Once the widget works perfectly standalone, we can integrate it into the main app or Next.js project as needed.

---

**Author:** Chris / PromptReviews 
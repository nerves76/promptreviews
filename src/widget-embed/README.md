# PromptReviews Embeddable Widget System

## Overview & Goals
PromptReviews allows users to create, customize, and manage review widgets from their account dashboard. These widgets can be embedded on any website, enabling users to showcase reviews with pixel-perfect, customizable designs. Key goals:

- **Self-serve:** Users can create widgets, add/edit reviews, and change widget design from their PromptReviews account.
- **Live updates:** Any changes made in the dashboard (reviews, design, settings) are reflected on all sites where the widget is embedded—no need to generate a new widget or update embed code.
- **Isolation:** Widget styles and scripts are fully scoped to prevent conflicts with host pages.
- **Simplicity:** Embedding a widget is as easy as copy-pasting a snippet.

## User Workflow
1. **Create a Widget:** In the dashboard, users create a new widget (multi, single, or photo style).
2. **Add/Edit Reviews:** Users can add, edit, or remove reviews associated with the widget. Each review can have a star rating, reviewer name, role, and content.
3. **Customize Design:** Users can adjust design settings (colors, fonts, border radius, etc.) in the Edit Widget menu.
4. **Embed:** Users copy the provided embed code and paste it into their website.
5. **Live Updates:** Any changes made in the dashboard are automatically reflected in all embeds.

## Widget Variables (Edit Widget Menu)
- **Widget Type:** multi, single, or photo
- **Accent Color:** Main color for highlights and navigation
- **Card Background:** Background color of review cards
- **Border Radius:** Card corner roundness
- **Border Color/Width:** Card border styling
- **Text Color:** Main review text color
- **Reviewer Name/Role Color:** Styling for reviewer info
- **Star Rating:** Per-review, 1–5 stars
- **Auto-advance:** Enable/disable slideshow auto-advance
- **Slideshow Speed:** Time between slides (if auto-advance enabled)
- **Font:** Main font family (default: Inter)
- **Shadow:** Card shadow intensity/color
- **Section Background:** Widget section background color

## File Architecture
```
src/widget-embed/
  multi/           # Multi-review widget implementation
    widget.js      # Main vanilla JS embeddable widget logic
    test.html      # Standalone test page for local development
    ...
  single/          # Single-review widget implementation
  photo/           # Photo widget implementation
  widget.css       # Source CSS for widgets (compiled by Tailwind)
  README.md        # (this file)
```
- **widget.js:** Handles rendering, data fetching, and style injection for the multi widget.
- **widget.css:** Source for all widget styles (compiled to `public/widget.css` for production).
- **test.html:** Local test page for development and pixel-perfect checks.

## How to Update Widgets
1. **Edit Widget Logic/Styles:**
   - Update `widget.js` for logic or markup changes.
   - Update `widget.css` for style changes (use Tailwind classes where possible).
2. **Build CSS:**
   - Run: `npx tailwindcss -i ./src/widget-embed/widget.css -o ./public/widget.css --minify`
   - Or: `npm run build:widget:css` (if script is in package.json)
3. **Build Project:**
   - Run: `npm run build` to rebuild the widget and app.
4. **Test:**
   - Open `src/widget-embed/multi/test.html` in your browser (e.g., http://localhost:3001/test/multi.html) to verify changes.
5. **Deploy:**
   - Commit and push changes, then deploy as usual.

## How We Are Testing
- **Local Test Pages:** Each widget type has a `test.html` for local, isolated testing.
- **Dashboard Preview:** The dashboard uses the same widget code for live previews.
- **Embed Simulation:** Paste the embed code into a blank HTML file to simulate real-world usage.
- **Pixel-Perfect Checks:** Compare widget output to design references.
- **Cross-Browser:** Test in Chrome, Firefox, Safari, and Edge.

## Best Practices for Embeddable Widgets
- **Style Isolation:** All CSS is injected into `<head>` and scoped with a unique class to prevent conflicts.
- **No Global Leakage:** Never use unscoped selectors or global styles.
- **No External Dependencies:** All required CSS and fonts are loaded by the widget script.
- **Live Data:** Widget fetches latest settings and reviews from the backend using the widget ID.
- **Backward Compatibility:** When adding new settings, always provide sensible defaults.

## Live Update Mechanism
- When a user edits a widget (reviews, design, etc.) and saves changes in the dashboard, the backend updates the widget config.
- The embeddable widget script always fetches the latest config and reviews using the widget ID, so changes are reflected instantly on all sites.
- No need to re-embed or update the script after making changes in the dashboard.

## Troubleshooting
- **Widget not updating?**
  - Clear browser cache or use a private window.
  - Ensure the widget ID in the embed code matches the one in your dashboard.
  - Check browser console for errors.
- **Style issues?**
  - Make sure all CSS is properly scoped and injected into `<head>`.
  - Test in an isolated HTML file to rule out host page conflicts.

---

For more details, see the main project README and the dashboard widget README. 
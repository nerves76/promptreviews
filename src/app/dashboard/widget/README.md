# Widget Review Management

## Overview
This module provides UI and logic for managing reviews associated with widgets in the dashboard. It allows users to:
- View available reviews (from the global `review_submissions` table)
- Select reviews to associate with a widget (stored in `widget_reviews`)
- Add, edit, and remove widget-specific reviews
- Set a star rating for each widget-specific review

## Main Components
- **WidgetList.tsx**: Main component for listing widgets and managing their reviews. Contains the review management modal and all related logic.
- **page.tsx**: Entry point for the widget dashboard page.

## Data Flow
- **Available Reviews (Left Column):**
  - Pulled from the `review_submissions` table.
  - Only fields that exist in the table are selected (e.g., `id`, `first_name`, `last_name`, `reviewer_role`, `review_content`, `platform`, `created_at`).
  - These reviews are not editable in the global table from this UI.

- **Selected Reviews (Right Column):**
  - Pulled from the `widget_reviews` table, filtered by the current widget.
  - Each selected review can have a custom `star_rating` (which is only stored in `widget_reviews`).
  - Users can add, edit, or remove reviews for the widget.

- **Custom Reviews:**
  - When a user adds a custom review, it is stored only in `widget_reviews` (not in `review_submissions`).

## Key Behaviors
- **Review Modal:**
  - Draggable, with a modern UI.
  - Left column: All available reviews from `review_submissions`.
  - Right column: Reviews currently associated with the widget (`widget_reviews`).
  - Users can move reviews between columns, edit widget-specific reviews, and set star ratings.
  - Star ratings are only editable for widget-specific reviews.

- **Data Consistency:**
  - The code ensures that only valid fields are selected from each table.
  - Handles Row Level Security (RLS) by requiring an authenticated user and correct Supabase policy.

## Developer Notes
- If you add new fields to `review_submissions` or `widget_reviews`, update the select statements and mapping logic in `WidgetList.tsx`.
- The code expects `review_id` as the unique key for reviews in the UI.
- If you see empty errors from Supabase, check RLS policies and column names.
- The modal and review management logic are all contained in `WidgetList.tsx` for now.

## Extending Functionality
- To support new review fields, update the mapping and UI in `WidgetList.tsx`.
- To change how reviews are filtered or sorted, update the `getFilteredAndSortedReviews` function.
- For new widget features, consider splitting logic into smaller components as the file grows.

## Troubleshooting
- **No reviews appear:** Check Supabase RLS policies and ensure the user is authenticated.
- **React key warning:** Ensure you use `review.review_id` as the key in lists.
- **Supabase 400 error:** Double-check column names in select statements.

---

## Widget Embed & Rendering on External Sites

### How Embedding Works
- Each widget can be embedded on any website using a simple embed code snippet, which looks like:
  ```html
  <div id="promptreviews-widget" data-widget="YOUR_WIDGET_ID"></div>
  <script src="https://app.promptreviews.app/widget.js" async></script>
  ```
- The `data-widget` attribute should be set to the unique widget ID you want to display.
- The script (`widget.js`) is responsible for loading the widget code and rendering the widget in place of the div.

### How the Widget is Rendered
- When the script loads, it:
  1. Reads the `data-widget` attribute to get the widget ID.
  2. Fetches the widget configuration and reviews from the backend (using the widget ID).
  3. Renders the widget using the same React components as the dashboard preview (ensuring a unified look and behavior).
  4. Applies all design settings (colors, fonts, border, etc.) as configured in the dashboard.

### How Settings Are Saved and Loaded
- Widget settings (design, display options, etc.) are saved in the database (typically in the `widgets` table) when you use the dashboard UI.
- When a widget is loaded (either in the dashboard preview or via the embed), the backend returns the saved settings, which are merged with any defaults.
- Any changes made in the dashboard must be saved and, if you want them to appear on external sites, the embed script may need to be rebuilt and redeployed (if you are self-hosting the script).
- The embed always fetches the latest settings from the backend, so changes in the dashboard are reflected in real time (unless cached or unless you are using a static build of the script).

### Notes
- The embed code is designed to be copy-paste simple for end users.
- If you add new settings or features, ensure the backend API and the embed script both support them.
- For troubleshooting, check the browser console for errors and ensure the widget ID is correct.

_Last updated: 2024-06-07_

---

## Updating Widget Styles (Tailwind CSS Build)

**Widget CSS Management:**

- All widget styles are managed directly in `public/widget.css`
- This file is served directly to users and embedded sites
- To modify widget styles:
  1. Edit `public/widget.css` directly
  2. Test your changes locally
  3. Commit and push the changes
  4. Deploy to update the live widget styles

Note: The widget CSS is now managed manually to ensure reliable updates and direct control over the final output.

**How to update widget styles:**

1. Edit your styles in `src/widget-embed/widget.css`.
2. Run the following command to generate the production CSS:
   ```sh
   npx tailwindcss -i ./src/widget-embed/widget.css -o ./public/widget.css --minify
   ```
   This will also update `public/widget.css.map` for debugging.
3. Commit and push both `src/widget-embed/widget.css` and the generated `public/widget.css` (and optionally `public/widget.css.map`).
4. Deploy as usual.

**Why?**
- `public/widget.css` is the file actually served to users and embedded sites.
- It is always generated from your source file by Tailwind/PostCSS.
- Manual edits to `public/widget.css` will be lost on the next build.

**Tip:**
- You can add this to your `package.json` scripts for convenience:
  ```json
  "scripts": {
    "build:widget:css": "npx tailwindcss -i ./src/widget-embed/widget.css -o ./public/widget.css --minify"
  }
  ```
  Then just run:
  ```sh
  npm run build:widget:css
  ```

---

## Consistency Between Dashboard Preview and Embedded Widget

### Why Might the Embedded Widget Look Different?
- **Stale or Cached Settings:**
  - The embed fetches the latest settings from the backend, but browser or CDN caching can cause old settings to be used. Always clear cache or use cache-busting techniques when testing changes.
- **Script Version Mismatch:**
  - If you update the widget code (React components, CSS, etc.), but the external site is loading an old version of `widget.js`, the embed may not reflect the latest changes. Make sure the script is rebuilt and redeployed after updates.
- **Environment Differences:**
  - The dashboard preview may have access to more data (e.g., draft reviews, user-specific settings) than the public embed, which only loads published and public data.
- **Design Propagation:**
  - If new design settings are added, ensure they are saved in the database, returned by the API, and used in both the dashboard and embed environments. Missing fields can cause the embed to fall back to defaults.
- **CSS/Font Loading:**
  - The dashboard may load global styles or fonts that are not included in the embed. Make sure all required CSS and fonts are bundled with or loaded by the embed script.
- **Feature Flags or Conditional Logic:**
  - Some features may be enabled only in the dashboard for testing. Double-check that all intended features are enabled in production embeds.

### Best Practices When Adding Features
- **Update All Layers:**
  - When adding a new setting or feature, update:
    1. The dashboard UI (for editing the setting)
    2. The database schema (to store the setting)
    3. The API/backend (to return the setting)
    4. The embed script and React components (to use the setting)
- **Test in Both Environments:**
  - Always test new features in both the dashboard preview and a real external embed to ensure consistency.
- **Document New Settings:**
  - Add documentation for new settings and features in this README to help future developers.
- **Handle Defaults Carefully:**
  - When loading settings, always merge with sensible defaults to avoid undefined behavior if a field is missing.
- **Check for Breaking Changes:**
  - If you change the structure of the widget data or settings, ensure backward compatibility or provide a migration path.

### Troubleshooting Checklist
- Is the embed script up to date and deployed?
- Are all settings being saved and returned by the API?
- Are there any console errors in the browser?
- Are all required assets (CSS, fonts) loaded in the embed?
- Is the widget ID correct in the embed code?

_Last updated: 2024-06-07_

# Widget Styling

The widget styles are now managed directly in `public/widget.css` using CSS variables. This approach provides several benefits:

1. Direct control over the final CSS output
2. Easy customization through CSS variables
3. No build process required for style updates
4. Immediate visibility of changes

## CSS Variables

The widget uses the following CSS variables for styling:

- `--card-background`: Background color of review cards
- `--card-border-radius`: Border radius of cards
- `--card-border-color`: Color of card borders
- `--card-border-width`: Width of card borders
- `--text-color`: Color of review text
- `--heading-color`: Color of reviewer names
- `--accent-color`: Color of accents (quotes, navigation)
- `--section-background`: Background color of the widget section
- `--card-shadow-intensity`: Intensity of card shadow
- `--card-shadow-color`: Color of card shadow

## Modifying Widget Styles

To modify widget styles:

1. Edit `public/widget.css` directly
2. Test changes locally
3. Commit and push changes
4. Deploy to update live widget styles

## Design Settings

The widget's design settings from the edit style modal are applied by setting these CSS variables in the widget component. This ensures that any changes made in the dashboard are immediately reflected in the widget's appearance.

## Responsive Design

The widget is fully responsive and uses CSS media queries to adjust its layout based on screen size. The main breakpoints are:

- Mobile: Single column layout
- Tablet (640px+): Two column layout
- Desktop (1024px+): Three column layout

## Browser Support

The widget uses modern CSS features that are supported by all major browsers:

- CSS Variables
- Flexbox
- Grid
- Media Queries
- Backdrop Filter

## Performance

The widget's CSS is optimized for performance:

- Minimal CSS footprint
- No unused styles
- Efficient selectors
- Hardware-accelerated animations

---

## Widget Photo/Avatar Rendering Logic

- **Photo/avatar areas (the `pr-widget-photo-img` block) should only appear in the PhotoWidget and MultiWidget.**
- **The SingleWidget should never render a photo/avatar area, even if a `photo_url` is present in the review data.**
- If you see a photo or placeholder avatar on the single card, check for and remove any `pr-widget-photo-img` block in the SingleWidget component (`src/widget-embed/index.tsx`).
- This ensures visual consistency and matches the intended design for each widget type.
- The code for rendering the photo/avatar is similar across widgets, so be careful not to copy/paste it into the SingleWidget.
- For future changes, always verify that only the intended widgets display reviewer photos. 
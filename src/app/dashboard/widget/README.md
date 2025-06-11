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
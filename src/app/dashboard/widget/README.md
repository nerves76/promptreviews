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

_Last updated: 2024-06-07_ 
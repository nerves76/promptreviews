# Vanilla JS Widget Integration Attempt: Detailed Account

## 1. Initial Goal

- **Objective:** Replace the React-based multi-widget with a vanilla JavaScript version, while keeping the React/Next.js dashboard as the configuration and management interface.
- **Widget Location:** The canonical vanilla JS widget is at `public/widgets/multi/widget-embed.js` (and its CSS).

---

## 2. Integration Steps

### A. Embedding the Vanilla Widget

- The React `MultiWidget.tsx` was replaced with a wrapper that loads the vanilla JS widget.
- The dashboard's widget preview area was updated to:
  - Dynamically load the Swiper and widget scripts/styles using a `useEffect` hook.
  - Initialize the widget with the correct data (reviews, design, etc.).
  - Ensure the widget's CSS is loaded from the public directory.

---

### B. Data Shape and Mapping

- **Problem:** The vanilla widget expects review data with fields like `name` and `content`, but the dashboard's API returns fields like `reviewer_name` and `review_content`.
- **Solution:**  
  - Added a mapping step in the React code to transform reviews into the expected shape before passing them to the widget.
  - Ensured every review object passed to the widget has a `name` and `content` property, using fallback logic.

---

## 3. Problems Encountered and Solutions

### A. TypeError: Cannot read properties of undefined (reading 'name')

- **Cause:** Some review objects were missing the `name` property, or were malformed.
- **Fix:**  
  - Added a robust mapping and filtering step in the React code to guarantee all reviews passed to the widget have the required properties.
  - Defensive coding in the widget JS to handle missing or malformed data.

---

### B. Swiper Initialization Errors

- **Error:** `swiper.on is not a function`
- **Cause:** Swiper was being used before it was fully loaded/initialized.
- **Fix:**  
  - Added checks to ensure Swiper is loaded before initializing the widget.
  - Used dynamic script loading and `requestAnimationFrame` to ensure DOM readiness.

---

### C. buildTimestamp Redeclaration Error

- **Error:** `Uncaught SyntaxError: Identifier 'buildTimestamp' has already been declared`
- **Cause:** The widget script declared `const buildTimestamp` at the top level, causing a redeclaration error if the script was loaded more than once (common with HMR or hot reload).
- **Fix:**  
  - Moved the `buildTimestamp` declaration inside a guard block:
    ```js
    if (!window.PromptReviews || !window.PromptReviews.renderMultiWidget) {
      const buildTimestamp = ...;
      // rest of widget code
    }
    ```
  - Ensured the script is idempotent and safe for multiple loads.

---

### D. TypeError: Cannot read properties of null (reading 'parentNode')

- **Cause:** The widget tried to manipulate a DOM node that didn't exist (e.g., `.swiper` element).
- **Fix:**  
  - Added defensive checks before accessing `.parentNode` in the widget JS.
  - Added console warnings and early returns if the required DOM elements are missing.

---

### E. Missing layout.css Stylesheet

- **Error:**  
  - The browser reported: "This page failed to load a stylesheet from a URL: layout.css"
- **Cause:** The app or widget references a `layout.css` file that does not exist in the expected location.
- **Fix:**  
  - Searched for the file and its references.
  - Determined that the file is not tracked in git and must be restored or recreated.
  - Provided instructions for creating a minimal placeholder or restoring from backup.

---

### F. Duplicate File Issues

- **Concern:** Past issues with duplicate widget files causing confusion and redeclaration errors.
- **Fix:**  
  - Searched the entire repo for duplicate `widget-embed.js` files.
  - Confirmed only one copy exists in the correct location.

---

### G. Server/Cache Issues

- **Problem:** Changes were not always reflected due to caching or stale build artifacts.
- **Fix:**  
  - Repeatedly restarted the dev server on port 3001.
  - Instructed to clear browser cache and use hard reloads.
  - Verified the actual loaded files in the browser's Network tab.

---

## 4. Other Improvements and Cleanups

- Updated imports for `SingleWidget` and `PhotoWidget` to use the correct React component paths.
- Added error boundaries in the React code to catch and display widget errors gracefully.
- Cleaned up unused or broken imports (e.g., `injectWidgetNavCSS`).
- Committed and pushed all changes to ensure a safe stopping point.

---

## 5. Outstanding Issues / Next Steps

- **layout.css** is still missing and must be restored or recreated for the site to render properly.
- Once the stylesheet is in place, the widget and dashboard should function as intended.

---

## Summary Table

| Problem/Error                                 | Cause/Context                                    | Solution/Action Taken                                 |
|------------------------------------------------|--------------------------------------------------|-------------------------------------------------------|
| Widget expects wrong review data shape         | API returns different field names                | Mapped/filtered reviews in React before passing to JS |
| Swiper not initialized                        | Script loaded out of order                       | Added load checks and dynamic script loading          |
| buildTimestamp redeclaration                  | Script loaded multiple times                     | Moved declaration inside guard block                  |
| parentNode TypeError                          | DOM element missing                              | Defensive checks and early returns in JS              |
| layout.css missing                            | File not tracked or deleted                      | Advised to restore or create placeholder              |
| Duplicate widget-embed.js files               | Past confusion, possible redeclaration errors    | Searched and confirmed only one copy exists           |
| Server/browser cache issues                   | Stale files served                              | Restarted server, cleared cache, checked Network tab  |
| Import errors for widgets                     | Wrong import paths after migration               | Updated imports to correct React component locations  |

---

**You are now in a safe, committed state. The only remaining blocker is the missing stylesheet. Once that's restored, your vanilla widget integration should be complete and stable.**

If you need a more technical or step-by-step breakdown for documentation or a postmortem, let me know! 
# PromptReviews Design Guidelines

_Last updated: 2024-06-09_

## How to Use This File

This file is the **canonical source for all UI/UX and visual conventions** in PromptReviews. All new modules, pages, and components must follow these patterns unless otherwise documented and approved.

- For a quickstart and where to find key components, see the "UI/UX Styles & Component Conventions" section in the main `README.md`.
- For implementation, see:
  - `src/app/components/SectionHeader.tsx` (section headers)
  - `src/app/components/PageCard.tsx` (page/card layout and floating icons)
  - `src/app/dashboard/edit-prompt-page/components/ReviewWriteSection.tsx` (review platform cards and AI button)
  - `src/app/components/PromptPageForm.tsx` (main prompt page form structure)

**If you need to deviate from these rules, document the reason and get approval.**

## 1. Section & Card Titles

- **Alignment:** Always centered (unless otherwise specified).
- **Color:** Slate blue (`#1A237E`).
- **Font:** Bold, at least `text-2xl` (prefer `text-3xl` for main titles).
- **Icon:** Always include the relevant icon to the left of the title. Icon is slate blue (`#1A237E`), never black or gray. Icon and text are vertically centered.
- **Spacing:** Add `mb-8` below main titles, `mb-4` for section titles.

**Example:**

```jsx
<div className="flex items-center justify-center mb-8">
  <FaCamera className="w-8 h-8 mr-3" style={{ color: "#1A237E" }} />
  <h1 className="text-3xl font-bold text-center" style={{ color: "#1A237E" }}>
    Photo + Testimonial
  </h1>
</div>
```

## 2. Icons

- **Context:** Use the correct icon for the context (e.g., FaCamera for photo, FaStar for review, FaVideo for video, etc).
- **Color:** Slate blue (`#1A237E`).
- **Size:** At least `w-7 h-7` for section titles, `w-8 h-8` for floating icons.
- **Floating Icon:** Place in the top-left of the card, with a white circular background, shadow, and padding. Use `absolute -top-8 -left-8 z-10 bg-white rounded-full shadow-lg p-4 flex items-center justify-center` and set width/height to 64px.

## 3. Card & Container Layout

- **Max Width:** 1000px for main cards/sections.
- **Centering:** Always horizontally centered (`mx-auto`).
- **Padding:** Use generous padding (`p-8` or `p-10` for main cards).
- **Margin:** Add `mt-24` or `mt-32` to avoid cramming against navigation/header.
- **Border Radius:** Use `rounded-2xl` for main cards.
- **Shadow:** Use `shadow-lg` for main cards, `shadow` for smaller elements.
- **Background:** Cards are always white (`bg-white`).

**Example:**

```jsx
<div
  className="relative bg-white rounded-2xl shadow-lg p-10 w-full mt-24 mx-auto"
  style={{ maxWidth: 1000 }}
>
  {/* Floating Icon and Title here */}
  {/* Card Content here */}
</div>
```

## 4. Color Palette

- **Slate Blue (Brand):** `#1A237E` (primary for titles, icons, accents)
- **Indigo:** `#4F46E5` (secondary accent, buttons)
- **Yellow:** `#facc15` (for star/favorite icons, rewards)
- **Red:** `#ef4444` (for error, heart icons)
- **Green:** `#22c55e` (for success, submit buttons)
- **Gray:** `#F3F4F6` (backgrounds), `#E5E7EB` (borders), `#6B7280` (secondary text)
- **White:** `#FFFFFF` (card backgrounds)

## 5. Spacing Guidelines

- **Vertical spacing between sections:** `mb-8` for main, `mb-4` for subsections.
- **Horizontal spacing:** Use `gap-4` or `gap-6` for flex/grid layouts.
- **Inputs:** Use `py-3 px-4` for input padding, `mb-4` below each input.
- **Buttons:** At least `px-4 py-2`, with margin between buttons (`gap-4` in flex containers).

## 6. Typography

### Font Size Scale & Usage

**Tailwind Classes with Conversions:**
```
text-xs    = 0.75rem  (12px)  - Helper text, badges, secondary info
text-sm    = 0.875rem (14px)  - Form labels, buttons, small headings  
text-base  = 1rem     (16px)  - Default body text
text-lg    = 1.125rem (18px)  - Large body text, card titles
text-xl    = 1.25rem  (20px)  - Subheadings
text-2xl   = 1.5rem   (24px)  - Section headers inside cards
text-3xl   = 1.875rem (30px)  - Main titles, page headers
text-4xl   = 2.25rem  (36px)  - Hero sections (rarely used)
text-5xl   = 3rem     (48px)  - Hero sections (rarely used)
text-6xl   = 3.75rem  (60px)  - Special elements (e.g., emojis)
```

### Font Weight Scale
```
font-medium   = 500  - Form labels, buttons
font-semibold = 600  - Subheadings, important labels
font-bold     = 700  - Main titles, section headers
```

### Standard Typography Combinations

- **Main Title:** `text-3xl font-bold`, `text-center` or `text-left` as needed, color slate blue (`#1A237E`). Used for main card/page titles.
- **Section Title:** `text-2xl font-bold`, `text-left`, color slate blue (`#1A237E`). Used for section headers inside cards.
- **Subheading:** `text-xl font-semibold`, color slate blue or gray as appropriate.
- **Card Title:** `text-lg font-semibold`, for smaller card headers.
- **Body:** `text-base`, `text-gray-700`. Used for main content and instructions.
- **Labels:** `text-sm font-medium`, `text-gray-700`. Used for form labels and small headings.
- **Subtext/Helper:** `text-xs`, `text-gray-500`. Used for helper text, notes, and secondary info.

**Example:**

```jsx
<h1 className="text-3xl font-bold text-left mb-8 flex items-center" style={{ color: '#1A237E' }}>
  <FaCamera className="w-8 h-8 mr-3" style={{ color: '#1A237E' }} />
  Photo + Testimonial
</h1>
<h2 className="text-2xl font-bold text-left mb-4 flex items-center" style={{ color: '#1A237E' }}>
  <FaStar className="w-7 h-7 mr-2" style={{ color: '#1A237E' }} />
  Section Title
</h2>
<label className="text-sm font-medium text-gray-700">Label</label>
<p className="text-base text-gray-700">Body text here.</p>
<span className="text-xs text-gray-500">Helper text here.</span>
```

## 7. Example Patterns

**Section Title with Icon:**

```jsx
<div className="flex items-center justify-center mb-8">
  <FaCamera className="w-8 h-8 mr-3" style={{ color: "#1A237E" }} />
  <h1 className="text-3xl font-bold text-center" style={{ color: "#1A237E" }}>
    Photo + Testimonial
  </h1>
</div>
```

**Floating Icon:**

```jsx
<div
  className="absolute -top-8 -left-8 z-10 bg-white rounded-full shadow-lg p-4 flex items-center justify-center"
  style={{ width: 64, height: 64 }}
>
  <FaCamera className="w-8 h-8" style={{ color: "#1A237E" }} />
</div>
```

**Main Card:**

```jsx
<div
  className="relative bg-white rounded-2xl shadow-lg p-10 w-full mt-24 mx-auto"
  style={{ maxWidth: 1000 }}
>
  {/* Floating Icon and Title here */}
  {/* Card Content here */}
</div>
```

## 8. General Rules

- Never use black for icons or titles—always use slate blue.
- Never cram cards against the top navigation—always add top margin.
- Always use the correct icon for the context.
- All section titles must be bold, centered, and slate blue, with the icon to the left.
- Maintain consistent spacing and alignment throughout.

---

_Refer to this file for all future UI/UX work. If you need to deviate, document the reason and get approval._

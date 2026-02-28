# Mobile Usability Fix Roadmap

Audit date: 2026-02-25 | Device: iPhone 14 (390x844) | App: app.promptreviews.app

Tech stack: Next.js 15 + Tailwind CSS 3.3 + TypeScript

---

## Phase 1: Global Container Padding

**Problem**: White content cards go edge-to-edge on mobile across nearly every page. There should always be a thin gap so containers never touch the screen sides.

### 1A. Auth pages (login, signup, forgot password)

**Files:**
- `src/app/(app)/auth/sign-in/page.tsx` (~line 242)
- `src/app/(app)/auth/sign-up/page.tsx` (~line 342)

**What to fix:**
- The outer `<div className="min-h-screen">` has zero horizontal padding
- The `<div className="sm:mx-auto sm:w-full sm:max-w-md">` only applies margin at `sm:` (640px+), so on mobile the form stretches to edges
- The form container itself (`w-full max-w-md`) fills the screen

**Fix:**
- Add `px-4` to the outer wrapper or the flex container wrapping the form
- Ensure the form card has breathing room on screens < 640px

### 1B. Dashboard layout / AppMain

**Files:**
- `src/app/(app)/components/AppMain.tsx` (~line 59): wrapper has `md:pl-4` — no mobile padding
- `src/app/(app)/dashboard/layout.tsx` (~line 174): outer div has no horizontal padding

**Fix:**
- Add `px-4 md:px-0` (or similar) to the main content wrapper so all dashboard pages get side padding on mobile
- This is the highest-leverage fix — it affects every dashboard page at once

### 1C. PageCard component

**File:** `src/app/(app)/components/PageCard.tsx` (~line 162-164)

**What's happening:**
- Outer wrapper has `px-4` but the card itself has `px-6 md:px-8` and `w-full`
- Combined, the card can still feel edge-to-edge

**Fix:**
- Verify the outer `px-4` actually creates visible breathing room after the AppMain fix
- If not, reduce card `px-6` to `px-4` on mobile or add margin to the card itself

---

## Phase 2: Responsive Heading Sizes

**Problem**: Many headings use large fixed sizes (`text-3xl`, `text-4xl`, `text-5xl`) without mobile breakpoint reductions. This causes text to wrap into tall stacks on narrow screens, eating vertical space and pushing layouts out of alignment.

**Pattern to apply everywhere:**
```
text-5xl → text-2xl sm:text-3xl md:text-4xl lg:text-5xl
text-4xl → text-2xl sm:text-3xl md:text-4xl
text-3xl → text-xl sm:text-2xl md:text-3xl
text-2xl → text-lg sm:text-xl md:text-2xl  (only where it stacks badly)
```

### Files to fix:

| File | ~Line | Current | Heading text |
|------|-------|---------|-------------|
| `src/app/(app)/dashboard/DashboardContent.tsx` | 485 | `text-4xl` | "Dashboard" |
| `src/app/(app)/dashboard/DashboardContent.tsx` | 621 | `text-2xl` | "Universal Prompt Page" |
| `src/app/(app)/dashboard/DashboardContent.tsx` | 732 | `text-xl` | "Get Found Online: The Game" |
| `src/app/(app)/dashboard/reviews/page.tsx` | 973 | `text-4xl` | "Reviews" |
| `src/app/(app)/dashboard/plan/page.tsx` | 1055 | `text-5xl` | "Choose your plan" |
| `src/app/(app)/dashboard/plan/page.tsx` | 1000 | `text-4xl` | "Agency plan" |
| `src/app/(app)/auth/sign-in/page.tsx` | 246 | `text-3xl` | "Welcome back" |
| `src/app/(app)/auth/sign-up/page.tsx` | 346 | `text-3xl` | "Create your account" |

**Additional sweep**: Search the entire `src/` directory for `text-4xl` and `text-5xl` that lack a mobile-first alternative (i.e., no `sm:text-` or `md:text-` preceding them). Fix all occurrences with the pattern above.

---

## Phase 3: Card Layouts That Don't Stack on Mobile

**Problem**: Several cards use `flex items-center justify-between` for a title-on-left, actions-on-right layout. On mobile, the title text wraps into a tall column while the actions stay pinned right, causing overflow and clipping.

### 3A. Universal Prompt Page card

**File:** `src/app/(app)/dashboard/DashboardContent.tsx` (~line 619)

**Current:**
```html
<div className="flex items-center justify-between mb-1">
  <div><!-- "Universal Prompt Page" title + icon --></div>
  <div><!-- View, Edit links --></div>
</div>
```

**Problem:** "Universal Prompt Page" wraps to 3 lines on mobile. "Edit" link clips off-screen.

**Fix:**
```html
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 gap-2">
```
Title and actions will stack vertically on mobile, sit side-by-side on wider screens.

### 3B. Game card ("Get Found Online")

**File:** `src/app/(app)/dashboard/DashboardContent.tsx` (~line 726)

**Current:**
```html
<div className="flex items-center justify-between mb-4">
  <div className="flex items-center gap-3">
    <!-- icon + title + subtitle -->
  </div>
  <Link>Play Game →</Link>
</div>
```

**Problem:** Title wraps to 5 lines on mobile, "Play Game" button floats awkwardly beside it.

**Fix:**
```html
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
```

### 3C. Global sweep

Search for all instances of this pattern across the codebase:
```
flex items-center justify-between
```
Where there is NO `flex-col` mobile fallback AND the children contain text that could wrap on mobile, add:
```
flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2
```

**Key files to check** (these are likely to have the same issue):
- `src/app/(app)/dashboard/google-business/` — section headers
- `src/app/(app)/dashboard/contacts/page.tsx` — "Contacts" header + action buttons
- `src/app/(app)/dashboard/widget/page.tsx` — "Widget preview" header
- `src/app/(app)/dashboard/analytics/` — section headers
- `src/app/(app)/dashboard/business-profile/` — section headers
- Any component using `PageCard` that adds its own header row inside

---

## Phase 4: Contacts Table Overflow

**File:** `src/app/(app)/dashboard/contacts/page.tsx`

**Problem:** The contacts table extends beyond the viewport. The "EMAIL" column header is cut to "EMA..." and the Export button is clipped. No horizontal scroll indicator visible.

**Fix:**
- Wrap the `<table>` in a `<div className="overflow-x-auto -mx-4 px-4">` so it scrolls horizontally on mobile
- Alternatively, hide less-critical columns on mobile using `hidden sm:table-cell`
- Ensure the header row with "Contacts" title + "Find dupes" + "Export" buttons stacks or wraps on mobile (same pattern as Phase 3)

---

## Phase 5: Blank/Broken Pages

### 5A. Plan page — completely blank on mobile

**File:** `src/app/(app)/dashboard/plan/page.tsx`

**Likely cause:** The page uses `text-5xl` (48px) heading, a `max-w-6xl` container, and potentially content that depends on JavaScript rendering that may fail or overflow on mobile. The plan cards (PricingModal or similar) may have fixed widths that don't fit.

**Fix:**
- Reduce heading to `text-2xl sm:text-3xl md:text-5xl`
- Ensure pricing cards use responsive widths (`w-full sm:w-auto`)
- Check if any conditional rendering is hiding content based on viewport (unlikely with Tailwind, but check JS logic)
- Test after Phase 1 + Phase 2 fixes — may resolve itself once padding and font sizes are corrected

### 5B. Reviews page — mostly blank on mobile

**File:** `src/app/(app)/dashboard/reviews/page.tsx`

**Likely cause:** Content may be rendering but invisible due to overflow or rendering issue. The page wraps in `<PageCard>` so container fix may help.

**Fix:**
- Apply Phase 1 + 2 fixes first, then retest
- Check if review cards or tab content has `min-width` or `overflow: hidden` that clips content on mobile
- Look for any `hidden` classes that might accidentally hide the review list on mobile

---

## Phase 6: Navigation & Top Bar Polish

### 6A. Top "Viewing" bar text truncation

**File:** `src/app/(app)/components/Header.tsx`

**Problem:** The top utility bar ("Viewing: Pure Energy Wellness | Agency dashboard | 13 accounts") clips text on narrow screens.

**Fix:**
- Add `truncate` to the business name text
- Consider hiding "Agency dashboard" / "13 accounts" labels on mobile with `hidden sm:inline`
- Or reduce font size on mobile: `text-xs sm:text-sm`

### 6B. Nav menu doesn't fully cover page

**File:** `src/app/(app)/components/Header.tsx`

**Problem:** The hamburger menu opens as a partial overlay, leaving dashboard content visible behind it. Users can accidentally tap through to content underneath.

**Fix:**
- Add a full-screen backdrop (`fixed inset-0 bg-black/50 z-40`) behind the mobile menu
- Ensure menu panel is `fixed inset-y-0 left-0 w-full sm:w-80 z-50 bg-[color]`

---

## Phase 7: Widget Preview Empty Space

**File:** `src/app/(app)/dashboard/widget/page.tsx`

**Problem:** The widget preview area takes up most of the screen as blank space, pushing "Your widgets" and "Create widget" below the fold.

**Fix:**
- On mobile, either collapse/hide the preview area by default with a toggle
- Or set a `max-h-[300px]` on mobile: `max-h-[300px] sm:max-h-none`
- Ensure "Create widget" button and widget list are visible without scrolling

---

## Phase 8: Help Bubble Overlap

**File:** `src/components/ui/HelpBubble.tsx` (or wherever the floating `?` button is rendered)

**Problem:** The floating help bubble in the bottom-right overlaps with content on several pages (chart labels, table rows, buttons).

**Fix:**
- Add `mb-16` or `pb-16` to page content containers so content doesn't sit behind the bubble
- Or reposition the bubble slightly higher on mobile: `bottom-20 sm:bottom-6`

---

## Phase 9: Signup Header/Content Overlap on Scroll

**File:** `src/app/(app)/auth/sign-up/page.tsx`

**Problem:** When scrolling the signup form, the "PROMPT REVIEWS" logo and "Create your account" heading overlap. The hero section content scrolls behind the nav without proper z-index or spacing separation.

**Fix:**
- Ensure the nav bar (`SimpleMarketingNav`) has a solid background (not transparent) and a `z-50` or higher stacking context
- Add `relative z-10` to the nav container so it stays above scrolling content
- Alternatively, make the nav `sticky top-0` with a background color so it stays anchored and doesn't overlap

---

## Phase 10: Prompt Pages Action Buttons Low Contrast

**File:** `src/app/(app)/prompt-pages/page.tsx` (and related components)

**Problem:** On the Prompt Pages screen, the action buttons (Copy link, QR code, Send SMS, Send email) render as low-contrast grey/muted rectangles against the blue/purple gradient background. They're very hard to see or identify as tappable on mobile.

**Fix:**
- Increase button contrast — use solid backgrounds (`bg-white`, `bg-white/90`) or outlined styles (`border border-white text-white`) instead of transparent/muted styles
- Ensure buttons have sufficient color contrast ratio (WCAG AA: 4.5:1 minimum)
- Test visibility against the gradient background at mobile size

---

## Execution Order

Recommended order for maximum impact with least risk:

1. **Phase 1B** (AppMain/dashboard layout padding) — single fix, affects all dashboard pages
2. **Phase 1A** (auth page padding) — 2 files, fixes login/signup
3. **Phase 2** (heading sizes) — systematic find-and-replace across ~10 files
4. **Phase 3** (card stacking) — ~5-10 flex layout fixes
5. **Phase 4** (contacts table) — 1 file
6. **Phase 5** (blank pages) — retest after 1-4, then fix remaining issues
7. **Phase 6** (nav/top bar) — polish
8. **Phase 7** (widget preview) — polish
9. **Phase 8** (help bubble) — polish

## Testing

After each phase, verify at 390px width (iPhone 14) using openclaw browser:
```
set device "iPhone 14"
```

Key pages to check after every change:
- `/auth/sign-in`
- `/dashboard`
- `/dashboard/reviews`
- `/dashboard/contacts`
- `/dashboard/plan`
- `/prompt-pages`
- `/dashboard/widget`

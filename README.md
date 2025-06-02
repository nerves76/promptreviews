This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

Public url is https://app.promptpages.app

It's main function is to create landing pages "prompt pages" that account holders can use to collect reviews. There are different kinds of prompt pages with different purposes.

---

# **PromptReviews Project Cheat Sheet**

It's important to know that due to a previous issue we use a togglt to embed hard coded keys. ./toggle-supabase-keys.sh

Keys include supabase, Stripe, Resend

## **Project Overview**
- **Stack:** Next.js (App Router), React, TypeScript, Supabase (DB, Auth, Storage), Tailwind CSS.
- **Purpose:** Business onboarding, authentication, and review management platform with custom prompt pages, AI-generated reviews, and media uploads.

---

## **Key Technologies & Patterns**

### **1. Supabase**
- **Auth, DB, Storage:** All handled via Supabase.
- **Client Usage:**  
  - **Use `@supabase/ssr` everywhere** for both client and server (API) code.
    - `createBrowserClient` for client-side (React components/pages).
    - `createServerClient` for server-side (API routes, middleware).
  - **Do NOT mix with `@supabase/auth-helpers-nextjs`** (legacy, only a few old usages remain).

### **2. Authentication**
- **Sign-in/Sign-up:**  
  - Use `createBrowserClient` from `@supabase/ssr`.
  - Handles both email/password and OAuth (Google).
- **Session Handling:**  
  - All session checks and user fetching use the same Supabase client.
  - If session is missing, user is redirected to `/auth/sign-in`.

### **3. Project Structure**
- **Pages:**  
  - `src/app/` — Next.js App Router pages.
  - `src/app/dashboard/` — Main dashboard and business management.
  - `src/app/r/[slug]/page.tsx` — Public prompt/review pages.
  - `src/app/auth/` — Auth flows.
  - `src/app/api/` — API routes (server actions).
- **Components:**  
  - `src/app/components/` — Shared UI components.
- **Utils:**  
  - `src/utils/` — Supabase helpers, guards, etc.

### **4. Review & Prompt Pages**
- **Prompt Pages:**  
  - Can be for platforms (Google, Yelp, etc.), video, photo+testimonial, or universal.
  - AI-generated review/testimonial support.
  - Media upload (photo/video) via Supabase Storage.

### **5. Business Logic**
- **Business Profiles:**  
  - Each user can create/manage a business profile.
  - Business data is stored in the `businesses` table.
- **Review Submissions:**  
  - Stored in `review_submissions` table.
  - Includes text, media URLs, reviewer info, etc.

---

## **Common Gotchas & Best Practices**

- **Always use the same Supabase client (`@supabase/ssr`) everywhere.**
- **Check for null/undefined user/session before accessing properties.**
- **If you see `AuthSessionMissingError`, the session is missing or expired.**
- **Environment variables:**  
  - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be set and correct.
  - Restart the dev server after changing env vars.
- **Do not use or reintroduce `@supabase/auth-helpers-nextjs` unless refactoring the whole app.**
- **For new features:**  
  - Follow the pattern of using `createBrowserClient` for all Supabase operations in client components.
  - Use `createServerClient` for API routes.

---

## **Debugging Tips**

- **If login/auth breaks:**  
  - Check for mixed Supabase client usage.
  - Clear cookies/localStorage and try again.
  - Check for errors in the browser console and network tab.
- **If you see session errors:**  
  - Make sure you're not running the app on multiple ports/domains.
  - Make sure you're not in incognito/private mode (unless testing).
- **If uploads fail:**  
  - Check Supabase Storage bucket permissions and policy.
  - Check file size/type limits.

---

## **How to Add a New Feature**

1. **Create a new page/component in `src/app/` or `src/app/dashboard/`.**
2. **Use `createBrowserClient` for Supabase operations.**
3. **Add any new DB columns via Supabase SQL editor and update types if needed.**
4. **Test with both a real user and a new incognito session.**
5. **Keep UI/UX consistent with Tailwind and existing design patterns.**

---

## **Where to Look for…**

- **Supabase client setup:**  
  - `src/utils/supabase.ts` (for types and helpers)
  - Directly in each page/component via `createBrowserClient`
- **Auth/session logic:**  
  - `src/app/auth/sign-in/page.tsx`, `src/app/auth/sign-up/page.tsx`
  - `src/utils/authGuard.ts`
- **Business/profile logic:**  
  - `src/app/dashboard/`
- **Prompt/review logic:**  
  - `src/app/r/[slug]/page.tsx`
- **API routes:**  
  - `src/app/api/`

---

## **Onboarding Checklist**

- [ ] Clone the repo and install dependencies.
- [ ] Set up `.env.local` with Supabase project URL and anon key.
- [ ] Run `npm run dev` and test sign-in/sign-up.
- [ ] Familiarize yourself with `@supabase/ssr` usage.
- [ ] Review the dashboard and prompt page flows.
- [ ] Read through `src/utils/supabase.ts` and `src/utils/authGuard.ts` for helper patterns.

---

**If you follow these patterns and keep Supabase client usage consistent, you'll avoid most session/auth headaches and be productive quickly!**


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Prompt Page UI Component Library

### Location
All modular, reusable UI components for prompt page modules (such as Special Offer, Emoji Sentiment, Review Platforms, etc.) are stored in:

```
src/app/dashboard/edit-prompt-page/components/
```

### What is stored here
- **Section modules** for the Universal Prompt Page and other prompt page editors, including:
  - `OfferSection.tsx`: Special Offer input module
  - `EmojiSentimentSection.tsx`: Emoji sentiment input module
  - `ReviewPlatformsSection.tsx`: Review platforms input module (platform name, URL, instructions, word count)
  - `ReviewWriteSection.tsx`: Review platforms + review writing/generation (for custom prompt pages)
  - `OfferToggle.tsx`: Simple toggle for enabling/disabling modules
  - `DisableAIGenerationSection.tsx`: Toggle for enabling/disabling the "Generate with AI" button on prompt pages
- **Shared config files** for module defaults (if needed)
- **Any future prompt page modules** (e.g., testimonials, feedback, etc.)

### How to use
- **Import the component** you need into your page or form:
  ```tsx
  import OfferSection from 'src/app/dashboard/edit-prompt-page/components/OfferSection';
  import DisableAIGenerationSection from 'src/app/components/DisableAIGenerationSection';
  ```
- **Pass in the required props** (see each component's interface for details).
- **Extend or create new modules** by following the same pattern: section header, icon, consistent styling, and modular props.

### Why this structure?
- Keeps all prompt page modules consistent, discoverable, and easy to maintain.
- Makes it easy to reuse modules across Universal, custom, and business profile pages.
- Encourages modular, scalable UI development.

If you want to move these to a more global shared directory (e.g., `src/app/components/prompt-modules/`), refactor as needed and update this section.

## Universal Prompt Page: Business Defaults Fallback Logic

### How it works
- When editing or rendering a Universal Prompt Page, the app fetches both the Universal Prompt Page record and the associated Business Profile.
- For each field (e.g., Special Offer, Review Platforms):
  - If the Universal Prompt Page has a value (not null/empty), use it.
  - Otherwise, use the value from the Business Profile.

**Example:**
```ts
const mergedOfferEnabled = universalPage.offerEnabled ?? businessProfile.default_offer_enabled;
const mergedOfferTitle = universalPage.offerTitle || businessProfile.default_offer_title;
const mergedReviewPlatforms = universalPage.reviewPlatforms?.length
  ? universalPage.reviewPlatforms
  : businessProfile.review_platforms;
```

### Editing & Saving
- The Universal Prompt Page editor pre-fills fields with merged values (universal override if present, otherwise business default).
- When a user changes a field, it is saved as an override in the Universal Prompt Page record.
- If a field is cleared, you can either:
  - Remove the override (so it falls back to business default), or
  - Save as null/empty to explicitly override.

### Public Prompt Page Rendering
- The public prompt page uses the same merge logic: show the universal value if set, otherwise show the business default.

### Benefits
- **Consistency:** New universal pages are pre-filled with business defaults, reducing setup friction.
- **Flexibility:** Users can override any field for a specific universal page.
- **Maintainability:** If the business profile changes, universal pages that haven't overridden a field will automatically reflect the new default.

### Implementation Notes
- This pattern can be used for any field: offer, review platforms, emoji sentiment, etc.
- You may want to visually indicate in the editor which fields are using business defaults vs. overridden.

### Public Prompt Page Fallback Logic
- The public prompt page (`/r/[slug]`) uses the same fallback logic as the editor:
  - For each field (Special Offer, Review Platforms, Emoji Sentiment, etc.), it uses the value from the prompt page if set, otherwise falls back to the business profile default.
- This ensures that:
  - New prompt pages always display up-to-date business defaults unless/until a value is explicitly overridden in the prompt page.
  - If the business profile is updated, all public prompt pages that haven't overridden a field will automatically reflect the new default.

---

## Falling Star Animation & Offer Banner Functionality

### Falling Star Animation
- **Purpose:** Adds a celebratory animation (stars, hearts, rainbows, etc.) that falls from the top of the public prompt page.
- **How to Enable:**
  - In the Universal Prompt Page editor, toggle the "Falling star animation" section ON and select an icon.
  - The animation is enabled if an icon is selected (the toggle reflects this state).
  - The selected icon will be saved as `falling_icon` in the database.
- **How it Works:**
  - On the public prompt page, if `falling_icon` is set, the animation will run.
  - If **Emoji Sentiment** is also enabled, the animation will only run after a user selects a positive sentiment ("Excellent" or "Satisfied").
  - If Emoji Sentiment is **not** enabled, the animation runs immediately on page load.
- **Supported Icons:** Stars, hearts, smiles, thumbs up, bolts, rainbows, coffee, wrenches, wine glass, barbell, flower, peace, etc.
- **Persistence:** The toggle and icon selection are synced with the presence of `falling_icon` in the database. If you turn the toggle off, the icon is cleared and the animation is disabled.

### Offer Banner (Special Offer)
- **Purpose:** Displays a slim, dismissible banner at the top of the public prompt page to promote a special offer, code, or link.
- **How to Enable:**
  - In the Universal Prompt Page editor, toggle the "Special Offer" section ON and fill in the title, message, and (optionally) a Learn More URL.
  - The banner is enabled if the toggle is ON and a title/message are provided.
- **How it Works:**
  - The banner appears at the very top of the public prompt page, above all other content.
  - It includes an icon, the offer title, a short message, and a "Learn More" button if a URL is provided.
  - Users can dismiss the banner (it will not reappear until the page is reloaded).
- **Persistence:** The offer settings are saved to the database and reflected on the public page after save.

---

#### DisableAIGenerationSection

**Props:**
- `enabled: boolean` — Whether the AI button is enabled (shown to customers)
- `onToggle: () => void` — Callback to toggle the enabled state

**Purpose:**
- Shows a styled toggle switch and description for enabling/disabling the "Generate with AI" button on the public prompt page.
- Used in both Universal and custom prompt page editors.

**Example:**
```tsx
<DisableAIGenerationSection enabled={aiButtonEnabled} onToggle={() => setAiButtonEnabled(v => !v)} />
```

---

## Global Loading Spinner and AppLoader

To ensure a consistent loading experience across the app, use the `AppLoader` component for all loading states. This component displays a centered animated five-star spinner (default size 48) and the text "Loading…" in white, making it suitable for both light and dark backgrounds.

### Usage

Import and use `AppLoader` wherever you need a loading state:

```tsx
import AppLoader from '@/app/components/AppLoader';

// ...
if (isLoading) {
  return <AppLoader />;
}
```

### Details
- The spinner is implemented by `FiveStarSpinner` with a default size of 48.
- The loading text is always white and centered below the spinner.
- This ensures all loading states look and feel the same throughout the app.

If you need a custom loading message or style, consider extending `AppLoader` or passing props as needed.

---

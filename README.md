This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

Here’s a **cheat sheet** for a new AI or human developer joining your project, based on your current codebase and recent issues:

---

# **PromptReviews Project Cheat Sheet**

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
  - Make sure you’re not running the app on multiple ports/domains.
  - Make sure you’re not in incognito/private mode (unless testing).
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

**If you follow these patterns and keep Supabase client usage consistent, you’ll avoid most session/auth headaches and be productive quickly!**


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

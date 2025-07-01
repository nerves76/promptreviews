# PromptReviews Project

This is a vanilla JavaScript project for creating and managing prompt pages that account holders can use to collect reviews. The project uses vanilla JavaScript, HTML, and CSS, with no framework dependencies.

Public url is https://app.promptpages.app

It's main function is to create landing pages "prompt pages" that account holders can use to collect reviews. There are different kinds of prompt pages with different purposes.

This project is currently focused on developing a standalone widget for collecting reviews. The widget is being developed as a vanilla JavaScript component first, before being integrated into the larger Next.js application.

## Recent Updates (Latest)

### Team Management Feature (January 2025)
- **Plan-Based User Limits**: Added team management with plan-based user limits (Grower: 1 user, Builder: 3 users, Maven: 5 users)
- **Account Invitations System**: Implemented invitation system with email-based team member invitations
- **Team Page UI**: Created comprehensive team management page with members list, invitations, and role management
- **Database Schema**: Added `max_users` to accounts table and `account_invitations` table with RLS policies
- **API Routes**: Created `/api/team/members`, `/api/team/invitations`, and `/api/team/invite` endpoints
- **User Display**: Team members display shows both account owner name (first_name + last_name) and business name
- **Role Management**: Support for 'owner' and 'member' roles with proper permissions
- **Invitation Management**: Send, view, and cancel invitations with expiration handling
- **Plan Enforcement**: Automatic user limit enforcement based on account plan

### Sticky Style Button for Prompt Page Owners (January 2025)
- **Added Sticky Style Button**: Logged-in users who own a prompt page now see a sticky "Style" button in the top-left corner
- **Real-time Style Editing**: Users can edit their prompt page styles directly from the public page and see changes immediately
- **Owner-Only Visibility**: Button only appears for authenticated users who own the prompt page (account_id match)
- **Consistent Design**: Button matches the existing save button styling and positioning
- **Modal Integration**: Reuses existing StyleModalPage component for consistent editing experience
- **Responsive Design**: Button adapts to mobile screens and adjusts position when offer banner is visible

### Sign-Up Flow & Development Server Fixes (January 2025)
- **Fixed FiveStarSpinner Positioning**: Moved spinner from vertically centered to positioned closer to navigation (48 units from top) for better UX
- **Fixed Development Server Issues**: Resolved port 3001 conflicts and Sentry integration errors
- **Fixed Track-Event API**: Added missing cookie options and proper service client configuration
- **Fixed Async Params**: Updated prompt-pages API to properly await params in Next.js 15
- **Improved Local Development**: Enhanced auto-signin feature using force-signin API for reliable local development
- **Database Cleanup**: Added comprehensive test data cleanup for development environment

### Sign-Up Flow Improvements
- **Enhanced Auto-Signin for Local Development**: Users are automatically signed in after account creation using the force-signin API when on localhost
- **Email Confirmation Bypass**: Local development bypasses email confirmation for faster testing using server-side email confirmation
- **Proper Redirect Flow**: Users are redirected to dashboard after successful sign-up with success message
- **Error Handling**: Enhanced error handling for duplicate account creation attempts and sign-in failures
- **Session Management**: Improved session establishment and persistence with proper email confirmation handling

### API Fixes & Improvements
- **Track-Event API**: Fixed cookie options and service client configuration for anonymous events
- **Prompt-Pages API**: Fixed async params handling for Next.js 15 compatibility
- **Service Client**: Proper configuration with cookie options for server-side operations
- **Error Logging**: Enhanced logging for debugging API issues

### UI/UX Improvements
- **FiveStarSpinner Positioning**: Positioned closer to navigation instead of vertically centered
- **Loading States**: Improved loading experience across the application
- **Development Server**: Stable development environment with proper error handling

### Technical Infrastructure
- **Port Management**: Automatic port conflict resolution for development server
- **Sentry Integration**: Properly disabled for local development to reduce noise
- **Database Schema**: All 73 migrations applied and up to date
- **Test Data Management**: Comprehensive cleanup scripts for development environment

### Persistent Onboarding Tasks System
- **Database-Backed Task Tracking**: Implemented `onboarding_tasks` table with RLS policies for secure task completion tracking
- **Automatic Task Completion**: Tasks automatically complete when users visit key pages (business profile, style, create prompt page)
- **Persistent Progress**: Onboarding checklist progress now persists across sessions and page refreshes
- **Utility Functions**: Created `onboardingTasks.ts` utility for database operations with proper error handling
- **Enhanced UX**: GettingStarted component now fetches and displays real-time task completion status
- **Multi-User Support**: Task tracking works with the existing account/user architecture

### JWT Signature Issues & Authentication Fixes
- **Fixed JWT Signature Errors**: Resolved persistent JWT signature errors in `/api/create-account` endpoint by switching from anon key to service key
- **Fixed Auth Session Missing**: Users now get proper sessions after signup in local development with auto-signin feature
- **Fixed Admin API Errors**: Resolved 400 Bad Request errors in admin status checking by correcting column name usage
- **Updated Auth Guard**: Fixed admin status checking in auth guard to use correct database column names
- **Improved Error Handling**: Added comprehensive error handling and logging for authentication flows

### User Onboarding Flow Improvements
- **Fixed Welcome Popup Logic**: Welcome popup now only shows on the create-business page for new users, not on the dashboard
- **Fixed Business Creation Redirect**: Business creation now properly redirects to dashboard after successful creation
- **Fixed Plan Selection Modal**: Pricing modal now automatically shows for new users who have created a business but haven't selected a plan yet
- **Added Starfall Celebration**: New users see a celebratory starfall animation after selecting their plan
- **Enhanced User Experience**: Complete end-to-end flow from signup to full dashboard access

### Complete User Flow
1. **Sign Up**: User creates account with email/password
2. **Auto-Signin**: In local development, user is automatically signed in after account creation
3. **Create Business**: User lands on create-business page with welcome popup
4. **Dashboard Redirect**: After business creation, user is redirected to dashboard
5. **Plan Selection**: Pricing modal automatically appears for new users
6. **Celebration**: Starfall animation plays after plan selection
7. **Full Access**: User can now access all dashboard features

### Onboarding Tasks System Architecture

#### **Database Schema**
```sql
-- onboarding_tasks table
- id (UUID, PK): Primary key
- user_id (UUID, FK): References auth.users(id)
- task_key (TEXT): Unique identifier for each task
- completed (BOOLEAN): Task completion status
- completed_at (TIMESTAMP): When task was completed
- created_at, updated_at: Timestamps
```

#### **Task Keys & Automatic Completion**
- `business_profile_created`: Completes when user visits `/dashboard/business-profile`
- `style_configured`: Completes when user visits `/dashboard/style`
- `prompt_page_created`: Completes when user visits `/dashboard/create-prompt-page`
- `widget_configured`: Completes when user visits `/dashboard/widget`
- `contacts_uploaded`: Completes when user visits `/dashboard/contacts`

#### **Technical Implementation**
- **RLS Policies**: Secure access control ensuring users can only see their own tasks
- **Utility Functions**: `getOnboardingTasks()`, `markTaskComplete()`, `initializeUserTasks()`
- **Error Handling**: Graceful fallback to local state if database operations fail
- **Loading States**: Proper loading indicators during task status fetching
- **Real-time Updates**: Task completion status updates immediately in UI

#### **Component Integration**
- **GettingStarted Component**: Fetches and displays task completion from database
- **Dashboard Pages**: Pass user ID to enable automatic task completion
- **Error Recovery**: Falls back to local state if database is unavailable
- **Performance**: Efficient database queries with proper indexing

### Technical Improvements
- **Service Key Usage**: API endpoints now use Supabase service key for privileged operations
- **Database Consistency**: Fixed column name mismatches between code and database schema
- **Error Logging**: Enhanced logging for debugging authentication and database issues
- **Session Management**: Improved session handling across the application
- **RLS Policies**: Proper Row Level Security policies for multi-user account system

## Signup Flow & Multi-User Architecture

### Complete Signup Process

The signup flow is designed to support both single-user accounts and future multi-user/multi-business functionality. Here's the complete process:

#### 1. **User Registration** (`/auth/sign-up`)
- User enters email, password, first name, and last name
- Frontend validates input and calls Supabase Auth to create user
- On successful registration, user is automatically signed in (local development)
- Frontend calls `/api/create-account` to create account record

#### 2. **Account Creation** (`/api/create-account`)
- **Purpose**: Creates the account record and account_users relationship
- **Service Key Usage**: Uses Supabase service key to bypass RLS for privileged operations
- **Data Structure**: Creates account with proper UUID references to `auth.users(id)`
- **Multi-User Ready**: Sets up account_users record with 'owner' role for future multi-user support

#### 3. **Auth Callback** (`/auth/callback`)
- **Purpose**: Handles OAuth redirects and ensures account exists
- **Account Check**: Verifies account exists, creates if missing
- **Error Handling**: Gracefully handles JWT signature errors and missing accounts
- **Service Key Usage**: Uses service key for all database operations

#### 4. **Business Creation** (`/dashboard/create-business`)
- **Welcome Popup**: Shows welcome message for new users
- **Business Form**: User creates their first business profile
- **Account Linking**: Business is linked to user's account via `account_id`
- **Redirect**: After creation, user is redirected to dashboard

#### 5. **Plan Selection**
- **Automatic Trigger**: Pricing modal appears for new users who haven't selected a plan
- **Plan Assignment**: User selects plan (grower, starter, etc.)
- **Celebration**: Starfall animation plays after plan selection
- **Account Update**: Plan information is saved to accounts table

### Database Architecture for Multi-User/Multi-Business Support

#### **Accounts Table**
```sql
- id (UUID, PK, references auth.users(id)): Primary key, also foreign key to auth.users
- user_id (UUID): The user who created the account (for initial ownership)
- email, first_name, last_name: User information
- plan, trial_start, trial_end: Subscription and trial information
- has_seen_welcome, business_name: User experience flags
- stripe_customer_id, stripe_subscription_id: Payment integration
- created_at, updated_at: Timestamps
```

#### **Account_Users Table** (Multi-User Support)
```sql
- id (UUID, PK): Primary key
- account_id (UUID, FK): References accounts(id)
- user_id (UUID, FK): References auth.users(id)
- role (TEXT): 'owner', 'member', 'admin', etc.
- created_at, updated_at: Timestamps
```

#### **Businesses Table** (Multi-Business Support)
```sql
- id (UUID, PK): Primary key
- account_id (UUID, FK): References accounts(id) - enables multiple businesses per account
- name, description, website: Business information
- created_at, updated_at: Timestamps
```

### Key Technical Implementation Details

#### **JWT Signature Error Resolution**
- **Problem**: Local Supabase development had JWT signature mismatches
- **Solution**: Use service key for all API operations instead of anon key
- **Implementation**: All `/api/*` routes use `createServerClient` with service key
- **Benefits**: Bypasses RLS for privileged operations, ensures consistent authentication

#### **Session Management**
- **Auto-Signin**: In local development, users are automatically signed in after registration
- **Session Persistence**: Proper session handling across page refreshes and redirects
- **Error Recovery**: Graceful handling of session expiration and JWT errors

#### **RLS (Row Level Security) Policies**
- **Accounts**: Users can only access their own account records
- **Account_Users**: Users can only access account_users records for accounts they belong to
- **Businesses**: Users can only access businesses linked to their account
- **Multi-User Ready**: Policies support future role-based access control

#### **Error Handling & Logging**
- **Comprehensive Logging**: All API endpoints include detailed error logging
- **Graceful Degradation**: System continues to function even if some operations fail
- **User Feedback**: Clear error messages and loading states for better UX

### Future Multi-User/Multi-Business Features

The current architecture is designed to support:

#### **Multiple Users Per Account**
- Account owners can invite team members
- Role-based permissions (owner, admin, member)
- Shared access to businesses and prompt pages
- Team collaboration features

#### **Multiple Businesses Per Account**
- Users can create and manage multiple business profiles
- Each business can have its own prompt pages and widgets
- Business-specific settings and branding
- Cross-business analytics and reporting

#### **Account Management**
- Account-level billing and subscription management
- User invitation and removal workflows
- Account settings and preferences
- Audit logs for account activities

### Testing the Signup Flow

#### **Manual Testing**
1. Visit `/auth/sign-up`
2. Create account with valid email/password
3. Verify automatic redirect to create-business page
4. Create business profile
5. Verify redirect to dashboard
6. Confirm plan selection modal appears
7. Select plan and verify starfall animation

#### **Automated Testing**
- Test scripts available for end-to-end signup flow verification
- Database cleanup scripts for testing
- Admin tools for user management and cleanup

### Common Issues & Solutions

#### **JWT Signature Errors**
- **Symptom**: "JWSError JWSInvalidSignature" in logs
- **Cause**: Mismatch between environment variables and Supabase configuration
- **Solution**: Ensure consistent use of service key in API routes

#### **Auth Session Missing**
- **Symptom**: "AuthSessionMissingError" after signup
- **Cause**: Session not properly established or expired
- **Solution**: Check auth callback and session handling logic

#### **Business Creation Failures**
- **Symptom**: Business creation returns 500 error
- **Cause**: RLS policies or foreign key constraints
- **Solution**: Verify account_id linking and RLS policy configuration

#### **Plan Selection Not Showing**
- **Symptom**: Pricing modal doesn't appear for new users
- **Cause**: Logic checking for plan selection status
- **Solution**: Verify plan selection detection logic in dashboard

## Development Strategy

### Phase 1: Widget Development (Current)
- Focus on widget design and functionality
- Develop as a standalone vanilla JavaScript component
- Test and refine user experience
- Ensure cross-browser compatibility
- Optimize performance and loading times

### Phase 2: Integration (Future)
- Integrate widget with Next.js application
- Connect to backend services
- Implement authentication and data persistence
- Add analytics and monitoring

## Widget Development

The widget is currently being developed as a standalone component in the `public/widgets/multi/` directory:

```
public/widgets/multi/
├── widget-embed.js    # Main widget JavaScript (with responsive fallback)
├── widget-embed.min.js # Minified version for production
├── widget-embed-working.js # Working version with responsive fixes
├── multi-widget.css   # Widget styles
├── test-responsive.html # Test page for responsive behavior
└── working-test.html  # Test page with debug console
```

To test the widget:
1. Open `public/widgets/multi/test-responsive.html` in your browser
2. Make changes to the JavaScript and CSS files
3. Refresh to see your changes
4. Test responsive behavior by resizing the browser window

No build step is required during widget development.

## Widget Responsiveness

The multi-widget now has proper responsive behavior with a dual system:

### Primary: Swiper.js Carousel
- **Desktop (1024px+)**: 3 cards visible with navigation
- **Tablet (768px-1023px)**: 2 cards visible with navigation  
- **Mobile (<768px)**: 1 card visible with navigation

### Fallback: CSS Grid Layout
When Swiper.js fails to load (network issues, CDN problems), the widget falls back to a responsive CSS Grid:
- **Desktop (1024px+)**: 3 cards per row
- **Tablet (768px-1023px)**: 2 cards per row
- **Mobile (<768px)**: 1 card per row

### Key Features
- **Multiple CDN fallbacks** for Swiper.js loading reliability
- **Responsive CSS Grid** with `!important` declarations to override inline styles
- **Graceful degradation** when Swiper fails to load
- **Consistent card styling** between Swiper and Grid modes

### Testing Responsiveness
1. Visit `http://localhost:3001/widgets/multi/test-responsive.html`
2. Resize browser window to test different breakpoints
3. Check browser console for loading status
4. Test with network throttling to simulate slow connections

## Admin User Management

### Admin Delete Functionality

A comprehensive admin user deletion system has been implemented to properly clean up all user-related data when users are deleted. This prevents orphaned data that can cause conflicts when users are recreated.

#### Features
- **Complete Data Cleanup**: Removes all user-related data across all database tables
- **Admin-Only Access**: Requires admin privileges to use
- **Safe Deletion Order**: Follows proper foreign key constraint order
- **Detailed Logging**: Provides comprehensive cleanup results
- **User-Friendly Interface**: Web-based admin panel for user management

#### Files Created
- `src/utils/adminDelete.ts` - Core deletion utility functions
- `src/app/api/admin/delete-user/route.ts` - Admin-only API endpoint
- `src/app/admin/page.tsx` - Admin user management interface
- `test-admin-delete.js` - Test script for verification

#### Cleanup Process
The deletion process follows this order to respect foreign key constraints:

1. **Child Tables** (widgets, reviews, analytics, etc.)
   - Analytics events
   - AI usage records
   - Widget reviews
   - Review submissions
   - Contacts
   - Prompt pages
   - Widgets
   - Businesses

2. **Junction Tables** (account_users)

3. **Parent Tables** (accounts, admins)

4. **Auth User** (Supabase Auth)

#### Usage
1. Navigate to `/admin` (admin privileges required)
2. Search for user by email address
3. Review user information
4. Click "Delete User & All Data"
5. Confirm deletion in modal
6. View detailed cleanup results

#### Testing
Run the test script to verify functionality:
```bash
node test-admin-delete.js <test-email>
```

This will create a test user with sample data, delete them using the admin API, and verify complete cleanup.

## Testing & Development Tools

### Test Scripts
- **Signup Flow Testing**: `test-signup-flow.js` - Tests complete user signup, account creation, and business creation flow
- **Admin Delete Testing**: `test-admin-delete.js` - Tests admin user deletion functionality
- **Database Connection**: Various scripts for testing database connectivity and schema

### Development Environment
- **Local Supabase**: Running on port 54321 with local database
- **Next.js Dev Server**: Running on port 3001
- **Environment Variables**: Configured for local development with service keys

### Common Issues & Solutions
- **JWT Signature Errors**: Use service key instead of anon key for API operations
- **Auth Session Missing**: Ensure proper signin flow and session management
- **Admin API 400 Errors**: Check column names match database schema
- **Business Creation Issues**: Verify RLS policies and foreign key constraints

---

# **PromptReviews Project Cheat Sheet**

This project uses environment variables for configuration. Ensure all required environment variables are set in your deployment platform.

Keys include supabase, Stripe, Resend

## **Project Overview**

- **Stack:** Vanilla JavaScript, HTML, CSS, Supabase (DB, Auth, Storage), Tailwind CSS.
- **Purpose:** Business onboarding, authentication, and review management platform with custom prompt pages, AI-generated reviews, and media uploads.

## **Documentation**

- [Sign-Up Process & Multi-User System](SIGNUP_AND_MULTI_USER_DOCUMENTATION.md) - Comprehensive guide to authentication and multi-user account management
- [Database Schema](databaseschema.md) - Complete database structure and relationships
- [Authentication Cleanup](AUTHENTICATION_CLEANUP.md) - Security standardization and API authentication patterns
- [Widget System](WIDGET_SYSTEM_DOCUMENTATION.md) - Widget development and customization guide
- [Widget Dashboard](WIDGET_DASHBOARD_DOCUMENTATION.md) - Dashboard widget management interface
- [Troubleshooting](TROUBLESHOOTING_DOCUMENTATION.md) - Common issues and solutions
- [User Documentation](USER_DOCUMENTATION.md) - End-user guide and features

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

## **Updating Widget Styles (Tailwind CSS Build)**

**Widget CSS Management:**

- All widget styles are managed directly in `public/widget.css`
- This file is served directly to users and embedded sites
- To modify widget styles:
  1. Edit `public/widget.css` directly
  2. Test your changes locally
  3. Commit and push the changes
  4. Deploy to update the live widget styles

Note: The widget CSS is now managed manually to ensure reliable updates and direct control over the final output.

**How the build works (now automated):**

- The `package.json` build script runs:
  ```sh
  npx tailwindcss -i ./src/widget-embed/widget.css -o ./public/widget.css --minify
  ```
  as part of every Vercel deployment.
- **You do NOT need to run this command manually before pushing.**
- Vercel will always generate the latest CSS from your source on every deploy.
- A safelist is included in `src/widget-embed/widget.css` to ensure all Tailwind utility classes used in widget JSX are present in the final CSS, even if not detected by Tailwind's scan.

**How to update widget styles:**

1. Edit your styles in `src/widget-embed/widget.css` (and/or your widget JSX).
2. Commit and push your changes.
3. Vercel will build and deploy the correct, up-to-date CSS automatically.

**Summary:**
- No more manual CSS builds needed.
- No more missing classes in production.
- Just edit, commit, and push—Vercel takes care of the rest.

For more details, see the safelist comment in `src/widget-embed/widget.css`.

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
- **If widget responsiveness breaks:**
  - Check browser console for Swiper loading errors
  - Test with network throttling to simulate slow connections
  - Verify CSS media queries are applying correctly
  - Test on different screen sizes using browser dev tools

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
- [ ] Set up environment variables in your deployment platform.
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
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

You can start editing the page by modifying the HTML, CSS, and JavaScript files in the project. The page auto-updates as you edit the files.

## Project Structure

- `public/` - Contains all static assets and widget files
  - `widgets/` - Contains the widget implementation files
    - `multi/` - Multi-widget implementation
      - `widget-embed.js` - Main widget JavaScript
      - `widget-embed.css` - Widget styles
      - `multi.html` - Example implementation
- `src/` - Source files for the project
  - `widget-embed/` - Widget source files
    - `widget.css` - Source CSS for widgets
    - `widget.js` - Source JavaScript for widgets

## Development

The project uses a simple development server that serves static files. No framework or build step is required for development.

To modify widget styles:
1. Edit the CSS files directly
2. Test your changes locally
3. Commit and push the changes
4. Deploy to update the live widget styles

## Learn More

To learn more about the technologies used in this project:

- [Supabase Documentation](https://supabase.com/docs) - learn about Supabase features and API
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - learn about Tailwind CSS features
- [Vanilla JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript) - learn about JavaScript

## Deployment

The project can be deployed to any static hosting service that supports serving static files. Some recommended options:

- [Vercel](https://vercel.com) - Simple deployment with automatic HTTPS
- [Netlify](https://netlify.com) - Great for static sites with form handling
- [GitHub Pages](https://pages.github.com) - Free hosting for static sites

To deploy:
1. Build your static files
2. Upload to your chosen hosting service
3. Configure your domain and SSL certificate

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
  import OfferSection from "src/app/dashboard/edit-prompt-page/components/OfferSection";
  import DisableAIGenerationSection from "src/app/components/DisableAIGenerationSection";
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
const mergedOfferEnabled =
  universalPage.offerEnabled ?? businessProfile.default_offer_enabled;
const mergedOfferTitle =
  universalPage.offerTitle || businessProfile.default_offer_title;
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
  - In any prompt page editor, toggle the "Falling star animation" section ON and select an icon.
  - The animation is enabled if an icon is selected (the toggle reflects this state).
  - The selected icon will be saved as `falling_icon` in the database.
- **How it Works:**
  - On the public prompt page, if `falling_icon` is set, the animation will run.
  - If **Emoji Sentiment** is also enabled, the animation will only run after a user selects a positive sentiment ("Excellent" or "Satisfied").
  - If Emoji Sentiment is **not** enabled, the animation runs immediately when the page loads.
  - The animation creates 60 falling icons with random positions, sizes, and timing for a natural effect.

### **UI Improvements (Latest Update)**
- **Simplified Interface:** Shows only the selected icon with blue border (no grid of default icons)
- **"More Icons" Button:** Opens a modal with 50+ icons organized by category
- **Prompty Integration:** Full-height Prompty image positioned flush with module edges
- **Consistent Styling:** All icons use slate blue color (`text-slate-blue`) for brand consistency
- **Better Layout:** Toggle positioned further from heading, proper spacing and typography
- **Category Organization:** Icons organized into 8 categories for easy browsing:
  - **Nature & Weather:** Rainbows, Suns, Moons, Clouds, Snowflakes, Fire, Trees, Leaves, Flowers
  - **Food & Drinks:** Coffee, Gifts, Wine
  - **Activities & Sports:** Thumbs Up, Bicycles, Dumbbells, Trophies, Medals, Crowns
  - **Tools & Objects:** Wrenches, Anchors, Lightbulbs, Magic, Rockets, Gems
  - **Transportation:** Planes, Cars, Ships
  - **Symbols & Peace:** Peace, Globes, Flags, Shields
  - **Entertainment:** Music, Games, Cameras, Books
  - **Animals:** Cats, Dogs, Birds, Butterflies, Fish, Frogs
  - **Fantasy & Fun:** Dragons, Ghosts, Robots, Unicorns
  - **Time & Communication:** Clocks, Bells, Location markers

### **Technical Implementation**
- **Component:** `FallingStarsSection.tsx` - Reusable component used across all prompt page forms
- **Configuration:** `fallingStarsConfig.ts` - Centralized icon definitions and utilities
- **Animation:** CSS animations with JavaScript-generated random positioning
- **Database:** Stores `falling_icon` as a string key in the `prompt_pages` table
- **Consistent Usage:** Same component used in Universal, Service, Product, and Photo prompt pages

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
<DisableAIGenerationSection
  enabled={aiButtonEnabled}
  onToggle={() => setAiButtonEnabled((v) => !v)}
/>
```

---

## Global Loading Spinner and AppLoader

To ensure a consistent loading experience across the app, use the `AppLoader` component for all loading states. This component displays a centered animated five-star spinner (default size 48) and the text "Loading…" in white, making it suitable for both light and dark backgrounds.

### Usage

Import and use `AppLoader` wherever you need a loading state:

```tsx
import AppLoader from "@/app/components/AppLoader";

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

# UI/UX Styles & Component Conventions

## Where to Find Key UI Modules

- **SectionHeader:** `src/app/components/SectionHeader.tsx` — For all section headers with icon, title, and subcopy. Use this for consistent section/module headers.
- **PageCard:** `src/app/components/PageCard.tsx` — For main page/card layout, floating top-left icon, and card-level actions. Always use for dashboard and prompt page forms.
- **ReviewWriteSection:** `src/app/dashboard/edit-prompt-page/components/ReviewWriteSection.tsx` — For review platform cards, AI button, and review template fields.
- **PromptPageForm:** `src/app/components/PromptPageForm.tsx` — Main form for all prompt page types. Shows how to compose all modules and use conventions.

## Visual & Code Conventions

- **Section headers:**
  - Use `<SectionHeader icon={...} title="..." subCopy="..." />` for all major sections.
  - Title: `text-2xl font-bold text-[#1A237E]` (or override with `titleClassName` for page titles).
  - Subcopy: Left-aligned with title, `text-sm text-gray-700`.
- **Page-level icons:**
  - Use the `icon` prop on `PageCard` for a floating, breaching icon in the top-left of the card.
  - Never render the icon manually inside the form/component.
- **AI Gen Button:**
  - Use the standardized button: `inline-flex items-center px-4 py-2 border rounded font-semibold shadow text-slate-blue border-slate-blue bg-white hover:bg-slate-blue/10 transition text-sm whitespace-nowrap w-auto min-w-[180px] self-start gap-2` with `<FaMagic />`

## Recent Updates

### Admin User Management System (Latest)
- **Comprehensive User Deletion**: Created admin-only functionality to completely delete users and all associated data
- **Safety Features**: Prevents admins from deleting their own accounts
- **Database Cleanup**: Properly removes data from all related tables (widgets, reviews, businesses, contacts, etc.)
- **UI Improvements**: Fixed button styling issues (changed `bg-slateblue` to `bg-slate-blue` throughout the app)
- **API Endpoint**: `/api/admin/delete-user` with proper authentication and validation
- **Admin Interface**: User-friendly admin page at `/admin` for user management

### Authentication & Account System Fixes
- **Account ID Resolution**: Fixed issues with user-account relationships using `getAccountIdForUser` utility
- **RLS Policy Compliance**: Updated all account queries to use proper account-user relationships
- **Dashboard Stability**: Resolved "multiple rows returned" errors in account queries
- **Force Sign-in**: Local development bypass for email confirmation (development only)

## 2025-06-30: Back Button for Multi-Step Prompt Pages
- Added back button functionality to multi-step prompt page forms
- Users can now navigate from step 2 back to step 1 to modify customer/client details
- Added back button to top right action area in edit prompt page (`[slug]/page.tsx`)
- Added back button to bottom left of step 2 in `PromptPageForm.tsx` for create mode
- Product prompt pages already had back button correctly implemented
- Improves user experience by allowing easy navigation between steps
- See `src/app/dashboard/edit-prompt-page/` for details.

## 2025-06-30: Authentication Error Fixes
- Fixed "Auth session missing" errors that were preventing prompt pages from loading
- Updated `getUserOrMock` and `getSessionOrMock` functions in `src/utils/supabase.ts` to handle authentication errors gracefully
- Functions now return null user/session instead of throwing errors when no auth session exists
- Prompt pages now work properly for both authenticated and unauthenticated users
- Resolves blank page issue when visiting saved prompt pages
- Improves overall application stability and user experience
- See `src/utils/supabase.ts` for implementation details.

## 2025-06-30: Migration Enforcement System
- **Automatic Migration Checks:** Added `predev` hook that runs before `npm run dev`
- **Migration Status:** Shows clear status messages: "All migrations applied" or lists missing migrations
- **Auto-Application:** Automatically applies missing migrations when found
- **Manual Commands:** Added `npm run migrations:check` and `npm run migrations:apply`
- **Error Handling:** Graceful handling of database connection issues and CLI problems
- **Color-coded Output:** Green for success, yellow for warnings, red for errors
- **Prevents Schema Issues:** Ensures database schema is always up-to-date
- **Development Integration:** Runs automatically before development server starts
- See `scripts/check-migrations.js` for implementation details.

## 2025-06-30: Popup Conflict Modal Improvements
- Updated popup conflict modal message to be more user-friendly and clear
- Changed message to: "You can't enable Emoji Sentiment and Personalized note pop-up at the same time because that's pop-ups on top of pop-ups—which would be weird."
- Added conflict modal to `ServicePromptPageForm.tsx` (was missing)
- Conflict modal now appears in both `PromptPageForm.tsx` and `ServicePromptPageForm.tsx`
- Users get clear feedback when trying to enable conflicting popup features
- Improves user experience by explaining why certain features can't be enabled together
- See `src/app/components/PromptPageForm.tsx` and `src/app/dashboard/edit-prompt-page/[slug]/ServicePromptPageForm.tsx` for details.

## 2025-06-30
- Updated `prompt_page_type` enum in the database and codebase.
- Allowed values: 'universal', 'product', 'service', 'photo', 'event', 'video', 'employee'.
- Removed legacy values: 'custom', 'experience'.
- Updated all prompt page creation, filtering, and UI logic to use the new enum values.
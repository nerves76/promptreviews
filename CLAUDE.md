# Claude AI Assistant Context

This file provides important context for AI assistants working on the PromptReviews codebase.

## ⚠️ CRITICAL: Domain Information
- **The correct domain is promptreviews.app** (NOT .com)
- All email addresses should use @promptreviews.app
- Support email: support@promptreviews.app
- Main application URL: app.promptreviews.app

## ⚠️ IMPORTANT: Known Issues
- **Turbopack is currently broken** - DO NOT use the `--turbo` flag with Next.js dev server
- The `npm run dev` command has been modified to run WITHOUT Turbopack
- If server fails to load pages properly, ensure Turbopack is disabled

## Project Overview
PromptReviews is a review management platform that allows businesses to collect, manage, and display customer reviews through customizable widgets.

## Tech Stack

### Frontend
- **Framework:** Next.js 15.3.2 with React 19.1.0
- **Language:** TypeScript 5.8.3
- **CSS Framework:** Tailwind CSS 3.3.0
- **UI Components:** 
  - Headless UI 2.2.3
  - Radix UI components
  - Hero Icons 2.2.0
  - Lucide React icons
- **Package Manager:** npm (v0.1.0 in package.json)
- **Node Version:** 18+ required

### Backend & Infrastructure
- **Database:** Supabase (PostgreSQL with RLS)
- **Authentication:** Supabase Auth
- **File Storage:** Supabase Storage
- **Hosting:** Vercel (primary deployment platform)
- **Edge Functions:** Vercel Functions (30s max duration)
- **Cron Jobs:** Vercel Cron

## Recent Major Fixes

### Widget Page Refresh Issue (2024)
**Problem:** Users were losing work due to unexpected page refreshes on `/dashboard/widget`

**Solution Implemented:**
1. Removed duplicate `fetchWidgets()` calls in widget CRUD operations
2. Isolated auth token refresh events to prevent UI re-renders
3. Added smart autosave with localStorage persistence
4. Implemented visual indicators for character limit warnings
5. Created refresh prevention monitoring system

**Key Files:**
- `/src/app/dashboard/widget/components/ReviewManagementModal.tsx` - Has autosave logic
- `/src/auth/context/CoreAuthContext.tsx` - Token refresh isolation
- `/docs/WIDGET_REFRESH_FIX.md` - Detailed documentation

## Third-Party Services

### Payment Processing
- **Stripe:** Full payment integration
  - Checkout sessions for new subscriptions
  - Portal sessions for billing management
  - Webhook handling for subscription events
  - Plans: grower, builder, maven
  - Billing sync with retry logic

### AI & Content Generation
- **OpenAI API:** GPT-4 for review generation
- AI-powered features:
  - Review request generation
  - Grammar fixing
  - Service description generation
  - Review response generation

### Email Services
- **Resend:** Transactional email service
- **Mailgun:** Alternative email service (via mailgun.js)
- Email templates stored in database

### Analytics & Monitoring
- **Sentry:** Error tracking and performance monitoring
  - Client and server-side tracking
  - Session replay (10% sampling)
  - Release tracking
  - Development mode suppression via DISABLE_SENTRY
- **Google Analytics 4:** User behavior tracking
  - Event tracking for all major interactions
  - Custom events and parameters

### Other Integrations
- **Google OAuth:** For Google Business Profile integration
- **QR Code Generation:** Using qrcode library
- **Image Compression:** browser-image-compression
- **PDF Generation:** jspdf

## Architecture Notes

### Authentication
- Using Supabase for auth
- Token refreshes every ~55 minutes
- Multiple auth contexts: CoreAuthContext, AccountContext, BusinessContext
- Auth state changes should be carefully isolated to prevent cascading updates

### Widget System
- Three widget types: multi, single, photo
- Max 250 characters for review content (but autosave preserves full text)
- Widgets are account-scoped, not user-scoped
- Widget data fetching uses `useWidgets` hook

### State Management
- React Context for global state (auth, account, business)
- localStorage for temporary form data and autosave
- Supabase for persistent data

## Common Pitfalls to Avoid

1. **Don't call fetchWidgets() after CRUD operations** - The operations handle it internally
2. **Be careful with auth event handlers** - TOKEN_REFRESHED events shouldn't trigger UI updates
3. **Always check for existing patterns** - The codebase has established patterns for common operations
4. **Character limits are UI-only** - Backend may accept longer text, handle gracefully

## API Structure

### Route Organization
- **Location:** `/src/app/api/` (Next.js 15 App Router pattern)
- **File Convention:** `route.ts` files define API endpoints
- **Authentication:** Most routes check session via Supabase
- **Common Patterns:**
  - GET/POST/PUT/DELETE methods exported from route.ts
  - Supabase service client for bypassing RLS when needed
  - Error handling with try/catch blocks
  - CORS headers handled by Next.js

### Key API Categories
- `/api/auth/` - Authentication endpoints
- `/api/stripe-webhook/` - Stripe webhook handling
- `/api/widgets/` - Widget CRUD operations
- `/api/businesses/` - Business management
- `/api/team/` - Team invitation system
- `/api/admin/` - Admin-only endpoints
- `/api/cron/` - Scheduled task endpoints
- `/api/ai/` - AI generation endpoints

## Environment Variables

### Required Variables
```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe (Required for payments)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Email (Required)
RESEND_API_KEY=

# AI (Required for AI features)
OPENAI_API_KEY=

# Google OAuth (Optional - for GBP integration)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# Monitoring (Optional but recommended)
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_GA_TRACKING_ID=

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3002

# Development
DISABLE_SENTRY=true  # For local dev
CRON_SECRET_TOKEN=    # For cron jobs
```

## Development Commands

```bash
# Start development server
npm run dev                 # Port 3002 with Sentry disabled (DO NOT USE --turbo flag)
npm run dev:fast           # With Turbopack (CURRENTLY BROKEN - DO NOT USE)
npm run dev:debug          # With Sentry enabled

# Build & Deploy
npm run build              # Production build
npm run build:widget       # Build widget scripts
npm run watch:widget       # Watch widget changes

# Database
npm run migrations:check   # Check migration status
npm run migrations:apply   # Apply migrations
npx supabase db reset      # Reset local DB

# Testing & Debugging
npm run lint               # Run linter
npm run test:auth         # Test auth flow
npm run performance:test  # Performance testing

# Cleanup
npm run cleanup           # Clear Next.js cache
```

## Database Schema Notes

### Key Tables
- `accounts` - Business accounts
- `account_users` - User-account relationships
- `widgets` - Widget configurations
- `widget_reviews` - Reviews displayed in widgets
- `review_submissions` - Customer-submitted reviews

### RLS Policies
- Most tables use Row Level Security
- Policies are account-based, not user-based
- Admin users have special permissions

## Testing Approach

When testing fixes:
1. Test with character limits (especially 250+ chars)
2. Test auth token refresh (wait ~55 minutes)
3. Test with multiple accounts
4. Check browser console for warnings/errors
5. Test autosave/restore functionality

## Contact & Support

For questions about the codebase or architecture decisions, check:
1. `/docs/` directory for documentation
2. Git commit history for context
3. Comments in complex code sections

## Deployment & Hosting

### Vercel Configuration
- **Framework:** Next.js auto-detected
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Functions Timeout:** 30 seconds max
- **Deployment Branches:** main, staging
- **Cron Jobs:**
  - Trial reminders: Daily at 9 AM UTC
  - Review reminders: Monthly on 1st at 10 AM UTC

### Production URLs
- **Main App:** app.promptreviews.app
- **Development:** localhost:3002

## Component Structure

### File Organization
```
src/app/
├── components/          # Shared components
│   ├── ui/             # Basic UI components (button, card, input)
│   ├── business-info/  # Business-related components
│   ├── help/           # Help system components
│   └── prompt-features/# Prompt page features
├── dashboard/          # Dashboard pages
│   ├── widget/        # Widget management
│   ├── business-profile/
│   └── team/          # Team management
├── api/               # API routes
└── [page]/           # Public pages
```

### Component Conventions
- **Naming:** PascalCase for components (e.g., `ReviewModal.tsx`)
- **Styling:** Tailwind CSS classes, avoid inline styles
- **Types:** TypeScript interfaces for all props
- **Hooks:** Custom hooks in `hooks/` folders
- **Utils:** Utility functions in `utils/` folders

### Common Component Patterns
```typescript
// Component with TypeScript
interface ComponentProps {
  data: DataType;
  onAction?: (id: string) => void;
}

export function Component({ data, onAction }: ComponentProps) {
  // Implementation
}
```

## Error Handling & Testing

### Error Handling
- **Sentry Integration:** Automatic error tracking
- **Error Boundaries:** React Error Boundaries for component crashes
- **API Error Format:**
  ```json
  {
    "error": "Error message",
    "details": "Additional context"
  }
  ```
- **Try-Catch Patterns:** All async operations wrapped
- **User-Friendly Messages:** Technical errors translated for users

### Testing Approach
- **Manual Testing:** Primary approach currently
- **Test Commands:**
  - `npm run test:auth` - Auth flow testing
  - `npm run performance:test` - Performance monitoring
- **Browser Testing:** Multiple viewport sizes tested
- **API Testing:** Dedicated test endpoints in `/api/test-*`

### Performance Monitoring
- **Tools:**
  - Sentry Performance Monitoring
  - Custom performance scripts in `scripts/`
  - Browser DevTools profiling
- **Key Metrics:**
  - Page load time
  - API response times
  - Bundle size optimization

## Git Workflow

### Branch Strategy
- **main:** Production branch
- **staging:** Staging environment
- **Feature branches:** Named descriptively

### Commit Conventions
- Clear, descriptive messages
- Reference issue numbers when applicable
- Format: `type: description` (e.g., `fix: widget refresh issue`)

## AI Assistant Guidelines

When working on this codebase:
1. **Read before writing** - Always read existing code first
2. **Follow patterns** - Match existing code style and patterns
3. **Test thoroughly** - Consider edge cases and user experience
4. **Document changes** - Update relevant documentation
5. **Preserve user data** - Never implement changes that could lose user input
6. **Monitor performance** - Watch for unnecessary re-renders or API calls
7. **Check migrations** - Always verify database migrations are in sync
8. **Use existing utilities** - Leverage existing helper functions and hooks

## Database Migration Rules

**ALWAYS follow proper migration workflow:**
1. **Use correct timestamps** - Migration files must use actual creation date/time (YYYYMMDDHHMMSS format)
2. **Check migration status** - Run `npx supabase migration list` before making changes
3. **Never bypass the system** - Don't run SQL directly in production or use repair commands as first solution
4. **Fix sequencing properly** - If migrations are out of order, rename them to correct timestamps
5. **Test locally first** - Run `npx supabase db reset --local` to verify migrations work
6. **Push through system** - Use `npx supabase db push` to apply to remote
7. **Keep environments in sync** - Migrations ensure local and remote databases match

**Common issues:**
- If a migration is "out of sequence" (created later but named earlier), rename it to reflect actual creation time
- Storage bucket policies require special handling - use DO blocks with error handling
- Never suggest manual SQL execution in production dashboard as a first solution

## Recent Issues Log

### 2025-08 - Automatic Page Refreshes (Timer-based)
- **Issue:** All pages refresh automatically on a timer (~55 minutes)
- **Symptoms:** Page reloads without user interaction, happens across all dashboard pages
- **Root Cause:** Under investigation - likely related to auth token refresh cycle
- **Status:** ACTIVE ISSUE - Debugging tools deployed
- **Debugging:** RefreshDebugger component added to track source
- **Console Commands:**
  - `refreshDebugReport()` - Show suspicious events
  - `clearRefreshDebug()` - Clear event history  
  - `refreshReport()` - Show global refresh monitor
- **Workaround:** Save work frequently, autosave is active on most forms

### 2024 - Widget Page Refreshes
- **Issue:** Form data loss, PageCard flickering
- **Root Cause:** Duplicate fetches, token refresh side effects
- **Status:** RESOLVED
- **Documentation:** `/docs/WIDGET_REFRESH_FIX.md`
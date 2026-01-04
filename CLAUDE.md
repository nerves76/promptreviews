# Claude AI Assistant Context

This file provides important context for AI assistants working on the PromptReviews codebase.

## ⚠️ CRITICAL: Domain Information
- **The correct domain is promptreviews.app** (NOT .com)
- All email addresses should use @promptreviews.app
- Support email: support@promptreviews.app
- Main application URL: app.promptreviews.app

## ⚠️ CRITICAL: Product Name
- **The product name is "Prompt Reviews" (two words)**
- ✅ "Prompt Reviews", "Prompt Reviews app"
- ❌ "PromptReviews", "promptreviews", "Prompt reviews"
- Exception: Domain/URLs use `promptreviews` (no space) - e.g., promptreviews.app
- Exception: Code variables/identifiers can use `PromptReviews` or `promptReviews`

## ⚠️ IMPORTANT: Copy & Content Conventions
- **All UI copy must use sentence case** (only capitalize the first letter)
  - ✅ "Your balance", "Transaction history", "How credits work"
  - ❌ "Your Balance", "Transaction History", "How Credits Work"
- This applies to: headings, button labels, menu items, form labels, etc.
- Exceptions: proper nouns, acronyms, product names (e.g., "Local Ranking Grid")

## ⚠️ CRITICAL: Icon System
**NEVER guess icon names.** Only use icons from the `IconName` type in `/src/components/Icon.tsx`.

### Usage
```tsx
import Icon, { IconName } from "@/components/Icon";

<Icon name="FaStar" size={16} className="text-gray-500" />
```

### Available Icons (commonly used)
```
FaCheck, FaCheckCircle, FaTimes, FaPlus, FaMinus, FaEdit, FaTrash,
FaStar, FaRegStar, FaHeart, FaThumbsUp, FaSmile, FaFrown, FaMeh,
FaUser, FaUsers, FaUserCircle, FaUserPlus,
FaCog, FaWrench, FaTools, FaKey, FaLock, FaUnlock, FaShieldAlt,
FaSearch, FaFilter, FaEye, FaEyeSlash,
FaArrowLeft, FaArrowRight, FaChevronDown, FaChevronUp, FaChevronLeft, FaChevronRight,
FaCalendarAlt, FaClock, FaBell,
FaEnvelope, FaPhone, FaMobile, FaGlobe, FaLink, FaShare,
FaImage, FaCamera, FaVideo, FaUpload, FaFileAlt,
FaCreditCard, FaCoins, FaWallet, FaGift,
FaStore, FaBuilding, FaBriefcase, FaMapMarker,
FaChartLine, FaRocket, FaTrophy, FaLightbulb,
FaInfoCircle, FaQuestionCircle, FaExclamationTriangle,
FaSpinner, FaRedo, FaCopy, FaSave, FaBookmark,
FaGoogle, FaFacebook, FaLinkedin, FaYelp, FaTripadvisor
```

### Icons that DO NOT exist (common mistakes)
```
❌ FaHistory (use FaClock)
❌ FaSync (use FaRedo)
❌ FaUndo (use FaRedo)
❌ FaShoppingCart (use FaCreditCard)
❌ FaExchangeAlt (use FaCoins)
❌ FaBox (use FaBoxOpen)
❌ FaClose (use FaTimes)
❌ FaWarning (use FaExclamationTriangle)
```

### How to verify an icon exists
```bash
grep "FaIconName" src/components/Icon.tsx
```

## ⚠️ IMPORTANT: Brand Colors & Guidelines

**Reference:** Full brand guidelines available at `/admin/brand-guidelines` (admin only)

### Simplified Color Palette
| Purpose | Hex | Tailwind Class |
|---------|-----|----------------|
| **Primary** | `#2E4A7D` | `slate-blue` |
| **Gold (stars only)** | `#FFD700` | `brand-gold` |
| **Success** | `#16a34a` | `green-600` |
| **Error** | `#dc2626` | `red-600` |
| **Warning** | `#f59e0b` | `amber-500` |
| **Info** | `#3b82f6` | `blue-500` |

### App Background Gradient
```css
background: linear-gradient(to bottom, #527DE7, #7864C8, #914AAE);
```

### Text Colors (WCAG AA Compliant)
- **Headings:** `text-gray-900` (#111827)
- **Body text:** `text-gray-600` (#4b5563)
- **Muted/placeholder:** `text-gray-500` (#6b7280) - NOT gray-400
- **On gradient:** `text-white`, `text-white/90`, `text-white/70` - NOT white/50 or lower

### Rules
- ✅ Use `slate-blue` for primary buttons, links, headings
- ✅ Use opacity variants for hover (e.g., `hover:bg-slate-blue/80`)
- ✅ Use Tailwind classes, not inline hex values
- ❌ Never use `text-gray-400` for readable text (fails WCAG)
- ❌ Never use `text-white/50` or lower for readable text
- ❌ Never create new custom colors - use existing palette

## ⚠️ IMPORTANT: Modal Component

**ALWAYS use the centralized Modal component for new modals.** Located at `/src/app/(app)/components/ui/modal.tsx`.

### Usage
```tsx
import { Modal } from '@/app/(app)/components/ui/modal';
import { Button } from '@/app/(app)/components/ui/button';

<Modal isOpen={isOpen} onClose={onClose} title="Confirm action" size="md">
  <p>Are you sure you want to proceed?</p>
  <Modal.Footer>
    <Button variant="secondary" onClick={onClose}>Cancel</Button>
    <Button onClick={handleConfirm}>Confirm</Button>
  </Modal.Footer>
</Modal>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | boolean | required | Controls modal visibility |
| `onClose` | () => void | required | Called when modal should close |
| `title` | string | - | Optional title (renders in header) |
| `size` | 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| '3xl' \| '4xl' \| 'full' | 'md' | Modal width |
| `showCloseButton` | boolean | true | Show red X close button |
| `allowOverflow` | boolean | false | Allow content overflow (for dropdowns) |
| `className` | string | - | Additional classes for modal panel |

### Sub-components
- `<Modal.Header>` - Custom header section
- `<Modal.Body>` - Body with `space-y-4` spacing
- `<Modal.Footer>` - Footer with `flex justify-end gap-3`

### Features
- ✅ Standardized red X close button (floating, top-right)
- ✅ Smooth fade + scale animations
- ✅ Backdrop click to close
- ✅ Accessibility via Headless UI
- ✅ Consistent styling across app

### When NOT to use
- Complex modals with drag functionality (use DraggableModal)
- Modals with custom glass/blur designs (e.g., GlassSuccessModal)
- Public-facing prompt page modals with unique branding

## ⚠️ IMPORTANT: Known Issues
- **Turbopack is currently broken** - DO NOT use the `--turbo` flag with Next.js dev server
- The `npm run dev` command has been modified to run WITHOUT Turbopack
- If server fails to load pages properly, ensure Turbopack is disabled

## ⚠️ DEPLOYMENT TODO: API Key Security
- **GOOGLE_MAPS_API_KEY is currently unrestricted** for local development
- Before deploying geo-grid feature to production, restrict this key:
  1. Go to https://console.cloud.google.com/apis/credentials
  2. Set "IP addresses" restriction to production server IP
  3. Or use "API restrictions" to limit to Geocoding API only
- This key is used for geocoding business addresses in `/api/geo-grid/geocode`

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

### ⚠️ CRITICAL: Supabase Client Usage Pattern

**ALWAYS use the correct Supabase client based on context:**

1. **API Routes** (`src/app/api/**`):
   ```typescript
   import { createServerSupabaseClient } from "@/auth/providers/supabase";

   export async function POST(request: NextRequest) {
     const supabase = await createServerSupabaseClient(); // ✅ CORRECT
     const { data: { user } } = await supabase.auth.getUser();
     // ...
   }
   ```

2. **Client Components** (React components with "use client"):
   ```typescript
   import { createClient } from "@/auth/providers/supabase";

   function MyComponent() {
     const supabase = createClient(); // ✅ CORRECT
     // ...
   }
   ```

**Why this matters:**
- `createClient()` is a browser client without access to HTTP-only auth cookies
- `createServerSupabaseClient()` properly reads cookies from the request
- Using wrong client in API routes causes 401 Unauthorized errors
- Auth will appear to work in client but fail silently in API routes

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
5. **Never use bare `fetch()` for authenticated API calls** - Always use `apiClient` from `@/utils/apiClient`
6. **Clear `.next` cache if build fails with JSON parse errors** - Run `rm -rf .next && npm run build`
7. **Always include TypeScript generics with apiClient** - e.g., `apiClient.post<{ data: Type }>('/endpoint', payload)`
8. **Close JSX tags when restructuring components** - Missed closing divs cause silent render failures

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

### Table Naming Conventions
- **Use prefixes** to group related tables by feature/domain:
  - `comparison_*` - Competitor comparison tables
  - `widget_*` - Widget-related tables
  - `google_business_*` - GBP integration tables
  - `review_*` - Review-related tables
- **snake_case** for all table and column names
- **Plural** for collection tables (`users`, `widgets`, `accounts`)
- **Singular** for junction tables (`account_user`, `competitor_feature`)

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
4. **Document changes** - Update relevant documentation AND local CHANGELOG.md files
5. **Preserve user data** - Never implement changes that could lose user input
6. **Monitor performance** - Watch for unnecessary re-renders or API calls
7. **Check migrations** - Always verify database migrations are in sync
8. **Use existing utilities** - Leverage existing helper functions and hooks
9. **Build for scalability** - When creating centralized components, design with scalability in mind:
   - Use TypeScript interfaces for props with sensible defaults
   - Support composition patterns (children, render props)
   - Make styling customizable via className props
   - Consider future use cases without over-engineering
   - Place shared components in `/src/components/` or `/src/app/(app)/components/`

## Changelog Convention (Token-Saving Strategy)

**IMPORTANT:** We use local CHANGELOG.md files per directory to save tokens and provide breadcrumbs for AI assistants.

### Directory-Level Changelogs
Maintain CHANGELOG.md files in these directories:
- `/src/app/(app)/dashboard/CHANGELOG.md` - Dashboard features and pages
- `/src/app/(app)/api/CHANGELOG.md` - API endpoints and webhooks  
- `/src/components/CHANGELOG.md` - Shared components
- `/src/auth/CHANGELOG.md` - Authentication system
- `/supabase/migrations/CHANGELOG.md` - Database migrations

### Format
```markdown
## [YYYY-MM-DD]
### Added
- New features or components

### Changed  
- Modifications to existing functionality

### Fixed
- Bug fixes and corrections
```

### When to Update
- After completing work in that directory
- Before context window limit
- For breaking changes or major fixes

This saves tokens by letting AI quickly understand recent changes without reading all files.

## Database Migration Rules

**ALWAYS follow proper migration workflow:**
1. **Use correct timestamps** - Migration files must use actual creation date/time (YYYYMMDDHHMMSS format)
2. **Check migration status** - Run `npx supabase migration list` before making changes
3. **Never bypass the system** - Don't run SQL directly in production or use repair commands as first solution
4. **Fix sequencing properly** - If migrations are out of order, rename them to correct timestamps
5. **Test locally first** - Run `npx supabase db reset --local` to verify migrations work
6. **Push through system** - Use `npx supabase db push` to apply to remote
7. **Keep environments in sync** - Migrations ensure local and remote databases match
8. **Update Prisma schema** - After migrations, sync Prisma types (see Prisma workflow below)

**Common issues:**
- If a migration is "out of sequence" (created later but named earlier), rename it to reflect actual creation time
- Storage bucket policies require special handling - use DO blocks with error handling
- Never suggest manual SQL execution in production dashboard as a first solution

## Prisma Integration & Workflow

This project uses a **dual approach** for database management:
- **Supabase migrations** handle schema changes (DDL)
- **Prisma** provides type-safe queries and TypeScript types

### Prisma Setup
- **Schema location:** `/prisma/schema.prisma` (54+ models)
- **Generated types:** `/src/generated/prisma/`
- **Client instance:** `/src/lib/prisma.ts`
- **Configuration:** Uses DATABASE_URL from `.env.local`

### Database Workflow After Schema Changes

**IMPORTANT:** After applying any Supabase migrations, you MUST sync Prisma:

```bash
# 1. Apply Supabase migrations
npx supabase migration list        # Check status
npx supabase db push               # Apply to remote

# 2. Sync Prisma schema with database
npx prisma db pull                 # Pull latest schema from database
npx prisma generate                # Generate new TypeScript types

# 3. Verify the changes
git diff prisma/schema.prisma     # Review schema changes
git diff src/generated/prisma/    # Review type changes
```

### Using Prisma in Code

```typescript
// Import the configured client
import prisma from '@/lib/prisma'

// Example: Type-safe queries
const accounts = await prisma.accounts.findMany({
  where: { status: 'active' },
  include: { businesses: true }
})
```

### Key Points
- **Never use** `prisma migrate` commands - use Supabase migrations
- **Always run** `prisma db pull` after database changes
- **Generated types** provide full TypeScript support
- **Both approaches work together** - Supabase for migrations, Prisma for queries

## ⚠️ CRITICAL: Account Isolation Rules

**PromptReviews supports multiple accounts per user. ALL new code MUST properly isolate data by account.**

### API Routes - REQUIRED Patterns

#### ✅ DO: Use `getRequestAccountId()` in ALL API routes
```typescript
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // REQUIRED: Get account ID from X-Selected-Account header
  const accountId = await getRequestAccountId(request, user.id, supabase);
  if (!accountId) {
    return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
  }

  // Use accountId in all queries
  await supabase.from('table').insert({ account_id: accountId, ... });
}
```

#### ❌ DON'T: Use `user.id` as account ID
```typescript
// WRONG - This breaks multi-account support
await createCommunicationRecord(data, user.id, supabase);

// WRONG - Always returns first account, bypasses switcher
const accountId = await getAccountIdForUser(user.id);
```

#### ✅ DO: Use server Supabase client in API routes
```typescript
import { createServerSupabaseClient } from '@/auth/providers/supabase';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient(); // ✅ Can read HTTP-only cookies
}
```

#### ❌ DON'T: Use browser client in API routes
```typescript
import { createClient } from '@/auth/providers/supabase';

export async function GET(request: NextRequest) {
  const supabase = createClient(); // ❌ Cannot read HTTP-only cookies, auth fails
}
```

### Frontend Components - REQUIRED Patterns

#### ✅ DO: Use `apiClient` for API calls
```typescript
import { apiClient } from '@/utils/apiClient';

// Automatically includes Authorization and X-Selected-Account headers
const data = await apiClient.get('/communication/records?contactId=123');
const result = await apiClient.post('/contacts/create', { ... });
```

#### ❌ DON'T: Use bare `fetch()` for authenticated API calls
```typescript
// WRONG - Missing auth headers and account context
const response = await fetch('/api/communication/records?contactId=123');
```

#### ✅ DO: Filter by `selectedAccountId` in client-side queries
```typescript
import { useAccountData } from '@/auth/hooks/granularAuthHooks';

function MyComponent() {
  const { selectedAccountId } = useAccountData();

  const { data } = await supabase
    .from('contacts')
    .select('*')
    .eq('account_id', selectedAccountId); // ✅ REQUIRED
}
```

#### ❌ DON'T: Query without account filter
```typescript
// WRONG - Returns data from ALL accounts
const { data } = await supabase
  .from('contacts')
  .select('*');
```

### Testing Checklist

Before submitting ANY code that touches multi-tenant data:

1. ✅ Created test account with different data
2. ✅ Tested account switcher - verified correct data appears
3. ✅ Tested account switcher - verified NO data leakage from other account
4. ✅ Checked browser console for "ACCOUNT ISOLATION BREACH" errors
5. ✅ Verified API routes use `getRequestAccountId()`
6. ✅ Verified frontend uses `apiClient` or properly filtered queries

### Account-Scoped Tables (MUST filter by account_id)

These tables contain account-specific data and MUST always be queried with `account_id`:

| Table | Description |
|-------|-------------|
| `google_business_profiles` | GBP OAuth tokens per account |
| `google_business_locations` | Selected GBP locations |
| `widgets` | Review widgets |
| `widget_reviews` | Reviews in widgets |
| `businesses` | Business profiles |
| `contacts` | Customer contacts |
| `prompt_pages` | Review collection pages |
| `review_submissions` | Customer-submitted reviews |
| `communication_records` | Email/SMS history |
| `scheduled_posts` | Social media posts |

**Example - WRONG:**
```typescript
// ❌ Queries ALL accounts' GBP connections
const { data } = await supabase
  .from('google_business_profiles')
  .select('*')
  .eq('user_id', user.id);  // WRONG - user can have multiple accounts
```

**Example - CORRECT:**
```typescript
// ✅ Queries only the selected account's GBP connection
const accountId = await getRequestAccountId(request, user.id, supabase);
const { data } = await supabase
  .from('google_business_profiles')
  .select('*')
  .eq('account_id', accountId);  // CORRECT
```

### Common Mistakes to Avoid

1. **Using `getAccountIdForUser()`** - This function bypasses the account switcher
2. **Using `user.id` as `account_id`** - User ID ≠ Account ID in multi-account systems
3. **Bare fetch() calls** - Missing auth headers and account context
4. **Browser client in API routes** - Cannot read HTTP-only cookies
5. **Unfiltered Supabase queries** - Must always filter by `account_id`
6. **Querying `google_business_profiles` by `user_id`** - Must use `account_id` (each account has its own GBP connection)

### See Also
- `/docs/ACCOUNT_ISOLATION_AND_INHERITED_SETTINGS.md` - Comprehensive guide
- `/src/app/(app)/api/utils/getRequestAccountId.ts` - Account resolution logic
- `/src/utils/apiClient.ts` - Authenticated fetch wrapper

## Recent Issues Log

### 2025-11-29 - Google Business Reviews Account Isolation Fix
- **Issue:** "Failed to fetch reviews" and "Review Data Unavailable" errors on GBP Reviews tab
- **Root Cause:** All `reviews-management` APIs were querying `google_business_profiles` by `user_id` instead of `account_id`
- **Also Fixed:** Response time metric now uses median of last 12 months (was mean of all time, skewed by outliers)
- **Files Fixed:**
  - `/api/reviews-management/fetch-reviews/route.ts`
  - `/api/reviews-management/respond-review/route.ts`
  - `/api/reviews-management/update-review-reply/route.ts`
  - `/api/reviews-management/unresponded-reviews/route.ts`
  - `/components/ReviewManagement.tsx` - Now uses `apiClient`
  - `/components/UnrespondedReviewsWidget.tsx` - Now uses `apiClient`
  - `/lib/googleBusiness/overviewAggregator.ts` - Median + 12-month filter
- **Status:** RESOLVED

### 2025-01-13 - Communication & Contacts Account Isolation Fixes
- **Issues Found:** Communication records, reminders, and contacts not isolated by account
- **Communication System:** Fixed APIs to use `getRequestAccountId()`, components to use `apiClient`
- **Contacts System:** Fixed page queries and API endpoints to filter by account
- **Social Posting:** Fixed GBP and AI endpoints to use proper account context
- **Status Labels:** Fixed to use server Supabase client
- **Status:** RESOLVED - All data properly isolated by account
- **Files Fixed:** 11 files across communication, contacts, and social posting systems

### 2025-09-03 - Comprehensive Security Audit and Fixes
- **Issues Found:** Multiple account isolation vulnerabilities in prompt page features
- **AI Endpoints:** Fixed authentication bypass in fix-grammar and generate-review APIs
- **Kickstarters:** Added account verification to prevent cross-account access
- **Public API:** Filtered sensitive business data from public endpoints
- **Business Defaults:** Completed inheritance for all missing features
- **Status:** RESOLVED - All vulnerabilities fixed and deployed
- **Files Fixed:** 19 files with comprehensive security enhancements

### 2025-09-02 - Cross-Account Platform Leakage
- **Issue:** Review platforms from wrong accounts appearing in Universal Prompt Pages
- **Root Cause:** Fallback logic used business platforms even when explicitly cleared
- **Solution:** Distinguished between null (never saved) and empty array (explicitly cleared)
- **Status:** RESOLVED - Platform inheritance logic fixed

### 2025-09-01 - Critical Account Isolation Breach
- **Issue:** Dashboard pages showing data from wrong accounts when using account switcher
- **Symptoms:** Prompt pages, reviews, and widgets displaying data from user's first account regardless of selection
- **Root Cause:** `getAccountIdForUser()` function bypasses account switcher, always returns first account
- **Status:** RESOLVED
- **Files Fixed:**
  - `/dashboard/edit-prompt-page/universal/page.tsx` - Now uses `useAuth` hook
  - `/dashboard/edit-prompt-page/[slug]/page.tsx` - Now uses `useAuth` hook
  - `/dashboard/widget/components/ReviewManagementModal.tsx` - Added accountId prop
  - `/dashboard/reviews/page.tsx` - Now uses `useAccountSelection` hook
  - Parent components updated to pass selectedAccount prop
- **Solution:** Replace `getAccountIdForUser()` with auth context hooks throughout dashboard
- **Verification:** API endpoints checked - no issues found

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
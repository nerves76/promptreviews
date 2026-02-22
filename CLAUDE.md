# Claude AI Assistant Context

This file provides important context for AI assistants working on the PromptReviews codebase.

## ⚠️ CRITICAL: Pre-Commit TypeScript Check
**ALWAYS run `npx tsc --noEmit` before committing code changes.**

- If errors are found, fix them before committing
- This prevents TypeScript errors from accumulating in the codebase
- CI will also run this check on GitHub, but catching errors locally is faster

```bash
# Run before committing
npx tsc --noEmit

# If errors found, fix them, then commit
```

## ⚠️ CRITICAL: Security Rules for All New Code

These rules exist because past violations were found and fixed in a comprehensive audit. **Every rule here prevents a real bug that existed in this codebase.**

### Never Commit Secrets or Environment Files
- **NEVER create or commit** `.env.production`, `.env.vercel.tmp`, or any file containing real API keys/secrets
- All secrets go in `.env.local` (gitignored) or Vercel environment variables
- If you see a file with real keys (starts with `sk_live_`, `eyJ`, etc.), **stop and alert the user**
- `.gitignore` already blocks `.env.production`, `.env.vercel*`, `.env.prod*`

### Never Use `dangerouslySetInnerHTML` Without DOMPurify
```tsx
// ❌ NEVER — XSS vulnerability
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ ALWAYS — Sanitize first
import DOMPurify from 'isomorphic-dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />
```
- The ONLY exception is hardcoded string literals (no user/DB content)
- `isomorphic-dompurify` is already installed — always use it

### Always Validate API Route Inputs
Every API route that accepts user input MUST validate:
```typescript
// Email fields: format + header injection
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEADER_INJECTION_REGEX = /[\r\n]|%0[aAdD]/;

// ❌ NEVER — Accepts anything
const { email, subject } = await request.json();
resend.emails.send({ to: email, subject });

// ✅ ALWAYS — Validate first
if (HEADER_INJECTION_REGEX.test(email)) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
if (!EMAIL_REGEX.test(email.trim())) return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
```
- Validate ALL string inputs for injection characters
- Validate email `from` fields are restricted to `@promptreviews.app`
- Add length limits on text fields (subject: 500 chars, name: 200 chars)

### Always Authenticate API Routes
```typescript
// ❌ NEVER — Unauthenticated endpoint
export async function POST(request: NextRequest) {
  const { id } = await request.json();
  await supabase.from('table').update({ verified: true }).eq('id', id);
}

// ✅ ALWAYS — Check auth first
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const accountId = await getRequestAccountId(request, user.id, supabase);
  if (!accountId) return NextResponse.json({ error: 'No account' }, { status: 403 });
  // Now safe to proceed...
}
```
- Exception: Public endpoints (review submission pages, embed widgets) — but still validate tokens/slugs
- Cron endpoints MUST call `verifyCronSecret(request)` as the first line

### Always Use `getUser()` — Never `getSession()` Alone for Auth
```typescript
// ❌ NEVER in API routes — doesn't validate JWT server-side
const { data: { session } } = await supabase.auth.getSession();

// ✅ ALWAYS — Validates JWT against Supabase
const { data: { user } } = await supabase.auth.getUser();
```
- `getSession()` is ONLY acceptable for: reading access_token for external APIs (after getUser validates), debug/diagnostic endpoints, OAuth callback retry logic
- If you need both user validation AND access_token, call getUser() first, then getSession()

### Never Return Sensitive Tokens in API Responses
```typescript
// ❌ NEVER — Exposes tokens to the browser
return NextResponse.json({ access_token: token, refresh_token: refreshToken });

// ✅ ALWAYS — Return only status
return NextResponse.json({ success: true, expiresIn: 3600 });
```
- OAuth tokens, API keys, and secrets must NEVER appear in API response bodies
- Tokens stored in the database must be encrypted — use `encryptGbpToken()` / `decryptGbpToken()` from `@/lib/crypto/gbpTokenHelpers`
- The encryption key env var is `GOOGLE_TOKEN_ENCRYPTION_KEY`

### Never Hardcode Stripe Price IDs or Secrets
```typescript
// ❌ NEVER
const priceId = 'price_1RT6s7LqwlpgZPtwjv65Q3xa';

// ✅ ALWAYS — Use env vars with fallbacks
const priceId = process.env.STRIPE_PRICE_BUILDER_MONTHLY || 'price_1RT6s7LqwlpgZPtwjv65Q3xa';
if (!process.env.STRIPE_PRICE_BUILDER_MONTHLY) console.warn('Missing STRIPE_PRICE_BUILDER_MONTHLY env var');
```
- All Stripe price IDs must come from environment variables
- Fallbacks to hardcoded values are OK temporarily but must log a warning

### Never Write Unbounded Database Queries
```typescript
// ❌ NEVER — Loads all rows, gets slower as DB grows
const { data } = await supabase.from('big_table').select('*');

// ✅ ALWAYS — Add limits, date filters, or pagination
const { data } = await supabase.from('big_table').select('*')
  .gte('created_at', thirtyDaysAgo)
  .limit(100);

// ✅ For counts — use head: true (returns count without rows)
const { count } = await supabase.from('big_table').select('id', { count: 'exact', head: true });
```
- Admin/analytics endpoints MUST have default date ranges (30 days) and row limits (1000)
- List endpoints MUST support pagination via `limit`/`offset` or `page`/`pageSize`

### Never Write N+1 Queries
```typescript
// ❌ NEVER — N queries in a loop
for (const post of posts) {
  const { data: author } = await supabase.from('profiles').select('*').eq('id', post.author_id).single();
  post.author = author;
}

// ✅ ALWAYS — Batch query then map
const authorIds = [...new Set(posts.map(p => p.author_id))];
const { data: authors } = await supabase.from('profiles').select('*').in('id', authorIds);
const authorMap = new Map(authors.map(a => [a.id, a]));
posts.forEach(p => p.author = authorMap.get(p.author_id));
```
- Use `.in('id', [...ids])` for batch lookups
- Use `Promise.all()` to run independent batch queries in parallel
- Guard against empty arrays: `if (ids.length === 0) return [];`

### Always Use `apiClient` for Authenticated Frontend API Calls
```typescript
// ❌ NEVER in authenticated client components
const res = await fetch('/api/some-endpoint');

// ✅ ALWAYS — Includes auth + account headers automatically
import { apiClient } from '@/utils/apiClient';
const data = await apiClient.get('/some-endpoint');
```
- Bare `fetch()` is ONLY acceptable in: public pages (no auth), auth pages (pre-login), embed components, test pages
- `apiClient` automatically includes `Authorization` and `X-Selected-Account` headers

### RLS Policies Must Never Allow `anon` Read Access to Tenant Data
```sql
-- ❌ NEVER — Anon can read all rows
CREATE POLICY "read_all" ON tenant_table FOR SELECT TO anon USING (true);

-- ✅ ALWAYS — Scoped to authenticated user's accounts
CREATE POLICY "read_own" ON tenant_table FOR SELECT TO authenticated
  USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid()));
```
- All tenant-scoped tables MUST have RLS policies restricted to `authenticated` role
- The `anon` role should NEVER have SELECT access to tenant data

### All Tenant-Scoped Tables Must Have `account_id NOT NULL`
- New tables with tenant data MUST include `account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE`
- Add an index: `CREATE INDEX idx_tablename_account_id ON tablename(account_id);`
- Always filter queries by `account_id` — see the Account Isolation Rules section

### Environment Variables Must Be Validated at Startup
- Required env vars are validated in `src/lib/env.ts`, called from `src/instrumentation.ts`
- When adding a new required env var: add it to the `REQUIRED_SERVER_VARS` or `REQUIRED_PUBLIC_VARS` array in `src/lib/env.ts`
- When adding a new optional env var: add it to `OPTIONAL_VARS` array
- Also add all new env vars to `.env.local.example`

### OAuth/External API Token Refresh Must Have Retry + Error Codes
Token refresh operations (e.g., Google OAuth) are prone to transient network failures. Silent failures cause cascading errors that are hard to debug.
```typescript
// ❌ NEVER — Single attempt, generic error, swallows failures
try {
  const tokens = await oauth2Client.refreshAccessToken();
  await saveTokens(tokens);
} catch (error) {
  console.error('Refresh failed', error);
  return NextResponse.json({ error: 'Token refresh failed' }, { status: 500 });
}

// ✅ ALWAYS — Retry + structured error codes + save rotated refresh tokens
const MAX_RETRIES = 2;
for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    // If Google rotated the refresh token, encrypt and save the new one
    if (credentials.refresh_token) {
      const encrypted = encryptGbpToken(credentials.refresh_token);
      await supabase.from('google_business_profiles')
        .update({ encrypted_refresh_token: encrypted })
        .eq('account_id', accountId);
    }
    return { accessToken: credentials.access_token };
  } catch (error: any) {
    if (attempt === MAX_RETRIES) {
      const code = error?.response?.status === 400 ? 'TOKEN_EXPIRED' : 'REFRESH_FAILED';
      return NextResponse.json({ error: code, message: 'Token refresh failed' }, { status: 401 });
    }
    await new Promise(r => setTimeout(r, 1000 * attempt)); // Backoff
  }
}
```
- Retry at least once on transient failures before giving up
- Return structured error codes (`TOKEN_EXPIRED`, `REFRESH_FAILED`) not generic errors
- Never silently swallow token refresh failures — always log and return a clear error
- If Google returns a new `refresh_token` during rotation, encrypt and save it immediately

### Cron Jobs Must Have Idempotency Guards + Timeout Protection
Vercel Functions have a 30-second timeout. Cron jobs that run past this limit get killed silently. Jobs that lack idempotency guards can run twice and send duplicate emails/notifications.
```typescript
// ❌ NEVER — No auth, no idempotency, no timeout guard
export async function GET(request: NextRequest) {
  const accounts = await getActiveAccounts();
  for (const account of accounts) {
    await sendReminderEmail(account); // May timeout mid-loop, no duplicate protection
  }
  return NextResponse.json({ success: true });
}

// ✅ ALWAYS — Auth + idempotency + timeout protection
import { verifyCronSecret } from '@/lib/verifyCronSecret';
import { hasCompletedToday, logCronCompletion, shouldExitEarly } from '@/lib/cronLogger';

export async function GET(request: NextRequest) {
  verifyCronSecret(request); // MUST be first line

  const startTime = Date.now();
  const alreadyRan = await hasCompletedToday('reminder-emails');
  if (alreadyRan) return NextResponse.json({ skipped: true, reason: 'already_completed_today' });

  const accounts = await getActiveAccounts();
  let processed = 0;
  for (const account of accounts) {
    if (shouldExitEarly(startTime)) break; // Exit before 30s timeout
    await sendReminderEmail(account);
    processed++;
  }

  await logCronCompletion('reminder-emails', { processed, total: accounts.length });
  return NextResponse.json({ success: true, processed });
}
```
- Use `hasCompletedToday()` / `hasCompletedThisMonth()` from `src/lib/cronLogger.ts` as the first check
- Use `shouldExitEarly(startTime)` in processing loops to exit before the 30s Vercel timeout
- All cron endpoints MUST call `verifyCronSecret(request)` as the first line
- Log completion so the next invocation can skip if already done

### All Tenant-Scoped Tables Must Have RLS Policies
Every table with `account_id` needs Row Level Security policies. Missing policies mean the table is either wide-open or completely blocked, depending on whether RLS is enabled.
```sql
-- ❌ NEVER — Table with account_id but no RLS policies
CREATE TABLE my_feature_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  data TEXT
);
ALTER TABLE my_feature_data ENABLE ROW LEVEL SECURITY;
-- Oops: no policies = no access for anyone (or wide open if RLS not enabled)

-- ✅ ALWAYS — Full policy set for authenticated + service_role bypass
ALTER TABLE my_feature_data ENABLE ROW LEVEL SECURITY;

-- Authenticated users: scoped to their accounts
CREATE POLICY "Users can SELECT own account data" ON my_feature_data
  FOR SELECT TO authenticated
  USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can INSERT own account data" ON my_feature_data
  FOR INSERT TO authenticated
  WITH CHECK (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can UPDATE own account data" ON my_feature_data
  FOR UPDATE TO authenticated
  USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can DELETE own account data" ON my_feature_data
  FOR DELETE TO authenticated
  USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid()));

-- Service role: bypass for server-side operations (cron, webhooks, admin)
CREATE POLICY "Service role full access" ON my_feature_data
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```
- Every table with `account_id` needs SELECT/INSERT/UPDATE/DELETE policies for `authenticated` role
- Every such table also needs a `service_role` bypass policy for server-side operations
- Use the subquery pattern: `account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid())`
- Never grant `anon` access to tenant-scoped tables

### All API Routes Must Validate Input Parameters
Raw user input (UUIDs, slugs, strings, files) must be validated before use. Invalid inputs cause cryptic database errors and potential injection attacks.
```typescript
// ❌ NEVER — Trust user input directly
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id'); // Could be anything
  const { data } = await supabase.from('table').select('*').eq('id', id);
}

// ✅ ALWAYS — Validate with centralized validators
import { isValidUuid, validateSlug, validateStringLength } from '@/app/(app)/api/utils/validation';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!isValidUuid(id)) {
    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
  }
  const { data } = await supabase.from('table').select('*').eq('id', id);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const slugError = validateSlug(body.slug);
  if (slugError) return NextResponse.json({ error: slugError }, { status: 400 });
  const nameError = validateStringLength(body.name, 'Name', 1, STRING_LIMITS.NAME_MAX);
  if (nameError) return NextResponse.json({ error: nameError }, { status: 400 });
  // Safe to proceed...
}
```
- Use validators from `src/app/(app)/api/utils/validation.ts`
- UUID params: `isValidUuid()` / `validateUuid()`
- Slugs: `validateSlug()`
- String fields: `validateStringLength()` or `validateRequiredString()`
- File uploads: `validateFileUpload()` or `validateCsvUpload()`
- Standard limits are defined in the `STRING_LIMITS` constant

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

## ⚠️ IMPORTANT: Button & Badge Text Must Not Wrap
- **Button and badge text must NEVER wrap to multiple lines**
- Always add `whitespace-nowrap` to buttons, badges, and pill-shaped elements
- If text is too long, either:
  - Shorten the text
  - Use an icon instead
  - Increase the container width
- Examples:
  ```tsx
  // ✅ CORRECT - Text won't wrap
  <button className="px-4 py-2 rounded whitespace-nowrap">Save changes</button>
  <span className="px-2 py-1 rounded-full whitespace-nowrap">Start Here!</span>

  // ❌ WRONG - Text can wrap and stack
  <button className="px-4 py-2 rounded">Save changes</button>
  ```

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
background: linear-gradient(to bottom, #527DE7, #7B6BA8, #E8A87C);
/* Blue → Muted lavender → Peach (sunset effect) */
```

### Text Colors (WCAG AA Compliant)
- **Headings:** `text-gray-900` (#111827)
- **Body text:** `text-gray-600` (#4b5563)
- **Muted/placeholder:** `text-gray-500` (#6b7280) - NOT gray-400
- **On gradient:** `text-white`, `text-white/90`, `text-white/70` - NOT white/50 or lower

### Rules
- ✅ Use `slate-blue` for primary buttons, links, headings
- ✅ Use opacity variants for hover (e.g., `hover:bg-slate-blue/90` to lighten)
- ✅ Consistent hover behavior: buttons should lighten on hover, not change color
- ✅ Use Tailwind classes, not inline hex values
- ❌ Never use `text-gray-400` for readable text (fails WCAG)
- ❌ Never use `text-white/50` or lower for readable text
- ❌ Never create new custom colors - use existing palette
- ❌ **Never use purple or indigo** (`purple-*`, `indigo-*`, `violet-*`) - use `slate-blue` instead
  - Exception: When you need many distinct colors for indicators/categories (e.g., chart legends)

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

## ⚠️ IMPORTANT: Accessibility (a11y) Requirements

**All UI components MUST be accessible.** Follow WCAG 2.1 Level AA guidelines.

### Buttons & Interactive Elements

#### Icon-Only Buttons - ALWAYS add `aria-label`
```tsx
// ✅ CORRECT - Has aria-label for screen readers
<button onClick={onDelete} aria-label="Delete item" title="Delete">
  <Icon name="FaTrash" className="w-4 h-4" />
</button>

// ❌ WRONG - Screen readers can't announce purpose
<button onClick={onDelete} title="Delete">
  <Icon name="FaTrash" className="w-4 h-4" />
</button>
```

#### Clickable Divs - MUST have keyboard support
If you use `onClick` on a non-button element, you MUST add:
- `role="button"`
- `tabIndex={0}`
- `onKeyDown` handler for Enter/Space keys

```tsx
// ✅ CORRECT - Full keyboard accessibility
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  className="cursor-pointer ..."
>
  Clickable content
</div>

// ❌ WRONG - Not keyboard accessible
<div onClick={handleClick} className="cursor-pointer">
  Clickable content
</div>
```

**Better approach:** Use `<button>` instead of `<div>` when possible.

### Dialog/Modal Accessibility
- **ALWAYS add `aria-label`** to Dialog components
- Use `Dialog.Title` for the modal heading
- Close button must have `aria-label="Close"` or `aria-label="Close modal"`

```tsx
// ✅ CORRECT
<Dialog open={isOpen} onClose={onClose} aria-label="Confirm deletion">
  <Dialog.Title>Delete item?</Dialog.Title>
  ...
</Dialog>
```

### Form Inputs
Every input MUST have an associated label:
```tsx
// Option 1: Explicit label with htmlFor/id
<label htmlFor="email-input">Email</label>
<input id="email-input" type="email" ... />

// Option 2: aria-label for icon inputs
<input type="search" aria-label="Search contacts" placeholder="Search..." />

// Option 3: Wrap input in label
<label>
  Email
  <input type="email" ... />
</label>
```

### Color Contrast (WCAG AA - 4.5:1 ratio)
| Use Case | Correct | Wrong |
|----------|---------|-------|
| Muted text | `text-gray-500` | `text-gray-400` |
| Placeholder | `text-gray-500` | `text-gray-400` |
| Body text | `text-gray-600` | `text-gray-400` |
| On gradients | `text-white/70`+ | `text-white/50` |

**Never use `text-gray-400` for any readable text** - it fails WCAG contrast requirements.

### Images
- **Informative images:** Descriptive alt text
- **Decorative images:** `alt=""` or use CSS background
- **Logos:** Include business name in alt text

```tsx
// ✅ Informative image
<Image src={photo} alt="Customer John reviewing our product" />

// ✅ Logo with context
<Image src={logo} alt={`${businessName} logo`} />

// ✅ Decorative (screen readers skip)
<Image src={pattern} alt="" aria-hidden="true" />
```

### Link Text
**Never use vague link text.** Links should describe their destination.

```tsx
// ✅ CORRECT - Descriptive
<a href="/docs">Read the documentation</a>
<button onClick={viewPages}>View your prompt pages</button>

// ❌ WRONG - Vague
<a href="/docs">Click here</a>
<button onClick={viewPages}>Click here to see them</button>
```

### Focus States
All interactive elements need visible focus indicators:
```tsx
// ✅ Standard focus pattern
className="focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
```

### Accessibility Checklist
Before submitting UI code:
- [ ] All icon-only buttons have `aria-label`
- [ ] All modals/dialogs have `aria-label`
- [ ] All form inputs have labels
- [ ] Clickable non-buttons have `role="button"` + keyboard support
- [ ] No `text-gray-400` for readable text
- [ ] All images have appropriate alt text
- [ ] No vague "click here" link text
- [ ] Focus states are visible on interactive elements

## ⚠️ IMPORTANT: Known Issues
- **Turbopack is currently broken** - DO NOT use the `--turbo` flag with Next.js dev server
- The `npm run dev` command has been modified to run WITHOUT Turbopack
- If server fails to load pages properly, ensure Turbopack is disabled

## ⚠️ Known Duplication: PromptPageForm Variants

There are **11 PromptPageForm variants** that share significant code. Each file has a
`TODO` comment referencing this section. Consolidation is planned but deferred due to risk.

### Current variants (all in `src/app/(app)/components/` unless noted)
| File | Purpose |
|------|---------|
| `PromptPageForm.tsx` | Original / generic form |
| `BasePromptPageForm.tsx` | Shared base with composition pattern |
| `ServicePromptPageForm.tsx` | Service-type prompt pages |
| `ServicePromptPageFormRefactored.tsx` | Refactored service form using BasePromptPageForm |
| `UniversalPromptPageForm.tsx` | Universal prompt pages |
| `EmployeePromptPageForm.tsx` | Employee-type prompt pages |
| `EventPromptPageForm.tsx` | Event-type prompt pages |
| `PhotoPromptPageForm.tsx` | Photo-type prompt pages |
| `ProductPromptPageForm.tsx` | Product-type prompt pages |
| `ReviewBuilderPromptPageForm.tsx` | Review Builder experience |
| `dashboard/edit-prompt-page/[slug]/ServicePromptPageForm.tsx` | Legacy slug-based service form |

### Consolidation plan
1. **Phase 1 (done):** `BasePromptPageForm` + `ServicePromptPageFormRefactored` demonstrate the target architecture.
2. **Phase 2:** Migrate remaining type-specific forms (`Employee`, `Event`, `Photo`, `Product`) to use `BasePromptPageForm`.
3. **Phase 3:** Remove `PromptPageForm.tsx` (original) and `ServicePromptPageForm.tsx` once all pages are migrated.
4. **Phase 4:** Remove the slug-based `ServicePromptPageForm.tsx` duplicate.

### Why not consolidate now
- Each variant has type-specific sections, validation, and feature toggles
- Several are actively used in production routes
- Risk of regression is high without comprehensive test coverage
- `BasePromptPageForm` already provides the right abstraction to build on

### Canonical date formatting utility
When adding date formatting to new or existing code, import from `src/utils/formatDate.ts`
instead of defining inline helpers. This file provides `formatDate`, `formatRelativeDate`,
`formatDateWithWeekday`, and `formatDateOrFallback`.

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
9. **Never use `getSession()` for auth in API routes** - Use `getUser()` which validates the JWT server-side (see Security Rules)
10. **Never use `dangerouslySetInnerHTML` without DOMPurify** - XSS vulnerability (see Security Rules)
11. **Never hardcode Stripe price IDs** - Use env vars with fallbacks (see Security Rules)
12. **Never write unbounded queries** - Always add `.limit()`, date filters, or pagination (see Security Rules)
13. **Never return tokens in API responses** - Only return status/metadata, encrypt tokens at rest (see Security Rules)
14. **Always validate API inputs** - Check for injection chars, valid formats, length limits (see Security Rules)
15. **All new API routes need auth + account isolation** - `createServerSupabaseClient()` + `getUser()` + `getRequestAccountId()`
16. **All cron endpoints need `verifyCronSecret()`** - First line of every cron handler
17. **New env vars must be registered** - Add to `src/lib/env.ts` arrays AND `.env.local.example`
18. **OAuth refresh must retry + return structured errors** — Use retry loop + `TOKEN_EXPIRED`/`REFRESH_FAILED` codes (see Security Rules)
19. **Cron jobs need idempotency + timeout guards** — Use `hasCompletedToday()` + `shouldExitEarly()` from `src/lib/cronLogger.ts` (see Security Rules)
20. **All tenant tables need RLS policies** — SELECT/INSERT/UPDATE/DELETE for `authenticated` + `service_role` bypass (see Security Rules)
21. **All API inputs need validation** — Use validators from `src/app/(app)/api/utils/validation.ts` (see Security Rules)

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

## ⚠️ IMPORTANT: File Size Guidelines
- Keep individual files under ~500 lines when practical
- If a file grows beyond 500 lines, consider splitting into smaller modules
- Extract reusable logic into separate utility files
- Use barrel exports (index.ts) to maintain clean imports

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

This project uses **Supabase migrations** for schema changes and **Prisma** for TypeScript types. Both must be kept in sync.

### Migration Workflow (in order)

```bash
# 1. Create migration file
#    File: supabase/migrations/YYYYMMDDHHMMSS_description.sql
#    Use actual creation timestamp (not arbitrary future date)

# 2. Test locally first
npx supabase db reset --local      # Reset local DB and apply all migrations

# 3. Verify local status
npx supabase migration list        # Both columns should match

# 4. Push to remote
npx supabase db push --include-all # Apply pending migrations to production

# 5. Sync Prisma types (REQUIRED after any schema change)
npx prisma db pull                 # Pull latest schema from database
npx prisma generate                # Generate new TypeScript types

# 6. Verify and commit
git diff prisma/schema.prisma      # Review schema changes
git add -A && git commit           # Commit migration + Prisma changes together
```

### Migration Rules
- **Use correct timestamps** - Migration files must use actual creation date/time (YYYYMMDDHHMMSS format)
- **Local first, then remote** - Always test locally before pushing to production
- **Never bypass the system** - Don't run SQL directly in production or use repair commands as first solution
- **Keep environments in sync** - Run `npx supabase migration list` to verify both columns match
- **Always sync Prisma** - After any migration, run `prisma db pull && prisma generate`

### Common Issues
- **"Out of sequence" error** - Migration timestamp is earlier than already-applied migrations. Rename file to current timestamp.
- **Column already exists** - Migration was partially applied. Use `npx supabase migration repair <id> --status reverted --linked` then push again.
- **Local/remote mismatch** - Run `npx supabase db reset --local` to reset local, then `npx supabase db push --include-all` for remote.

## Prisma Integration

### Setup
- **Schema location:** `/prisma/schema.prisma`
- **Generated types:** `/src/generated/prisma/`
- **Client instance:** `/src/lib/prisma.ts`
- **Connection:** Uses DATABASE_URL from `.env.local`

### Using Prisma in Code

```typescript
import prisma from '@/lib/prisma'

const accounts = await prisma.accounts.findMany({
  where: { status: 'active' },
  include: { businesses: true }
})
```

### Key Points
- **Never use** `prisma migrate` commands - use Supabase migrations only
- **Always run** `prisma db pull` after any database schema change
- **Commit together** - Migration files and Prisma schema changes should be in the same commit

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
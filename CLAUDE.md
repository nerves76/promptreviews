# Claude AI Assistant Context

This file provides important context for AI assistants working on the PromptReviews codebase.

## Project Overview
PromptReviews is a review management platform that allows businesses to collect, manage, and display customer reviews through customizable widgets.

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

## Development Commands

```bash
# Start development server
npm run dev

# Run tests (if configured)
npm test

# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build
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

## AI Assistant Guidelines

When working on this codebase:
1. **Read before writing** - Always read existing code first
2. **Follow patterns** - Match existing code style and patterns
3. **Test thoroughly** - Consider edge cases and user experience
4. **Document changes** - Update relevant documentation
5. **Preserve user data** - Never implement changes that could lose user input
6. **Monitor performance** - Watch for unnecessary re-renders or API calls

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

### 2024 - Widget Page Refreshes
- **Issue:** Form data loss, PageCard flickering
- **Root Cause:** Duplicate fetches, token refresh side effects
- **Status:** RESOLVED
- **Documentation:** `/docs/WIDGET_REFRESH_FIX.md`
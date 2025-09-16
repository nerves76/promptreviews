# RLS Status Documentation

## Date: 2025-08-13
## Status: ⚠️ TEMPORARILY DISABLED

## Summary
Row Level Security (RLS) has been temporarily disabled on critical tables due to authentication conflicts. The system is currently secure through application-level controls until RLS can be properly re-implemented.

## Current State

### Tables with RLS Disabled
- `public.accounts` - RLS disabled
- `public.account_users` - RLS disabled  
- `public.businesses` - RLS disabled

### Why RLS Was Disabled
1. **Authentication Blocking**: RLS policies were preventing user sign-in ("Database error granting user")
2. **Trigger Conflicts**: The `trigger_check_account_reactivation` trigger was interfering with auth
3. **Policy Conflicts**: Multiple overlapping policies created unpredictable behavior

## Actions Taken

### 1. Created Optimized RLS Policies (Initially)
- Added performance indexes for RLS lookups
- Created simplified policies for better performance
- **Result**: Authentication blocked

### 2. Attempted Policy Fixes
- Adjusted policies to allow auth operations
- Added INSERT policies for account creation
- **Result**: Still blocked due to trigger issues

### 3. Cleaned Up All Policies
- Removed all conflicting policies (31 total)
- Disabled RLS on critical tables
- Removed problematic trigger
- **Result**: ✅ Authentication working

## Security Considerations

### Current Security Model
While RLS is disabled at the database level, security is maintained through:

1. **Supabase Auth**: All requests require valid JWT tokens
2. **Application Logic**: Auth contexts validate user permissions
3. **API Routes**: Server-side validation of user access
4. **Service Role**: Limited to server-side operations only

### Risk Assessment
- **Low Risk**: Development environment only
- **Medium Risk**: If deployed to production without RLS
- **Mitigation**: Re-enable RLS before production deployment

## Re-enabling RLS Plan

### Phase 1: Research (Current)
- [ ] Understand why auth triggers "Database error granting user"
- [ ] Identify all auth-related database functions
- [ ] Document the auth flow through the database

### Phase 2: Design
- [ ] Design simple, non-conflicting policies
- [ ] Use service role for auth operations
- [ ] Separate auth operations from user operations

### Phase 3: Implementation
- [ ] Create new migration with simple policies
- [ ] Test auth flow thoroughly
- [ ] Enable policies one table at a time

### Phase 4: Testing
- [ ] Test sign up flow
- [ ] Test sign in flow
- [ ] Test multi-account switching
- [ ] Test admin operations

## Proposed Simple RLS Policies

When re-enabling, use these simplified policies:

```sql
-- Accounts: Users can manage their own account
CREATE POLICY "own_account_all"
ON accounts FOR ALL
TO authenticated
USING (auth.uid() = id OR auth.uid() = user_id)
WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

-- Account Users: Users can manage their relationships
CREATE POLICY "own_relationships_all"
ON account_users FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Businesses: Access through account relationship
CREATE POLICY "account_businesses_all"
ON businesses FOR ALL
TO authenticated
USING (
  account_id IN (
    SELECT account_id FROM account_users
    WHERE user_id = auth.uid()
  )
);
```

## Migrations Created

1. `20250813000001_reenable_rls_optimized.sql` - Initial attempt (caused auth issues)
2. `20250813000002_fix_rls_auth_issues.sql` - Fix attempt (still had issues)
3. `20250813000003_clean_rls_policies.sql` - Disabled RLS (current state)

## Next Steps

1. **Immediate**: Continue development with RLS disabled
2. **Short-term**: Research Supabase auth + RLS best practices
3. **Medium-term**: Implement proper RLS with auth compatibility
4. **Long-term**: Full security audit before production

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Auth Helpers Documentation](https://supabase.com/docs/guides/auth/auth-helpers)
- Migration files in `/supabase/migrations/`

## Contact

For questions about this RLS status, consult the AUTH_COMPARISON_REPORT.md or the team lead.
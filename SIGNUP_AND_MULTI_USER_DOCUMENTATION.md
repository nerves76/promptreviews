# Sign-Up Process and Multi-User Account System Documentation

## Overview

This document provides comprehensive documentation of the sign-up process and multi-user account system in PromptReviews. The system is designed to support multiple users per account while maintaining proper authentication, authorization, and data isolation.

## Signup Configuration (Direct Confirmation)

PromptReviews no longer uses transactional email for account verification. The signup form posts to `/api/auth/signup`, which leverages a Supabase service-role client to create and immediately confirm the user. Important details:

- `auth.admin.createUser` is called with `email_confirm: true`, so Supabase marks the account as verified on creation.
- Database triggers (plus a fallback in the API route) provision the `accounts` and `account_users` records.
- Users can sign in as soon as the signup request succeeds—no confirmation link is required.

Ensure the Supabase environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are present in every environment; without them, the API route returns a descriptive error. Team invitations still rely on Supabase's email delivery to send secure acceptance links, which is handled separately from the core signup flow described below.

## Sign-Up Process Flow

### 1. User Registration (`/auth/sign-up`)

**File**: `src/app/(app)/auth/sign-up/page.tsx`

**Process**:
1. User completes registration form with first name, last name, email, and password
2. Client-side validation enforces required fields, email format, password length, and terms acceptance
3. The form submits a POST request to `/api/auth/signup`

### 2. Server-Side Account Creation (`/api/auth/signup`)

**File**: `src/app/(app)/api/auth/signup/route.ts`

**Process**:
1. Validate the payload (required fields, password length, email format)
2. Verify critical Supabase environment variables are present
3. Create the user via `supabase.auth.admin.createUser` with `email_confirm: true`
4. Ensure the `accounts` and `account_users` rows exist (insert manually if triggers have not finished)
5. Return success so the client can prompt the user to sign in immediately

### 3. Account Setup Flow

**After Signup API success**:
1. **Sign-In Prompt**: UI displays confirmation and links to `/auth/sign-in`
2. **Plan Selection**: Upon first sign-in, onboarding prompts for plan choice
3. **Business Creation**: User creates their first business profile
4. **Dashboard Access**: Full dashboard unlocks once onboarding requirements are completed

## Multi-User Account System

### **Database Schema**

**Accounts Table**:
```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
```

`created_by` captures the user who initiated the account so support teams can trace ownership and helpers can safely join service-role created accounts.

**Account Users Table**:
```sql
CREATE TABLE account_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, user_id)
);
```

**Businesses Table**:
```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **User Roles**

- **Owner**: Full access to account, can manage users and settings
- **Admin**: Can manage businesses and content, limited user management
- **Member**: Can view and contribute to businesses

### **Account Management**

**Adding Users to Account**:
1. Account owner sends an invitation from the team management tools
2. The system emails a secure acceptance link to the prospective user
3. The user opens the email, follows the link, completes signup, and is attached to the account
4. The new member gains access to the account's businesses

**User Permissions**:
- Users can only access businesses within their account
- RLS policies enforce data isolation between accounts
- Users can be members of multiple accounts

## Security Features

### **Row Level Security (RLS)**

**Account Isolation**:
```sql
-- Users can only access their own account data
CREATE POLICY "Users can view own account" ON accounts
  FOR SELECT USING (id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));
```

**Business Access Control**:
```sql
-- Users can only access businesses in their account
CREATE POLICY "Users can view account businesses" ON businesses
  FOR ALL USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));
```

### **Authentication Guards**

**File**: `src/utils/authGuard.ts`

**Features**:
- Session validation
- Account access verification
- Role-based permissions
- Onboarding gating for business/plan requirements

## Error Handling

### **Common Issues**

1. **Signup API Error**:
   - Confirm all required fields are being sent from the client
   - Check browser devtools for the JSON response returned by `/api/auth/signup`
   - Ensure required Supabase environment variables are configured

2. **Account Creation Failed**:
   - Verify RLS policies are correctly configured
   - Check database connection and permissions
   - Review server logs for detailed error messages

3. **Multi-User Access Issues**:
   - Verify user is added to account_users table
   - Check user role and permissions
   - Ensure RLS policies are working correctly

### **Debugging**

**Enable Logging**:
```typescript
// In sign-up component
console.log('Submitting signup payload:', { email, firstName, lastName });

// Around the fetch call
console.log('Signup response:', result);

// On the server route
console.log('Signup POST received for:', email);
```

## Testing

### **Local Development Testing**

1. **Sign-Up Flow**:
   ```bash
   npm run dev
   # Visit http://localhost:3001/auth/sign-up
   # Complete the sign-up form and submit
   # Confirm the success toast appears and no email is requested
   ```

2. **Initial Sign-In**:
   - Visit `/auth/sign-in`
   - Sign in with the newly created credentials
   - Confirm onboarding redirects trigger as expected

3. **Multi-User Testing**:
   - Create multiple test accounts
   - Send invitation emails and confirm delivery/link exchange
   - Verify account isolation

### **Production Testing**

1. **Deploy and Test**:
   - Test sign-up flow in production
   - Verify immediate sign-in works without email delivery

2. **Multi-Environment Verification**:
   - Test both local and production environments
   - Verify no cross-environment issues
   - Confirm invitation emails deliver and link targets are environment-aware

## Maintenance

### **Regular Tasks**

1. **Configuration Updates**:
   - Keep Supabase configuration in sync
   - Rotate and safeguard service-role credentials
   - Monitor authentication logs

2. **Database Maintenance**:
   - Review RLS policies regularly
   - Monitor account and user growth
   - Clean up orphaned records

3. **Security Reviews**:
   - Audit user permissions
   - Review authentication flows
   - Test account isolation

### **Monitoring**

**Key Metrics**:
- Sign-up conversion rates
- Account creation success rates
- Multi-user adoption rates
- Signup API error rates
- Invitation email delivery rates

**Alerts**:
- Failed authentication attempts
- Database connection issues
- Elevated signup API failures

## Troubleshooting

### **Signup API Issues**

**Problem**: `/api/auth/signup` returns a 400 error
**Solution**:
1. Confirm the request payload includes first name, last name, email, and password
2. Inspect the JSON error message for validation failures (password length, email format, duplicate user)
3. Ensure `SUPABASE_SERVICE_ROLE_KEY` is available to the app route

**Problem**: `/api/auth/signup` returns a 500 error about missing env vars
**Solution**:
1. Verify `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are set
2. Restart the Next.js server after editing `.env.local`
3. Re-run the signup flow to confirm the warning no longer appears

### **Account Creation Issues**

**Problem**: "Account not found" errors
**Solution**:
1. Confirm the signup API request succeeded (2xx response)
2. Verify `accounts` contains a row matching the new user's ID
3. Review RLS policies to ensure inserts are permitted for the service-role client

**Problem**: Multi-user access denied
**Solution**:
1. Verify user is in account_users table
2. Check user role and permissions
3. Review RLS policies for account access

### **Invitation Email Issues**

**Problem**: Invitation email not received
**Solution**:
1. Confirm the invitation record exists and the email address is correct
2. Check Supabase email configuration (sender domain, rate limits)
3. Resend the invite and inspect Supabase Auth logs for delivery status

This documentation should be updated whenever changes are made to the authentication or multi-user systems. 

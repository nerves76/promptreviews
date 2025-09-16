# Sign-Up Process and Multi-User Account System Documentation

## Overview

This document provides comprehensive documentation of the sign-up process and multi-user account system in PromptReviews. The system is designed to support multiple users per account while maintaining proper authentication, authorization, and data isolation.

## Email Confirmation Setup (Long-Term Solution)

### **Configuration for Both Environments**

The system is configured to work seamlessly in both local development and production environments:

**Supabase Configuration (`supabase/config.toml`):**
```toml
[auth]
site_url = "https://app.promptreviews.app"
additional_redirect_urls = ["https://app.promptreviews.app", "http://localhost:3001"]
```

**How It Works:**
1. **Production**: `site_url` points to production domain
2. **Local Development**: `localhost:3001` is included in `additional_redirect_urls`
3. **Sign-Up Code**: Always uses `window.location.origin` for `emailRedirectTo`

### **Environment Detection**

The sign-up process automatically detects the environment:
- **Local Development**: `http://localhost:3001/auth/callback`
- **Production**: `https://app.promptreviews.app/auth/callback`

### **Deployment Considerations**

**Before Deploying to Production:**
- Ensure `site_url` is set to `https://app.promptreviews.app`
- Verify `additional_redirect_urls` includes both production and localhost URLs
- Run `supabase config push` to update the remote configuration

**For Local Development:**
- No configuration changes needed
- Email confirmation links will automatically point to localhost:3001
- Both environments are supported simultaneously

## Sign-Up Process Flow

### 1. User Registration (`/auth/sign-up`)

**File**: `src/app/auth/sign-up/page.tsx`

**Process**:
1. User fills out registration form with:
   - First Name
   - Last Name
   - Email
   - Password
2. Form validation ensures all fields are completed
3. Supabase Auth creates user account with metadata:
   ```typescript
   {
     email,
     password,
     options: {
       emailRedirectTo: `${window.location.origin}/auth/callback`,
       data: {
         first_name: firstName,
         last_name: lastName,
       },
     },
   }
   ```
4. Email confirmation is sent to user's email address
5. User is redirected to confirmation page

### 2. Email Confirmation (`/auth/callback`)

**File**: `src/app/auth/callback/route.ts`

**Process**:
1. User clicks email confirmation link
2. Link points to current environment (localhost:3001 or production)
3. Supabase processes the confirmation token
4. User is automatically signed in
5. Account creation process begins:
   - Creates account record in `accounts` table
   - Creates account_user record linking user to account
   - Creates default business profile
   - Redirects to plan selection page

### 3. Account Setup Flow

**After Email Confirmation**:
1. **Plan Selection**: User chooses subscription plan
2. **Business Creation**: User creates their first business
3. **Dashboard Access**: User gains access to full dashboard

## Multi-User Account System

### **Database Schema**

**Accounts Table**:
```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

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
1. Account owner invites user via email
2. User receives invitation email
3. User accepts invitation and joins account
4. User gains access to account's businesses

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
- Email confirmation checks
- Account access verification
- Role-based permissions

## Error Handling

### **Common Issues**

1. **Email Not Confirmed**:
   - Check if user clicked confirmation link
   - Verify email confirmation is enabled in Supabase
   - Check browser console for redirect URL logs

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
console.log('Sign-up redirect URL:', redirectUrl);
console.log('Current origin:', window.location.origin);

// In callback route
console.log('Auth callback triggered');
console.log('User data:', user);
```

## Testing

### **Local Development Testing**

1. **Sign-Up Flow**:
   ```bash
   npm run dev
   # Visit http://localhost:3001/auth/sign-up
   # Complete sign-up process
   # Check email confirmation link points to localhost:3001
   ```

2. **Email Confirmation**:
   - Click email confirmation link
   - Verify redirect to localhost:3001/auth/callback
   - Check account creation in database

3. **Multi-User Testing**:
   - Create multiple test accounts
   - Test user invitations
   - Verify account isolation

### **Production Testing**

1. **Deploy and Test**:
   - Ensure `site_url` is set to production domain
   - Test sign-up flow in production
   - Verify email confirmation links work

2. **Multi-Environment Verification**:
   - Test both local and production environments
   - Verify no cross-environment issues

## Maintenance

### **Regular Tasks**

1. **Configuration Updates**:
   - Keep Supabase configuration in sync
   - Update redirect URLs as needed
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
- Email confirmation success rates
- Account creation success rates
- Multi-user adoption rates

**Alerts**:
- Failed authentication attempts
- Database connection issues
- Email delivery failures

## Troubleshooting

### **Email Confirmation Issues**

**Problem**: Email links point to wrong environment
**Solution**: 
1. Check `supabase/config.toml` site_url setting
2. Verify `additional_redirect_urls` includes both environments
3. Run `supabase config push` to update remote configuration

**Problem**: Email confirmation not working locally
**Solution**:
1. Ensure development server is running on port 3001
2. Check that localhost:3001 is in additional_redirect_urls
3. Verify emailRedirectTo parameter in sign-up code

### **Account Creation Issues**

**Problem**: "Account not found" errors
**Solution**:
1. Check account creation in callback route
2. Verify RLS policies allow account creation
3. Review database permissions

**Problem**: Multi-user access denied
**Solution**:
1. Verify user is in account_users table
2. Check user role and permissions
3. Review RLS policies for account access

This documentation should be updated whenever changes are made to the authentication or multi-user systems. 
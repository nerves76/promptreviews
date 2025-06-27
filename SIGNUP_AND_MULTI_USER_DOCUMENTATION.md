# Sign-Up Process and Multi-User Account System Documentation

## Overview

This document provides comprehensive documentation of the sign-up process and multi-user account system in PromptReviews. The system is designed to support multiple users per account while maintaining proper authentication, authorization, and data isolation.

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
4. User receives confirmation email
5. User is redirected to confirmation page with instructions

**Key Features**:
- Email confirmation required before account activation
- User metadata stored for first/last name
- Analytics tracking for sign-up events
- Comprehensive error handling with user-friendly messages

### 2. Email Confirmation (`/auth/callback`)

**File**: `src/app/auth/callback/route.ts`

**Process**:
1. User clicks confirmation link in email
2. Callback route exchanges code for session
3. **Account Creation**: If user has no existing account:
   - Creates new `accounts` record with user's email as name
   - Creates `account_users` record linking user as "owner"
   - Sends welcome email
4. **Account Linking**: If user already has account links:
   - No new account created
   - User remains linked to existing account(s)
5. Redirects to dashboard

**Multi-User Support**:
- Each new user gets their own account by default
- Users can be added to multiple accounts later
- Account ownership is tracked via `account_users` table

## Database Schema for Multi-User Support

### Core Tables

#### `accounts` Table
```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  plan TEXT DEFAULT 'NULL',
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  custom_prompt_page_count INTEGER DEFAULT 0,
  contact_count INTEGER DEFAULT 0,
  first_name TEXT,
  last_name TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT,
  is_free_account BOOLEAN DEFAULT false,
  has_had_paid_plan BOOLEAN DEFAULT false,
  email TEXT,
  plan_lookup_key TEXT,
  review_notifications_enabled BOOLEAN DEFAULT true,
  user_id UUID
);
```

#### `account_users` Table
```sql
CREATE TABLE account_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(account_id, user_id)
);
```

### User Roles

The system supports three user roles with hierarchical permissions:

1. **Owner** (Level 3)
   - Full account control
   - Can manage all users and settings
   - Can delete account
   - Can change billing information

2. **Admin** (Level 2)
   - Can manage business profiles
   - Can manage users (except owners)
   - Can view analytics and reports
   - Cannot change billing or delete account

3. **Member** (Level 1)
   - Can view and manage content
   - Can create/edit prompt pages
   - Can manage widgets
   - Cannot manage users or account settings

## Multi-User Account Management

### Account Utilities (`src/utils/accountUtils.ts`)

The system provides comprehensive utilities for managing multi-user accounts:

#### Core Functions

**`getUserAccounts(supabase, userId)`**
- Returns all accounts a user belongs to
- Used for account switching and permissions

**`getAccountUsers(supabase, accountId)`**
- Returns all users in an account
- Used for user management interface

**`addUserToAccount(supabase, accountId, userId, role)`**
- Adds a user to an account with specified role
- Used for inviting team members

**`removeUserFromAccount(supabase, accountId, userId)`**
- Removes a user from an account
- Used for team management

**`updateUserRole(supabase, accountId, userId, role)`**
- Updates a user's role within an account
- Used for role management

**`userHasRole(supabase, accountId, userId, role)`**
- Checks if user has specific role or higher
- Used for permission checks

### Permission System

The permission system uses role hierarchy:
```typescript
const roleHierarchy = { owner: 3, admin: 2, member: 1 };
```

Users with higher roles can perform actions of lower roles. For example:
- Owners can perform all admin and member actions
- Admins can perform all member actions
- Members can only perform member-level actions

## Authentication Flow

### 1. Initial Sign-Up
```
User Registration → Email Confirmation → Account Creation → Dashboard
```

### 2. Subsequent Sign-Ins
```
Sign-In → Session Validation → Account Selection → Dashboard
```

### 3. Multi-Account Access
```
User can belong to multiple accounts → Account switcher → Role-based access
```

## Security Considerations

### Row-Level Security (RLS)

The system uses Supabase RLS policies to ensure data isolation:

#### `account_users` RLS Policies
```sql
-- Users can only see account_users records they're part of
CREATE POLICY "Users can view their own account memberships" ON account_users
  FOR SELECT USING (auth.uid() = user_id);

-- Account owners can manage users in their accounts
CREATE POLICY "Account owners can manage users" ON account_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = account_users.account_id
      AND au.user_id = auth.uid()
      AND au.role = 'owner'
    )
  );
```

#### `accounts` RLS Policies
```sql
-- Users can only see accounts they belong to
CREATE POLICY "Users can view their accounts" ON accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM account_users
      WHERE account_id = accounts.id
      AND user_id = auth.uid()
    )
  );
```

### API Authentication

All API routes use the unified authentication utility:
```typescript
const { user, supabase: authSupabase, error: authError } = await authenticateApiRequest(request);
if (authError || !user) {
  return NextResponse.json({ error: "Authentication required" }, { status: 401 });
}
```

## Future Multi-User Features

### Planned Enhancements

1. **Account Invitations**
   - Email-based invitation system
   - Role assignment during invitation
   - Invitation expiration and management

2. **Account Switching**
   - UI for switching between accounts
   - Session management for multiple accounts
   - Account-specific settings

3. **Team Management Interface**
   - User management dashboard
   - Role assignment interface
   - Activity logs and audit trails

4. **Billing Integration**
   - Account-level billing
   - User-based usage tracking
   - Role-based billing permissions

### Implementation Guidelines

When adding new features that support multi-user accounts:

1. **Always check user permissions** using `userHasRole()`
2. **Use account context** for data isolation
3. **Implement proper RLS policies** for new tables
4. **Add audit logging** for user management actions
5. **Test with multiple users** in the same account

## Testing Multi-User Scenarios

### Test Cases

1. **New User Sign-Up**
   - Verify account creation
   - Verify owner role assignment
   - Verify welcome email

2. **Existing User Sign-In**
   - Verify account access
   - Verify role-based permissions
   - Verify data isolation

3. **Multi-Account User**
   - Verify account switching
   - Verify role inheritance
   - Verify data access controls

4. **User Management**
   - Verify user invitation
   - Verify role changes
   - Verify user removal

### Test Data Setup

```sql
-- Create test accounts
INSERT INTO accounts (name, email) VALUES 
  ('Test Account 1', 'test1@example.com'),
  ('Test Account 2', 'test2@example.com');

-- Create test users
INSERT INTO auth.users (email, encrypted_password) VALUES 
  ('user1@example.com', 'hashed_password'),
  ('user2@example.com', 'hashed_password');

-- Link users to accounts
INSERT INTO account_users (account_id, user_id, role) VALUES 
  ('account1_id', 'user1_id', 'owner'),
  ('account1_id', 'user2_id', 'member'),
  ('account2_id', 'user1_id', 'admin');
```

## Troubleshooting

### Common Issues

1. **"User not found in account"**
   - Check `account_users` table for user-account link
   - Verify RLS policies are working correctly

2. **"Insufficient permissions"**
   - Check user role in `account_users` table
   - Verify role hierarchy logic

3. **"Account not found"**
   - Check if account exists in `accounts` table
   - Verify user has access to account via `account_users`

### Debug Queries

```sql
-- Check user's accounts
SELECT a.* FROM accounts a
JOIN account_users au ON a.id = au.account_id
WHERE au.user_id = 'user_id_here';

-- Check account users
SELECT au.*, u.email FROM account_users au
JOIN auth.users u ON au.user_id = u.id
WHERE au.account_id = 'account_id_here';

-- Check user permissions
SELECT role FROM account_users
WHERE account_id = 'account_id_here' AND user_id = 'user_id_here';
```

## Conclusion

The sign-up process and multi-user account system provide a robust foundation for team collaboration while maintaining security and data isolation. The system is designed to scale from single users to large teams with proper role-based access control.

Key principles:
- **Security first**: All data access is controlled by RLS policies
- **Role-based access**: Clear permission hierarchy
- **Scalable design**: Supports unlimited users per account
- **Audit trail**: All user management actions are logged
- **Future-ready**: Architecture supports planned enhancements

For questions or issues related to the multi-user system, refer to the troubleshooting section or contact the development team. 
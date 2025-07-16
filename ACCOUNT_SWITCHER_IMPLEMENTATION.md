# Account Switcher Implementation

## Overview

The account switcher functionality allows users to seamlessly switch between multiple accounts they belong to, with a primary use case being customer support where administrators can be invited to customer accounts to help debug issues.

## ✅ **What Was Implemented**

### 1. Account Selection State Management (`src/utils/accountSelection.ts`)
- **Purpose**: Manages user's manual account selection with localStorage persistence
- **Key Features**:
  - `useAccountSelection()` React hook for managing state
  - `UserAccount` interface with role, plan, and account metadata
  - localStorage persistence with user-specific keys
  - Validation of stored account selections
  - Automatic fallback to primary account algorithm when no manual selection

### 2. AccountSwitcher UI Component (`src/app/components/AccountSwitcher.tsx`)
- **Purpose**: Provides intuitive dropdown interface for account switching
- **Key Features**:
  - Only renders when user has multiple accounts (`hasMultipleAccounts`)
  - Shows current account with role badges and plan information
  - Dropdown with all available accounts
  - Visual indicators: "Default" for algorithmic choice, "Current" for selected
  - Role-based color coding (owner: blue, admin: purple, member: green)
  - Plan-based color coding (maven: yellow, builder: blue, grower: green)
  - Customer support explanation in footer
  - Page reload after account switch to refresh all data

### 3. Modified Account Selection Logic (`src/utils/accountUtils.ts`)
- **Purpose**: Enhanced `getAccountIdForUser()` to respect manual selections
- **Priority Order**:
  1. **Manual Selection** (NEW): User's manually chosen account
  2. **Team Accounts with Plans**: `role='member'` with valid plan
  3. **Owned Accounts with Plans**: `role='owner'` with valid plan  
  4. **Any Team Account**: Fallback for teams without plan info
  5. **Any Account**: Last resort

### 4. Header Integration (`src/app/components/Header.tsx`)
- **Desktop**: AccountSwitcher placed between navigation and notifications
- **Mobile**: AccountSwitcher added to mobile menu dropdown
- **Responsive**: Hidden on small screens, visible on `md:` and larger

## 🎯 **Use Cases Supported**

### Primary: Customer Support
1. **Customer invites admin** to their account via team management
2. **Admin receives invitation** via email notification system
3. **Admin accepts invitation** and gets `role='member'` on customer account
4. **Admin visits dashboard** and sees AccountSwitcher with multiple accounts
5. **Admin switches to customer account** to debug their specific issues
6. **Admin has full access** to customer's data within role permissions

### Secondary: Team Management
1. **Business owners** can invite team members to collaborate
2. **Team members** can switch between multiple business accounts
3. **Admins** can manage multiple client accounts efficiently

## 📁 **Files Modified/Created**

### New Files:
- `src/utils/accountSelection.ts` - State management for account switching
- `src/app/components/AccountSwitcher.tsx` - UI component for account switching

### Modified Files:
- `src/utils/accountUtils.ts` - Enhanced getAccountIdForUser with manual selection
- `src/app/components/Header.tsx` - Added AccountSwitcher to desktop and mobile headers

## 🔧 **How It Works**

### Account Selection Flow:
1. **Page Load**: `useAccountSelection()` hook loads user's available accounts
2. **Check Storage**: Looks for manually selected account in localStorage
3. **Validate Selection**: Ensures stored selection is still valid/accessible
4. **Fallback Logic**: Uses automatic algorithm if no valid manual selection
5. **Render UI**: Shows AccountSwitcher only if user has multiple accounts

### Switching Process:
1. **User clicks AccountSwitcher** dropdown
2. **Shows all accounts** with current selection highlighted
3. **User selects different account**
4. **Updates localStorage** with new selection
5. **Reloads page** to refresh all data with new account context

### Data Persistence:
- **localStorage Key**: `promptreviews_selected_account_{userId}`
- **Validation**: Checks account still exists and user has access
- **Cleanup**: Invalid selections are automatically cleared

## 🎨 **UI/UX Design**

### Current Account Display:
- **Account Icon**: First letter of account name in brand color circle
- **Account Name**: Business name or user's full name
- **Role Badge**: Color-coded role indicator (owner/admin/member)
- **Dropdown Arrow**: Indicates interactive element

### Dropdown Interface:
- **Header**: "Switch Account" with explanation
- **Account List**: All accounts with rich metadata
- **Visual Indicators**: 
  - "Default" badge for algorithmic choice
  - "Current" badge for active selection
  - Checkmark icon for selected account
- **Footer**: Customer support explanation

### Accessibility:
- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Clear focus indicators
- **Click Outside**: Closes dropdown when clicking elsewhere

## 🔒 **Security Considerations**

### Access Control:
- **RLS Enforcement**: All database queries respect Row Level Security
- **Role Validation**: Account access validated on every request
- **Session Integrity**: User authentication required for all operations

### Data Isolation:
- **Account Context**: All APIs use selected account for data filtering
- **Permission Boundaries**: Users only see data they have legitimate access to
- **Invalid Selection Handling**: Graceful fallback when access is revoked

## 🚀 **Testing Strategy**

### Manual Testing Scenarios:
1. **Single Account User**: AccountSwitcher should not render
2. **Multi-Account User**: AccountSwitcher appears with proper accounts
3. **Account Switching**: Selection persists across page reloads
4. **Invalid Storage**: Graceful handling of corrupted localStorage
5. **Access Revocation**: Proper fallback when account access is removed
6. **Mobile Interface**: AccountSwitcher works in mobile menu

### Edge Cases Handled:
- **No accounts found**: Graceful error handling
- **Network errors**: Error states in useAccountSelection hook
- **Stale data**: Validation of account access on each load
- **Storage failures**: Fallback to automatic selection algorithm

## 💡 **Future Enhancements**

### Potential Improvements:
1. **Real-time Updates**: WebSocket notifications for account changes
2. **Account Metadata**: Show additional context (business type, plan status)
3. **Recent Accounts**: Quick access to recently used accounts
4. **Account Search**: Search functionality for users with many accounts
5. **Keyboard Shortcuts**: Quick account switching with hotkeys

### Performance Optimizations:
1. **Caching**: Cache account list in React Query/SWR
2. **Lazy Loading**: Load account details on-demand
3. **Prefetching**: Preload data for likely account switches

## 🎉 **Success Metrics**

The implementation successfully enables:
- ✅ **Multi-account access** with single email address
- ✅ **Customer support workflows** via account invitation
- ✅ **Intuitive account switching** with persistent selection
- ✅ **Secure data isolation** between accounts
- ✅ **Responsive design** for desktop and mobile
- ✅ **Accessible interface** with proper ARIA support

## 📞 **Support Use Case Example**

1. **Customer** has an issue with their widget configuration
2. **Customer sends support request** to admin email
3. **Admin responds**: "I can help! Please invite chris@diviner.io to your account"
4. **Customer goes** to Dashboard → Team → Add User → chris@diviner.io (member role)
5. **Admin receives email** notification about team invitation  
6. **Admin logs into dashboard** and sees AccountSwitcher with customer's account
7. **Admin switches** to customer account and sees their exact data/settings
8. **Admin debugs issue** directly in customer's environment
9. **Admin fixes problem** and switches back to own account
10. **Customer is happy** with fast, accurate support!

This implementation transforms customer support from "send screenshots" to "let me log in and fix it directly" - dramatically improving support quality and speed. 
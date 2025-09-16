# AuthContext Splitting Plan

## Current State
- **File**: `/src/auth/context/AuthContext.tsx`
- **Size**: 1197 lines (Target: <500 lines per file)
- **Mixed Concerns**: Authentication, Payment, Business, Admin, Account Management

## Proposed Split Architecture

### 1. **CoreAuthContext.tsx** (~300 lines)
Core authentication functionality only
- User/Session management
- Sign in/out/up methods
- Email verification
- Basic loading/error states

### 2. **AccountContext.tsx** (~250 lines)
Account and multi-account management
- Account selection
- Account switching
- Account data fetching
- Account caching

### 3. **BusinessContext.tsx** (~200 lines)
Business profile management
- Business data fetching
- Business validation
- Business caching
- Business guards

### 4. **AdminContext.tsx** (~150 lines)
Admin functionality
- Admin status checking
- Admin caching
- Admin-specific methods

### 5. **SubscriptionContext.tsx** (~300 lines)
Payment and subscription management
- Trial status
- Plan management
- Payment status
- Billing history
- Subscription lifecycle

## Implementation Strategy

1. **Create new context files** with focused responsibilities
2. **Create a composite provider** that combines all contexts
3. **Maintain backward compatibility** with existing AuthContext exports
4. **Use React Context composition** to share state between contexts
5. **Implement proper TypeScript types** for each context

## Benefits
- **Separation of Concerns**: Each context handles one domain
- **Better Performance**: Components only subscribe to needed state
- **Easier Testing**: Smaller, focused units
- **Maintainability**: Clear boundaries and responsibilities
- **Code Reusability**: Contexts can be used independently

## Migration Path
1. Create new context files
2. Move logic piece by piece
3. Create composite provider
4. Update imports gradually
5. Deprecate old AuthContext over time
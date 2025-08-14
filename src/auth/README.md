# Authentication Module

## Structure Overview

The authentication system has been reorganized into a modular structure for better maintainability and clarity.

### Directory Structure

```
/src/auth/
├── context/           # Core authentication context and state
│   ├── AuthContext.tsx      # Main auth context (still large, but references modular parts)
│   ├── PaymentContext.tsx   # Payment/subscription state calculations
│   └── SessionContext.tsx   # Session timing and expiry management
├── guards/            # Route protection components
│   └── BusinessGuard.tsx    # Ensures user has business profile
├── hooks/             # Custom React hooks for auth
│   └── useAuth.ts          # All auth-related hooks
├── providers/         # External service providers
│   └── supabase.ts         # Supabase client configuration
├── types/             # TypeScript type definitions
│   └── auth.types.ts       # All auth-related types
├── utils/             # Utility functions
│   ├── admin.ts            # Admin role management
│   ├── accounts.ts         # Multi-account management
│   └── accountSelection.ts # Account switching logic
└── index.ts           # Main module exports
```

### Database Structure

SQL migrations are located in `/supabase/migrations/`

## Usage

### Import Everything from Main Export

```typescript
import { 
  AuthProvider,
  useAuth,
  useIsAdmin,
  BusinessGuard,
  // ... other exports
} from '@/auth';
```

### Or Import from Specific Modules

```typescript
import { useAuth } from '@/auth/hooks';
import { BusinessGuard } from '@/auth/guards/BusinessGuard';
import { isAdmin } from '@/auth/utils/admin';
```

## Key Components

### AuthContext (Refactored)
- **Location**: Split across multiple files in `/src/auth/context/`
- **Size**: All files now under 400 lines
- **Purpose**: Modular auth state management
- **Architecture**: 
  - CoreAuthContext (338 lines) - Core authentication
  - AccountContext (303 lines) - Account management
  - BusinessContext (322 lines) - Business profiles
  - AdminContext (178 lines) - Admin functionality
  - SubscriptionContext (337 lines) - Payments/subscriptions
  - CompositeAuthProvider (111 lines) - Combines all contexts
  - AuthContext (79 lines) - Backward compatibility wrapper

### Multi-Account System
- **Priority Order**:
  1. Manually selected account (localStorage)
  2. Team accounts with plans
  3. Owned accounts with plans
  4. Any team account
  5. Fallback to any account

### Admin System
- **Implementation**: Simple `is_admin` boolean in accounts table
- **Auto-grant**: Based on `ADMIN_EMAILS` environment variable
- **Check**: `isAdmin()` function with 5-minute cache

## Known Issues

1. **RLS Disabled**: Row Level Security temporarily disabled due to auth conflicts (see RLS_STATUS_DOCUMENTATION.md)
2. **Race Conditions**: Session timing issues during OAuth flows
3. **Loading States**: Multiple loading flags that can get stuck
4. **Cache Timing**: Aggressive caching may cause stale data

## Future Improvements

### Short-term
- [x] Split AuthContext into smaller contexts ✅ COMPLETED
- [ ] Re-enable RLS with proper auth compatibility
- [ ] Add proper error boundaries
- [ ] Implement retry logic with exponential backoff
- [ ] Add debug mode for development

### Long-term
- [ ] Move to JWT-based role management
- [ ] Implement proper RBAC system
- [ ] Add audit logging
- [ ] Create auth microservice

## Migration Notes

### Import Path Changes
- `@/contexts/AuthContext` → `@/auth`
- `@/components/BusinessGuard` → `@/auth/guards/BusinessGuard`
- `@/utils/admin` → `@/auth/utils/admin`
- `@/utils/accountUtils` → `@/auth/utils/accounts`
- `@/utils/supabaseClient` → `@/auth/providers/supabase`

### Files Kept in Original Locations
- `/src/contexts/AuthContext.tsx` - Keep for backward compatibility
- `/src/utils/*.ts` - Original auth utils kept but imports updated

## Testing

Run `npm run build` to verify all imports are correct.

The build should complete with only OpenTelemetry warnings, no auth-related errors.
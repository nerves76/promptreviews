# Migration Guide: Optimizing Components for Token Refresh

## Before (Causes Re-renders on Token Refresh)

```typescript
// ❌ BAD: Using entire auth context
import { useAuth } from '@/auth/context';

export function MyComponent() {
  const { user, session, account, business } = useAuth();
  
  // This component re-renders on EVERY auth change including token refreshes
  
  return (
    <div>
      <h1>Welcome {user?.email}</h1>
      <p>Account: {account?.account_name}</p>
    </div>
  );
}
```

## After (No Re-renders on Token Refresh)

```typescript
// ✅ GOOD: Using granular hooks
import { useAuthUser, useAccountData } from '@/auth/hooks/granularAuthHooks';

export function MyComponent() {
  const { user } = useAuthUser();
  const { accountName } = useAccountData();
  
  // This component ONLY re-renders when user or account actually changes
  
  return (
    <div>
      <h1>Welcome {user?.email}</h1>
      <p>Account: {accountName}</p>
    </div>
  );
}
```

## Migration Examples

### Example 1: Widget Page

**Before:**
```typescript
export default function WidgetPage() {
  const { user, session, account } = useAuth();
  const supabase = createClient();
  
  const fetchWidgets = async () => {
    const token = session?.access_token;
    // Fetches with token from session
  };
}
```

**After:**
```typescript
import { useAccountData } from '@/auth/hooks/granularAuthHooks';
import { apiClient } from '@/utils/apiClient';

export default function WidgetPage() {
  const { accountId } = useAccountData();
  
  const fetchWidgets = async () => {
    // Token handled automatically by apiClient
    const widgets = await apiClient.get(`/widgets?account=${accountId}`);
  };
}
```

### Example 2: Review Management Modal

**Before:**
```typescript
const ReviewManagementModal = () => {
  const { user, session } = useAuth();
  const supabase = createClient();
  
  useEffect(() => {
    // Re-runs on every token refresh!
    if (session) {
      loadReviews();
    }
  }, [session]);
};
```

**After:**
```typescript
import { useAuthUser } from '@/auth/hooks/granularAuthHooks';
import { apiClient } from '@/utils/apiClient';

const ReviewManagementModal = () => {
  const { userId } = useAuthUser();
  
  useEffect(() => {
    // Only re-runs when user actually changes
    if (userId) {
      loadReviews();
    }
  }, [userId]);
};
```

### Example 3: Dashboard

**Before:**
```typescript
const Dashboard = () => {
  const { 
    user, 
    session, 
    account, 
    business, 
    isLoading 
  } = useAuth();
  
  // Entire dashboard re-renders on token refresh
};
```

**After:**
```typescript
import { 
  useAuthUser, 
  useAccountData, 
  useBusinessData, 
  useAuthLoading 
} from '@/auth/hooks/granularAuthHooks';

const Dashboard = () => {
  const { user } = useAuthUser();
  const { account } = useAccountData();
  const { business } = useBusinessData();
  const { isLoading } = useAuthLoading();
  
  // Each hook only triggers re-renders for its specific data
};
```

## API Call Migration

### Before (Manual Token Management):
```typescript
const saveWidget = async (data) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch('/api/widgets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
};
```

### After (Automatic Token Management):
```typescript
import { apiClient } from '@/utils/apiClient';

const saveWidget = async (data) => {
  // Token automatically handled, no re-renders
  const widget = await apiClient.post('/widgets', data);
};
```

## Quick Migration Checklist

1. **Replace `useAuth()` with granular hooks:**
   - `useAuthUser()` - For user data
   - `useAccountData()` - For account data
   - `useBusinessData()` - For business data
   - `useAuthLoading()` - For loading states
   - `useAuthActions()` - For auth methods

2. **Replace manual API calls with `apiClient`:**
   - No more manual token management
   - Automatic retry on 401
   - No React dependencies

3. **Remove session dependencies from useEffect:**
   - Don't watch `session` for changes
   - Use specific data like `userId` instead

4. **Use TokenManager for background operations:**
   - Polling
   - WebSocket authentication
   - Background sync

## Testing Your Migration

1. **Open browser DevTools**
2. **Add console log in component:**
   ```typescript
   console.log('Component rendered:', Date.now());
   ```
3. **Wait for token refresh** (or simulate with short expiry)
4. **Verify no console logs** appear during token refresh

## Rollback Strategy

If issues occur, you can run both systems in parallel:

```typescript
// Use feature flag
const useOptimizedAuth = process.env.NEXT_PUBLIC_USE_OPTIMIZED_AUTH === 'true';

export function MyComponent() {
  const auth = useOptimizedAuth 
    ? useAuthUser() 
    : useAuth();
    
  // Rest of component
}
```

## Common Pitfalls

1. **Don't pass entire auth object as props** - Pass specific values
2. **Don't use session for user info** - Use user object
3. **Don't manually refresh tokens** - Let TokenManager handle it
4. **Don't mix old and new patterns** - Migrate entire component

## Performance Gains

After migration, you should see:
- ✅ 0 re-renders on token refresh
- ✅ 50-80% reduction in render count
- ✅ No form data loss
- ✅ No modal closures
- ✅ Stable UI during auth events
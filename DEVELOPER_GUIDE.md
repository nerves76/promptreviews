# Developer Guide: Fixing React Hook Dependencies

## Quick Reference for Common Hook Dependency Issues

### 1. Function Dependencies in useEffect

**❌ Before (causes warnings):**
```javascript
const loadData = async () => {
  // fetch data
};

useEffect(() => {
  loadData();
}, []); // ⚠️ Warning: missing 'loadData' dependency
```

**✅ After (using utility):**
```javascript
import { useStableCallback } from '@/utils/hookHelpers';

const loadData = useStableCallback(async () => {
  // fetch data
});

useEffect(() => {
  loadData();
}, []); // ✅ No warning, stable function reference
```

### 2. Multiple Function Dependencies

**❌ Before:**
```javascript
useEffect(() => {
  checkAuth();
  loadData();
  initializeApp();
}, [user?.id]); // ⚠️ Missing multiple function dependencies
```

**✅ After:**
```javascript
import { useStableEffect } from '@/utils/hookHelpers';

useStableEffect(() => {
  checkAuth();
  loadData();
  initializeApp();
}, [user?.id]); // ✅ Automatically handles function dependencies
```

### 3. Debounced Effects

**❌ Before:**
```javascript
useEffect(() => {
  const timeout = setTimeout(() => {
    validateForm();
  }, 300);
  
  return () => clearTimeout(timeout);
}, [formData]); // Can cause excessive API calls
```

**✅ After:**
```javascript
import { useDebouncedEffect } from '@/utils/hookHelpers';

useDebouncedEffect(() => {
  validateForm();
}, [formData], 300); // ✅ Automatic debouncing
```

### 4. One-time Effects

**❌ Before:**
```javascript
useEffect(() => {
  initializeAnalytics();
}, []); // May run multiple times in development
```

**✅ After:**
```javascript
import { useOnce } from '@/utils/hookHelpers';

useOnce(() => {
  initializeAnalytics();
}); // ✅ Guaranteed to run only once
```

## Systematic Fix Process

### Step 1: Import Utilities
```javascript
import { 
  useStableCallback, 
  useStableEffect, 
  useDebouncedEffect, 
  useOnce 
} from '@/utils/hookHelpers';
```

### Step 2: Identify Hook Pattern
- **Functions in deps**: Use `useStableCallback` or `useStableEffect`
- **Frequent updates**: Use `useDebouncedEffect`
- **One-time setup**: Use `useOnce`
- **Complex dependencies**: Use `useStableEffect`

### Step 3: Apply Appropriate Fix
Choose the utility that best matches your use case from the examples above.

## Priority Files to Fix

Based on the linting output, focus on these files first:

1. `src/contexts/AuthContext.tsx` - Core authentication logic
2. `src/app/dashboard/page.tsx` - Main dashboard
3. `src/app/dashboard/layout.tsx` - Dashboard layout
4. `src/app/components/Header.tsx` - Navigation component

## Validation

After applying fixes:

```bash
# Check specific file
npm run lint -- src/contexts/AuthContext.tsx

# Check overall improvement
npm run lint | grep "react-hooks/exhaustive-deps" | wc -l
```

## Best Practices

1. **Always use utilities for function dependencies**
2. **Prefer `useStableEffect` over manual `useCallback` + `useEffect`**
3. **Use `useDebouncedEffect` for search/validation**
4. **Use `useOnce` for initialization logic**
5. **Keep dependency arrays minimal and explicit**

## Common Anti-patterns to Avoid

❌ **Don't ignore the warnings by disabling the rule**
❌ **Don't add functions directly to dependency arrays**
❌ **Don't use empty dependency arrays when you need dependencies**
✅ **Do use the provided utilities to create stable references**
✅ **Do think about what your effect actually depends on**
✅ **Do test your components after making changes**
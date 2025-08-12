# Google Business Profile Integration Resilience Plan

## 1. Data Validation & Type Safety

### Add Zod Schema Validation
Create schemas to validate API responses before using them:

```typescript
// src/lib/schemas/google-business.ts
import { z } from 'zod';

export const GoogleLocationSchema = z.object({
  location_id: z.string().optional(),
  id: z.string().optional(),
  location_name: z.string().optional(),
  name: z.string().optional(),
  address: z.string().optional(),
  status: z.string().optional(),
}).refine(data => data.location_id || data.id, {
  message: "Location must have either location_id or id"
});

export const GooglePlatformSchema = z.object({
  id: z.string(),
  name: z.string(),
  connected: z.boolean(),
  locations: z.array(GoogleLocationSchema).optional().default([]),
  error: z.string().optional()
});

// Use in API:
const validated = GooglePlatformSchema.parse(apiResponse);
```

## 2. Error Boundaries & Fallbacks

### Component Error Boundary
```typescript
// src/components/GoogleBusinessErrorBoundary.tsx
class GoogleBusinessErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    // Log to monitoring service
    console.error('Google Business Error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 rounded-lg">
          <h3>Google Business Profile temporarily unavailable</h3>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

## 3. Defensive Data Transformation

### Safe Location Transformer
```typescript
// src/lib/transformers/google-locations.ts
export function safeTransformLocation(
  loc: unknown, 
  index: number
): TransformedLocation {
  // Always return a valid object, never throw
  try {
    const raw = loc as any;
    
    // Multiple fallback strategies for ID
    const id = 
      raw?.location_id || 
      raw?.id || 
      raw?.name?.replace(/\s+/g, '-').toLowerCase() ||
      `fallback-location-${index}-${Date.now()}`;
    
    // Safe name extraction with multiple fallbacks
    const name = 
      raw?.location_name || 
      raw?.name || 
      raw?.title ||
      (raw?.address ? `Business at ${raw.address.split(',')[0]}` : null) ||
      `Location ${index + 1}`;
    
    return {
      id,
      name,
      address: raw?.address || '',
      status: 'unknown', // Don't trust status field
      _raw: raw, // Keep raw data for debugging
      _transformedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Failed to transform location ${index}:`, error);
    return {
      id: `error-location-${index}`,
      name: `Location ${index + 1}`,
      address: '',
      status: 'error',
      _error: String(error)
    };
  }
}
```

## 4. API Response Interceptor

### Add Response Validation Layer
```typescript
// src/lib/api/google-business-client.ts
class GoogleBusinessAPIClient {
  private async fetchWithValidation<T>(
    url: string, 
    schema: z.ZodSchema<T>,
    options?: RequestInit
  ): Promise<T> {
    try {
      // Add timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...options?.headers,
          'X-Request-ID': crypto.randomUUID(), // For tracking
        }
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new APIError(response.status, await response.text());
      }
      
      const data = await response.json();
      
      // Validate response structure
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Invalid API response structure:', error.errors);
        // Return safe default
        throw new ValidationError('Invalid response from Google Business API');
      }
      throw error;
    }
  }
}
```

## 5. State Management Improvements

### Use Reducer for Complex State
```typescript
// src/hooks/useGoogleBusiness.ts
type State = {
  isConnected: boolean;
  locations: Location[];
  selectedLocations: string[];
  isLoading: boolean;
  error: string | null;
  lastFetch: Date | null;
};

type Action = 
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Location[] }
  | { type: 'FETCH_ERROR'; error: string }
  | { type: 'DISCONNECT' }
  | { type: 'SELECT_LOCATION'; id: string }
  | { type: 'DESELECT_LOCATION'; id: string };

function googleBusinessReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null };
    
    case 'FETCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        locations: action.payload,
        isConnected: action.payload.length > 0,
        lastFetch: new Date(),
        error: null
      };
    
    case 'FETCH_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.error,
        // Keep existing data on error
      };
    
    case 'DISCONNECT':
      return {
        isConnected: false,
        locations: [],
        selectedLocations: [],
        isLoading: false,
        error: null,
        lastFetch: null
      };
    
    default:
      return state;
  }
}
```

## 6. Add Integration Tests

### Critical Path Tests
```typescript
// src/__tests__/google-business-integration.test.ts
describe('Google Business Integration', () => {
  it('handles undefined location.id gracefully', () => {
    const location = { name: 'Test', address: '123 Main' };
    const result = safeTransformLocation(location, 0);
    expect(result.id).toBeDefined();
    expect(result.id).not.toBe('undefined');
  });
  
  it('handles disconnect and reconnect flow', async () => {
    // Test the full disconnect/reconnect cycle
  });
  
  it('prevents selecting all locations on single click', () => {
    // Test checkbox isolation
  });
});
```

## 7. Add Health Check Endpoint

```typescript
// src/app/api/health/google-business/route.ts
export async function GET() {
  const checks = {
    database: false,
    api: false,
    tokens: false,
  };
  
  try {
    // Check database connection
    const { data } = await supabase
      .from('google_business_profiles')
      .select('count')
      .limit(1);
    checks.database = true;
    
    // Check if tokens exist
    const { data: tokens } = await supabase
      .from('google_business_profiles')
      .select('id')
      .limit(1);
    checks.tokens = !!tokens?.length;
    
    // Quick API validation (if tokens exist)
    if (checks.tokens) {
      // Lightweight API check
      checks.api = true;
    }
    
    return NextResponse.json({
      status: Object.values(checks).every(v => v) ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      checks,
      error: String(error),
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
```

## 8. Add Retry Logic

```typescript
// src/lib/utils/retry.ts
export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on 4xx errors (except 429)
      if (error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error;
      }
      
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}
```

## 9. Add Monitoring & Alerting

```typescript
// src/lib/monitoring/google-business.ts
class GoogleBusinessMonitor {
  private static errors: Error[] = [];
  
  static logError(error: Error, context: Record<string, any>) {
    this.errors.push(error);
    
    // Send to monitoring service
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        tags: {
          component: 'google-business',
          ...context
        }
      });
    }
    
    // Alert if error rate is high
    if (this.errors.filter(e => 
      Date.now() - e.timestamp < 60000
    ).length > 5) {
      console.error('HIGH ERROR RATE in Google Business integration');
    }
  }
}
```

## 10. Feature Flags for Gradual Rollout

```typescript
// src/lib/feature-flags.ts
export const GoogleBusinessFlags = {
  USE_NEW_DISCONNECT_FLOW: process.env.NEXT_PUBLIC_GB_NEW_DISCONNECT === 'true',
  ENABLE_RETRY_LOGIC: process.env.NEXT_PUBLIC_GB_RETRY === 'true',
  USE_VALIDATION: process.env.NEXT_PUBLIC_GB_VALIDATE === 'true',
  DEBUG_MODE: process.env.NEXT_PUBLIC_GB_DEBUG === 'true',
};

// Usage:
if (GoogleBusinessFlags.USE_VALIDATION) {
  data = GoogleLocationSchema.parse(response);
} else {
  data = response;
}
```

## 11. Add Circuit Breaker Pattern

```typescript
// src/lib/circuit-breaker.ts
class CircuitBreaker {
  private failures = 0;
  private lastFailTime: Date | null = null;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailTime > 30000) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
      }
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailTime = new Date();
      
      if (this.failures >= 5) {
        this.state = 'OPEN';
      }
      throw error;
    }
  }
}
```

## 12. Add Data Consistency Checks

```typescript
// src/lib/validation/consistency.ts
export function validateLocationConsistency(locations: Location[]): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check for duplicate IDs
  const ids = locations.map(l => l.id);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    issues.push('Duplicate location IDs detected');
  }
  
  // Check for required fields
  locations.forEach((loc, i) => {
    if (!loc.id) {
      issues.push(`Location ${i} missing ID`);
    }
    if (!loc.name && !loc.address) {
      issues.push(`Location ${i} missing both name and address`);
    }
  });
  
  return {
    valid: issues.length === 0,
    issues
  };
}
```

## Implementation Priority

1. **Immediate** (Do now):
   - Data validation with Zod
   - Safe transformation functions
   - Error boundaries

2. **Short-term** (This week):
   - Integration tests
   - Health check endpoint
   - Retry logic

3. **Medium-term** (This month):
   - Monitoring & alerting
   - Circuit breaker
   - Feature flags

4. **Long-term** (This quarter):
   - Full state management refactor
   - Comprehensive test suite
   - Performance optimizations

## Success Metrics

- Zero TypeError crashes in production
- < 0.1% failed disconnect attempts
- < 1s average response time for location fetching
- 99.9% uptime for Google Business features
- < 5 user complaints per month about Google Business integration
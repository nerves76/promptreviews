# Authentication System Refactor Plan

## 🎯 Goal
Simplify and modernize the authentication system to eliminate the complex multi-step failures and provide a robust, maintainable solution using best practices.

## 🚨 Current Problems to Fix
1. **Overly Complex Flow**: Multiple APIs, silent failures, complex retry logic
2. **Inconsistent Session Management**: Custom API vs. Supabase client conflicts
3. **Silent Account Creation Failures**: Users can exist without proper accounts
4. **Middleware Complexity**: Different behavior in dev/prod, complex session checks
5. **Poor Error Handling**: Masked failures, unclear error states
6. **Database Relationship Issues**: Manual management of auth.users ↔ accounts ↔ account_users

## 📋 Refactor Strategy

### Phase 1: Database Schema Simplification
### Phase 2: Authentication Flow Modernization  
### Phase 3: Session Management Cleanup
### Phase 4: Error Handling Improvement
### Phase 5: Testing & Monitoring

---

## 🗄️ Phase 1: Database Schema Simplification

### 1.1 Use Supabase Database Triggers (Recommended)
**Replace manual account creation with automatic triggers**

```sql
-- Create function to automatically create account when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.accounts (
    id,
    email,
    first_name,
    last_name,
    plan,
    trial_start,
    trial_end,
    is_free_account,
    custom_prompt_page_count,
    contact_count,
    created_at,
    has_seen_welcome,
    review_notifications_enabled
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'grower',
    NOW(),
    NOW() + INTERVAL '14 days',
    false,
    0,
    0,
    NOW(),
    false,
    true
  );

  INSERT INTO public.account_users (
    account_id,
    user_id,
    role,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.id,
    'owner',
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires when user confirms email
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();
```

**Benefits:**
- ✅ Atomic account creation (no partial states)
- ✅ No API calls needed during signup
- ✅ Consistent data across all signups
- ✅ Eliminates race conditions

### 1.2 Cleanup Existing Tables
```sql
-- Add constraints to ensure data integrity
ALTER TABLE accounts ADD CONSTRAINT accounts_user_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE account_users ADD CONSTRAINT account_users_unique_user_account 
  UNIQUE (user_id, account_id);
```

---

## 🔐 Phase 2: Authentication Flow Modernization

### 2.1 Remove Custom Authentication API
**Delete these files:**
- `src/app/api/auth/signin/route.ts`
- `src/app/api/create-account/route.ts` (no longer needed with triggers)
- `src/app/api/force-signin/route.ts` (development hack)

### 2.2 Modernize Sign-Up Component
**Simplified `src/app/auth/sign-up/page.tsx`:**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        setEmailSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  // Rest of component...
}
```

**Key Changes:**
- ✅ Remove manual account creation calls
- ✅ Simplified error handling
- ✅ No silent failures
- ✅ Database triggers handle account setup

### 2.3 Modernize Sign-In Component
**Simplified `src/app/auth/sign-in/page.tsx`:**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

export default function SignInPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.user) {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  // Rest of component...
}
```

**Key Changes:**
- ✅ Direct Supabase client usage (no custom API)
- ✅ Consistent session management
- ✅ Simplified error handling
- ✅ Standard redirect pattern

### 2.4 Simplify Auth Callback
**Streamlined `src/app/auth/callback/route.ts`:**

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=Missing confirmation code`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => cookieStore.set({ name, value, ...options }),
        remove: (name, options) => cookieStore.set({ name, value: "", ...options }),
      },
    }
  );

  try {
    await supabase.auth.exchangeCodeForSession(code);
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
  } catch (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=Email confirmation failed`);
  }
}
```

**Key Changes:**
- ✅ No manual account creation (handled by triggers)
- ✅ Simplified error handling
- ✅ Standard Supabase patterns
- ✅ Clean redirect logic

---

## 🍪 Phase 3: Session Management Cleanup

### 3.1 Simplify Middleware
**Streamlined `src/middleware.ts`:**

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => res.cookies.set({ name, value, ...options }),
        remove: (name, options) => res.cookies.set({ name, value: "", ...options }),
      },
    }
  );

  // Get session
  const { data: { session } } = await supabase.auth.getSession();

  // Protect dashboard routes (except public ones)
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    const isPublicDashboardRoute = 
      req.nextUrl.pathname.startsWith("/dashboard/universal") ||
      req.nextUrl.pathname.startsWith("/dashboard/prompt-pages");

    if (!session && !isPublicDashboardRoute) {
      return NextResponse.redirect(new URL("/auth/sign-in", req.url));
    }
  }

  // Protect API routes (except public ones)
  if (req.nextUrl.pathname.startsWith("/api")) {
    const publicApiRoutes = ["/api/track-event", "/api/track-review"];
    const isPublicApiRoute = publicApiRoutes.some(route => 
      req.nextUrl.pathname.startsWith(route)
    );

    if (!session && !isPublicApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
```

**Key Changes:**
- ✅ Remove development/production differences
- ✅ Simplified session checking
- ✅ Clear public route definitions
- ✅ Consistent behavior across environments

### 3.2 Simplify Auth Guard
**Streamlined `src/utils/authGuard.ts`:**

```typescript
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import type { User } from "@supabase/supabase-js";

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);

      if (!session) {
        router.push("/auth/sign-in");
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (event === "SIGNED_OUT" || !session) {
          router.push("/auth/sign-in");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  return { user, loading };
}

// Simple hook for protected routes
export function useRequireAuth(): UseAuthReturn {
  const auth = useAuth();
  
  if (!auth.loading && !auth.user) {
    // This will be handled by the useAuth hook's redirect
  }
  
  return auth;
}
```

**Key Changes:**
- ✅ Single responsibility (auth state only)
- ✅ No complex retry logic
- ✅ Standard Supabase auth state listening
- ✅ Clean separation of concerns

---

## 🛡️ Phase 4: Error Handling Improvement

### 4.1 Centralized Error Types
**Create `src/types/auth.ts`:**

```typescript
export interface AuthError {
  code: string;
  message: string;
  userMessage: string;
}

export const AUTH_ERRORS: Record<string, AuthError> = {
  INVALID_CREDENTIALS: {
    code: "invalid_credentials",
    message: "Invalid login credentials",
    userMessage: "Invalid email or password. Please try again.",
  },
  EMAIL_NOT_CONFIRMED: {
    code: "email_not_confirmed",
    message: "Email not confirmed",
    userMessage: "Please check your email and confirm your account before signing in.",
  },
  USER_NOT_FOUND: {
    code: "user_not_found", 
    message: "User not found",
    userMessage: "No account found with this email address.",
  },
  WEAK_PASSWORD: {
    code: "weak_password",
    message: "Password should be at least 6 characters",
    userMessage: "Password must be at least 6 characters long.",
  },
  EMAIL_ALREADY_REGISTERED: {
    code: "signup_disabled",
    message: "User already registered",
    userMessage: "An account with this email already exists. Please sign in instead.",
  },
};

export function getAuthError(error: any): AuthError {
  const errorMessage = error?.message || "";
  
  for (const authError of Object.values(AUTH_ERRORS)) {
    if (errorMessage.includes(authError.message)) {
      return authError;
    }
  }
  
  return {
    code: "unknown_error",
    message: errorMessage,
    userMessage: "An unexpected error occurred. Please try again.",
  };
}
```

### 4.2 Error Boundary Component
**Create `src/components/AuthErrorBoundary.tsx`:**

```typescript
"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Auth error boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
            <p className="text-gray-600 mb-4">Something went wrong with authentication.</p>
            <button
              onClick={() => window.location.href = "/auth/sign-in"}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Return to Sign In
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 🧪 Phase 5: Testing & Monitoring

### 5.1 Create Test Suite
**Create `src/__tests__/auth.test.ts`:**

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe("Authentication Flow", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "testpassword123";
  let userId: string;

  test("User signup creates all required records", async () => {
    // 1. Create user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        first_name: "Test",
        last_name: "User"
      }
    });

    expect(authError).toBeNull();
    expect(authData.user).toBeTruthy();
    userId = authData.user!.id;

    // 2. Check account was created by trigger
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", userId)
      .single();

    expect(accountError).toBeNull();
    expect(account).toBeTruthy();
    expect(account.email).toBe(testEmail);

    // 3. Check account_user relationship was created
    const { data: accountUser, error: accountUserError } = await supabase
      .from("account_users")
      .select("*")
      .eq("user_id", userId)
      .single();

    expect(accountUserError).toBeNull();
    expect(accountUser).toBeTruthy();
    expect(accountUser.role).toBe("owner");
  });

  test("User can sign in after signup", async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    expect(error).toBeNull();
    expect(data.user).toBeTruthy();
    expect(data.session).toBeTruthy();
  });

  afterAll(async () => {
    // Cleanup
    if (userId) {
      await supabase.auth.admin.deleteUser(userId);
    }
  });
});
```

### 5.2 Add Health Check Endpoint
**Create `src/app/api/health/auth/route.ts`:**

```typescript
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Test database connection
    const { data, error } = await supabase.from("accounts").select("count").limit(1);
    
    if (error) {
      return NextResponse.json(
        { status: "error", message: "Database connection failed", error: error.message },
        { status: 500 }
      );
    }

    // Test auth service
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      return NextResponse.json(
        { status: "error", message: "Auth service failed", error: authError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "healthy",
      checks: {
        database: "ok",
        auth: "ok",
        userCount: users.length
      }
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: "Health check failed", error: String(error) },
      { status: 500 }
    );
  }
}
```

---

## 📋 Implementation Checklist

### Database Changes
- [ ] Create and deploy database triggers for automatic account creation
- [ ] Add foreign key constraints for data integrity
- [ ] Test triggers with new user creation

### Code Changes
- [ ] Remove custom authentication API routes
- [ ] Update sign-up component to use direct Supabase client
- [ ] Update sign-in component to use direct Supabase client  
- [ ] Simplify auth callback route
- [ ] Streamline middleware
- [ ] Replace complex auth guard with simple useAuth hook
- [ ] Add centralized error handling
- [ ] Add error boundary component

### Testing
- [ ] Create comprehensive test suite
- [ ] Add health check endpoint
- [ ] Test complete signup → login → dashboard flow
- [ ] Test error scenarios (invalid credentials, unconfirmed email, etc.)
- [ ] Load test authentication endpoints

### Documentation
- [ ] Update authentication documentation
- [ ] Create troubleshooting guide for new system
- [ ] Document environment setup requirements

---

## 🎯 Benefits of New Architecture

### Reliability
- ✅ Atomic account creation (no partial states)
- ✅ Database-enforced consistency
- ✅ Elimination of race conditions
- ✅ Clear error states and handling

### Maintainability  
- ✅ Standard Supabase patterns throughout
- ✅ Reduced code complexity (50% fewer files)
- ✅ Single source of truth for auth state
- ✅ Clear separation of concerns

### Developer Experience
- ✅ Consistent behavior across environments
- ✅ Better error messages for users
- ✅ Comprehensive testing suite
- ✅ Health monitoring endpoints

### Security
- ✅ Reduced attack surface (fewer custom endpoints)
- ✅ Standard session management
- ✅ Proper CSRF protection via Supabase
- ✅ Database-level security constraints

This refactor transforms your authentication system from a complex, error-prone multi-step process into a simple, reliable, and maintainable solution following modern best practices.
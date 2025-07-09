import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Only require auth in production
  if (process.env.NODE_ENV !== "production") {
    // In development, still check session but don't block requests
    console.log('Middleware: Development mode - checking session but not blocking');
  }

  // Create Supabase client with proper cookie handling (Next.js 15 async compatible)
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => {
          const value = cookieStore.get(name)?.value;
          return value;
        },
        set: (name, value, options) => {
          // In middleware, we use response cookies
          res.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          res.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  try {
    // 🔧 FIX: Add retry logic to handle session timing issues
    // Sometimes the JWT token is created before the user record is fully persisted
    let user = null;
    let error = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      const { data: { user: userResult }, error: userError } = await supabase.auth.getUser();
      
      if (userResult && !userError) {
        user = userResult;
        error = null;
        break;
      }
      
      // If it's a session timing error, retry after a short delay
      const isTimingError = userError && (
        userError.message.includes('User from sub claim in JWT does not exist') ||
        userError.message.includes('Unexpected failure') ||
        userError.message.includes('JWT') ||
        userError.message.includes('sub claim') ||
        userError.code === 'PGRST301' // PostgREST JWT error
      );
      
      if (isTimingError) {
        console.log(`Middleware: Retry ${retryCount + 1}/${maxRetries} - Session timing error (${userError.message}), retrying...`);
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 200 + (retryCount * 100))); // Exponential backoff: 200ms, 300ms, 400ms
          continue;
        }
      }
      
      // For other errors, break immediately
      error = userError;
      break;
    }
    
    if (error) {
      console.log('Middleware: User authentication check failed:', error.message);
    }

    const hasSession = !!user && !error;
    const userId = user?.id;

    console.log('Middleware: Session check result:', {
      hasSession,
      userId,
      pathname: req.nextUrl.pathname,
      retriesUsed: retryCount
    });

    // In development, log but don't redirect
    if (process.env.NODE_ENV !== "production") {
      return res;
    }

    // In production, redirect if no session
    if (!hasSession) {
      console.log('Middleware: Redirecting unauthenticated user to sign-in');
      const signInUrl = new URL('/auth/sign-in', req.url);
      return NextResponse.redirect(signInUrl);
    }

    return res;
  } catch (error) {
    console.error('Middleware: Unexpected error:', error);
    
    // In development, continue anyway
    if (process.env.NODE_ENV !== "production") {
      return res;
    }

    // In production, redirect to sign-in on error
    const signInUrl = new URL('/auth/sign-in', req.url);
    return NextResponse.redirect(signInUrl);
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/((?!auth|upload|stripe-webhook|check-admin|check-env|track-event|track-review|create-checkout-session|create-stripe-portal-session|email-templates|debug-session|debug-checkout|prompt-pages|businesses).*)',
  ],
};

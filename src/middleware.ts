import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Docs site URL for proxying
const DOCS_SITE_URL = 'https://docs-site-7mwbiq8mr-nerves76s-projects.vercel.app';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Handle /docs routes - proxy to the docs site
  if (req.nextUrl.pathname.startsWith('/docs')) {
    const docsPath = req.nextUrl.pathname.replace('/docs', '') || '/';
    const queryString = req.nextUrl.search;
    const targetUrl = `${DOCS_SITE_URL}${docsPath}${queryString}`;
    
    console.log('Middleware: Proxying docs request to:', targetUrl);
    return NextResponse.rewrite(targetUrl);
  }

  // Skip middleware for social-posting routes - they handle auth internally
  if (req.nextUrl.pathname.startsWith('/api/social-posting/')) {
    console.log('Middleware: Skipping social-posting route:', req.nextUrl.pathname);
    return res;
  }

  // TEMPORARY: Disable middleware completely to debug auth issues
  const nodeEnv = process.env.NODE_ENV as string;
  if (nodeEnv === "production") {
    console.log('Middleware: Temporarily disabled for production debugging');
    return res;
  }

  // Only require auth in production
  if (nodeEnv !== "production") {
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

    // Always log in production for debugging
    console.log('Middleware: Session check result:', {
      hasSession,
      userId,
      pathname: req.nextUrl.pathname,
      retriesUsed: retryCount,
      error: error?.message,
      cookies: req.headers.get('cookie')?.includes('sb-') ? 'has supabase cookies' : 'no supabase cookies',
      env: nodeEnv
    });

    // In development, log but don't redirect
    if (nodeEnv !== "production") {
      return res;
    }

    // Redirect to sign-in if no session (API routes only now)
    if (!hasSession) {
      console.log('Middleware: No session found for API route, redirecting to sign-in', {
        pathname: req.nextUrl.pathname,
        hasSession,
        error: error?.message
      });
      const signInUrl = new URL('/auth/sign-in', req.url);
      return NextResponse.redirect(signInUrl);
    }

    return res;
  } catch (error) {
    console.error('Middleware: Unexpected error:', error);
    
    // In development, continue anyway
    if (nodeEnv !== "production") {
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
    // Docs routing (proxy to docs site)
    '/docs/:path*',
    // REMOVED: '/dashboard/:path*' - Now handled by client-side AuthContext
    // Only run on specific API routes that need authentication
    '/api/admin/:path*',
    '/api/cancel-account',
    '/api/check-schema',
    '/api/create-account',
    '/api/delete-user',
    '/api/feedback',
    // '/api/generate-review', // Removed: Should be publicly accessible for anonymous users
    '/api/generate-reviews',
    '/api/initialize-onboarding-tasks',
    '/api/metadata-templates/:path*',
    '/api/refresh-session',
    '/api/review-submissions/:path*',
    '/api/send-trial-reminders',
    '/api/send-welcome-email',
    '/api/team/:path*',
    '/api/test-sentry',
    '/api/upgrade-subscription',
    '/api/upload-contacts',
    '/api/upload-photo',
    '/api/upload-widget-photo',
    '/api/widgets/:path*',
    '/api/cron/:path*',
    // NOTE: /r/:path* (prompt pages) are intentionally EXCLUDED to remain public
    // NOTE: /api/social-posting/:path* are intentionally EXCLUDED - handled internally
  ],
};

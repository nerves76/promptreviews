import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Docs site URL for proxying
const DOCS_SITE_URL = 'https://docs-site-7mwbiq8mr-nerves76s-projects.vercel.app';

export async function middleware(req: NextRequest) {
  // CRITICAL: Skip middleware for ALL Next.js internal routes and static assets
  // This MUST happen first to prevent interference with CSS/JS serving
  // SPECIFICALLY handle CSS files to prevent MIME type errors
  if (
    req.nextUrl.pathname.startsWith('/_next') || // All Next.js internal routes
    req.nextUrl.pathname.startsWith('/api') ||    // All API routes
    req.nextUrl.pathname.includes('.css') ||      // CSS files specifically
    req.nextUrl.pathname.includes('.js') ||       // JS files specifically  
    req.nextUrl.pathname.includes('.') ||         // All other files with extensions
    req.nextUrl.pathname.startsWith('/favicon') || // Favicon
    req.nextUrl.pathname.startsWith('/robots') ||  // Robots.txt
    req.nextUrl.pathname.startsWith('/sitemap')    // Sitemap
  ) {
    // For CSS files, ensure proper headers
    if (req.nextUrl.pathname.includes('.css')) {
      const response = NextResponse.next();
      response.headers.set('Content-Type', 'text/css; charset=utf-8');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      return response;
    }
    return NextResponse.next();
  }
  
  // Allow embedding for infographic embed page
  if (req.nextUrl.pathname.startsWith('/infographic-embed') || req.nextUrl.pathname.startsWith('/infographic/embed')) {
    const res = NextResponse.next();
    // Remove X-Frame-Options to allow embedding in iframes
    res.headers.delete('X-Frame-Options');
    // Set permissive frame-ancestors for embedding
    res.headers.set(
      'Content-Security-Policy',
      "frame-ancestors 'self' http://localhost:* https://localhost:* http://*.promptreviews.app https://*.promptreviews.app *;"
    );
    return res;
  }
  
  const res = NextResponse.next();
  
  // Handle /docs routes - proxy to the docs site
  if (req.nextUrl.pathname.startsWith('/docs')) {
    const docsPath = req.nextUrl.pathname.replace('/docs', '') || '/';
    const queryString = req.nextUrl.search;
    const targetUrl = `${DOCS_SITE_URL}${docsPath}${queryString}`;
    
    console.log('Middleware: Proxying docs request to:', targetUrl);
    return NextResponse.rewrite(targetUrl);
  }

  // For now, don't do auth checks in middleware - let client-side handle it
  // This prevents issues with public pages and reduces complexity
  return res;
  
  /* === COMMENTED OUT AUTH CODE - Can be re-enabled if needed ===
  const nodeEnv = process.env.NODE_ENV as string;

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
  === END OF COMMENTED AUTH CODE === */
}

// Configure which routes to run middleware on
// IMPORTANT: Using negative lookahead to exclude static assets
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - Any file with an extension (e.g., .js, .css, .png)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\.).*)',
  ],
};

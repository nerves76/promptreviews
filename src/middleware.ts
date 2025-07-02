import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionOrMock } from "@/utils/supabaseClient";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Only require auth in production
  if (process.env.NODE_ENV !== "production") {
    // In development, still check session but don't block requests
    console.log('Middleware: Development mode - checking session but not blocking');
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove: (name, options) => {
          res.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    },
  );

  // Get session with better error handling and manual cookie check
  let session = null;
  try {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    session = currentSession;
    
    // Debug: Show all cookies for diagnosis
    const allCookies = req.cookies.getAll();
    console.log('Middleware: All cookies found:', allCookies.map(c => `${c.name}=${c.value.substring(0, 20)}...`));
    
    // If no session from supabase, check manual cookies as fallback
    if (!session) {
      const accessToken = req.cookies.get('sb-access-token')?.value;
      const refreshToken = req.cookies.get('sb-refresh-token')?.value;
      
      console.log('Middleware: Manual cookie check:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        accessTokenLength: accessToken?.length || 0,
        refreshTokenLength: refreshToken?.length || 0
      });
      
      if (accessToken && refreshToken) {
        console.log('Middleware: Found manual session cookies, treating as authenticated');
        // Create a mock session for middleware purposes
        session = { 
          access_token: accessToken, 
          user: { id: 'cookie-user' } 
        } as any;
      } else {
        console.log('Middleware: No manual cookies found, checking for any Supabase-related cookies...');
        const supabaseCookies = allCookies.filter(c => c.name.startsWith('sb-'));
        console.log('Middleware: Supabase cookies:', supabaseCookies.map(c => c.name));
      }
    } else {
      console.log('Middleware: Found valid Supabase session');
    }
    
    console.log('Middleware: Final session check result:', { 
      hasSession: !!session, 
      userId: session?.user?.id,
      pathname: req.nextUrl.pathname,
      sessionType: session ? (session.user?.id === 'cookie-user' ? 'manual-cookie' : 'supabase') : 'none'
    });
  } catch (error) {
    console.log('Middleware: Session check failed, continuing without session:', error);
    // Continue without session rather than failing
  }

  // Protect dashboard routes and specific subpages in production only
  const protectedDashboardSubpages = [
    "/dashboard/analytics",
    "/dashboard/business-profile",
    "/dashboard/style",
    "/dashboard/contacts",
  ];

  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    if (!session) {
      const isUniversal = req.nextUrl.pathname.startsWith(
        "/dashboard/universal",
      );
      const isPrompt = req.nextUrl.pathname.startsWith(
        "/dashboard/prompt-pages",
      );
      const isProtectedSubpage = protectedDashboardSubpages.some((subpage) =>
        req.nextUrl.pathname.startsWith(subpage),
      );
      if (
        !isUniversal &&
        !isPrompt &&
        (req.nextUrl.pathname === "/dashboard" || isProtectedSubpage)
      ) {
        const redirectUrl = new URL("/auth/sign-in", req.url);
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  // Protect API routes, but allow public access to /api/track-event and /api/track-review
  if (req.nextUrl.pathname.startsWith("/api")) {
      if (
    req.nextUrl.pathname === "/api/track-event" ||
    req.nextUrl.pathname === "/api/track-review" ||
    req.nextUrl.pathname === "/api/force-signin" ||
    req.nextUrl.pathname === "/api/refresh-session" ||
    req.nextUrl.pathname === "/api/check-env" ||
    req.nextUrl.pathname.startsWith("/api/auth/")
  ) {
    return res;
  }
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return res;
}

// Configure which routes to run middleware on
export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};

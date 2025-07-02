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

  // Get session with better error handling
  let session = null;
  try {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    session = currentSession;
    console.log('Middleware: Session check result:', { 
      hasSession: !!session, 
      userId: session?.user?.id,
      pathname: req.nextUrl.pathname 
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
      req.nextUrl.pathname === "/api/check-env"
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

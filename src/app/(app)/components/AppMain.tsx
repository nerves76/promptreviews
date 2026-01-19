"use client";
import { usePathname } from "next/navigation";
import { useAuth } from "@/auth";
import Header from "./Header";
import FeedbackBubble from "./FeedbackBubble";
import Sidebar from "./sidebar/Sidebar";

export default function AppMain({
  children,
  loader,
}: {
  children: React.ReactNode;
  loader?: React.ReactNode;
}) {
  const pathname = usePathname();
  const { account } = useAuth();

  // Routes that should be treated as public (no header/sidebar)
  // Note: /prompt-pages/outreach-templates is an authenticated dashboard page, not public
  const isPublic =
    pathname.startsWith("/r/") ||
    (pathname.startsWith("/prompt-pages/") && !pathname.startsWith("/prompt-pages/outreach-templates")) ||
    pathname.startsWith("/demo/") ||
    pathname.startsWith("/embed/") ||
    pathname === "/infographic-embed" ||
    pathname === "/infographic/embed";
  const isAuth = pathname.startsWith("/auth/") || pathname.startsWith("/reset-password");

  // Pages that should NOT show the sidebar
  const noSidebarPaths = [
    "/game",
    "/dashboard/create-business",
    "/agency",
  ];

  // Hide sidebar during onboarding (no plan yet) or on excluded paths
  const hasValidPlan = account?.plan && account.plan !== 'no_plan' && account.plan !== 'NULL';
  const isOnboarding = !hasValidPlan && !account?.is_free_account;
  const showSidebar = !isAuth && !isPublic && !isOnboarding && !noSidebarPaths.some(p => pathname.startsWith(p));

  if (isPublic) {
    return <main>{children}</main>;
  }

  return (
    <div className="h-screen flex bg-transparent overflow-hidden">
      {/* Sidebar - full height, desktop only, independent scroll */}
      {showSidebar && <Sidebar />}

      {/* Main column: Header + Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent overflow-hidden">
        {/* Main content - scrolls independently, header scrolls with content */}
        <main className="flex-1 bg-transparent overflow-y-auto">
          {!isAuth && <Header />}
          {/* md:pl-4 provides clearance for PageCard icons that breach left */}
          <div className="md:pl-4">
            {loader}
            {children}
          </div>
        </main>
      </div>

      {/* Feedback bubble for authenticated users */}
      {!isAuth && <FeedbackBubble />}
    </div>
  );
}

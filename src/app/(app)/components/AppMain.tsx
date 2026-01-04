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

  const isPublic =
    pathname.startsWith("/r/") ||
    pathname.startsWith("/prompt-pages/") ||
    pathname.startsWith("/demo/") ||
    pathname.startsWith("/embed/") ||
    pathname === "/infographic-embed" ||
    pathname === "/infographic/embed";
  const isAuth = pathname.startsWith("/auth/") || pathname.startsWith("/reset-password");

  // Pages that should NOT show the sidebar
  const noSidebarPaths = [
    "/game",
    "/dashboard/create-business",
  ];

  // Hide sidebar during onboarding (no plan yet) or on excluded paths
  const hasValidPlan = account?.plan && account.plan !== 'no_plan' && account.plan !== 'NULL';
  const isOnboarding = !hasValidPlan && !account?.is_free_account;
  const showSidebar = !isAuth && !isPublic && !isOnboarding && !noSidebarPaths.some(p => pathname.startsWith(p));

  if (isPublic) {
    return <main>{children}</main>;
  }
  return (
    <div className="min-h-screen flex bg-transparent">
      {/* Sidebar - full height, desktop only */}
      {showSidebar && <Sidebar />}

      {/* Main column: Header + Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent">
        {/* Header */}
        {!isAuth && <Header />}

        {/* Main content */}
        <main className="flex-1 bg-transparent">
          {loader}
          {children}
        </main>
      </div>

      {/* Feedback bubble for authenticated users */}
      {!isAuth && <FeedbackBubble />}
    </div>
  );
}

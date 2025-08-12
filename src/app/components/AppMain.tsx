"use client";
import { usePathname } from "next/navigation";
import Header from "./Header";
import AnnouncementBanner from "./AnnouncementBanner";
import FeedbackBubble from "./FeedbackBubble";
import { useMemo } from "react";

export default function AppMain({
  children,
  loader,
}: {
  children: React.ReactNode;
  loader?: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublic =
    pathname.startsWith("/r/") || 
    pathname.startsWith("/prompt-pages/") ||
    pathname.startsWith("/demo/") ||
    pathname.startsWith("/embed/");
  const isAuth = pathname.startsWith("/auth/") || pathname.startsWith("/reset-password");
  if (isPublic) {
    return <main>{children}</main>;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600">
      <main>
        {!isAuth && <Header />}
        {!isAuth && <AnnouncementBanner />}
        {loader}
        {children}
        {/* Feedback bubble for authenticated users */}
        {!isAuth && <FeedbackBubble />}
      </main>
    </div>
  );
}

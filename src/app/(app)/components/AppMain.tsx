"use client";
import { usePathname } from "next/navigation";
import Header from "./Header";
import FeedbackBubble from "./FeedbackBubble";

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
    pathname.startsWith("/embed/") ||
    pathname === "/infographic-embed" ||
    pathname === "/infographic/embed";
  const isAuth = pathname.startsWith("/auth/") || pathname.startsWith("/reset-password");
  if (isPublic) {
    return <main>{children}</main>;
  }
  return (
    <div className="min-h-screen">
      <main>
        {!isAuth && <Header />}
        {loader}
        {children}
        {/* Feedback bubble for authenticated users */}
        {!isAuth && <FeedbackBubble />}
      </main>
    </div>
  );
}

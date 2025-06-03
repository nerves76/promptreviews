"use client";
import { usePathname } from "next/navigation";
import Header from "./Header";
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
    pathname.startsWith("/r/") || pathname.startsWith("/prompt-pages/");
  const isAuth = pathname.startsWith("/auth/");
  if (isPublic) {
    return <main>{children}</main>;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600">
      <main>
        {!isAuth && <Header />}
        {loader}
        {children}
      </main>
    </div>
  );
}

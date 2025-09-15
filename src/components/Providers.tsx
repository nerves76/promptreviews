"use client";

import { AuthProvider } from "@/auth";
import { ReviewerProvider } from "@/contexts/ReviewerContext";
import { BusinessGuard } from "@/auth/guards/BusinessGuard";
import GlobalLoaderProvider from "@/app/(app)/components/GlobalLoaderProvider";
import { usePathname } from "next/navigation";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicPromptPage = pathname?.startsWith("/r/") || false;
  return (
    <AuthProvider>
      {/* Global loader must wrap everything so context is always available */}
      <GlobalLoaderProvider enabled={!isPublicPromptPage} interceptNetwork={!isPublicPromptPage}>
        <ReviewerProvider>
          <BusinessGuard>
            {children}
          </BusinessGuard>
        </ReviewerProvider>
      </GlobalLoaderProvider>
    </AuthProvider>
  );
}

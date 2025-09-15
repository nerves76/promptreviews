"use client";

import { AuthProvider } from "@/auth";
import { ReviewerProvider } from "@/contexts/ReviewerContext";
import { BusinessGuard } from "@/auth/guards/BusinessGuard";
import GlobalLoaderProvider from "@/app/(app)/components/GlobalLoaderProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {/* Global loader must wrap everything so context is always available */}
      <GlobalLoaderProvider enabled={true} interceptNetwork={true}>
        <ReviewerProvider>
          <BusinessGuard>
            {children}
          </BusinessGuard>
        </ReviewerProvider>
      </GlobalLoaderProvider>
    </AuthProvider>
  );
}

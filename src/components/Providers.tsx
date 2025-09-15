"use client";

import { AuthProvider } from "@/auth";
import { ReviewerProvider } from "@/contexts/ReviewerContext";
import { BusinessGuard } from "@/auth/guards/BusinessGuard";
import GlobalLoaderProvider from "@/app/(app)/components/GlobalLoaderProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ReviewerProvider>
        <BusinessGuard>
          <GlobalLoaderProvider enabled={true} interceptNetwork={false}>
            {children}
          </GlobalLoaderProvider>
        </BusinessGuard>
      </ReviewerProvider>
    </AuthProvider>
  );
}

"use client";

import { AuthProvider } from "@/auth";
import { ReviewerProvider } from "@/contexts/ReviewerContext";
import { BusinessGuard } from "@/auth/guards/BusinessGuard";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ReviewerProvider>
        <BusinessGuard>
          {children}
        </BusinessGuard>
      </ReviewerProvider>
    </AuthProvider>
  );
}

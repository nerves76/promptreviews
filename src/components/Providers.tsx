"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { ReviewerProvider } from "@/contexts/ReviewerContext";
import BusinessGuard from "./BusinessGuard";

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

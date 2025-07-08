"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { ReviewerProvider } from "@/contexts/ReviewerContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ReviewerProvider>
        {children}
      </ReviewerProvider>
    </AuthProvider>
  );
}

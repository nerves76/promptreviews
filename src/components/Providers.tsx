"use client";

import { ReviewerProvider } from "@/contexts/ReviewerContext";
import ClientOnly from "@/components/ClientOnly";
import SessionManager from "@/components/SessionManager";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReviewerProvider>
      <ClientOnly>
        <SessionManager />
      </ClientOnly>
      {children}
    </ReviewerProvider>
  );
}

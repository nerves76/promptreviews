"use client";

import { ReviewerProvider } from "@/contexts/ReviewerContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ReviewerProvider>{children}</ReviewerProvider>;
}

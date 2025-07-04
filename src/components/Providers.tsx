"use client";

import { useEffect } from "react";
import { ReviewerProvider } from "@/contexts/ReviewerContext";
import { setupSessionRefresh } from "@/utils/sessionUtils";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Set up automatic session refresh to prevent session timeouts
    const intervalId = setupSessionRefresh();
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  return <ReviewerProvider>{children}</ReviewerProvider>;
}

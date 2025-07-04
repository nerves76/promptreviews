import { useEffect } from "react";
import { setupSessionRefresh } from "@/utils/sessionUtils";

/**
 * Client-side only component to manage session refresh
 * This prevents hydration mismatches by only running on the client
 */
export default function SessionManager() {
  useEffect(() => {
    // Set up automatic session refresh to prevent session timeouts
    const intervalId = setupSessionRefresh();
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}
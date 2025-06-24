"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { trackEvent, GA_EVENTS } from "../../utils/analytics";

export default function SignOut() {
  useEffect(() => {
    const signOut = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      
      // Track sign out event
      trackEvent(GA_EVENTS.SIGN_OUT, {
        timestamp: new Date().toISOString(),
      });
      
      await supabase.auth.signOut();
      window.location.href = "/auth/sign-in";
    };
    signOut();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Signing out...</h1>
      </div>
    </div>
  );
}

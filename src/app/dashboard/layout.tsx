"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { Dialog } from "@headlessui/react";
import { isAccountBlocked } from "@/utils/accountLimits";
import { getUserOrMock } from "@/utils/supabase";
import { trackEvent, GA_EVENTS } from "../../utils/analytics";
import TrialBanner from "../components/TrialBanner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccount = async () => {
      const {
        data: { user },
      } = await getUserOrMock(supabase);
      if (!user) {
        setBlocked(false);
        setLoading(false);
        return;
      }
      setBlocked(false);
      setLoading(false);
    };
    fetchAccount();
  }, [supabase]);

  const handleSignOut = async () => {
    // Track sign out event
    trackEvent(GA_EVENTS.SIGN_OUT, {
      timestamp: new Date().toISOString(),
    });
    
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("hideTrialBanner");
    }
    router.push("/auth/sign-in");
  };

  if (loading) return <div>{children}</div>;

  return (
    <div className="w-full bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 pb-16 md:pb-24 lg:pb-32">
      <TrialBanner />
      {children}
    </div>
  );
}

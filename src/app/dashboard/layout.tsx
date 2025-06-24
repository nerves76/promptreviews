"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { Dialog } from "@headlessui/react";
import { isAccountBlocked } from "@/utils/accountLimits";
import { getUserOrMock } from "@/utils/supabase";

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
  const [showTrialBanner, setShowTrialBanner] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    const fetchAccount = async () => {
      const {
        data: { user },
      } = await getUserOrMock(supabase);
      if (!user) {
        setShowTrialBanner(false);
        setBlocked(false);
        setLoading(false);
        return;
      }
      const { data: accountData } = await supabase
        .from("accounts")
        .select("plan, trial_start, trial_end, has_had_paid_plan")
        .eq("id", user.id)
        .single();
      if (
        accountData &&
        accountData.plan === "grower" &&
        accountData.trial_end &&
        new Date(accountData.trial_end) > new Date() &&
        accountData.has_had_paid_plan === false
      ) {
        if (
          typeof window !== "undefined" &&
          sessionStorage.getItem("hideTrialBanner") === "1"
        ) {
          setShowTrialBanner(false);
        } else {
          setShowTrialBanner(true);
        }
        const now = new Date();
        const end = new Date(accountData.trial_end);
        const daysLeft = Math.ceil(
          (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        setTrialDaysLeft(daysLeft);
      } else {
        setShowTrialBanner(false);
      }
      setBlocked(false);
      setLoading(false);
    };
    fetchAccount();
  }, [supabase]);

  const handleDismissBanner = useCallback(() => {
    setShowTrialBanner(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("hideTrialBanner", "1");
    }
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("hideTrialBanner");
    }
    router.push("/auth/sign-in");
  };

  if (loading) return <div>{children}</div>;

  return (
    <div className="w-full bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 pb-16 md:pb-24 lg:pb-32">
      {children}
      {showTrialBanner && trialDaysLeft !== null && (
        <div
          className="w-full bg-yellow-200 text-yellow-900 px-4 py-3 flex items-center justify-center z-50 fixed top-0 left-0"
          style={{ minHeight: 56, position: "relative" }}
        >
          <div className="flex items-center gap-4 justify-center w-full">
            <span className="font-semibold">You are in a free trial:</span>
            <span>
              {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left.
            </span>
            <Link
              href="/dashboard/plan"
              className="bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-bold px-2 py-1 rounded text-sm transition"
            >
              Upgrade now
            </Link>
          </div>
          <button
            onClick={handleDismissBanner}
            className="absolute top-2 right-4 text-yellow-900 hover:text-yellow-700 text-xl font-bold"
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * TrialBanner Component
 * 
 * Displays a countdown banner for users in their free trial period.
 * Positioned above the navigation to be less intrusive than a fixed overlay.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { getUserOrMock } from '../../utils/supabase';

interface TrialBannerProps {
  isAdmin?: boolean;
  showForTesting?: boolean;
}

export default function TrialBanner({ isAdmin = false, showForTesting = false }: TrialBannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    if (showForTesting) {
      setShowBanner(true);
      setTrialDaysLeft(7); // Show 7 days for testing
      setLoading(false);
      return;
    }

    const fetchTrialStatus = async () => {
      try {
        const { data: { user } } = await getUserOrMock(supabase);
        if (!user) {
          setShowBanner(false);
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
          // Check if user has dismissed the banner
          if (
            typeof window !== "undefined" &&
            sessionStorage.getItem("hideTrialBanner") === "1"
          ) {
            setShowBanner(false);
          } else {
            setShowBanner(true);
          }
          
          const now = new Date();
          const end = new Date(accountData.trial_end);
          const daysLeft = Math.ceil(
            (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          );
          setTrialDaysLeft(daysLeft);
        } else {
          setShowBanner(false);
        }
      } catch (error) {
        console.error('Error fetching trial status:', error);
        setShowBanner(false);
      } finally {
        setLoading(false);
      }
    };

    fetchTrialStatus();
  }, [supabase, showForTesting]);

  const handleDismissBanner = () => {
    setShowBanner(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("hideTrialBanner", "1");
    }
  };

  if (loading || !showBanner) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-4 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold">🎉 You're in a free trial:</span>
          <span className="font-bold text-lg">
            {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left
          </span>
        </div>
        <Link
          href="/dashboard/plan"
          className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          Upgrade Now
        </Link>
        <button
          onClick={handleDismissBanner}
          className="text-yellow-800 hover:text-yellow-900 text-xl font-bold ml-2"
          aria-label="Dismiss trial banner"
        >
          ×
        </button>
      </div>
    </div>
  );
} 
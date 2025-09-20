/**
 * Trial Banner Component
 * Displays trial information and remaining time for users on trial plans
 */

"use client";

import { useState, useEffect, useMemo } from "react";

interface TrialBannerProps {
  trialEnd?: Date;
  plan?: string;
  accountData?: any; // Add accountData prop
}

export default function TrialBanner({ 
  trialEnd: propTrialEnd, 
  plan: propPlan, 
  accountData 
}: TrialBannerProps = {}) {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isVisible, setIsVisible] = useState(true);
  const [trialEnd, setTrialEnd] = useState<Date | null>(propTrialEnd || null);
  const [plan, setPlan] = useState<string>(propPlan || "");
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Use accountData if provided, otherwise use props
  useEffect(() => {
    if (accountData) {
      if (accountData.trial_end) {
        setTrialEnd(new Date(accountData.trial_end));
      }
      if (accountData.plan) {
        setPlan(accountData.plan);
      }
    } else if (propTrialEnd && propPlan) {
      setTrialEnd(propTrialEnd);
      setPlan(propPlan);
    }
  }, [accountData, propTrialEnd, propPlan]);

  // Calculate time remaining
  useEffect(() => {
    if (!trialEnd) {
      return;
    }

    const updateTimeRemaining = () => {
      const now = new Date();
      const timeDiff = trialEnd.getTime() - now.getTime();
      
      if (timeDiff <= 0) {
        setTimeRemaining("Trial expired");
        return;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      // Emphasize urgency as trial nears end
      if (days > 3) {
        setTimeRemaining(`${days} day${days !== 1 ? 's' : ''} remaining`);
      } else if (days > 0) {
        // 1–3 days left
        setTimeRemaining(`Only ${days} day${days !== 1 ? 's' : ''} left`);
      } else if (hours > 0) {
        setTimeRemaining(`Only ${hours} hour${hours !== 1 ? 's' : ''} left`);
      } else {
        setTimeRemaining("Less than 1 hour left");
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [trialEnd]);

  // Check if banner should be shown (memoized to prevent excessive calculations)
  const shouldShow = useMemo(() => {
    if (!hasMounted) {
      return false;
    }

    // Check if user dismissed the banner
    const hideBanner = typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem('hideTrialBanner')
      : null;
    
    if (hideBanner === 'true') {
      return false;
    }

    // Only grower is a trial plan - builder and maven are paid plans
    const paidPlans = ['builder', 'maven'];
    
    // If we have account data, use it
    if (accountData) {
      // Never show banner for paid plans
      if (paidPlans.includes(accountData.plan)) {
        return false;
      }
      
      // Only show banner for Grower plan users who are on an active trial and haven't paid
      if (accountData.plan === 'grower' && 
          accountData.trial_end && 
          new Date() < new Date(accountData.trial_end) &&
          !accountData.stripe_customer_id) {
        return true;
      }
      
      // Don't show for users with no plan (they need to select a plan first)
      // Don't show for grower plan users who have already paid
      // Don't show for expired trials
      return false;
    } else if (plan) {
      // Fallback to props if no account data
      
      // Never show banner for paid plans
      if (paidPlans.includes(plan)) {
        return false;
      }
      
      // Show if trial hasn't expired for grower plan AND we have a trial_end date
      if (plan === 'grower' && trialEnd && new Date() < trialEnd) {
        return true;
      }
    }

    return false;
  }, [hasMounted, accountData, plan, trialEnd]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('hideTrialBanner', 'true');
    }
  };

  if (!isVisible || !shouldShow) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white relative">
      <div className="relative max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 pr-8">
            <div className="flex-shrink-0">
              <img
                src="/images/prompty-success.png"
                alt="Prompty"
                className="w-12 h-12 object-contain"
              />
            </div>
            <div className="ml-3">
              <p className="font-medium">
                🎉 You're on a {plan} trial! {timeRemaining}
              </p>
              <p className="text-sm opacity-90">
                Upgrade anytime to unlock all features and continue growing your business
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <a
              href="/dashboard/plan"
              className="flex-shrink-0 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors backdrop-blur-sm border border-white/20"
            >
              Upgrade
            </a>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1.5 text-white/70 hover:text-white/90 transition-all duration-200 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/15"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 

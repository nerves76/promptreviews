/**
 * Trial Banner Component
 * Displays trial information and remaining time for users on trial plans
 */

"use client";

import { useState, useEffect } from "react";

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

  // Use accountData if provided, otherwise use props
  useEffect(() => {
    if (accountData) {
      if (process.env.NODE_ENV === 'development') {
        console.log("TrialBanner: Using accountData from props:", accountData);
      }
      if (accountData.trial_end) {
        setTrialEnd(new Date(accountData.trial_end));
      }
      if (accountData.plan) {
        setPlan(accountData.plan);
      }
    } else if (propTrialEnd && propPlan) {
      if (process.env.NODE_ENV === 'development') {
        console.log("TrialBanner: Using trial end and plan from props");
      }
      setTrialEnd(propTrialEnd);
      setPlan(propPlan);
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log("TrialBanner: No account data provided");
      }
    }
  }, [accountData, propTrialEnd, propPlan]);

  // Calculate time remaining
  useEffect(() => {
    if (!trialEnd) {
      if (process.env.NODE_ENV === 'development') {
        console.log("TrialBanner: No trial end date, skipping time calculation");
      }
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
      
      if (days > 0) {
        setTimeRemaining(`${days} day${days !== 1 ? 's' : ''} remaining`);
      } else {
        setTimeRemaining("Less than 1 day remaining");
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [trialEnd]);

  // Check if banner should be shown
  const shouldShow = () => {
    // Check if user dismissed the banner
    const hideBanner = sessionStorage.getItem('hideTrialBanner');
    if (process.env.NODE_ENV === 'development') {
      console.log("TrialBanner: Checked sessionStorage, hideBanner:", hideBanner);
    }
    
    if (hideBanner === 'true') {
      return false;
    }

    // Only grower is a trial plan - builder and maven are paid plans
    const paidPlans = ['builder', 'maven'];
    
    // If we have account data, use it
    if (accountData) {
      if (process.env.NODE_ENV === 'development') {
        console.log("TrialBanner: Using accountData for plan check:", accountData.plan);
      }
      
      // Never show banner for paid plans
      if (paidPlans.includes(accountData.plan)) {
        if (process.env.NODE_ENV === 'development') {
          console.log("TrialBanner: User is on paid plan, hiding banner");
        }
        return false;
      }
      
      // Show for users with no plan or on grower (trial) plan
      if (!accountData.plan || accountData.plan === 'grower') {
        // Check if trial hasn't expired
        if (accountData.trial_end && new Date() < new Date(accountData.trial_end)) {
          if (process.env.NODE_ENV === 'development') {
            console.log("TrialBanner: Trial is active, showing banner");
          }
          return true;
        }
        
        // For grower plan without trial dates, show banner (they might be in trial)
        if (accountData.plan === 'grower' && !accountData.trial_end) {
          if (process.env.NODE_ENV === 'development') {
            console.log("TrialBanner: Grower plan without trial dates, showing banner");
          }
          return true;
        }
        
        // For users with no plan, show banner
        if (!accountData.plan) {
          if (process.env.NODE_ENV === 'development') {
            console.log("TrialBanner: No plan set, showing banner");
          }
          return true;
        }
      }
    } else if (plan) {
      // Fallback to props if no account data
      if (process.env.NODE_ENV === 'development') {
        console.log("TrialBanner: Using plan prop for trial check:", plan);
      }
      
      // Never show banner for paid plans
      if (paidPlans.includes(plan)) {
        if (process.env.NODE_ENV === 'development') {
          console.log("TrialBanner: Paid plan from props, hiding banner");
        }
        return false;
      }
      
      // Show if trial hasn't expired for grower plan
      if (plan === 'grower' && trialEnd && new Date() < trialEnd) {
        if (process.env.NODE_ENV === 'development') {
          console.log("TrialBanner: Trial is active (from props), showing banner");
        }
        return true;
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log("TrialBanner: Not showing banner - conditions not met");
    }
    return false;
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('hideTrialBanner', 'true');
  };

  if (process.env.NODE_ENV === 'development') {
    console.log("TrialBanner: Render conditions:", {
      isVisible,
      trialEnd: !!trialEnd,
      plan: !!plan,
      timeRemaining,
      shouldShow: shouldShow(),
      accountData: !!accountData,
      propTrialEnd: !!propTrialEnd,
      propPlan: !!propPlan
    });
  }

  if (!isVisible || !shouldShow()) {
    if (process.env.NODE_ENV === 'development') {
      console.log("TrialBanner: Not showing banner");
    }
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 relative">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <img
              src="https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/small-prompty-success.png"
              alt="Prompty"
              className="w-12 h-12 object-contain transform scale-x-[-1]"
            />
          </div>
          <div>
            <p className="font-medium">
              🎉 You're on a {plan || 'free'} trial! {timeRemaining}
            </p>
            <p className="text-sm opacity-90">
              {plan ? 'Upgrade anytime to unlock all features and continue growing your business' : 'Choose a plan to unlock all features and continue growing your business'}
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
            className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 
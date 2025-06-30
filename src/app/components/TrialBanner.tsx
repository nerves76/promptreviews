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
      console.log("TrialBanner: Using accountData from props:", accountData);
      if (accountData.trial_end) {
        setTrialEnd(new Date(accountData.trial_end));
      }
      if (accountData.plan) {
        setPlan(accountData.plan);
      }
    } else if (propTrialEnd && propPlan) {
      console.log("TrialBanner: Using trial end and plan from props");
      setTrialEnd(propTrialEnd);
      setPlan(propPlan);
    } else {
      console.log("TrialBanner: No account data provided");
    }
  }, [accountData, propTrialEnd, propPlan]);

  // Calculate time remaining
  useEffect(() => {
    if (!trialEnd) {
      console.log("TrialBanner: No trial end date, skipping time calculation");
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
    console.log("TrialBanner: Checked sessionStorage, hideBanner:", hideBanner);
    
    if (hideBanner === 'true') {
      return false;
    }

    // Show for users with no plan (null) or users on trial plans
    const trialPlans = ['grower', 'builder', 'maven'];
    
    // If we have account data, use it
    if (accountData) {
      console.log("TrialBanner: Using accountData for plan check:", accountData.plan);
      
      // Show for users with no plan or on trial plans
      if (!accountData.plan || trialPlans.includes(accountData.plan)) {
        // Check if trial hasn't expired
        if (accountData.trial_end && new Date() < new Date(accountData.trial_end)) {
          console.log("TrialBanner: Trial is active, showing banner");
          return true;
        }
        
        // For grower plan without trial dates, show banner (they might be in trial)
        if (accountData.plan === 'grower' && !accountData.trial_end) {
          console.log("TrialBanner: Grower plan without trial dates, showing banner");
          return true;
        }
      }
    } else if (plan && trialPlans.includes(plan)) {
      // Fallback to props if no account data
      console.log("TrialBanner: Using plan prop for trial check:", plan);
      
      // Show if trial hasn't expired
      if (trialEnd && new Date() < trialEnd) {
        console.log("TrialBanner: Trial is active (from props), showing banner");
        return true;
      }
    }

    console.log("TrialBanner: Not showing banner - conditions not met");
    return false;
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('hideTrialBanner', 'true');
  };

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

  if (!isVisible || !shouldShow()) {
    console.log("TrialBanner: Not showing banner");
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 relative">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
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
  );
} 
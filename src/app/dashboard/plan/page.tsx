"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabaseClient";
import PricingModal from "../../components/PricingModal";
import AppLoader from "@/app/components/AppLoader";
import { useRouter } from "next/navigation";
import { tiers } from "../../components/PricingModal";
import TopLoaderOverlay from "@/app/components/TopLoaderOverlay";
import { getAccountIdForUser } from "@/auth/utils/accounts";

export default function PlanPage() {
  const supabase = createClient();

  const [account, setAccount] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'owner' | 'member' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [downgradeTarget, setDowngradeTarget] = useState<string | null>(null);
  const [downgradeFeatures, setDowngradeFeatures] = useState<string[]>([]);
  const [downgradeProcessing, setDowngradeProcessing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeTarget, setUpgradeTarget] = useState<string | null>(null);
  const [upgradeFeatures, setUpgradeFeatures] = useState<string[]>([]);
  const [upgradeProcessing, setUpgradeProcessing] = useState(false);
  const [lastAction, setLastAction] = useState<string>("");
  const [starAnimation, setStarAnimation] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState<string>('');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [isAdminAccount, setIsAdminAccount] = useState(false);
  const prevPlanRef = useRef<string | null>(null);
  const router = useRouter();
  
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    onCancel?: () => void;
    loading?: boolean;
    details?: {
      creditAmount?: string;
      timeline?: string;
      stripeEmail?: string;
      processingFeeNote?: string;
    };
  } | null>(null);

  // Helper function to get price ID for a plan
  const getPriceId = (plan: string, billing: 'monthly' | 'annual' = 'monthly') => {
    const priceMap: { [key: string]: { monthly: string; annual: string } } = {
      grower: {
        monthly: "price_1RT6s7LqwlpgZPtwjv65Q3xa", // Free trial, use builder price for first payment
        annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_GROWER_ANNUAL || "price_1RT6s7LqwlpgZPtwjv65Q3xa"
      },
      builder: {
        monthly: "price_1RT6s7LqwlpgZPtwjv65Q3xa",
        annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUILDER_ANNUAL || "price_1RT6s7LqwlpgZPtwjv65Q3xa"
      },
      maven: {
        monthly: "price_1RT6sVLqwlpgZPtwEZLKBQo7",
        annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MAVEN_ANNUAL || "price_1RT6sVLqwlpgZPtwEZLKBQo7"
      }
    };
    return priceMap[plan]?.[billing] || "";
  };

  // Helper function to calculate admin pricing (99% off)
  const getAdminPrice = (regularPrice: string) => {
    const price = parseFloat(regularPrice);
    const discountedPrice = price * 0.01; // 99% off = 1% of original price
    return discountedPrice.toFixed(2);
  };

  useEffect(() => {
    const fetchAccount = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      setUser(user);

      // Get account ID using the utility function
      const accountId = await getAccountIdForUser(user.id, supabase);
      
      if (!accountId) {
        console.error("No account found for user:", user.id);
        router.push("/dashboard/create-business");
        return;
      }

      // Get account data
      const { data: accountData } = await supabase
        .from("accounts")
        .select("*")
        .eq("id", accountId)
        .single();

      // Get user's role in this account
      const { data: accountUser } = await supabase
        .from("account_users")
        .select("role")
        .eq("account_id", accountId)
        .eq("user_id", user.id)
        .single();

      setAccount(accountData);
      setUserRole(accountUser?.role || null);
      setCurrentPlan(accountData?.plan || null);
      prevPlanRef.current = accountData?.plan || null;
      
      // Check if this is an admin account
      setIsAdminAccount(accountData?.is_admin === true);
      
      // Set billing period from database if available
      if (accountData?.billing_period) {
        setBillingPeriod(accountData.billing_period as 'monthly' | 'annual');
      }
      
      // Check if account has expired
      const now = new Date();
      const trialEnd = accountData?.trial_end ? new Date(accountData.trial_end) : null;
      const isTrialExpired = trialEnd && now > trialEnd && accountData?.plan === "grower" && accountData?.has_had_paid_plan === false;
      setIsExpired(Boolean(isTrialExpired));
      
      setIsLoading(false);
    };
    fetchAccount();
  }, [router, supabase]);

  const handleSelectTier = useCallback(
    async (tierKey: string, billing: 'monthly' | 'annual' = 'monthly') => {
      if (!account || !user) return;
      
      // Check if user has permission to change billing
      if (userRole !== 'owner') {
        alert('Only account owners can change billing plans. Please contact your account owner to make this change.');
        return;
      }
      
      const prevPlan = prevPlanRef.current;
      const currentTier = tiers.find((t) => t.key === prevPlan);
      const targetTier = tiers.find((t) => t.key === tierKey);
      
      // Handle users with no plan or invalid plan - treat as new user
      const hasValidCurrentPlan = currentTier && prevPlan && prevPlan !== 'no_plan' && prevPlan !== 'NULL';
      
      const isUpgrade =
        hasValidCurrentPlan && targetTier && targetTier.order > currentTier.order;
      const isDowngrade =
        hasValidCurrentPlan && targetTier && targetTier.order < currentTier.order;
      const isBillingPeriodChange = 
        hasValidCurrentPlan && tierKey === currentPlan && billing !== account?.billing_period;

      // Handle billing period change (monthly to annual or vice versa)
      if (isBillingPeriodChange && account.stripe_customer_id) {
        const isToAnnual = billing === 'annual';
        
        // Show loading modal while fetching preview
        setConfirmModalConfig({
          title: 'Calculating changes...',
          message: 'Please wait while we calculate your billing adjustment.',
          confirmText: '',
          cancelText: '',
          loading: true,
          onConfirm: () => {},
        });
        setShowConfirmModal(true);
        
        try {
          // Fetch the billing change preview
          const previewRes = await fetch("/api/preview-billing-change", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              plan: tierKey,
              userId: account.id,
              billingPeriod: billing,
            }),
          });
          
          if (previewRes.ok) {
            const { preview } = await previewRes.json();
            
            // Update modal with actual preview data
            setConfirmModalConfig({
              title: isToAnnual ? 'Switch to Annual Billing' : 'Switch to Monthly Billing',
              message: preview.message,
              confirmText: isToAnnual ? 'Switch to Annual' : 'Switch to Monthly',
              cancelText: 'Keep Current Plan',
              loading: false,
              details: {
                creditAmount: preview.creditAmount,
                timeline: preview.timeline,
                stripeEmail: preview.stripeEmail,
                processingFeeNote: preview.processingFeeNote,
              },
              onConfirm: async () => {
            setShowConfirmModal(false);
            setUpgrading(true);
            setUpgradingPlan('Updating billing period...');
            
            try {
              const res = await fetch("/api/upgrade-subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  plan: tierKey,
                  userId: account.id,
                  currentPlan: currentPlan,
                  billingPeriod: billing,
                }),
              });
              
              if (res.ok) {
                // Redirect to success page
                window.location.href = `/dashboard/plan?success=1&change=billing_period&plan=${tierKey}&billing=${billing}`;
                return;
              } else {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Billing period change failed');
              }
            } catch (error) {
              console.error("Billing period change error:", error);
              // Use modal for error too
              setConfirmModalConfig({
                title: 'Error',
                message: 'Failed to change billing period. Please try again.',
                confirmText: 'OK',
                cancelText: '',
                onConfirm: () => setShowConfirmModal(false)
              });
              setShowConfirmModal(true);
            } finally {
              setUpgrading(false);
              setUpgradingPlan('');
            }
              },
              onCancel: () => {
                setShowConfirmModal(false);
              }
            });
          } else {
            // Error fetching preview
            const errorData = await previewRes.json();
            setConfirmModalConfig({
              title: 'Error',
              message: errorData.message || 'Unable to calculate billing changes. Please try again.',
              confirmText: 'OK',
              cancelText: '',
              loading: false,
              onConfirm: () => setShowConfirmModal(false)
            });
          }
        } catch (error) {
          console.error("Error fetching billing preview:", error);
          setConfirmModalConfig({
            title: 'Error',
            message: 'Unable to calculate billing changes. Please try again.',
            confirmText: 'OK',
            cancelText: '',
            loading: false,
            onConfirm: () => setShowConfirmModal(false)
          });
        }
        return;
      }
      
      if (isUpgrade) {
        // Show upgrade confirmation modal with proration preview
        const gainedFeatures = targetTier.features.filter(feature => 
          !currentTier?.features.includes(feature)
        );
        setUpgradeTarget(tierKey);
        setUpgradeFeatures(gainedFeatures);
        
        // Fetch proration preview for the upgrade
        setShowConfirmModal(true);
        setConfirmModalConfig({
          title: 'Loading billing details...',
          message: 'Calculating proration for your upgrade...',
          confirmText: '',
          cancelText: '',
          loading: true,
          onConfirm: () => {},
        });
        
        try {
          const previewRes = await fetch("/api/preview-billing-change", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              plan: tierKey,
              userId: account.id,
              billingPeriod: billing,
            }),
          });
          
          if (previewRes.ok) {
            const { preview } = await previewRes.json();
            
            // Update modal with actual preview data
            setConfirmModalConfig({
              title: `Upgrade to ${targetTier.name}`,
              message: preview.message,
              confirmText: 'Confirm Upgrade',
              cancelText: 'Cancel',
              loading: false,
              details: {
                creditAmount: preview.creditAmount,
                timeline: preview.timeline,
                stripeEmail: preview.stripeEmail,
                processingFeeNote: preview.processingFeeNote,
              },
              onConfirm: async () => {
                setShowConfirmModal(false);
                setShowUpgradeModal(true);
              },
              onCancel: () => {
                setShowConfirmModal(false);
                setUpgradeTarget(null);
                setUpgradeFeatures([]);
              }
            });
          } else {
            // If preview fails, fall back to regular upgrade modal
            console.error('Failed to fetch billing preview');
            setShowConfirmModal(false);
            setShowUpgradeModal(true);
          }
        } catch (error) {
          console.error('Error fetching billing preview:', error);
          setShowConfirmModal(false);
          setShowUpgradeModal(true);
        }
        return;
      }
      
      // Handle new user or users with no valid plan selecting a paid plan (bypass upgrade modal for direct checkout)
      if ((isNewUser || !hasValidCurrentPlan || currentPlan === 'grower' || currentPlan === 'no_plan' || currentPlan === 'NULL') && tierKey !== 'grower') {
        try {
          const res = await fetch("/api/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              plan: tierKey,
              userId: account.id,
              email: user.email,
              billingPeriod: billing,
            }),
          });
          
          if (res.ok) {
            const data = await res.json();
            // Redirect to Stripe checkout
            window.location.href = data.url;
            return;
          } else {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Checkout failed');
          }
        } catch (error) {
          console.error("Checkout error:", error);
          alert("Failed to create checkout session. Please try again.");
          return;
        }
      }
      
      if (isDowngrade) {
        setLastAction("downgrade");
        
        // Show downgrade confirmation modal with proration preview
        const lostFeatures = (currentTier?.features || []).filter(
          (f) => !(targetTier?.features || []).includes(f),
        );
        setDowngradeTarget(tierKey);
        setDowngradeFeatures(lostFeatures);
        
        // Fetch proration preview for the downgrade
        setShowConfirmModal(true);
        setConfirmModalConfig({
          title: 'Loading billing details...',
          message: 'Calculating credit for your downgrade...',
          confirmText: '',
          cancelText: '',
          loading: true,
          onConfirm: () => {},
        });
        
        try {
          const previewRes = await fetch("/api/preview-billing-change", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              plan: tierKey,
              userId: account.id,
              billingPeriod: billing,
            }),
          });
          
          if (previewRes.ok) {
            const { preview } = await previewRes.json();
            
            // Update modal with actual preview data
            setConfirmModalConfig({
              title: `Downgrade to ${targetTier.name}`,
              message: preview.message,
              confirmText: 'Confirm Downgrade',
              cancelText: 'Keep Current Plan',
              loading: false,
              details: {
                creditAmount: preview.creditAmount,
                timeline: preview.timeline,
                stripeEmail: preview.stripeEmail,
                processingFeeNote: preview.processingFeeNote,
              },
              onConfirm: async () => {
                setShowConfirmModal(false);
                setShowDowngradeModal(true);
              },
              onCancel: () => {
                setShowConfirmModal(false);
                setDowngradeTarget(null);
                setDowngradeFeatures([]);
              }
            });
          } else {
            // If preview fails, fall back to regular downgrade modal
            console.error('Failed to fetch billing preview');
            setShowConfirmModal(false);
            setShowDowngradeModal(true);
          }
        } catch (error) {
          console.error('Error fetching billing preview:', error);
          setShowConfirmModal(false);
          setShowDowngradeModal(true);
        }
        return;
      }
      
      // Safety check: Never allow direct database updates for paid plans
      if (tierKey === 'builder' || tierKey === 'maven') {
        console.error(`🚨 CRITICAL: Attempted to directly update database with paid plan ${tierKey}. This should go through Stripe!`);
        alert('Error: Paid plans must be processed through Stripe. Please try again.');
        return;
      }
      
      // For same plan (should only be grower plan at this point), just reload
      await supabase
        .from("accounts")
        .update({ plan: tierKey })
        .eq("id", account.id);
      // Show stars and success modal for new user, upgrade, or downgrade
      if (isNewUser || (prevPlan === "grower" && tierKey !== "grower")) {
        setLastAction(isNewUser ? "new" : "upgrade");
        setStarAnimation(true);
        setShowSuccessModal(true);
      } else {
        // For same plan, just reload
        window.location.reload();
      }
    },
    [account, isNewUser, userRole, currentPlan, user, supabase],
  );

  // Show success modal after successful Stripe payment or handle canceled checkout
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Clean up any leftover localStorage flags that might cause false popups
    localStorage.removeItem("showPlanSuccess");
    
    const params = new URLSearchParams(window.location.search);
    
    // Only show success modal if returning from successful Stripe payment
    if (params.get("success") === "1") {
      const changeType = params.get("change") || "upgrade";
      const planName = params.get("plan");
      const billingType = params.get("billing");
      
      setStarAnimation(true);
      setShowSuccessModal(true);
      setLastAction(changeType as "new" | "upgrade" | "downgrade");
      
      console.log("🎉 Plan change successful!", {
        changeType,
        planName,
        billingType,
        currentUrl: window.location.href
      });
      
      // Show specific message based on change type
      if (changeType === "upgrade" && planName) {
        const tierName = tiers.find(t => t.key === planName)?.name || planName;
        const billingText = billingType === 'annual' ? ' (Annual)' : ' (Monthly)';
        console.log(`✅ Successfully upgraded to ${tierName}${billingText}. Any unused time from your previous plan has been credited.`);
      } else if (changeType === "billing_period") {
        const billingText = billingType === 'annual' ? 'annual' : 'monthly';
        console.log(`✅ Successfully switched to ${billingText} billing. Proration has been applied.`);
      }
      
      // Clean up the URL
      params.delete("success");
      params.delete("change");
      params.delete("plan");
      params.delete("billing");
      const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState({}, document.title, newUrl);
    }
    
    // Handle canceled checkout - reset any processing states
    if (params.get("canceled") === "1") {
      console.log("🚫 User canceled checkout, resetting modal states");
      setUpgradeProcessing(false);
      setDowngradeProcessing(false);
      setShowUpgradeModal(false);
      setShowDowngradeModal(false);
      
      // Clean up the URL
      params.delete("canceled");
      const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // Confirm downgrade handler
  const handleConfirmDowngrade = async () => {
    if (!downgradeTarget || !account || !user) return;
    
    // Additional permission check
    if (userRole !== 'owner') {
      alert('Only account owners can change billing plans.');
      setShowDowngradeModal(false);
      return;
    }
    
    setDowngradeProcessing(true);
    console.log("🔽 Starting downgrade process", {
      from: currentPlan,
      to: downgradeTarget,
      hasStripeCustomer: !!account.stripe_customer_id
    });
    
    try {
      // For customers with active Stripe subscriptions, use the upgrade API to downgrade
      // This includes downgrades TO grower (which is a paid plan at $15/month)
      if (account.stripe_customer_id) {
        console.log("📡 Calling upgrade-subscription API for downgrade...");
        const res = await fetch("/api/upgrade-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: downgradeTarget,
            userId: account.id,
            currentPlan: currentPlan,
            billingPeriod: billingPeriod,
          }),
        });
        
        if (res.ok) {
          const data = await res.json();
          console.log("📉 Downgrade API response:", data);
          
          // For now, always use local redirect to ensure it works
          const redirectUrl = `/dashboard/plan?success=1&change=downgrade&plan=${downgradeTarget}&billing=${billingPeriod}`;
          console.log("🔄 Redirecting to:", redirectUrl);
          
          // Add a small delay to ensure the database update completes
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 500);
          return;
        } else {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Downgrade failed');
        }
      } else {
        // For free/trial users, update the database directly
        await supabase
          .from("accounts")
          .update({ plan: downgradeTarget })
          .eq("id", account.id);
        
        // Refetch account data after downgrade
        const { data: updatedAccount } = await supabase
          .from("accounts")
          .select("*")
          .eq("id", account.id)
          .single();
        
        if (updatedAccount) {
          setAccount(updatedAccount);
          setCurrentPlan(updatedAccount.plan);
          prevPlanRef.current = updatedAccount.plan;
        }
        
        setShowDowngradeModal(false);
        setLastAction("downgrade");
        setStarAnimation(true);
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Downgrade error:", error);
      alert("Failed to downgrade. Please try again.");
    }
    setDowngradeProcessing(false);
  };
  const handleCancelDowngrade = () => {
    setShowDowngradeModal(false);
    setDowngradeTarget(null);
    setDowngradeFeatures([]);
    setDowngradeProcessing(false);
  };

  // Confirm upgrade handler
  const handleConfirmUpgrade = async () => {
    if (!upgradeTarget || !account || !user) return;
    
    // Additional permission check
    if (userRole !== 'owner') {
      alert('Only account owners can change billing plans.');
      setShowUpgradeModal(false);
      return;
    }
    
    setUpgradeProcessing(true);
    
    try {
      // Check if user has a Stripe customer ID (existing customer vs new user)
      // Users with stripe_customer_id are paying customers, even if on grower plan
      const hasStripeCustomer = !!account.stripe_customer_id;
      
      if (hasStripeCustomer) {
        // Existing customer - use upgrade API
        const res = await fetch("/api/upgrade-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: upgradeTarget,
            userId: account.id,
            currentPlan: currentPlan,
            billingPeriod: billingPeriod,
          }),
        });
        
        if (res.ok) {
          const data = await res.json();
          console.log("📈 Upgrade API response:", data);
          
          // For now, always use local redirect to ensure it works
          const redirectUrl = `/dashboard/plan?success=1&change=upgrade&plan=${upgradeTarget}&billing=${billingPeriod}`;
          console.log("🔄 Redirecting to:", redirectUrl);
          
          // Add a small delay to ensure the database update completes
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 500);
          return;
        } else {
          const errorData = await res.json();
          
          // Check if this is a free trial user who should use checkout instead
          if (errorData.error === "FREE_TRIAL_USER" || errorData.redirectToCheckout) {
            console.log("Free trial user detected, redirecting to checkout...");
            
            // Redirect to checkout session API instead
            const checkoutRes = await fetch("/api/create-checkout-session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                plan: upgradeTarget,
                userId: account.id,
                email: user.email,
                billingPeriod: billingPeriod,
              }),
            });
            
            if (checkoutRes.ok) {
              const checkoutData = await checkoutRes.json();
              // Redirect to Stripe checkout
              window.location.href = checkoutData.url;
              return;
            } else {
              const checkoutErrorData = await checkoutRes.json();
              throw new Error(checkoutErrorData.message || 'Checkout failed');
            }
          }
          
          throw new Error(errorData.message || 'Upgrade failed');
        }
      } else {
        // New user or trial user - use checkout session API
        const res = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: upgradeTarget,
            userId: account.id,
            email: user.email,
            billingPeriod: billingPeriod,
          }),
        });
        
        if (res.ok) {
          const data = await res.json();
          // Redirect to Stripe checkout
          window.location.href = data.url;
          return;
        } else {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Checkout failed');
        }
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      alert("Failed to upgrade. Please try again.");
    }
    setUpgradeProcessing(false);
  };

  const handleCancelUpgrade = () => {
    setShowUpgradeModal(false);
    setUpgradeTarget(null);
    setUpgradeFeatures([]);
    setUpgradeProcessing(false);
  };

  if (isLoading) {
    return <AppLoader />;
  }

  // Helper to check if user can manage billing
  const isOwner = userRole === 'owner';
  const canManageBilling = isOwner;

  return (
    <>
      <div className="min-h-screen text-white flex flex-col">
        {/* Header */}
        <div className="max-w-6xl mx-auto w-full px-6 pt-12">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 text-white">
              Choose your plan
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              {currentPlan === "grower" || !currentPlan 
                ? "Select the perfect plan to start collecting more reviews."
                : `You're currently on the ${tiers.find(t => t.key === currentPlan)?.name || currentPlan} plan${account?.billing_period === 'annual' ? ' (Annual billing)' : account?.billing_period === 'monthly' ? ' (Monthly billing)' : ''}.`
              }
            </p>
            
            {/* Admin account notice */}
            {isAdminAccount && (
              <div className="mt-6 p-4 bg-green-900/30 border border-green-700 rounded-lg max-w-2xl mx-auto">
                <div className="flex items-center justify-center space-x-2 text-green-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium">
                    Admin testing mode active: 99% discount will be applied at checkout (~$1-3 pricing)
                  </p>
                </div>
              </div>
            )}
            
            {/* Permission messaging for non-owners */}
            {!canManageBilling && (
              <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg max-w-2xl mx-auto">
                <div className="flex items-center justify-center space-x-2 text-blue-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm">
                    You're viewing as a team member. Only account owners can change billing plans.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Main Content */}
        <div className="w-full flex flex-col items-center justify-start py-12">          
          {/* Expired Account Message */}
          {isExpired && (
            <div className="mb-6 bg-red-900/20 border border-red-700 rounded-lg p-4 max-w-2xl">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-red-400 text-xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-200">
                    Your trial has expired
                  </h3>
                  <div className="mt-1 text-sm text-red-300">
                    <p>
                      Don't lose access to your reviews and analytics. Choose a plan below to continue growing your business.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Billing Period Toggle */}
          <div className="mb-8 flex justify-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1 flex items-center border border-white/20">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 rounded-md transition-all ${
                  billingPeriod === 'monthly' 
                    ? 'bg-slate-blue text-white' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('annual')}
                className={`px-4 py-2 rounded-md transition-all flex items-center ${
                  billingPeriod === 'annual' 
                    ? 'bg-slate-blue text-white' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Annual
                <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                  Save 15%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full px-4">
            {tiers.map((tier) => (
              <div
                key={tier.key}
                className={`relative bg-white/10 backdrop-blur-sm rounded-lg p-6 border-2 transition-all duration-300 hover:scale-105 flex flex-col ${
                  currentPlan === tier.key && billingPeriod === account?.billing_period
                    ? "border-blue-400 bg-blue-500/20"
                    : "border-white/20 hover:border-white/40"
                }`}
              >
                {currentPlan === tier.key && billingPeriod === account?.billing_period && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Current Plan
                    </span>
                  </div>
                )}
                <div className="text-center flex flex-col h-full">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {tier.name}
                  </h3>
                  <div className="mb-4">
                    {isAdminAccount ? (
                      // Show admin pricing
                      billingPeriod === 'monthly' ? (
                        <div>
                          <div className="text-3xl font-bold text-white">
                            ${getAdminPrice(tier.priceMonthly)}<span className="text-lg font-normal">/mo</span>
                          </div>
                          <div className="text-sm text-white/70 line-through">
                            ${tier.priceMonthly}/mo
                          </div>
                          <div className="text-xs text-green-400 font-semibold">
                            99% OFF - Admin Testing
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-3xl font-bold text-white">
                            ${getAdminPrice(tier.priceAnnual)}<span className="text-lg font-normal">/mo</span>
                          </div>
                          <div className="text-sm text-white/70 mt-1">
                            ${getAdminPrice(tier.annualTotal)}/year
                          </div>
                          <div className="text-sm text-white/70 line-through">
                            ${tier.annualTotal}/year
                          </div>
                          <div className="text-xs text-green-400 font-semibold">
                            99% OFF - Admin Testing
                          </div>
                        </div>
                      )
                    ) : (
                      // Show regular pricing
                      billingPeriod === 'monthly' ? (
                        <div className="text-3xl font-bold text-white">
                          ${tier.priceMonthly}<span className="text-lg font-normal">/mo</span>
                        </div>
                      ) : (
                        <div>
                          <div className="text-3xl font-bold text-white">
                            ${tier.priceAnnual}<span className="text-lg font-normal">/mo</span>
                          </div>
                          <div className="text-sm text-white/70 mt-1">
                            ${tier.annualTotal}/year
                          </div>
                        </div>
                      )
                    )}
                  </div>
                  <ul className="text-white/90 space-y-2 mb-6 flex-grow">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <span className="text-green-400 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleSelectTier(tier.key, billingPeriod)}
                    disabled={(currentPlan === tier.key && billingPeriod === account?.billing_period) || !canManageBilling}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                      currentPlan === tier.key && billingPeriod === account?.billing_period
                        ? "bg-purple-400 text-purple-900 cursor-not-allowed"
                        : !canManageBilling
                        ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                        : "bg-slate-blue hover:bg-slate-blue/90 text-white"
                    }`}
                  >
                    {(() => {
                      if (currentPlan === tier.key && billingPeriod === account?.billing_period) return "Current Plan";
                      if (currentPlan === tier.key && billingPeriod !== account?.billing_period) {
                        return billingPeriod === 'annual' ? "Switch to Annual" : "Switch to Monthly";
                      }
                      if (!canManageBilling) return "Contact Account Owner";
                      if (isNewUser || !currentPlan || currentPlan === 'grower') {
                        return tier.key === "grower" ? "Start Free Trial" : "Get Started";
                      }
                      
                      // For existing users, show upgrade/downgrade based on tier order
                      const currentTier = tiers.find((t) => t.key === currentPlan);
                      const targetTier = tiers.find((t) => t.key === tier.key);
                      
                      if (!currentTier || !targetTier) return "Select Plan";
                      if (targetTier.order > currentTier.order) return "Upgrade";
                      if (targetTier.order < currentTier.order) return "Downgrade";
                      return "Select Plan";
                    })()}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center relative">
              {/* Standardized close button - breaching corner */}
              <button
                onClick={() => setShowSuccessModal(false)}
                className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-200 z-10"
                aria-label="Close modal"
              >
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Crompty Image */}
              <div className="mb-6 flex justify-center">
                <img
                  src="https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/small-prompty-success.png"
                  alt="Crompty Success"
                  className="w-24 h-24 object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {lastAction === "new"
                  ? "Welcome to Prompt Reviews!"
                  : lastAction === "upgrade"
                  ? "Plan Upgraded Successfully!"
                  : "Plan Updated Successfully!"}
              </h2>
              <p className="text-gray-600 mb-6">
                {lastAction === "new"
                  ? "Your account has been created and you're ready to start collecting reviews!"
                  : lastAction === "upgrade"
                  ? "You now have access to all the features in your new plan. Any unused time from your previous subscription has been automatically credited to your account."
                  : "Your plan has been updated successfully. Proration has been automatically applied to your account."}
              </p>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push("/dashboard");
                }}
                className="bg-slate-blue text-white px-6 py-2 rounded-lg hover:bg-slate-blue/90 transition-colors"
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Downgrade Confirmation Modal */}
        {showDowngradeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md mx-4 relative">
              {/* Standardized close button - always available */}
              <button
                onClick={handleCancelDowngrade}
                className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-200 z-10"
                aria-label="Close modal"
              >
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {downgradeProcessing ? (
                // Processing State
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Downgrading your plan...
                  </h3>
                  <p className="text-gray-600 mb-4">
                    We're processing your downgrade to {tiers.find(t => t.key === downgradeTarget)?.name}. This may take a few moments.
                  </p>
                  
                  {/* Powered by Stripe Badge */}
                  <div className="flex items-center justify-center space-x-2 pt-4 border-t border-gray-200">
                    <span className="text-sm text-gray-500">Powered by</span>
                    <span className="text-sm font-semibold" style={{ color: '#635BFF' }}>Stripe</span>
                  </div>
                </div>
              ) : (
                // Confirmation State
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Confirm Plan Downgrade
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Are you sure you want to downgrade your plan? You'll lose access to:
                  </p>
                  <ul className="text-red-600 mb-6 space-y-1">
                    {downgradeFeatures.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <span className="text-red-500 mr-2">✗</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-center">
                    <button
                      onClick={handleConfirmDowngrade}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Confirm Downgrade
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Upgrade Confirmation Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md mx-4 relative">
              {/* Standardized close button - always available */}
              <button
                onClick={handleCancelUpgrade}
                className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-200 z-10"
                aria-label="Close modal"
              >
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {upgradeProcessing ? (
                // Processing State
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-blue mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Upgrading your plan...
                  </h3>
                  <p className="text-gray-600 mb-4">
                    We're processing your upgrade to {tiers.find(t => t.key === upgradeTarget)?.name}. This may take a few moments.
                  </p>
                  
                  {/* Powered by Stripe Badge */}
                  <div className="flex items-center justify-center space-x-2 pt-4 border-t border-gray-200">
                    <span className="text-sm text-gray-500">Powered by</span>
                    <span className="text-sm font-semibold" style={{ color: '#635BFF' }}>Stripe</span>
                  </div>
                </div>
              ) : (
                // Confirmation State
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Confirm Plan Upgrade
                  </h2>
                  <p className="text-gray-600 mb-4">
                    You're upgrading to {tiers.find(t => t.key === upgradeTarget)?.name}. You'll gain access to:
                  </p>
                  <ul className="text-green-600 mb-6 space-y-1">
                    {upgradeFeatures.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-center">
                    <button
                      onClick={handleConfirmUpgrade}
                      className="bg-slate-blue text-white px-6 py-2 rounded-lg hover:bg-slate-blue/90 transition-colors"
                    >
                      Confirm Upgrade
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Star Animation Overlay */}
        {starAnimation && (
          <TopLoaderOverlay />
        )}
        
        {/* Loading Overlay for Billing Changes */}
        {upgrading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-sm mx-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-blue mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {upgradingPlan || 'Processing...'}
              </h3>
              <p className="text-gray-600 text-sm">
                Please wait while we update your billing...
              </p>
            </div>
          </div>
        )}
        
        {/* Confirmation Modal */}
        {showConfirmModal && confirmModalConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={!confirmModalConfig.loading ? confirmModalConfig.onCancel : undefined}
            />
            
            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 border-2 border-white">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">{confirmModalConfig.title}</h2>
              </div>
              
              {/* Content */}
              <div className="p-6">
                {confirmModalConfig.loading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-blue"></div>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-600">{confirmModalConfig.message}</p>
                    
                    {/* Additional details for billing changes */}
                    {confirmModalConfig.details && (
                      <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded-lg">
                        {confirmModalConfig.details.timeline && (
                          <div className="flex items-start space-x-2">
                            <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-gray-600">{confirmModalConfig.details.timeline}</p>
                          </div>
                        )}
                        {confirmModalConfig.details.stripeEmail && (
                          <div className="flex items-start space-x-2">
                            <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-gray-600">{confirmModalConfig.details.stripeEmail}</p>
                          </div>
                        )}
                        {confirmModalConfig.details.processingFeeNote && (
                          <div className="flex items-start space-x-2">
                            <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-gray-500">{confirmModalConfig.details.processingFeeNote}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {/* Footer */}
              {!confirmModalConfig.loading && (
                <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                  {confirmModalConfig.cancelText && (
                    <button
                      onClick={confirmModalConfig.onCancel}
                      className="px-5 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      {confirmModalConfig.cancelText}
                    </button>
                  )}
                  {confirmModalConfig.confirmText && (
                    <button
                      onClick={confirmModalConfig.onConfirm}
                      className="px-5 py-2 bg-slate-blue text-white font-medium rounded-lg hover:bg-slate-blue/90 transition-colors"
                    >
                      {confirmModalConfig.confirmText}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

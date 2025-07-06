"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabaseClient";
import PricingModal from "../../components/PricingModal";
import AppLoader from "@/app/components/AppLoader";
import { useRouter } from "next/navigation";
import { tiers } from "../../components/PricingModal";
import TopLoaderOverlay from "@/app/components/TopLoaderOverlay";
import { getAccountIdForUser } from "@/utils/accountUtils";

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
  const prevPlanRef = useRef<string | null>(null);
  const router = useRouter();

  // Helper function to get price ID for a plan
  const getPriceId = (plan: string) => {
    const priceMap: { [key: string]: string } = {
      grower: "price_1RT6s7LqwlpgZPtwjv65Q3xa", // Free trial, use builder price for first payment
      builder: "price_1RT6s7LqwlpgZPtwjv65Q3xa",
      maven: "price_1RT6sVLqwlpgZPtwEZLKBQo7"
    };
    return priceMap[plan] || "";
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
      
      // Check if account has expired
      const now = new Date();
      const trialEnd = accountData?.trial_end ? new Date(accountData.trial_end) : null;
      const isTrialExpired = trialEnd && now > trialEnd && accountData?.plan === "grower" && accountData?.has_had_paid_plan === false;
      setIsExpired(Boolean(isTrialExpired));
      
      setIsLoading(false);
    };
    fetchAccount();
  }, []);

  const handleSelectTier = useCallback(
    async (tierKey: string) => {
      if (!account || !user) return;
      
      // Check if user has permission to change billing
      if (userRole !== 'owner') {
        alert('Only account owners can change billing plans. Please contact your account owner to make this change.');
        return;
      }
      
      const prevPlan = prevPlanRef.current;
      const currentTier = tiers.find((t) => t.key === prevPlan);
      const targetTier = tiers.find((t) => t.key === tierKey);
      
      const isUpgrade =
        currentTier && targetTier && targetTier.order > currentTier.order;
      const isDowngrade =
        currentTier && targetTier && targetTier.order < currentTier.order;

      if (isUpgrade) {
        // Show upgrade confirmation modal
        const gainedFeatures = targetTier.features.filter(feature => 
          !currentTier?.features.includes(feature)
        );
        setUpgradeTarget(tierKey);
        setUpgradeFeatures(gainedFeatures);
        setShowUpgradeModal(true);
        return;
      }
      
      // Handle new user selecting a paid plan (bypass upgrade modal for direct checkout)
      if ((isNewUser || !currentPlan || currentPlan === 'grower') && tierKey !== 'grower') {
        try {
          const res = await fetch("/api/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              plan: tierKey,
              userId: account.id,
              email: user.email,
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
        
        // Show downgrade confirmation modal for all downgrades
        const lostFeatures = (currentTier?.features || []).filter(
          (f) => !(targetTier?.features || []).includes(f),
        );
        setDowngradeTarget(tierKey);
        setDowngradeFeatures(lostFeatures);
        setShowDowngradeModal(true);
        return;
      }
      
      // For same plan, just reload
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
    [account, isNewUser, router, userRole],
  );

  // Show success modal after successful Stripe payment
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Clean up any leftover localStorage flags that might cause false popups
    localStorage.removeItem("showPlanSuccess");
    
    const params = new URLSearchParams(window.location.search);
    
    // Only show success modal if returning from successful Stripe payment
    if (params.get("success") === "1") {
      setStarAnimation(true);
      setShowSuccessModal(true);
      setLastAction("upgrade");
      
      // Clean up the URL
      params.delete("success");
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
    
    try {
      // For customers with active Stripe subscriptions, use the upgrade API to downgrade
      if (account.stripe_customer_id && currentPlan !== "grower") {
        const res = await fetch("/api/upgrade-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: downgradeTarget,
            userId: account.id,
            currentPlan: currentPlan,
          }),
        });
        
        if (res.ok) {
          // Redirect to success page
          window.location.href = `/dashboard?success=1&change=downgrade&plan=${downgradeTarget}`;
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
      const hasStripeCustomer = account.stripe_customer_id && currentPlan !== "grower";
      
      if (hasStripeCustomer) {
        // Existing customer - use upgrade API
        const res = await fetch("/api/upgrade-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: upgradeTarget,
            userId: account.id,
            currentPlan: currentPlan,
          }),
        });
        
        if (res.ok) {
          // Redirect to success page
          window.location.href = `/dashboard?success=1&change=upgrade&plan=${upgradeTarget}`;
          return;
        } else {
          const errorData = await res.json();
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
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              {currentPlan === "grower" || !currentPlan 
                ? "Select the perfect plan to start collecting more reviews."
                : `You're currently on the ${tiers.find(t => t.key === currentPlan)?.name || currentPlan} plan.`
              }
            </p>
            
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full px-4">
            {tiers.map((tier) => (
              <div
                key={tier.key}
                className={`relative bg-white/10 backdrop-blur-sm rounded-lg p-6 border-2 transition-all duration-300 hover:scale-105 ${
                  currentPlan === tier.key
                    ? "border-blue-400 bg-blue-500/20"
                    : "border-white/20 hover:border-white/40"
                }`}
              >
                {currentPlan === tier.key && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Current Plan
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {tier.name}
                  </h3>
                  <div className="text-3xl font-bold text-white mb-4">
                    ${tier.price}
                  </div>
                  <ul className="text-white/90 space-y-2 mb-6">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <span className="text-green-400 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleSelectTier(tier.key)}
                    disabled={currentPlan === tier.key || !canManageBilling}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                      currentPlan === tier.key
                        ? "bg-purple-400 text-purple-900 cursor-not-allowed"
                        : !canManageBilling
                        ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                        : "bg-slate-blue hover:bg-slate-blue/90 text-white"
                    }`}
                  >
                    {(() => {
                      if (currentPlan === tier.key) return "Current Plan";
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
                  ? "You now have access to all the features in your new plan."
                  : "Your plan has been updated successfully."}
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
                  {/* Standardized close button - breaching corner */}
                  <button
                    onClick={handleCancelDowngrade}
                    className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-200 z-10"
                    aria-label="Close modal"
                  >
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  
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
                  {/* Standardized close button - breaching corner */}
                  <button
                    onClick={handleCancelUpgrade}
                    className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-200 z-10"
                    aria-label="Close modal"
                  >
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  
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
      </div>
    </>
  );
}

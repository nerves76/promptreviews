"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/utils/supabaseClient";
import PricingModal from "../../components/PricingModal";
import AppLoader from "@/app/components/AppLoader";
import { useRouter } from "next/navigation";
import { tiers } from "../../components/PricingModal";
import TopLoaderOverlay from "@/app/components/TopLoaderOverlay";
import { getAccountIdForUser } from "@/utils/accountUtils";

export default function PlanPage() {
  const [account, setAccount] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [downgradeTarget, setDowngradeTarget] = useState<string | null>(null);
  const [downgradeFeatures, setDowngradeFeatures] = useState<string[]>([]);
  const [lastAction, setLastAction] = useState<string>("");
  const [starAnimation, setStarAnimation] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const prevPlanRef = useRef<string | null>(null);
  const router = useRouter();
  // Using singleton Supabase client from supabaseClient.ts

  useEffect(() => {
    const fetchAccount = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Get account ID using the utility function
      const accountId = await getAccountIdForUser(user.id, supabase);
      
      if (!accountId) {
        console.error("No account found for user:", user.id);
        router.push("/dashboard/create-business");
        return;
      }

      const { data: accountData } = await supabase
        .from("accounts")
        .select("*")
        .eq("id", accountId)
        .single();
      setAccount(accountData);
      setCurrentPlan(accountData?.plan || null);
      prevPlanRef.current = accountData?.plan || null;
      
      // Check if account has expired
      const now = new Date();
      const trialEnd = accountData?.trial_end ? new Date(accountData.trial_end) : null;
      const isTrialExpired = trialEnd && now > trialEnd && accountData?.plan === "free" && accountData?.has_had_paid_plan === false;
      setIsExpired(Boolean(isTrialExpired));
      
      setIsLoading(false);
    };
    fetchAccount();
  }, []);

  const handleSelectTier = useCallback(
    async (tierKey: string) => {
      if (!account) return;
      const prevPlan = prevPlanRef.current;
      const currentTier = tiers.find((t) => t.key === prevPlan);
      const targetTier = tiers.find((t) => t.key === tierKey);
      const isUpgrade =
        currentTier && targetTier && targetTier.order > currentTier.order;
      const isDowngrade =
        currentTier && targetTier && targetTier.order < currentTier.order;

      if (isUpgrade) {
        setLastAction("upgrade");
        // If user already has a Stripe customer ID, send to billing portal for upgrades
        if (account.stripe_customer_id) {
          setIsLoading(true);
          const res = await fetch("/api/create-stripe-portal-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ customerId: account.stripe_customer_id }),
          });
          const data = await res.json();
          setIsLoading(false);
          if (data.url) {
            window.location.href = data.url;
            return;
          } else {
            alert("Could not open billing portal.");
            return;
          }
        }
        // Otherwise, proceed with checkout session (for new users)
        const { data: { user } } = await supabase.auth.getUser();
        const email = user?.email;
        if (!email) {
          alert("No valid email address found for checkout.");
          return;
        }
        const res = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: tierKey,
            userId: account.id,
            email,
          }),
        });
        const data = await res.json();
        if (data.url) {
          // Set flag to show success modal after Stripe redirect
          localStorage.setItem("showPlanSuccess", "1");
          window.location.href = data.url;
          return;
        } else {
          alert("Failed to start checkout: " + (data.error || "Unknown error"));
          return;
        }
      }
      if (isDowngrade) {
        setLastAction("downgrade");
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
    [account, isNewUser, router],
  );

  // Show success modal after Stripe redirect if flag is set
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("showPlanSuccess") === "1") {
      setStarAnimation(true);
      setShowSuccessModal(true);
      localStorage.removeItem("showPlanSuccess");
    }
  }, [isNewUser, router]);

  // Confirm downgrade handler
  const handleConfirmDowngrade = async () => {
    if (!downgradeTarget) return;
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
    setAccount(updatedAccount);
    setCurrentPlan(updatedAccount?.plan || null);
    setShowDowngradeModal(false);
    setLastAction("downgrade");
    setStarAnimation(false);
    setShowSuccessModal(true);
  };
  const handleCancelDowngrade = () => {
    setShowDowngradeModal(false);
    setDowngradeTarget(null);
    setDowngradeFeatures([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen w-full flex flex-col items-center justify-start py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white text-center drop-shadow-lg">
          {isNewUser ? "Choose your plan to get started" : "Manage your plan"}
        </h1>
        {!isNewUser && currentPlan && currentPlan !== "free" && currentPlan !== "none" && (
          <div className="mb-2 text-lg text-white/80">
            <span className="font-semibold">Current Plan:</span>{" "}
            <span className="capitalize">
              {currentPlan === "grower"
                ? "Grower"
                : currentPlan === "builder"
                  ? "Builder"
                  : currentPlan === "maven"
                    ? "Maven"
                    : currentPlan.charAt(0).toUpperCase() +
                      currentPlan.slice(1)}
            </span>
          </div>
        )}
        
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
        
        <div className="text-white/80 text-center mb-8 max-w-2xl">
          <p>
            {isNewUser
              ? "Start with our 14-day free trial. No credit card required."
              : "Upgrade, downgrade, or renew your subscription below."}
          </p>
        </div>

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
                  <span className="text-lg font-normal text-white/70">
                    /month
                  </span>
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
                  disabled={currentPlan === tier.key}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                    currentPlan === tier.key
                      ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {currentPlan === tier.key
                    ? "Current Plan"
                    : isNewUser
                    ? "Start Free Trial"
                    : "Select Plan"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {lastAction === "new"
                ? "Welcome to PromptReviews!"
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
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Downgrade Confirmation Modal */}
      {showDowngradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4">
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
            <div className="flex gap-4">
              <button
                onClick={handleConfirmDowngrade}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Confirm Downgrade
              </button>
              <button
                onClick={handleCancelDowngrade}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Star Animation Overlay */}
      {starAnimation && (
        <TopLoaderOverlay />
      )}
    </>
  );
}

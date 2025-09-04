"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabaseClient";
import PricingModal from "../../components/PricingModal";
import AppLoader from "@/app/(app)/components/AppLoader";
import { useRouter, useSearchParams } from "next/navigation";
import { tiers } from "../../components/PricingModal";
import TopLoaderOverlay from "@/app/(app)/components/TopLoaderOverlay";
import { useAuth } from "@/auth";

export default function PlanPage() {
  const supabase = createClient();
  const { selectedAccountId, account: authAccount } = useAuth();

  // Log when component mounts/unmounts
  useEffect(() => {
    return () => {
    };
  }, []);
  
  const [account, setAccount] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'owner' | 'member' | null>(null);
  // Check for success state immediately
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const hasSuccess = urlParams.get('success') === '1';
      const hasSessionSuccess = sessionStorage.getItem('showPlanSuccessModal') === 'true';
      const shouldLoad = !hasSuccess && !hasSessionSuccess;
      return shouldLoad;
    }
    return true;
  });
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  // Don't initialize from sessionStorage to avoid hydration mismatch
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Debug render cycles with state
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [downgradeTarget, setDowngradeTarget] = useState<string | null>(null);
  const [downgradeFeatures, setDowngradeFeatures] = useState<string[]>([]);
  const [downgradeProcessing, setDowngradeProcessing] = useState(false);
  const [hadPreviousTrial, setHadPreviousTrial] = useState(false);
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
  const successModalShownRef = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
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

  // Combined effect for handling success modal from both URL and sessionStorage
  // Use specific search param values as dependencies instead of the whole object
  const success = searchParams?.get('success');
  const change = searchParams?.get('change');
  const canceled = searchParams?.get('canceled');
  const isReactivation = searchParams?.get('reactivation') === 'true';
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const shouldShowModal = sessionStorage.getItem('showPlanSuccessModal');
      const savedAction = sessionStorage.getItem('planSuccessAction');
      
      // Check if we should show success modal from URL or session
      if ((success === '1' || shouldShowModal === 'true') && !successModalShownRef.current) {
        
        // Mark that we've shown the modal BEFORE setting state to prevent re-runs
        successModalShownRef.current = true;
        
        // Determine if this is a first payment (from no_plan or expired trial)
        const isFirstPayment = account && (
          !account.has_had_paid_plan || 
          (account.trial_end && new Date(account.trial_end) < new Date() && !account.stripe_subscription_id)
        );
        
        // Set action type from URL or session, considering first payment
        let action = change || savedAction || 'upgrade';
        if (isFirstPayment && action === 'upgrade') {
          action = 'first_payment';
        }
        
        // Batch all state updates together
        setLastAction(action);
        setShowSuccessModal(true);
        setStarAnimation(false);
        setIsLoading(false);
        
        // Save to sessionStorage if not already there
        sessionStorage.setItem('showPlanSuccessModal', 'true');
        sessionStorage.setItem('planSuccessAction', action);
        
        // Clean up URL if needed
        if (success === '1') {
          setTimeout(() => {
            window.history.replaceState({}, '', window.location.pathname);
          }, 100);
        }
      }
      
      // Handle canceled checkout
      if (canceled === '1') {
        setUpgradeProcessing(false);
        setDowngradeProcessing(false);
        setShowUpgradeModal(false);
        setShowDowngradeModal(false);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [success, change, canceled]); // Only re-run when these specific values change

  useEffect(() => {
    const fetchAccount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      setUser(user);

      // Get account ID from auth context
      const accountId = selectedAccountId || authAccount?.id;
      
      if (!accountId) {
        router.push("/dashboard/create-business");
        return;
      }

      // Parallelize database queries for better performance
      const [accountResult, userRoleResult] = await Promise.all([
        supabase.from("accounts").select("*").eq("id", accountId).single(),
        supabase.from("account_users").select("role").eq("account_id", accountId).eq("user_id", user.id).single()
      ]);

      const accountData = accountResult.data;
      const accountUser = userRoleResult.data;

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
      const trialStart = accountData?.trial_start ? new Date(accountData.trial_start) : null;
      const isTrialExpired = trialEnd && now > trialEnd && accountData?.plan === "grower" && accountData?.has_had_paid_plan === false;
      setIsExpired(Boolean(isTrialExpired));
      
      // Check if user already had a trial (trial_start exists and is in the past)
      const hadTrial = trialStart && trialStart < now && (accountData?.plan !== 'grower' || isTrialExpired || accountData?.has_had_paid_plan);
      setHadPreviousTrial(Boolean(hadTrial));
      
      // Stop showing loader immediately - page can render now
      setIsLoading(false);
      
      // Sync with Stripe in background (non-blocking)
      if (accountData?.stripe_subscription_id) {
        fetch('/api/sync-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: accountId })
        })
        .then(syncRes => {
          if (syncRes.ok) {
            return syncRes.json();
          }
          throw new Error('Sync failed');
        })
        .then(syncData => {
          if (syncData.currentPlan && syncData.currentBilling) {
            // Update local state if sync changed the values
            if (syncData.currentPlan !== accountData.plan || syncData.currentBilling !== accountData.billing_period) {
              setCurrentPlan(syncData.currentPlan);
              setBillingPeriod(syncData.currentBilling as 'monthly' | 'annual');
              prevPlanRef.current = syncData.currentPlan;
            }
          }
        })
        .catch(err => {
          console.warn('Failed to sync with Stripe:', err);
        });
      }
    };
    fetchAccount();
  }, [router, supabase, selectedAccountId, authAccount?.id]);

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
        
        // Check if user needs checkout (trial/free) or upgrade (existing customer)
        const needsCheckout = !account.stripe_customer_id || account.is_free_account;
        
        
        if (needsCheckout) {
          // For trial/free users, go directly to checkout (no proration needed)
          setUpgrading(true);
          setUpgradingPlan(`Setting up ${targetTier.name} plan...`);
          
          try {
            const res = await fetch("/api/create-checkout-session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                priceId: getPriceId(tierKey, billing),
                plan: tierKey,
                billingPeriod: billing,
                userId: account.id,
                isReactivation: isReactivation,
              }),
            });
            
            if (res.ok) {
              const data = await res.json();
              window.location.href = data.url;
              return;
            } else {
              const errorData = await res.json();
              throw new Error(errorData.message || 'Checkout failed');
            }
          } catch (error) {
            console.error("Checkout error:", error);
            alert("Failed to create checkout session. Please try again.");
          } finally {
            setUpgrading(false);
            setUpgradingPlan('');
          }
          return;
        }
        
        // Show upgrade confirmation first
        setShowUpgradeModal(true);
        
        // Fetch proration preview in the background
        fetch("/api/preview-billing-change", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: tierKey,
            userId: account.id,
            billingPeriod: billing,
          }),
        }).then(async (previewRes) => {
          if (previewRes.ok) {
            const { preview } = await previewRes.json();
            
            // Store the proration info to show after upgrade confirmation
            setConfirmModalConfig({
              title: `Billing Details for ${targetTier.name}`,
              message: `You'll be charged $${preview.netAmount} for the prorated difference.`,
              confirmText: 'Proceed with Upgrade',
              cancelText: 'Cancel',
              loading: false,
              details: {
                creditAmount: preview.creditAmount,
                timeline: preview.timeline,
                stripeEmail: preview.stripeEmail,
                processingFeeNote: preview.processingFeeNote,
              },
              onConfirm: async () => {
                // Actually perform the upgrade
                setShowConfirmModal(false);
                setUpgrading(true);
                setUpgradingPlan(`Upgrading to ${targetTier.name}...`);
                
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
                    const data = await res.json();
                    window.location.href = data.redirectUrl || `/dashboard/plan?success=1&change=upgrade&plan=${tierKey}&billing=${billing}`;
                  } else {
                    throw new Error('Upgrade failed');
                  }
                } catch (error) {
                  console.error("Upgrade error:", error);
                  alert("Failed to upgrade. Please try again.");
                } finally {
                  setUpgrading(false);
                  setUpgradingPlan('');
                }
              },
              onCancel: () => {
                setShowConfirmModal(false);
                setUpgradeTarget(null);
                setUpgradeFeatures([]);
              }
            });
          } else {
            // If preview fails, just proceed without proration details
            console.error('Billing preview failed with status:', previewRes.status);
            
            let errorData: any = { error: 'Unknown error' };
            const responseText = await previewRes.text();
            
            try {
              errorData = JSON.parse(responseText);
            } catch (e) {
              console.error('Failed to parse error response:', e);
              errorData = { error: 'Server error', message: responseText || 'Unable to calculate billing changes' };
            }
            
            console.error('Failed to fetch billing preview:', errorData);
            
            // Show error message to user
            setConfirmModalConfig({
              title: 'Unable to Calculate Billing',
              message: errorData.message || 'Unable to calculate billing changes. You can still proceed with the upgrade.',
              confirmText: 'Continue Anyway',
              cancelText: 'Cancel',
              loading: false,
              onConfirm: () => {
                setShowConfirmModal(false);
                setShowUpgradeModal(true);
              },
              onCancel: () => {
                setShowConfirmModal(false);
                setUpgradeTarget(null);
                setUpgradeFeatures([]);
              }
            });
          }
        }).catch((error) => {
          console.error('Error fetching billing preview:', error);
          
          // Show error message to user
          setConfirmModalConfig({
            title: 'Connection Error',
            message: 'Unable to connect to billing service. Please try again.',
            confirmText: 'Try Again',
            cancelText: 'Cancel',
            loading: false,
            onConfirm: () => {
              setShowConfirmModal(false);
              // Retry by calling handleSelectTier again
              handleSelectTier(tierKey, billing);
            },
            onCancel: () => {
              setShowConfirmModal(false);
              setUpgradeTarget(null);
              setUpgradeFeatures([]);
            }
          });
        });
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
              isReactivation: isReactivation,
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
        
        // Check if user is on trial or free account (no Stripe customer)
        const needsCheckout = !account.stripe_customer_id || account.is_free_account;
        
        if (needsCheckout) {
          // For trial/free users, they need to set up payment first even for "downgrades"
          
          // Show a message that they need to set up payment
          setConfirmModalConfig({
            title: 'Payment Setup Required',
            message: 'To change your plan, you need to set up payment information first. Would you like to proceed?',
            confirmText: 'Set Up Payment',
            cancelText: 'Cancel',
            loading: false,
            onConfirm: async () => {
              setShowConfirmModal(false);
              setUpgrading(true);
              setUpgradingPlan(`Setting up ${targetTier.name} plan...`);
              
              try {
                const res = await fetch("/api/create-checkout-session", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    priceId: getPriceId(tierKey, billing),
                    plan: tierKey,
                    billingPeriod: billing,
                    userId: account.id,
                  }),
                });
                
                if (res.ok) {
                  const data = await res.json();
                  window.location.href = data.url;
                } else {
                  throw new Error('Failed to create checkout session');
                }
              } catch (error) {
                console.error("Checkout error:", error);
                alert("Failed to create checkout session. Please try again.");
                setUpgrading(false);
                setUpgradingPlan('');
              }
            },
            onCancel: () => {
              setShowConfirmModal(false);
              setDowngradeTarget(null);
              setDowngradeFeatures([]);
            }
          });
          setShowConfirmModal(true);
          return;
        }
        
        // First show the downgrade confirmation modal
        setShowDowngradeModal(true);
        return;
        
      }
      
      // Rest of the downgrade flow was moved to handleConfirmDowngrade
      return;
    },
    [account, isNewUser, userRole, currentPlan, user, supabase],
  );

  // Clean up any leftover localStorage flags on mount
  useEffect(() => {
    localStorage.removeItem("showPlanSuccess");
  }, []);
  
  // Debug: Track success modal state changes
  useEffect(() => {
    
    // Update ref to track current state
    if (showSuccessModal) {
      successModalShownRef.current = true;
    }
  }, [showSuccessModal]);

  // Star animation is now disabled when success modal shows, so this is no longer needed

  // Confirm downgrade handler
  const handleConfirmDowngrade = async () => {
    
    if (!downgradeTarget || !account || !user) {
      return;
    }
    
    // Additional permission check
    if (userRole !== 'owner') {
      alert('Only account owners can change billing plans.');
      setShowDowngradeModal(false);
      return;
    }
    
    // Close the downgrade modal first
    setShowDowngradeModal(false);
    
    // Get the target tier info
    const targetTier = tiers.find(t => t.key === downgradeTarget);
    if (!targetTier) return;
    
    // Show loading modal while fetching billing preview
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
      // Fetch proration preview
      const previewRes = await fetch("/api/preview-billing-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: downgradeTarget,
          userId: account.id,
          billingPeriod: billingPeriod,
        }),
      });
      
      if (previewRes.ok) {
        const { preview } = await previewRes.json();
        
        // Update modal with actual preview data
        setConfirmModalConfig({
          title: `Downgrade to ${targetTier.name}`,
          message: preview.message,
          confirmText: 'Confirm Downgrade',
          cancelText: 'Cancel',
          loading: false,
          details: {
            creditAmount: preview.creditAmount,
            timeline: preview.timeline,
            stripeEmail: preview.stripeEmail,
            processingFeeNote: preview.processingFeeNote,
          },
          onConfirm: async () => {
            // Show loading state in the modal
            setConfirmModalConfig(prev => ({
              ...prev!,
              loading: true,
              title: 'Processing downgrade...',
              message: 'Please wait while we update your subscription.'
            }));
            
            setDowngradeProcessing(true);
            
            try {
              // For customers with active Stripe subscriptions, use the upgrade API to downgrade
              if (account.stripe_customer_id) {
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
                  
                  // Build full URL to ensure proper redirect
                  const baseUrl = window.location.origin;
                  const redirectUrl = `${baseUrl}/dashboard/plan?success=1&change=downgrade&plan=${downgradeTarget}&billing=${billingPeriod}`;
                  
                  // Close modal and redirect
                  setShowConfirmModal(false);
                  
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
                // Don't show star animation for success modal
                setStarAnimation(false);
                setShowSuccessModal(true);
                setShowConfirmModal(false);
              }
            } catch (error) {
              console.error("Downgrade error:", error);
              // Show error in modal instead of alert
              setConfirmModalConfig({
                title: 'Downgrade Failed',
                message: 'There was an error processing your downgrade. Please try again.',
                confirmText: 'Close',
                cancelText: '',
                loading: false,
                onConfirm: () => {
                  setShowConfirmModal(false);
                }
              });
            } finally {
              setDowngradeProcessing(false);
            }
          },
          onCancel: () => {
            setShowConfirmModal(false);
            setDowngradeTarget(null);
            setDowngradeFeatures([]);
          }
        });
      } else {
        // If preview fails, show error and allow proceeding anyway
        console.error('Billing preview failed');
        
        setConfirmModalConfig({
          title: 'Unable to Calculate Credit',
          message: 'Unable to calculate your credit amount. You can still proceed with the downgrade.',
          confirmText: 'Continue Anyway',
          cancelText: 'Cancel',
          loading: false,
          onConfirm: async () => {
            // Proceed with downgrade without preview
            setShowConfirmModal(false);
            setDowngradeProcessing(true);
            
            try {
              if (account.stripe_customer_id) {
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
                  const redirectUrl = `/dashboard/plan?success=1&change=downgrade&plan=${downgradeTarget}&billing=${billingPeriod}`;
                  setTimeout(() => {
                    window.location.href = redirectUrl;
                  }, 500);
                } else {
                  throw new Error('Downgrade failed');
                }
              }
            } catch (error) {
              console.error("Downgrade error:", error);
              alert("Failed to downgrade. Please try again.");
            } finally {
              setDowngradeProcessing(false);
            }
          },
          onCancel: () => {
            setShowConfirmModal(false);
            setDowngradeTarget(null);
            setDowngradeFeatures([]);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching billing preview:', error);
      setShowConfirmModal(false);
      alert('Failed to fetch billing information. Please try again.');
    }
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
    
    // Close the upgrade modal
    setShowUpgradeModal(false);
    
    // Show the proration confirmation modal if we have the config ready
    if (confirmModalConfig && confirmModalConfig.title) {
      setShowConfirmModal(true);
    } else {
      // If no proration info, proceed directly with upgrade
      setUpgradeProcessing(true);
      
      try {
        // Check if user has a Stripe customer ID (existing customer vs new user)
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
          
          // For now, always use local redirect to ensure it works
          const redirectUrl = `/dashboard/plan?success=1&change=upgrade&plan=${upgradeTarget}&billing=${billingPeriod}`;
          
          // Add a small delay to ensure the database update completes
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 500);
          return;
        } else {
          const errorData = await res.json();
          
          // Check if this is a free trial user who should use checkout instead
          if (errorData.error === "FREE_TRIAL_USER" || errorData.redirectToCheckout) {
            
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
    }
  };

  const handleCancelUpgrade = () => {
    setShowUpgradeModal(false);
    setUpgradeTarget(null);
    setUpgradeFeatures([]);
    setUpgradeProcessing(false);
  };

  // Helper to check if user can manage billing
  const isOwner = userRole === 'owner';
  const canManageBilling = isOwner;

  // Render success modal even when loading to prevent it from disappearing
  const successModalElement = showSuccessModal ? (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center relative animate-scaleIn">
        {/* Standardized close button - breaching corner */}
        <button
          onClick={() => {
            sessionStorage.removeItem('showPlanSuccessModal');
            sessionStorage.removeItem('planSuccessAction');
            successModalShownRef.current = false;
            setShowSuccessModal(false);
            setStarAnimation(false); // Also hide star animation
          }}
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
            : lastAction === "first_payment"
            ? "Payment successful!"
            : lastAction === "upgrade"
            ? "Plan upgraded successfully!"
            : "Plan updated successfully!"}
        </h2>
        <p className="text-gray-600 mb-6">
          {lastAction === "new"
            ? "Your account has been created and you're ready to start collecting reviews!"
            : lastAction === "first_payment"
            ? "Your payment was successful! You now have full access to all plan features."
            : lastAction === "upgrade"
            ? "You now have access to all the features in your new plan. Any unused time from your previous subscription has been automatically credited to your account."
            : "Your plan has been updated successfully. Proration has been automatically applied to your account."}
        </p>
        <button
          onClick={() => {
            setShowSuccessModal(false);
            successModalShownRef.current = false;
            sessionStorage.removeItem('showPlanSuccessModal');
            sessionStorage.removeItem('planSuccessAction');
            setStarAnimation(false); // Also hide star animation
            router.push("/dashboard");
          }}
          className="bg-slate-blue text-white px-6 py-2 rounded-lg hover:bg-slate-blue/90 transition-colors"
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  ) : null;

  // Show success modal immediately if it should be shown
  if (showSuccessModal) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 flex flex-col items-center justify-center">
          {/* Background gradient */}
        </div>
        {successModalElement}
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 flex flex-col items-center justify-center">
        <AppLoader variant="centered" />
      </div>
    );
  }

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
            
            {/* Manual sync button for development */}
            {process.env.NODE_ENV === 'development' && account && (
              <div className="mt-4">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/manual-sync-subscription', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: account.id })
                      });
                      const data = await res.json();
                      if (res.ok) {
                        alert('Subscription synced! Refreshing page...');
                        window.location.reload();
                      } else {
                        console.error('Sync failed:', data);
                        alert('Sync failed: ' + (data.error || 'Unknown error'));
                      }
                    } catch (err) {
                      console.error('Sync error:', err);
                      alert('Failed to sync: ' + err);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  🔄 Sync Subscription (Dev Only)
                </button>
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
                      <li key={index} className="flex items-start">
                        <span className="text-green-400 mr-2 mt-0.5">✓</span>
                        <span className="text-left">{feature}</span>
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
                      // If user can't manage billing
                      if (!canManageBilling) return "Contact Account Owner";
                      
                      // For new users or users with no plan
                      if (isNewUser || !currentPlan || currentPlan === 'no_plan' || currentPlan === 'NULL') {
                        if (tier.key === "grower") {
                          // If they already had a trial, show regular purchase option
                          if (hadPreviousTrial) return "Get Started";
                          return "Start Free Trial";
                        }
                        return "Get Started";
                      }
                      
                      // Check if this is the current plan AND billing period
                      const isCurrentPlanAndBilling = currentPlan === tier.key && billingPeriod === account?.billing_period;
                      if (isCurrentPlanAndBilling) return "Current Plan";
                      
                      // If viewing different billing period than current
                      const isViewingDifferentBilling = billingPeriod !== account?.billing_period;
                      
                      if (isViewingDifferentBilling) {
                        // All buttons should say "Switch to Annual" or "Switch to Monthly"
                        return billingPeriod === 'annual' ? "Switch to Annual" : "Switch to Monthly";
                      }
                      
                      // Same billing period as current - show Upgrade/Downgrade
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

        {/* Success Modal is rendered at the top level to prevent unmounting */}
        {successModalElement}

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

        {/* Star Animation Overlay - Only show if success modal is NOT showing */}
        {starAnimation && !showSuccessModal && (
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

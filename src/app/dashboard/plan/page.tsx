'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import PricingModal from '../../components/PricingModal';
import AppLoader from '@/app/components/AppLoader';
import { useRouter } from 'next/navigation';
import { tiers } from '../../components/PricingModal';
import TopLoaderOverlay from '@/app/components/TopLoaderOverlay';

export default function PlanPage() {
  const [account, setAccount] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [starAnimation, setStarAnimation] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [downgradeTarget, setDowngradeTarget] = useState<string | null>(null);
  const [downgradeFeatures, setDowngradeFeatures] = useState<string[]>([]);
  const [lastAction, setLastAction] = useState<'upgrade' | 'downgrade' | 'new' | null>(null);
  const router = useRouter();
  const isNewUser = !account?.plan || account.plan === '' || account.plan === 'none';
  const prevPlanRef = useRef<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchAccount = async () => {
      setIsLoading(true);
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        setIsLoading(false);
        return;
      }
      const { data: accountData } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', user.data.user.id)
        .single();
      setAccount(accountData);
      setCurrentPlan(accountData?.plan || null);
      prevPlanRef.current = accountData?.plan || null;
      setIsLoading(false);
    };
    fetchAccount();
  }, []);

  const handleSelectTier = useCallback(async (tierKey: string) => {
    if (!account) return;
    const prevPlan = prevPlanRef.current;
    const currentTier = tiers.find(t => t.key === prevPlan);
    const targetTier = tiers.find(t => t.key === tierKey);
    const isUpgrade = currentTier && targetTier && targetTier.order > currentTier.order;
    const isDowngrade = currentTier && targetTier && targetTier.order < currentTier.order;

    if (isUpgrade) {
      setLastAction('upgrade');
      // If user already has a Stripe customer ID, send to billing portal for upgrades
      if (account.stripe_customer_id) {
        setIsLoading(true);
        const res = await fetch('/api/create-stripe-portal-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: account.stripe_customer_id }),
        });
        const data = await res.json();
        setIsLoading(false);
        if (data.url) {
          window.location.href = data.url;
          return;
        } else {
          alert('Could not open billing portal.');
          return;
        }
      }
      // Otherwise, proceed with checkout session (for new users)
      const user = await supabase.auth.getUser();
      const email = user.data.user?.email;
      if (!email) {
        alert('No valid email address found for checkout.');
        return;
      }
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: tierKey,
          userId: account.id,
          email
        }),
      });
      const data = await res.json();
      if (data.url) {
        // Set flag to show success modal after Stripe redirect
        localStorage.setItem('showPlanSuccess', '1');
        window.location.href = data.url;
        return;
      } else {
        alert('Failed to start checkout: ' + (data.error || 'Unknown error'));
        return;
      }
    }
    if (isDowngrade) {
      setLastAction('downgrade');
      const lostFeatures = (currentTier?.features || []).filter(f => !(targetTier?.features || []).includes(f));
      setDowngradeTarget(tierKey);
      setDowngradeFeatures(lostFeatures);
      setShowDowngradeModal(true);
      return;
    }
    // For same plan, just reload
    await supabase.from('accounts').update({ plan: tierKey }).eq('id', account.id);
    // Show stars and success modal for new user, upgrade, or downgrade
    if (isNewUser || (prevPlan === 'grower' && tierKey !== 'grower')) {
      setLastAction(isNewUser ? 'new' : 'upgrade');
      setStarAnimation(true);
      setShowSuccessModal(true);
    } else {
      // For same plan, just reload
      window.location.reload();
    }
  }, [account, isNewUser, router]);

  // Show success modal after Stripe redirect if flag is set
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('showPlanSuccess') === '1') {
      setStarAnimation(true);
      setShowSuccessModal(true);
      localStorage.removeItem('showPlanSuccess');
    }
  }, [isNewUser, router]);

  // Confirm downgrade handler
  const handleConfirmDowngrade = async () => {
    if (!downgradeTarget) return;
    await supabase.from('accounts').update({ plan: downgradeTarget }).eq('id', account.id);
    // Refetch account data after downgrade
    const { data: updatedAccount } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', account.id)
      .single();
    setAccount(updatedAccount);
    setCurrentPlan(updatedAccount?.plan || null);
    setShowDowngradeModal(false);
    setLastAction('downgrade');
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
      <div style={{ position: 'fixed', top: -190, left: 0, width: '100%', zIndex: 9999 }}>
        <AppLoader />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen w-full flex flex-col items-center justify-start py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white text-center drop-shadow-lg">
          {isNewUser ? 'Choose your plan to get started' : 'Manage your plan'}
        </h1>
        {!isNewUser && currentPlan && (
          <div className="mb-2 text-lg text-white/80">
            <span className="font-semibold">Current Plan:</span> <span className="capitalize">{
              currentPlan === 'grower' ? 'Grower' :
              currentPlan === 'builder' ? 'Builder' :
              currentPlan === 'maven' ? 'Maven' :
              currentPlan === 'free' ? 'Free' :
              currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)
            }</span>
          </div>
        )}
        <div className="text-white/80 text-center mb-8 max-w-2xl">
          {isNewUser
            ? "Select your plan and let's start capturing reviews and improving your web presence."
            : 'Upgrade, downgrade, or renew your subscription below.'}
        </div>
        <div className="w-full max-w-5xl">
          <PricingModal onSelectTier={handleSelectTier} asModal={false} currentPlan={currentPlan || undefined} hasHadPaidPlan={account?.has_had_paid_plan} />
        </div>
        {account?.stripe_customer_id && (
          <button
            onClick={async () => {
              setIsLoading(true);
              const res = await fetch('/api/create-stripe-portal-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId: account.stripe_customer_id }),
              });
              const data = await res.json();
              setIsLoading(false);
              if (data.url) {
                window.location.href = data.url;
              } else {
                alert('Could not open billing portal.');
              }
            }}
            disabled={isLoading}
            className="mt-8 px-6 py-3 bg-[#2E4A7D] text-white rounded-lg font-semibold shadow hover:bg-[#4666AF] transition-colors"
          >
            {isLoading ? 'Loading…' : 'Manage Billing (Invoices & Payment Info)'}
          </button>
        )}
      </div>
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          {/* Star Falling Animation Overlay */}
          {starAnimation && lastAction !== 'downgrade' && (
            <div className="fixed inset-0 pointer-events-none z-40">
              {[...Array(20)].map((_, i) => (
                <span
                  key={i}
                  className="absolute animate-fall-star"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${-Math.random() * 40}px`,
                    fontSize: `${Math.random() * 16 + 16}px`,
                    color: '#FFD700',
                    opacity: 0.8 + Math.random() * 0.2,
                    animationDelay: `${Math.random() * 1.5}s`,
                  }}
                >
                  ★
                </span>
              ))}
            </div>
          )}
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center relative z-50 overflow-hidden">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
              onClick={() => setShowSuccessModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4 text-indigo-800 relative z-10">{lastAction === 'downgrade' ? 'Plan changed.' : "It's official."}</h2>
            <p className="mb-6 text-lg text-gray-700 font-semibold relative z-10">
              {isNewUser ?
                "You're on your way! Let's set up your business profile next." :
                lastAction === 'downgrade' ?
                  'Your plan has been downgraded. Features have been adjusted.' :
                  'Your plan has been upgraded! Enjoy your new features.'
              }
            </p>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                if (isNewUser) {
                  router.replace('/dashboard/create-business');
                } else {
                  router.replace('/dashboard');
                }
              }}
              className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 font-semibold mt-2 relative z-10"
            >
              {isNewUser ? "Set Up Business" : "Go to Dashboard"}
            </button>
          </div>
        </div>
      )}
      {showDowngradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center relative z-50 overflow-hidden">
            <h2 className="text-2xl font-bold mb-4 text-red-700">Are you sure you want to downgrade?</h2>
            <p className="mb-4 text-gray-700">You will lose access to the following features:</p>
            <ul className="mb-6 text-left text-gray-800 list-disc list-inside">
              {downgradeFeatures.length > 0 ? downgradeFeatures.map(f => (
                <li key={f}>{f.replace('**', '').replace('*', '')}</li>
              )) : <li>No major features will be lost.</li>}
            </ul>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleCancelDowngrade}
                className="px-6 py-2 rounded bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDowngrade}
                className="px-6 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
              >
                Confirm Downgrade
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
'use client';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import PricingModal from '../../components/PricingModal';

export default function PlanPage() {
  const [account, setAccount] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

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
      setIsLoading(false);
    };
    fetchAccount();
  }, []);

  const handleSelectTier = async (tierKey: string) => {
    if (!account) return;
    await supabase.from('accounts').update({ plan: tierKey }).eq('id', account.id);
    setCurrentPlan(tierKey);
    setAccount({ ...account, plan: tierKey });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-purple-700">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-start py-12">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8 mb-10 flex flex-col items-center">
          <h1 className="text-4xl font-bold mb-6 text-purple-700">Your Plan</h1>
          {currentPlan && (
            <div className="mb-2 text-lg text-gray-700">
              <span className="font-semibold">Current Plan:</span> <span className="capitalize">{
                currentPlan === 'grower' ? 'Grower' :
                currentPlan === 'builder' ? 'Builder' :
                currentPlan === 'maven' ? 'Maven' :
                currentPlan === 'free' ? 'Free' :
                currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)
              }</span>
            </div>
          )}
        </div>
        <div className="w-full max-w-5xl">
          <PricingModal onSelectTier={handleSelectTier} asModal={false} currentPlan={currentPlan} />
        </div>
      </div>
    </>
  );
} 
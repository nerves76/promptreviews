'use client';

import { useEffect, useState, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useSearchParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import DashboardContent from './DashboardContent';
import { FaHome, FaBuilding } from 'react-icons/fa';
import { getUserOrMock, getSessionOrMock } from '@/utils/supabase';
import PricingModal from '../components/PricingModal';
import FiveStarSpinner from '../components/FiveStarSpinner';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  const [promptPages, setPromptPages] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const createPromptPageRef = useRef<HTMLAnchorElement>(null);
  const [showQR, setShowQR] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [universalPromptPage, setUniversalPromptPage] = useState<any>(null);
  const [customPromptPages, setCustomPromptPages] = useState<any[]>([]);
  const [universalUrl, setUniversalUrl] = useState('');
  const [showPostSaveModal, setShowPostSaveModal] = useState(false);
  const [savedPromptPageUrl, setSavedPromptPageUrl] = useState<string | null>(null);
  const [account, setAccount] = useState<any>(null);
  const [showPricingModal, setShowPricingModal] = useState(true);
  const [pendingAccountUpdate, setPendingAccountUpdate] = useState(false);
  const success = searchParams.get('success');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await getUserOrMock(supabase);
        if (!user) {
          router.push('/auth/sign-in');
          return;
        }
        setUser(user);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();
  }, [supabase, router]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Debug: log current user/session before fetching account
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        console.log('Current user before account fetch:', currentUser, 'Error:', userError);

        const { data: { session } } = await getSessionOrMock(supabase);
        if (!session) {
          throw new Error('No active session found. Please sign in again.');
        }

        // Fetch account profile
        const { data: accountData, error: accountError } = await supabase
          .from('accounts')
          .select('id, plan, is_free_account, subscription_status, first_name, last_name, trial_start, trial_end, custom_prompt_page_count, contact_count, created_at, updated_at')
          .eq('id', session.user.id)
          .single();
        console.log('Fetched accountData:', accountData);
        if (!accountError && accountData) {
          setAccount(accountData);
        }

        // Fetch business profile
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (businessError || !businessData) {
          setBusiness(null);
          setShowProfileModal(true);
          setIsLoading(false);
          return;
        }
        setBusiness(businessData);

        // Fetch prompt pages
        const { data: promptPagesData, error: promptPagesError } = await supabase
          .from('prompt_pages')
          .select('*')
          .eq('account_id', session.user.id)
          .order('created_at', { ascending: false });

        if (promptPagesError) {
          throw promptPagesError;
        }

        // Separate universal and custom prompt pages
        const universal = promptPagesData?.find(page => page.is_universal);
        const custom = promptPagesData?.filter(page => !page.is_universal) || [];
        
        setUniversalPromptPage(universal);
        setCustomPromptPages(custom);
        
        if (universal) {
          setUniversalUrl(`${window.location.origin}/r/${universal.slug}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, searchParams, supabase]);

  useEffect(() => {
    // Check for post-save modal flag in localStorage
    if (typeof window !== 'undefined') {
      const flag = localStorage.getItem('showPostSaveModal');
      if (flag) {
        try {
          const { url } = JSON.parse(flag);
          setSavedPromptPageUrl(url);
          setShowPostSaveModal(true);
        } catch {}
        localStorage.removeItem('showPostSaveModal');
      }
    }
  }, []);

  useEffect(() => {
    if (success === '1') {
      setPendingAccountUpdate(true);
    }
  }, [success]);

  useEffect(() => {
    // Refetch account if payment was successful
    if (success === '1' && user) {
      const fetchAccount = async () => {
        const { data: accountData } = await supabase
          .from('accounts')
          .select('*')
          .eq('id', user.id)
          .single();
        setAccount(accountData);
        // Logging for debug
        console.log('Fetched accountData after payment:', accountData);
      };
      fetchAccount();
    }
  }, [success, user, supabase]);

  useEffect(() => {
    const paidPlans = ['grower', 'builder', 'maven'];
    const now = new Date();
    const trialStart = account?.trial_start ? new Date(account.trial_start) : null;
    const trialEnd = account?.trial_end ? new Date(account.trial_end) : null;
    const isOnPaidPlan = paidPlans.includes(account?.plan);
    const isActive = account?.subscription_status === 'active';
    const planExpired =
      account?.plan === 'grower' && trialEnd && now > trialEnd && !isActive;
    if (!account?.plan || planExpired || (isOnPaidPlan && !isActive)) {
      router.replace('/dashboard/plan');
      return;
    }
    if (!business) {
      router.replace('/dashboard/create-business');
      return;
    }
  }, [user, account, business, router]);

  useEffect(() => {
    // Debug log for account and pendingAccountUpdate
    console.log('Dashboard debug:', { account, pendingAccountUpdate });
  }, [account, pendingAccountUpdate]);

  const handleCreatePromptPageClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!business) {
      e.preventDefault();
      setShowProfileModal(true);
    }
  };

  const handleCopyLink = () => {
    if (universalUrl) {
      navigator.clipboard.writeText(universalUrl);
      setCopySuccess('Link copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    }
  };

  const handleSelectTier = async (tierKey: string) => {
    if (!account) return;
    setShowPricingModal(false);
    // Update the account plan in Supabase
    await supabase.from('accounts').update({ plan: tierKey }).eq('id', account.id);
    // Optionally, refetch account or update state
    setAccount({ ...account, plan: tierKey });
  };

  const isDashboardReady = !!user && !!account && !isLoading && !pendingAccountUpdate;

  // Remove gating logic for debugging
  // if (!isDashboardReady) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <FiveStarSpinner />
  //     </div>
  //   );
  // }

  if (error) {
    return (
      <div className="min-h-screen py-12">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const userName =
    (account?.first_name && account.first_name.trim()) ||
    (business?.first_name && business.first_name.trim()) ||
    (business?.name && business.name.trim()) ||
    (user?.user_metadata?.full_name && user.user_metadata.full_name.trim()) ||
    (user?.email?.split('@')[0]) ||
    'there';

  // Add a function to force refetch account data
  const forceRefetchAccount = async () => {
    if (!user) return;
    const { data: accountData } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', user.id)
      .single();
    setAccount(accountData);
    console.log('Force refetched account:', accountData);
  };

  return (
    <div className="min-h-screen flex justify-center items-start">
      {/* Dashboard content goes here */}
      <div style={{ position: 'fixed', top: 100, left: 100, zIndex: 9999, background: 'red', color: 'white', padding: 20 }}>
        DASHBOARD LOADED
      </div>
      {/* Debug: Force show pricing modal */}
      <PricingModal onSelectTier={handleSelectTier} />
      {/* Debug: Manual refetch account button */}
      <button onClick={forceRefetchAccount} className="fixed bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded shadow-lg z-50">Refetch Account</button>
      {/* Post-save share modal */}
      {showPostSaveModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40" onClick={() => setShowPostSaveModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setShowPostSaveModal(false)} aria-label="Close">&times;</button>
            <h2 className="text-2xl font-bold text-indigo-800 mb-2">Prompt Page Saved!</h2>
            <p className="mb-6 text-gray-700">Share your prompt page with your customer:</p>
            <div className="flex flex-col gap-3">
              <a href={`sms:?body=${encodeURIComponent('Please leave a review: ' + window.location.origin + (savedPromptPageUrl || ''))}`} className="w-full inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition" target="_blank" rel="noopener noreferrer">Send via SMS</a>
              <a href={`mailto:?subject=Please leave a review&body=${encodeURIComponent('Please leave a review: ' + window.location.origin + (savedPromptPageUrl || ''))}`} className="w-full inline-flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-800 rounded-lg font-medium border border-indigo-200 hover:bg-indigo-100 transition" target="_blank" rel="noopener noreferrer">Send via Email</a>
              <button onClick={() => {navigator.clipboard.writeText(window.location.origin + (savedPromptPageUrl || '')); setShowPostSaveModal(false);}} className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-800 rounded-lg font-medium border border-gray-300 hover:bg-gray-200 transition">Copy Link</button>
              <a href={savedPromptPageUrl || '#'} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center px-4 py-2 bg-white text-indigo-700 rounded-lg font-medium border border-indigo-200 hover:bg-indigo-50 transition">View Page</a>
            </div>
          </div>
        </div>
      )}
      <div className="w-full max-w-7xl mx-auto">
        <div className="container mx-auto p-4">
          <DashboardContent
            userName={userName}
            business={business}
            customPromptPages={customPromptPages}
            universalPromptPage={universalPromptPage}
            createPromptPageRef={createPromptPageRef}
            handleCreatePromptPageClick={handleCreatePromptPageClick}
            showQR={showQR}
            handleCopyLink={handleCopyLink}
            copySuccess={copySuccess}
            showProfileModal={showProfileModal}
            setShowProfileModal={setShowProfileModal}
            showSuccessModal={showSuccessModal}
            setShowSuccessModal={setShowSuccessModal}
            universalUrl={universalUrl}
            QRCode={QRCodeSVG}
            setShowQR={setShowQR}
            account={account}
            parentLoading={isLoading || pendingAccountUpdate}
          />
        </div>
      </div>
    </div>
  );
}
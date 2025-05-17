'use client';

import { useEffect, useState, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useSearchParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import DashboardContent from './DashboardContent';
import { FaHome, FaBuilding } from 'react-icons/fa';

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

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
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

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No active session found. Please sign in again.');
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

  if (isLoading) {
    return (
      <div className="min-h-screen py-12 px-2">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-indigo-300 to-purple-200">
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
        />
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '../components/Header';
import { useAuthGuard } from '@/utils/authGuard';
import DashboardContent from './DashboardContent';

interface Business {
  id: string;
  name: string;
  created_at: string;
}

interface PromptPage {
  id: string;
  account_id: string;
  title: string;
  created_at: string;
  is_universal?: boolean;
}

// Minimal QR code generator using qrcode.react if available, else fallback to a placeholder
let QRCode: any = null;
try {
  QRCode = require('qrcode.react').QRCode;
} catch {}

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

export default function Dashboard() {
  useAuthGuard();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const [promptPages, setPromptPages] = useState<PromptPage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const createPromptPageRef = useRef<HTMLAnchorElement>(null);
  const [showQR, setShowQR] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Dashboard: fetched user', user);
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
        // Check for error in URL params
        const errorParam = searchParams.get('error');
        if (errorParam) {
          setError(decodeURIComponent(errorParam));
          setIsLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No active session found. Please sign in again.');
        }

        // Log the user ID for debugging
        console.log('session.user.id:', session.user.id);

        // Fetch business profile
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('account_id', session.user.id)
          .single();
        console.log('Raw business fetch result:', businessData, businessError);
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
          console.error('Prompt pages fetch error:', promptPagesError);
          throw promptPagesError;
        }

        setPromptPages(promptPagesData || []);
        console.log('Dashboard: business', businessData);
        console.log('Dashboard: promptPages', promptPagesData);
      } catch (err) {
        console.error('Dashboard: error fetching data', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
        // Show success modal if redirected after business creation
        if (typeof window !== 'undefined' && searchParams.get('success') === 'business-created') {
          setShowSuccessModal(true);
          // Optionally, remove the query param from the URL after showing
          const url = new URL(window.location.href);
          url.searchParams.delete('success');
          window.history.replaceState({}, document.title, url.pathname);
        }
      }
    };

    fetchData();
  }, [searchParams, supabase]);

  // Debug: log business before rendering
  console.log('business:', business);

  const handleCreatePromptPageClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    console.log('business in click handler:', business);
    if (!business) {
      e.preventDefault();
      setShowProfileModal(true);
    }
    // else, allow navigation
  };

  // Separate universal and custom prompt pages
  const universalPromptPage = promptPages.find(p => p.is_universal);
  const customPromptPages = promptPages.filter(p => !p.is_universal);

  // Universal Prompt Page URL
  const universalUrl = universalPromptPage ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${universalPromptPage.id}` : '';

  const handleCopyLink = async () => {
    if (universalUrl) {
      await navigator.clipboard.writeText(universalUrl);
      setCopySuccess('Link copied!');
      setTimeout(() => setCopySuccess(''), 1500);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-indigo-300 to-purple-200">
        <div className="max-w-[1000px] mx-auto bg-white rounded-lg shadow p-8 py-12 px-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there';

  return (
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
      QRCode={QRCode}
      setShowQR={setShowQR}
    />
  );
} 
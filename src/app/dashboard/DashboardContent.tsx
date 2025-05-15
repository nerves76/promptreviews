'use client';
import Link from 'next/link';
import { RefObject, useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useAuthGuard } from '@/utils/authGuard';

interface DashboardContentProps {
  userName: string;
  business: any;
  customPromptPages: any[];
  universalPromptPage: any;
  createPromptPageRef: RefObject<HTMLAnchorElement | null>;
  handleCreatePromptPageClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  showQR: boolean;
  handleCopyLink: () => void;
  copySuccess: string;
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;
  showSuccessModal: boolean;
  setShowSuccessModal: (show: boolean) => void;
  universalUrl: string;
  QRCode: any;
  setShowQR: (show: boolean) => void;
}

interface PromptPage {
  id: string;
  title: string;
  slug: string;
  status: 'in_queue' | 'on_hold' | 'accomplished';
  created_at: string;
  phone?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

const STATUS_COLORS = {
  in_queue: 'bg-blue-100 text-blue-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  accomplished: 'bg-green-100 text-green-800',
};

const STATUS_LABELS = {
  in_queue: 'In Queue',
  on_hold: 'On Hold',
  accomplished: 'Complete',
};

export default function DashboardContent({
  userName,
  business,
  customPromptPages,
  universalPromptPage,
  createPromptPageRef,
  handleCreatePromptPageClick,
  showQR,
  handleCopyLink,
  copySuccess,
  showProfileModal,
  setShowProfileModal,
  showSuccessModal,
  setShowSuccessModal,
  universalUrl,
  QRCode,
  setShowQR
}: DashboardContentProps) {
  useAuthGuard();
  const [promptPages, setPromptPages] = useState<PromptPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'in_queue' | 'on_hold' | 'accomplished'>('in_queue');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchPromptPages = async () => {
      try {
        // Log environment variables (without exposing the actual values)
        console.log('Environment check:', {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        });

        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          throw new Error('Supabase environment variables are not configured');
        }

        // Test Supabase connection
        const { data: testData, error: testError } = await supabase.from('prompt_pages').select('count').limit(1);
        console.log('Supabase connection test:', { testData, testError });

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('Auth check:', { 
          hasUser: !!user, 
          userId: user?.id,
          userError: userError ? {
            message: userError.message,
            status: userError.status
          } : null
        });

        if (userError) {
          console.error('Auth error:', userError);
          throw new Error('Authentication error: ' + userError.message);
        }
        
        if (!user) {
          setError('You must be signed in to view prompt pages');
          return;
        }

        console.log('Fetching prompt pages for user:', user.id);

        // Try a simpler query first
        const { data, error } = await supabase
          .from('prompt_pages')
          .select('id, title, slug, status, created_at, phone, email, first_name, last_name')
          .eq('account_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase query error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }

        if (!data) {
          console.log('No data returned from query');
          setPromptPages([]);
          return;
        }

        console.log('Fetched prompt pages:', data);
        setPromptPages(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load prompt pages';
        setError(errorMessage);
        console.error('Error loading prompt pages:', {
          message: errorMessage,
          error: err,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'not set',
          supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'not set'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromptPages();
  }, [supabase]);

  const updateStatus = async (pageId: string, newStatus: 'in_queue' | 'on_hold' | 'accomplished') => {
    try {
      const { error } = await supabase
        .from('prompt_pages')
        .update({ status: newStatus })
        .eq('id', pageId);

      if (error) throw error;

      setPromptPages(pages =>
        pages.map(page =>
          page.id === pageId ? { ...page, status: newStatus } : page
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status';
      console.error('Error updating status:', {
        message: errorMessage,
        error: err
      });
      setError(errorMessage);
    }
  };

  const filteredPromptPages = promptPages.filter(page => {
    if (selectedTab === 'in_queue') return page.status === 'in_queue';
    if (selectedTab === 'on_hold') return page.status === 'on_hold';
    if (selectedTab === 'accomplished') return page.status === 'accomplished';
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading prompt pages...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow pt-8 pb-24 px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {userName}!
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {business ? `Manage your prompt pages for ${business.name} from here.` : 'Manage your prompt pages and business profile from here.'}
            </p>
          </div>
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              {/* Remove duplicate welcome message */}
            </div>
            <div className="mt-4 flex md:ml-4 md:mt-0">
              <a
                href="/create-prompt-page"
                ref={createPromptPageRef}
                onClick={handleCreatePromptPageClick}
                className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Create Prompt Page
              </a>
            </div>
          </div>

          <div className="mt-8 space-y-8">
            {/* Universal Prompt Page Card */}
            {universalPromptPage && (
              <div className="rounded-lg p-6 bg-blue-50 border border-blue-200 flex items-center gap-4 shadow relative">
                <div className="flex-shrink-0">
                  <svg className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M6.05 17.95l-1.414 1.414m12.728 0l-1.414-1.414M6.05 6.05L4.636 4.636M12 7a5 5 0 100 10 5 5 0 000-10z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold text-blue-800">Universal Prompt Page</span>
                    <span className="inline-block bg-blue-200 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">General Use</span>
                  </div>
                  <p className="text-blue-900 mb-2 text-sm">This prompt page is general use and not customer specific. Good for situations where you don't know much about the customer or client you want reviews from. Also useful if you want to post a QR code in your place of business or on a business card.</p>
                  <div className="flex flex-wrap gap-2 items-center mt-2">
                    <Link href={`/r/${universalPromptPage.slug}`} className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium shadow">
                      View Universal Prompt Page
                    </Link>
                    <Link href={`/dashboard/edit-prompt-page/${universalPromptPage.slug}`} className="inline-flex items-center px-3 py-1.5 bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200 text-sm font-medium border border-indigo-300">
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm font-medium border border-blue-300"
                    >
                      Copy Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowQR(true)}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm font-medium border border-blue-300"
                    >
                      Show QR Code
                    </button>
                    {copySuccess && <span className="ml-2 text-green-600 text-xs font-semibold">{copySuccess}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Tabs for status filtering - moved here */}
            <div className="flex gap-2 mb-4">
              <button
                className={`px-4 py-2 rounded-t-md font-semibold border-b-2 transition-colors ${selectedTab === 'in_queue' ? 'border-indigo-600 text-indigo-700 bg-indigo-50' : 'border-transparent text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
                onClick={() => setSelectedTab('in_queue')}
              >
                In Queue
              </button>
              <button
                className={`px-4 py-2 rounded-t-md font-semibold border-b-2 transition-colors ${selectedTab === 'on_hold' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' : 'border-transparent text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
                onClick={() => setSelectedTab('on_hold')}
              >
                On Hold
              </button>
              <button
                className={`px-4 py-2 rounded-t-md font-semibold border-b-2 transition-colors ${selectedTab === 'accomplished' ? 'border-green-600 text-green-700 bg-green-50' : 'border-transparent text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
                onClick={() => setSelectedTab('accomplished')}
              >
                Complete
              </button>
            </div>

            {/* Custom Prompt Pages Table */}
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">Your Custom Prompt Pages</h3>
              <div className="mt-4">
                {business && filteredPromptPages.length === 0 ? (
                  <div className="text-center py-24 bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-500">No prompt pages in this status.</p>
                  </div>
                ) : (
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                            Title
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Status
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Created
                          </th>
                          <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {filteredPromptPages.map((page) => (
                          <tr key={page.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                              {page.title}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <select
                                value={page.status}
                                onChange={(e) => updateStatus(page.id, e.target.value as 'in_queue' | 'on_hold' | 'accomplished')}
                                className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[page.status] || 'bg-gray-100 text-gray-800'}`}
                              >
                                <option value="in_queue">In Queue</option>
                                <option value="on_hold">On Hold</option>
                                <option value="accomplished">Complete</option>
                              </select>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {new Date(page.created_at).toLocaleDateString()}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 flex gap-2 items-center">
                              <Link
                                href={`/r/${page.slug}`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                View
                              </Link>
                              <Link
                                href={`/dashboard/edit-prompt-page/${page.slug}`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Edit
                              </Link>
                              {/* Send SMS/Email Buttons */}
                              {page.phone && (
                                <button
                                  type="button"
                                  className="inline-flex items-center px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium shadow"
                                  onClick={() => {
                                    const name = `${page.first_name || ''} ${page.last_name || ''}`.trim() || '[name]';
                                    const businessName = business?.name || '[Business]';
                                    const reviewUrl = `${window.location.origin}/r/${page.slug}`;
                                    const message = `Hi ${name}, do you have 1-3 minutes to leave a review for ${businessName}? I have a review you can use and everything. Positive reviews really help small business get found online. Thanks so much! ${reviewUrl}`;
                                    window.location.href = `sms:${page.phone}?&body=${encodeURIComponent(message)}`;
                                  }}
                                >
                                  Send SMS
                                </button>
                              )}
                              {page.email && (
                                <a
                                  href={`mailto:${page.email}?subject=${encodeURIComponent('Quick Review Request')}&body=${encodeURIComponent(`Hi ${page.first_name || '[name]'}, do you have 1-3 minutes to leave a review for ${business?.name || '[Business]'}? I have a review you can use and everything. Positive reviews really help small business get found online. Thanks so much! ${window.location.origin}/r/${page.slug}`)}`}
                                  className="inline-flex items-center px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium shadow"
                                >
                                  Send Email
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* QR Code Modal */}
          {showQR && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-xs w-full text-center relative">
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
                  onClick={() => setShowQR(false)}
                >
                  &times;
                </button>
                <h3 className="text-lg font-bold mb-4">Universal Prompt Page QR Code</h3>
                {QRCode ? (
                  <QRCode value={universalUrl} size={180} />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center bg-gray-100 rounded">QR Code</div>
                )}
                <p className="mt-4 text-sm text-gray-600 break-all">{universalUrl}</p>
              </div>
            </div>
          )}

          {/* Profile Modal */}
          {showProfileModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                <h2 className="text-xl font-bold mb-4">Let's Get Your Business More Reviews!</h2>
                <p className="mb-6">First we need to set up your business profile.</p>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    window.location.href = '/dashboard/create-business';
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  Go to Business Profile
                </button>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="ml-4 text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Success Modal */}
          {showSuccessModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center relative">
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
                  onClick={() => setShowSuccessModal(false)}
                  aria-label="Close"
                >
                  &times;
                </button>
                <h2 className="text-xl font-bold mb-4 text-green-700">Business Profile Created!</h2>
                <p className="mb-6">Your business profile was created successfully. You can now create prompt pages and start collecting reviews!</p>
                <a
                  href="/create-prompt-page"
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 inline-block"
                >
                  Create Prompt Page
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 
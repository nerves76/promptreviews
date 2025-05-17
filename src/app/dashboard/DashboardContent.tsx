'use client';
import Link from 'next/link';
import { RefObject, useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useAuthGuard } from '@/utils/authGuard';
import { FaGlobe, FaHome, FaBuilding, FaHistory, FaBolt } from 'react-icons/fa';

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
  slug: string;
  status: 'in_queue' | 'in_progress' | 'complete' | 'draft';
  created_at: string;
  phone?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_universal: boolean;
}

const STATUS_COLORS = {
  in_queue: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  complete: 'bg-green-100 text-green-800',
  draft: 'bg-gray-100 text-gray-800',
};

const STATUS_LABELS = {
  in_queue: 'In Queue',
  in_progress: 'In Progress',
  complete: 'Complete',
  draft: 'Draft',
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
  console.log('DASHBOARD RENDERED');
  useAuthGuard();
  const [promptPages, setPromptPages] = useState<PromptPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'in_queue' | 'in_progress' | 'complete' | 'draft'>('in_queue');
  const [sortField, setSortField] = useState<'first_name' | 'last_name' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [batchStatus, setBatchStatus] = useState<'in_queue' | 'in_progress' | 'complete' | 'draft'>('in_queue');

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
          .select('id, slug, status, created_at, phone, email, first_name, last_name, is_universal')
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

  const updateStatus = async (pageId: string, newStatus: 'in_queue' | 'in_progress' | 'complete' | 'draft') => {
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
    if (selectedTab === 'in_progress') return page.status === 'in_progress';
    if (selectedTab === 'complete') return page.status === 'complete';
    if (selectedTab === 'draft') return page.status === 'draft';
    return true;
  });

  const inQueueCount = promptPages.filter(page => page.status === 'in_queue').length;
  const inProgressCount = promptPages.filter(page => page.status === 'in_progress').length;
  const completeCount = promptPages.filter(page => page.status === 'complete').length;
  const draftCount = promptPages.filter(page => page.status === 'draft').length;

  const handleSort = (field: 'first_name' | 'last_name') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedPromptPages = [...filteredPromptPages].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = (a[sortField] || '').toLowerCase();
    const bValue = (b[sortField] || '').toLowerCase();
    
    if (sortDirection === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPages(filteredPromptPages.map(page => page.id));
    } else {
      setSelectedPages([]);
    }
  };

  const handleSelectPage = (pageId: string, checked: boolean) => {
    if (checked) {
      setSelectedPages([...selectedPages, pageId]);
    } else {
      setSelectedPages(selectedPages.filter(id => id !== pageId));
    }
  };

  const handleBatchStatusUpdate = async () => {
    try {
      const { error } = await supabase
        .from('prompt_pages')
        .update({ status: batchStatus })
        .in('id', selectedPages);

      if (error) throw error;

      setPromptPages(pages =>
        pages.map(page =>
          selectedPages.includes(page.id) ? { ...page, status: batchStatus } : page
        )
      );
      setSelectedPages([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status';
      console.error('Error updating status:', {
        message: errorMessage,
        error: err
      });
      setError(errorMessage);
    }
  };

  const handleBatchDelete = async () => {
    if (deleteConfirmation !== 'DELETE') return;

    try {
      const { error } = await supabase
        .from('prompt_pages')
        .delete()
        .in('id', selectedPages);

      if (error) throw error;

      setPromptPages(pages => pages.filter(page => !selectedPages.includes(page.id)));
      setSelectedPages([]);
      setShowDeleteModal(false);
      setDeleteConfirmation('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete pages';
      console.error('Error deleting pages:', {
        message: errorMessage,
        error: err
      });
      setError(errorMessage);
    }
  };

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
      <div>
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow pt-4 pb-24 px-8 relative">
          <div className="absolute -top-4 -left-4 bg-white rounded-full shadow p-2 flex items-center justify-center">
            <FaHome className="w-7 h-7 text-indigo-500" />
          </div>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-bold text-gray-900">
              Dashboard
            </h1>
            <a
              href="/create-prompt-page"
              ref={createPromptPageRef}
              onClick={handleCreatePromptPageClick}
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 whitespace-nowrap"
            >
              Create Prompt Page
            </a>
          </div>
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-indigo-900">
              Welcome, {userName}!
            </h2>
            <p className="mt-2 text-sm text-gray-600 max-w-[650px]">
              Put some coffee on! Let's chat with some customers and get some reviews to grow your business.
            </p>
          </div>
          <div className="mt-2 space-y-4">
            {/* Universal Prompt Page Card */}
            {universalPromptPage && (
              <div className="rounded-lg p-6 bg-blue-50 border border-blue-200 flex items-center gap-4 shadow relative mb-16">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-blue-800 flex items-center gap-3">
                        <FaGlobe className="w-7 h-7 text-blue-400" />
                        Universal Prompt Page
                      </h2>
                      <span className="inline-block bg-blue-200 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded ml-4">General Use</span>
                    </div>
                    <div className="flex gap-4 items-center">
                      <Link href={`/r/${universalPromptPage.slug}`} className="text-indigo-600 underline hover:text-indigo-800 hover:underline">
                        View
                      </Link>
                      <Link href={`/dashboard/edit-prompt-page/${universalPromptPage.slug}`} className="text-indigo-600 underline hover:text-indigo-800 hover:underline">
                        Edit
                      </Link>
                    </div>
                  </div>
                  <p className="mt-2 text-blue-900 mb-2 text-sm">Your Universal Prompt Page is general-use and not customer specific. The reviews are not prewritten but there is an AI button that will generate a unique review instantly based on your business profile. Your customers/clients can edit before they post. Print your QR code, frame it, and hang it in your place of business for a super-easy way to get customers/clients to post a review. Add the QR code to business cards, menus, flyers, etc.</p>
                  <div className="flex flex-wrap gap-2 items-center mt-4">
                    <div className="flex flex-wrap gap-2 items-center">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap"
                      >
                        Copy Link
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowQR(true)}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap"
                      >
                        Show QR Code
                      </button>
                      {copySuccess && <span className="ml-2 text-green-600 text-xs font-semibold">{copySuccess}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-24">
              <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-3">
                <svg className="w-7 h-7 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Your Custom Prompt Pages
              </h2>
              <p className="mt-2 text-sm text-gray-500 mb-16">Manage your customer-specific prompt pages and their review status.</p>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                className={`px-4 py-1.5 rounded-t-md text-sm font-semibold border-b-2 transition-colors ${selectedTab === 'draft' ? 'border-gray-600 text-gray-700 bg-gray-50' : 'border-transparent text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
                onClick={() => setSelectedTab('draft')}
              >
                Draft ({draftCount})
              </button>
              <button
                className={`px-4 py-1.5 rounded-t-md text-sm font-semibold border-b-2 transition-colors ${selectedTab === 'in_queue' ? 'border-indigo-600 text-indigo-700 bg-indigo-50' : 'border-transparent text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
                onClick={() => setSelectedTab('in_queue')}
              >
                In Queue ({inQueueCount})
              </button>
              <button
                className={`px-4 py-1.5 rounded-t-md text-sm font-semibold border-b-2 transition-colors ${selectedTab === 'in_progress' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' : 'border-transparent text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
                onClick={() => setSelectedTab('in_progress')}
              >
                In Progress ({inProgressCount})
              </button>
              <button
                className={`px-4 py-1.5 rounded-t-md text-sm font-semibold border-b-2 transition-colors ${selectedTab === 'complete' ? 'border-green-600 text-green-700 bg-green-50' : 'border-transparent text-gray-600 bg-gray-100 hover:bg-green-50'}`}
                onClick={() => setSelectedTab('complete')}
              >
                Complete ({completeCount})
              </button>
            </div>

            {/* Batch Actions */}
            {selectedPages.length > 0 && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    {selectedPages.length} page{selectedPages.length !== 1 ? 's' : ''} selected
                  </span>
                  <select
                    value={batchStatus}
                    onChange={(e) => setBatchStatus(e.target.value as 'in_queue' | 'in_progress' | 'complete' | 'draft')}
                    className="rounded-md border-gray-300 text-sm"
                  >
                    <option value="in_queue">In Queue</option>
                    <option value="in_progress">In Progress</option>
                    <option value="complete">Complete</option>
                    <option value="draft">Draft</option>
                  </select>
                  <button
                    onClick={handleBatchStatusUpdate}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium"
                  >
                    Update Status
                  </button>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
                >
                  Delete Selected
                </button>
              </div>
            )}

            {/* Custom Prompt Pages Table */}
            <div className="mt-0">
              <div className="mt-4">
                {business && sortedPromptPages.length === 0 ? (
                  <div className="text-center py-24 bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-500">No prompt pages in this status.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="relative w-12 px-3 py-3.5">
                            <input
                              type="checkbox"
                              className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                              checked={selectedPages.length === filteredPromptPages.length}
                              onChange={(e) => handleSelectAll(e.target.checked)}
                            />
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer select-none hover:bg-gray-100 group"
                            onClick={() => handleSort('first_name')}
                          >
                            <div className="flex items-center gap-1">
                              First Name
                              <span className="text-gray-400 opacity-50 group-hover:opacity-100">
                                {sortField === 'first_name' ? (
                                  sortDirection === 'asc' ? '↑' : '↓'
                                ) : (
                                  <span className="text-xs">↕</span>
                                )}
                              </span>
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer select-none hover:bg-gray-100 group"
                            onClick={() => handleSort('last_name')}
                          >
                            <div className="flex items-center gap-1">
                              Last Name
                              <span className="text-gray-400 opacity-50 group-hover:opacity-100">
                                {sortField === 'last_name' ? (
                                  sortDirection === 'asc' ? '↑' : '↓'
                                ) : (
                                  <span className="text-xs">↕</span>
                                )}
                              </span>
                            </div>
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Edit
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Status
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Created
                          </th>
                          <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-sm font-semibold text-gray-900">
                            Send
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {sortedPromptPages.map((page, index) => (
                          <tr key={page.id} className={index % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                            <td className="relative w-12 px-3 py-4">
                              <input
                                type="checkbox"
                                className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                checked={selectedPages.includes(page.id)}
                                onChange={(e) => handleSelectPage(page.id, e.target.checked)}
                              />
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                              {page.first_name || ''}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                              {page.last_name || ''}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm flex gap-2 items-center">
                              <Link
                                href={`/r/${page.slug}`}
                                className="text-indigo-600 underline hover:text-indigo-800 hover:underline"
                              >
                                View
                              </Link>
                              <Link
                                href={`/dashboard/edit-prompt-page/${page.slug}`}
                                className="text-indigo-600 underline hover:text-indigo-800 hover:underline"
                              >
                                Edit
                              </Link>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <select
                                value={page.status}
                                onChange={(e) => updateStatus(page.id, e.target.value as 'in_queue' | 'in_progress' | 'complete' | 'draft')}
                                className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[page.status] || 'bg-gray-100 text-gray-800'}`}
                              >
                                <option value="in_queue">In Queue</option>
                                <option value="in_progress">In Progress</option>
                                <option value="complete">Complete</option>
                                <option value="draft">Draft</option>
                              </select>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {new Date(page.created_at).toLocaleDateString()}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-end">
                                {!page.is_universal && page.phone && (
                                  <button
                                    type="button"
                                    className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-800 rounded hover:bg-green-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap w-full sm:w-auto"
                                    onClick={() => {
                                      const name = page.first_name || '[name]';
                                      const businessName = business?.name || '[Business]';
                                      const reviewUrl = `${window.location.origin}/r/${page.slug}`;
                                      const message = `Hi ${name}, do you have 1-3 minutes to leave a review for ${businessName}? I have a review you can use and everything. Positive reviews really help small business get found online. Thanks so much! ${reviewUrl}`;
                                      window.location.href = `sms:${page.phone}?&body=${encodeURIComponent(message)}`;
                                    }}
                                  >
                                    Send SMS
                                  </button>
                                )}
                                {!page.is_universal && page.email && (
                                  <a
                                    href={`mailto:${page.email}?subject=${encodeURIComponent('Quick Review Request')}&body=${encodeURIComponent(`Hi ${page.first_name || '[name]'}, do you have 1-3 minutes to leave a review for ${business?.name || '[Business]'}? I have a review you can use and everything. Positive reviews really help small business get found online. Thanks so much! ${window.location.origin}/r/${page.slug}`)}`}
                                    className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap w-full sm:w-auto"
                                  >
                                    Send Email
                                  </a>
                                )}
                              </div>
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
                <h3 className="text-lg font-bold mb-4 text-indigo-900">
                  {business?.name ? `${business.name}'s ticket to more reviews!` : 'Your ticket to more reviews!'}
                </h3>
                {QRCode ? (
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <QRCode value={universalUrl} size={180} />
                    </div>
                    <button
                      onClick={() => {
                        const canvas = document.querySelector('canvas');
                        if (canvas) {
                          const pngUrl = canvas.toDataURL('image/png');
                          const downloadLink = document.createElement('a');
                          downloadLink.href = pngUrl;
                          downloadLink.download = `${business?.name ? business.name.toLowerCase().replace(/\s+/g, '-') : 'prompt-review'}-qr-code.png`;
                          document.body.appendChild(downloadLink);
                          downloadLink.click();
                          document.body.removeChild(downloadLink);
                        }
                      }}
                      className="mt-6 w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Download QR Code
                    </button>
                  </div>
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center bg-gray-100 rounded">QR Code</div>
                )}
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

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
                <h3 className="text-lg font-bold mb-4 text-red-600">
                  Delete Prompt Pages
                </h3>
                <p className="mb-4 text-gray-600">
                  You are about to delete {selectedPages.length} prompt page{selectedPages.length !== 1 ? 's' : ''}. This action cannot be undone.
                </p>
                <p className="mb-4 text-gray-600">
                  Please type DELETE in the box below to continue.
                </p>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
                  placeholder="Type DELETE to confirm"
                />
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteConfirmation('');
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBatchDelete}
                    disabled={deleteConfirmation !== 'DELETE'}
                    className={`px-4 py-2 rounded ${
                      deleteConfirmation === 'DELETE'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 
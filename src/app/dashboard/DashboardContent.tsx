'use client';
import Link from 'next/link';
import { RefObject, useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useAuthGuard } from '@/utils/authGuard';
import { FaGlobe, FaHome, FaBuilding, FaHistory, FaBolt, FaRegComment, FaLink, FaHandsHelping, FaBoxOpen } from 'react-icons/fa';
import { MdDownload, MdEvent, MdVideoLibrary, MdPhotoCamera } from 'react-icons/md';
import { getUserOrMock } from '@/utils/supabase';
import QRCodeGenerator, { QR_FRAME_SIZES } from './components/QRCodeGenerator';
import { useRouter } from 'next/navigation';
import FiveStarSpinner from '@/app/components/FiveStarSpinner';

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
  account: any;
  successMessage?: string;
  parentLoading?: boolean;
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
  review_type?: string;
}

const STATUS_COLORS = {
  in_queue: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  complete: 'bg-green-100 text-green-800',
  draft: 'bg-gray-100 text-gray-800',
};

const STATUS_LABELS = {
  in_queue: 'In queue',
  in_progress: 'In progress',
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
  setShowQR,
  account,
  parentLoading
}: DashboardContentProps) {
  console.log('DASHBOARD RENDERED');
  useAuthGuard();
  const [promptPages, setPromptPages] = useState<PromptPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'in_queue' | 'in_progress' | 'complete' | 'draft'>('draft');
  const [sortField, setSortField] = useState<'first_name' | 'last_name' | 'review_type' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [batchStatus, setBatchStatus] = useState<'in_queue' | 'in_progress' | 'complete' | 'draft'>('in_queue');
  const [qrModal, setQrModal] = useState<{ open: boolean; url: string; clientName: string; logoUrl?: string } | null>(null);
  const [selectedFrameSize, setSelectedFrameSize] = useState(QR_FRAME_SIZES[0]);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [copyLinkId, setCopyLinkId] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const promptTypes = [
    {
      key: 'service',
      label: 'Service review',
      icon: <FaHandsHelping className="w-7 h-7 text-slate-blue" />,
      description: 'Send to an individual and encourage them to edit/copy review and then post on any platform (Google, Yelp, BBB, etc.).'
    },
    {
      key: 'photo',
      label: 'Photo + testimonial',
      icon: <MdPhotoCamera className="w-7 h-7 text-[#1A237E]" />,
      description: 'Collect a photo and a written testimonial.'
    },
    {
      key: 'video',
      label: 'Video testimonial',
      icon: <MdVideoLibrary className="w-7 h-7 text-[#1A237E]" />,
      description: 'Request a video testimonial from your client.',
      comingSoon: true
    },
    {
      key: 'experience',
      label: 'Experiences & spaces',
      icon: <MdEvent className="w-7 h-7 text-[#1A237E]" />,
      description: 'For events, rentals, tours, and more.',
      comingSoon: true
    },
    {
      key: 'product',
      label: 'Product review',
      icon: <FaBoxOpen className="w-7 h-7 text-slate-blue" />,
      description: 'Collect reviews for a specific product, including product description and features/benefits.'
    },
  ];

  function handlePromptTypeSelect(typeKey: string) {
    setShowTypeModal(false);
    router.push(`/create-prompt-page?type=${typeKey}`);
  }

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

        const { data: { user }, error: userError } = await getUserOrMock(supabase);
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
          .select('id, slug, status, created_at, phone, email, first_name, last_name, is_universal, review_type')
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
    if (page.is_universal) return false;
    if (selectedType && page.review_type !== selectedType) return false;
    if (selectedTab === 'in_queue') return page.status === 'in_queue';
    if (selectedTab === 'in_progress') return page.status === 'in_progress';
    if (selectedTab === 'complete') return page.status === 'complete';
    if (selectedTab === 'draft') return page.status === 'draft';
    return true;
  });

  const inQueueCount = promptPages.filter(page => page.status === 'in_queue' && !page.is_universal).length;
  const inProgressCount = promptPages.filter(page => page.status === 'in_progress' && !page.is_universal).length;
  const completeCount = promptPages.filter(page => page.status === 'complete' && !page.is_universal).length;
  const draftCount = promptPages.filter(page => page.status === 'draft' && !page.is_universal).length;

  const handleSort = (field: 'first_name' | 'last_name' | 'review_type') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedPromptPages = [...filteredPromptPages].sort((a, b) => {
    if (!sortField) return 0;
    let aValue = '';
    let bValue = '';
    if (sortField === 'review_type') {
      aValue = (a.review_type || '').toLowerCase();
      bValue = (b.review_type || '').toLowerCase();
    } else {
      aValue = (a[sortField] || '').toLowerCase();
      bValue = (b[sortField] || '').toLowerCase();
    }
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

  // Soft lock for Grower plan: only allow access to first 3 prompt pages
  const isGrower = account?.plan === 'grower';
  const maxGrowerPages = 3;
  const accessiblePromptPages = isGrower ? sortedPromptPages.slice(0, maxGrowerPages) : sortedPromptPages;
  const lockedPromptPages = isGrower ? sortedPromptPages.slice(maxGrowerPages) : [];

  if (isLoading && !parentLoading) {
    return (
      <div className="min-h-screen">
        <div className="w-full mx-auto bg-white rounded-lg shadow p-16">
          <div className="text-center">
            <FiveStarSpinner />
            <p className="mt-4 text-gray-600">Loading prompt pages...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex justify-center items-start w-full">
        <div className="relative w-full">
          {/* Main dashboard content, remove pt-12 so title is at the top */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-4xl font-bold text-slate-blue">
                Dashboard
              </h1>
              <button
                onClick={e => {
                  e.preventDefault();
                  if (isGrower && sortedPromptPages.length >= maxGrowerPages) {
                    alert('Upgrade your plan to create more than 3 prompt pages.');
                    return;
                  }
                  setShowTypeModal(true);
                }}
                className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm whitespace-nowrap ${isGrower && sortedPromptPages.length >= maxGrowerPages ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-slate-blue text-white hover:bg-slate-blue/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-blue'}`}
                disabled={isGrower && sortedPromptPages.length >= maxGrowerPages}
              >
                Create Prompt Page
              </button>
            </div>
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-slate-blue">
                Welcome, {userName}!
              </h2>
              <p className="mt-2 text-sm text-gray-600 max-w-[650px]">
                Put the kettle on! Let's chat with some customers and get some reviews to grow your business.
              </p>
            </div>
            <div className="mt-2 space-y-4">
              {/* Universal Prompt Page Card */}
              {universalPromptPage && (
                <div className="rounded-lg p-6 bg-blue-50 border border-blue-200 flex items-center gap-4 shadow relative mb-16">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-slate-blue flex items-center gap-3">
                          <FaGlobe className="w-7 h-7 text-slate-blue" />
                          Universal Prompt Page
                        </h2>
                      </div>
                      <div className="flex gap-4 items-center">
                        <Link href={`/r/${universalPromptPage.slug}`} className="text-indigo-600 underline hover:text-indigo-800 hover:underline">
                          View
                        </Link>
                        {universalPromptPage?.slug && (
                          <Link
                            href={universalPromptPage.slug === 'universal-diviner' ? '/dashboard/edit-prompt-page/universal' : `/dashboard/edit-prompt-page/${universalPromptPage.slug}`}
                            className="text-indigo-600 underline hover:text-indigo-800 hover:underline"
                          >
                            Edit
                          </Link>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-blue-900 mb-2 text-sm">Your Universal Prompt Page is general-use and not customer specific. The reviews are not prewritten but there is an AI button that will generate a unique review instantly based on your business profile. Your customers/clients can edit before they post. Print your QR code, frame it, and hang it in your place of business for a super-easy way to get customers/clients to post a review. Add the QR code to business cards, menus, flyers, etc.</p>
                    <div className="flex flex-wrap gap-2 items-center mt-4">
                      <div className="flex flex-wrap gap-2 items-center">
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap"
                        >
                          <FaLink className="w-4 h-4" />
                          Copy link
                        </button>
                        <button
                          type="button"
                          onClick={() => setQrModal({ open: true, url: universalUrl, clientName: business?.name || 'PromptReviews', logoUrl: business?.logo_url })}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-soft-peach text-slate-blue rounded hover:bg-soft-peach/80 text-sm font-medium shadow h-9 align-middle whitespace-nowrap"
                        >
                          <MdDownload className="w-5 h-5" />
                          QR code
                        </button>
                        {copySuccess && <span className="ml-2 text-green-600 text-xs font-semibold">{copySuccess}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-blue mb-2 flex items-center gap-3">
                  <span className="text-3xl font-bold align-middle text-slate-blue" style={{fontFamily: 'Inter, sans-serif'}}>[P]</span>
                  Your custom prompt pages
                </h2>
                <p className="text-gray-600 text-base max-w-2xl mb-10">Create and manage your prompt pages and outreach efforts.</p>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <label htmlFor="type-filter" className="text-sm font-medium text-gray-700">Filter by type:</label>
                <select
                  id="type-filter"
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                >
                  <option value="">All types</option>
                  <option value="service">Service review</option>
                  <option value="product">Product review</option>
                  <option value="experience">Experiences & spaces</option>
                  <option value="video">Video testimonial</option>
                  <option value="photo">Photo + testimonial</option>
                </select>
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
                  In queue ({inQueueCount})
                </button>
                <button
                  className={`px-4 py-1.5 rounded-t-md text-sm font-semibold border-b-2 transition-colors ${selectedTab === 'in_progress' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' : 'border-transparent text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
                  onClick={() => setSelectedTab('in_progress')}
                >
                  In progress ({inProgressCount})
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
                      <option value="in_queue">In queue</option>
                      <option value="in_progress">In progress</option>
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
                    <>
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
                                  First
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
                                  Last
                                  <span className="text-gray-400 opacity-50 group-hover:opacity-100">
                                    {sortField === 'last_name' ? (
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
                                onClick={() => handleSort('review_type')}
                              >
                                <div className="flex items-center gap-1">
                                  Type
                                  <span className="text-gray-400 opacity-50 group-hover:opacity-100">
                                    {sortField === 'review_type' ? (
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
                          <tbody className="bg-white divide-y divide-gray-200">
                            {accessiblePromptPages.map((page, index) => (
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
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 capitalize">
                                  {page.review_type === 'service' && 'Service'}
                                  {page.review_type === 'photo' && 'Photo'}
                                  {page.review_type === 'video' && 'Video'}
                                  {page.review_type === 'experience' && 'Exp.'}
                                  {page.review_type === 'product' && 'Product'}
                                  {!['service', 'photo', 'video', 'experience', 'product'].includes(page.review_type || '') && (page.review_type ? page.review_type.charAt(0).toUpperCase() + page.review_type.slice(1) : 'Service')}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm flex gap-2 items-center">
                                  <div className="mt-[6px] flex gap-2">
                                    <Link
                                      href={`/r/${page.slug}`}
                                      className="text-indigo-600 underline hover:text-indigo-800 hover:underline"
                                    >
                                      View
                                    </Link>
                                    {page.slug && (
                                      <Link
                                        href={page.slug === 'universal-diviner' ? '/dashboard/edit-prompt-page/universal' : `/dashboard/edit-prompt-page/${page.slug}`}
                                        className="text-indigo-600 underline hover:text-indigo-800 hover:underline"
                                      >
                                        Edit
                                      </Link>
                                    )}
                                  </div>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                  <select
                                    value={page.status}
                                    onChange={(e) => updateStatus(page.id, e.target.value as 'in_queue' | 'in_progress' | 'complete' | 'draft')}
                                    className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[page.status] || 'bg-gray-100 text-gray-800'}`}
                                  >
                                    <option value="in_queue">In queue</option>
                                    <option value="in_progress">In progress</option>
                                    <option value="complete">Complete</option>
                                    <option value="draft">Draft</option>
                                  </select>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                  {new Date(page.created_at).toLocaleDateString()}
                                </td>
                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                  <div className="flex flex-row gap-2 items-center justify-end">
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
                                    {!page.is_universal && (
                                      <button
                                        type="button"
                                        className="inline-flex items-center px-2 py-1.5 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap w-full sm:w-auto"
                                        title="Copy link"
                                        onClick={async () => {
                                          try {
                                            await navigator.clipboard.writeText(`${window.location.origin}/r/${page.slug}`);
                                            setCopyLinkId(page.id);
                                            setTimeout(() => setCopyLinkId(null), 2000);
                                          } catch (err) {
                                            alert('Could not copy to clipboard. Please copy manually.');
                                          }
                                        }}
                                      >
                                        <FaLink className="w-4 h-4" />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-soft-peach text-slate-blue rounded hover:bg-soft-peach/80 text-sm font-medium shadow h-9 align-middle whitespace-nowrap w-full sm:w-auto"
                                      aria-label="Download QR Code"
                                      onClick={() => setQrModal({ open: true, url: `${window.location.origin}/r/${page.slug}`, clientName: `${page.first_name || ''} ${page.last_name || ''}`.trim() || business?.name || 'PromptReviews', logoUrl: business?.logo_url })}
                                    >
                                      <MdDownload className="w-5 h-5" />
                                      QR code
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {lockedPromptPages.length > 0 && (
                              <tr>
                                <td colSpan={8} className="py-6 text-center bg-yellow-50 text-yellow-800 font-semibold">
                                  <div className="mb-2">You have more than 3 prompt pages. Upgrade your plan to access the rest.</div>
                                  {lockedPromptPages.map(page => (
                                    <div key={page.id} className="flex items-center justify-between px-4 py-2 bg-yellow-100 rounded mb-2">
                                      <span className="font-medium">Prompt Page: {page.first_name || page.last_name || page.slug}</span>
                                      <span className="text-xs text-yellow-700">Locked</span>
                                    </div>
                                  ))}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Download Modal */}
          {qrModal?.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center relative">
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
                  onClick={() => setQrModal(null)}
                  aria-label="Close"
                >
                  &times;
                </button>
                <h3 className="text-lg font-bold mb-4 text-indigo-900">Download QR Code</h3>
                <div className="mb-4">
                  <label htmlFor="frame-size" className="block text-sm font-medium text-gray-700 mb-2">Select frame size</label>
                  <select
                    id="frame-size"
                    value={selectedFrameSize.label}
                    onChange={e => setSelectedFrameSize(QR_FRAME_SIZES.find(s => s.label === e.target.value) || QR_FRAME_SIZES[0])}
                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    {QR_FRAME_SIZES.map(size => (
                      <option key={size.label} value={size.label}>{size.label}</option>
                    ))}
                  </select>
                </div>
                <QRCodeGenerator
                  url={qrModal.url}
                  clientName={qrModal.clientName}
                  logoUrl={qrModal.logoUrl}
                  frameSize={selectedFrameSize}
                />
                <div className="mt-6 flex flex-col gap-2">
                  <a
                    href="#"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-paleGold hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    style={{ background: '#FFD700', color: '#1A237E' }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Buy Frame/Display
                  </a>
                </div>
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

          {/* Success Modal for Payment Confirmation */}
          {showSuccessModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center relative overflow-hidden">
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
                  onClick={() => setShowSuccessModal(false)}
                  aria-label="Close"
                >
                  &times;
                </button>
                {/* Star Falling Animation */}
                <div className="absolute inset-0 pointer-events-none z-0">
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
                <h2 className="text-2xl font-bold mb-4 text-indigo-800 relative z-10">It's official.</h2>
                <p className="mb-6 text-lg text-gray-700 font-semibold relative z-10">
                  You're a {account?.plan ? account.plan.charAt(0).toUpperCase() + account.plan.slice(1) : 'Member'}.<br />
                  Now let's get some amazing reviews and boost your online presence!
                </p>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 font-semibold mt-2 relative z-10"
                >
                  Let's Go!
                </button>
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

          {/* Prompt Type Selection Modal */}
          {showTypeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full text-center relative">
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
                  onClick={() => setShowTypeModal(false)}
                  aria-label="Close"
                >
                  &times;
                </button>
                <h2 className="text-2xl font-bold text-slate-blue mb-6">Select prompt page type</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {promptTypes.map(type => (
                    <button
                      key={type.key}
                      onClick={() => !type.comingSoon && handlePromptTypeSelect(type.key)}
                      className={`flex flex-col items-center gap-2 p-6 rounded-lg border border-gray-200 hover:border-indigo-400 shadow-sm hover:shadow-md transition-all bg-gray-50 hover:bg-indigo-50 focus:outline-none ${type.comingSoon ? 'opacity-60 cursor-not-allowed relative' : ''}`}
                      disabled={!!type.comingSoon}
                      tabIndex={type.comingSoon ? -1 : 0}
                    >
                      {type.icon}
                      <span className="font-semibold text-lg text-slate-blue">{type.label}</span>
                      <span className="text-sm text-gray-600 text-center">{type.description}</span>
                      {type.comingSoon && (
                        <span className="absolute top-2 right-2 bg-yellow-200 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded">Coming soon</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 
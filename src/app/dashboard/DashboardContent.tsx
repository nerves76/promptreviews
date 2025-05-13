'use client';
import Link from 'next/link';
import { RefObject } from 'react';

interface DashboardContentProps {
  userName: string;
  business: any;
  customPromptPages: any[];
  universalPromptPage: any;
  createPromptPageRef: RefObject<HTMLAnchorElement>;
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
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-indigo-300 to-purple-200">
        <div className="max-w-[1000px] mx-auto bg-white rounded-lg shadow p-8 py-12 px-4">
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
                    <Link href={`/r/${universalPromptPage.id}`} className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium shadow">
                      View Universal Prompt Page
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

            {/* Custom Prompt Pages Table */}
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">Your Custom Prompt Pages</h3>
              <div className="mt-4">
                {business && customPromptPages.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-500">No custom prompt pages yet. Create your first one!</p>
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
                            Created
                          </th>
                          <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                            <span className="sr-only">View</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {customPromptPages.map((page) => (
                          <tr key={page.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                              {page.title}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {new Date(page.created_at).toLocaleDateString()}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 flex gap-2">
                              <Link
                                href={`/r/${page.id}`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                View
                              </Link>
                              <Link
                                href={`/dashboard/edit-prompt-page/${page.id}`}
                                className="text-blue-600 hover:text-blue-900 ml-2"
                              >
                                Edit
                              </Link>
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
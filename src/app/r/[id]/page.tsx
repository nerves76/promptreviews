'use client';

import { useEffect, useState } from 'react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { QRCodeSVG } from 'qrcode.react';
import { Metadata } from 'next';

interface ReviewRequest {
  id: string;
  title: string;
  client_name: string;
  project_type: string;
  outcomes: string;
  review_platform_links: { platform: string; url: string }[];
  custom_incentive: string | null;
}

export default function Page({ params }: { params: { id: string } }) {
  const [reviewRequest, setReviewRequest] = useState<ReviewRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);

  const supabase = createPagesBrowserClient();

  useEffect(() => {
    const fetchReviewRequest = async () => {
      try {
        const { data, error } = await supabase
          .from('review_requests')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) throw error;
        setReviewRequest(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load review request');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviewRequest();
  }, [params.id, supabase]);

  const handleCopyAndOpen = async (platform: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedPlatform(platform);
      setTimeout(() => setCopiedPlatform(null), 2000);

      // Track the submission
      await supabase.from('review_submissions').insert({
        review_request_id: params.id,
        platform,
      });

      // Open the URL in a new tab
      window.open(url, '_blank');
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Loading...</h1>
        </div>
      </div>
    );
  }

  if (error || !reviewRequest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Error</h1>
          <p className="mt-2 text-red-600">{error || 'Review request not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">{reviewRequest.title}</h1>
              <p className="mt-2 text-lg text-gray-600">
                Hi {reviewRequest.client_name}, thank you for choosing us for your{' '}
                {reviewRequest.project_type} project!
              </p>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900">Project Outcomes</h2>
              <p className="mt-2 text-gray-600 whitespace-pre-line">{reviewRequest.outcomes}</p>
            </div>

            {reviewRequest.custom_incentive && (
              <div className="mt-8 bg-indigo-50 rounded-lg p-4">
                <h2 className="text-xl font-semibold text-indigo-900">Special Offer</h2>
                <p className="mt-2 text-indigo-700">{reviewRequest.custom_incentive}</p>
              </div>
            )}

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900">Leave a Review</h2>
              <p className="mt-2 text-gray-600">
                We would greatly appreciate if you could take a moment to share your experience with us.
                Click on any of the platforms below to leave your review:
              </p>

              <div className="mt-4 space-y-4">
                {reviewRequest.review_platform_links.map((link, index) => (
                  <button
                    key={index}
                    onClick={() => handleCopyAndOpen(link.platform, link.url)}
                    className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <span>{link.platform}</span>
                    <span className="text-indigo-600">
                      {copiedPlatform === link.platform ? 'Copied!' : 'Click to Review'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <div className="bg-white p-4 rounded-lg shadow">
                <QRCodeSVG
                  value={window.location.href}
                  size={200}
                  level="H"
                  includeMargin
                  className="mx-auto"
                />
                <p className="mt-2 text-sm text-gray-500 text-center">
                  Scan to access this page later
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Review Page',
}; 
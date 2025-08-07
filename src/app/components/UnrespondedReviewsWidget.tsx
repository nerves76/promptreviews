/**
 * Unresponded Reviews Widget
 * 
 * Displays count of unresponded Google reviews from the last 30 days
 * and provides a link to the review management interface
 */

'use client';

import { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaComments, FaArrowRight } from 'react-icons/fa';
import Link from 'next/link';

interface UnrespondedReviewsData {
  summary: {
    totalReviews: number;
    accountCount: number;
    locationCount: number;
  };
  locations: Array<{
    locationId: string;
    locationName: string;
    accountId: string;
    accountName: string;
    reviews: Array<{
      id: string;
      reviewer: {
        displayName: string;
      };
      starRating: string;
      comment: string;
      createTime: string;
    }>;
  }>;
}

interface UnrespondedReviewsWidgetProps {
  className?: string;
}

export default function UnrespondedReviewsWidget({ className = '' }: UnrespondedReviewsWidgetProps) {
  const [data, setData] = useState<UnrespondedReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUnrespondedReviews();
  }, []);

  const fetchUnrespondedReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/reviews-management/unresponded-reviews');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch unresponded reviews');
      }

      setData(result);
    } catch (err) {
      console.error('Error fetching unresponded reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to load review data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center h-20">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <FaExclamationTriangle className="text-amber-500 text-xl" />
          <div>
            <h3 className="font-semibold text-gray-900">Review Data Unavailable</h3>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.summary.totalReviews === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <FaComments className="text-green-500 text-xl" />
          <div>
            <h3 className="font-semibold text-gray-900">All Caught Up!</h3>
            <p className="text-sm text-gray-600">No unresponded reviews from the last 30 days.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-100 p-2 rounded-lg">
            <FaExclamationTriangle className="text-amber-600 text-xl" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Unresponded Reviews</h3>
            <p className="text-sm text-gray-600">
              {data.summary.totalReviews} review{data.summary.totalReviews !== 1 ? 's' : ''} across {data.summary.locationCount} location{data.summary.locationCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <Link 
          href="/dashboard/reviews-management"
          className="inline-flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors"
        >
          <span className="text-sm font-medium">View All</span>
          <FaArrowRight className="text-xs" />
        </Link>
      </div>

      {data.locations.length > 0 && (
        <div className="mt-4 space-y-2">
          {data.locations.slice(0, 3).map((location, index) => (
            <div key={location.locationId} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {location.locationName}
                </p>
                <p className="text-xs text-gray-500">
                  {location.reviews.length} review{location.reviews.length !== 1 ? 's' : ''} needing response
                </p>
              </div>
              <div className="ml-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  {location.reviews.length}
                </span>
              </div>
            </div>
          ))}
          
          {data.locations.length > 3 && (
            <div className="text-center pt-2">
              <p className="text-xs text-gray-500">
                +{data.locations.length - 3} more location{data.locations.length - 3 !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <Link 
          href="/dashboard/reviews-management"
          className="w-full inline-flex items-center justify-center px-4 py-2 bg-slate-600 text-white text-sm font-medium rounded-md hover:bg-slate-700 transition-colors"
        >
          <FaComments className="mr-2 text-sm" />
          Respond to Reviews
        </Link>
      </div>
    </div>
  );
} 
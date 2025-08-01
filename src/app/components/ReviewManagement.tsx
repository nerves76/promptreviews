/**
 * Review Management Component
 * 
 * Provides interface for managing Google Business Profile reviews
 * - Business location dropdown selection
 * - Fetch and display reviews
 * - Respond to reviews inline
 */

'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';
import ReviewResponseGenerator from './ReviewResponseGenerator';

interface GoogleBusinessLocation {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'pending' | 'suspended';
}

interface Review {
  reviewId: string;
  reviewer: {
    profilePhotoUrl?: string;
    displayName: string;
  };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

interface ReviewManagementProps {
  locations: GoogleBusinessLocation[];
  isConnected: boolean;
}

const STAR_RATINGS = {
  'ONE': 1,
  'TWO': 2,
  'THREE': 3,
  'FOUR': 4,
  'FIVE': 5
};

export default function ReviewManagement({ locations, isConnected }: ReviewManagementProps) {
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showingAiFor, setShowingAiFor] = useState<string | null>(null);

  // Auto-select first location if available
  useEffect(() => {
    if (locations.length > 0 && !selectedLocation) {
      setSelectedLocation(locations[0].id);
    }
  }, [locations, selectedLocation]);

  // Fetch reviews when location changes
  useEffect(() => {
    if (selectedLocation && isConnected) {
      fetchReviews(selectedLocation);
    }
  }, [selectedLocation, isConnected]);

  const fetchReviews = async (locationId: string) => {
    setIsLoadingReviews(true);
    setError(null);
    
    try {
      const response = await fetch('/api/reviews-management/fetch-reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locationId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.status}`);
      }

      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('Failed to fetch reviews. Please try again.');
      setReviews([]);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const handleReplySubmit = async (reviewId: string) => {
    if (!replyText.trim()) return;

    setIsSubmittingReply(true);
    setError(null);

    try {
      const response = await fetch('/api/reviews-management/respond-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationId: selectedLocation,
          reviewId,
          replyText: replyText.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit reply: ${response.status}`);
      }

      // Refresh reviews to show the new reply
      await fetchReviews(selectedLocation);
      
      // Clear reply state
      setReplyingTo(null);
      setReplyText('');
      
      alert('Reply submitted successfully!');
    } catch (error) {
      console.error('Error submitting reply:', error);
      setError('Failed to submit reply. Please try again.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleAiResponseGenerated = (response: string) => {
    setReplyText(response);
    setShowingAiFor(null);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Unknown date';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <Icon 
            key={i} 
            name="FaStar"
            className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} 
            size={16}
          />
        ))}
      </div>
    );
  };

  const selectedLocationData = locations.find(loc => loc.id === selectedLocation);

  return (
    <div className="space-y-6">
      {/* Location Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Business Location</h3>
        
        <div className="relative">
          <button
            onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
            className="w-full text-left bg-white border border-gray-300 rounded-md px-3 py-2 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-slate-blue"
          >
            <span className="truncate">
              {selectedLocationData ? selectedLocationData.name : 'Select a location...'}
            </span>
            <Icon name="FaChevronDown" className={`w-4 h-4 transition-transform ${isLocationDropdownOpen ? 'rotate-180' : ''}`} size={16} />
          </button>

          {isLocationDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {locations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => {
                    setSelectedLocation(location.id);
                    setIsLocationDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                >
                  <div className="font-medium text-gray-900">{location.name}</div>
                  <div className="text-sm text-gray-600">{location.address}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <Icon name="FaExclamationTriangle" className="w-5 h-5 text-red-600 mr-3" size={20} />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Reviews</h3>
            {selectedLocation && (
              <button
                onClick={() => fetchReviews(selectedLocation)}
                disabled={isLoadingReviews}
                className="px-3 py-1 text-sm bg-slate-blue text-white rounded hover:bg-slate-blue/90 disabled:opacity-50 transition-colors flex items-center space-x-2"
              >
                {isLoadingReviews ? (
                  <>
                    <FaSpinner className="w-3 h-3 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>Refresh</span>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {isLoadingReviews ? (
            <div className="p-8 text-center">
              <FaSpinner className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Loading reviews...</p>
            </div>
          ) : reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.reviewId} className="p-6">
                {/* Review Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {review.reviewer.profilePhotoUrl ? (
                        <img
                          src={review.reviewer.profilePhotoUrl}
                          alt={review.reviewer.displayName}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <FaUser className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{review.reviewer.displayName}</div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        {renderStars(STAR_RATINGS[review.starRating])}
                        <span>•</span>
                        <FaCalendarAlt className="w-3 h-3" />
                        <span>{formatDate(review.createTime)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review Comment */}
                {review.comment && (
                  <div className="mb-4">
                    <p className="text-gray-800 leading-relaxed">{review.comment}</p>
                  </div>
                )}

                {/* Existing Reply */}
                {review.reviewReply && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-900">Your Reply</span>
                      <span className="text-xs text-gray-600">
                        {formatDate(review.reviewReply.updateTime)}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">{review.reviewReply.comment}</p>
                  </div>
                )}

                {/* Reply Form */}
                {replyingTo === review.reviewId ? (
                  <div className="border-t border-gray-200 pt-4 space-y-4">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your reply..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-slate-blue resize-none"
                      rows={3}
                    />
                    
                    {/* AI Response Generator Option */}
                    {showingAiFor === review.reviewId ? (
                      <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-purple-900">AI Review Response Generator</h4>
                          <button
                            onClick={() => setShowingAiFor(null)}
                            className="text-purple-600 hover:text-purple-800 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                        <ReviewResponseGenerator 
                          onResponseGenerated={handleAiResponseGenerated}
                        />
                      </div>
                    ) : (
                      <div className="flex justify-start">
                        <button
                          onClick={() => setShowingAiFor(review.reviewId)}
                          className="flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-800 border border-purple-300 rounded px-3 py-1 hover:bg-purple-50"
                        >
                          <FaRobot className="w-3 h-3" />
                          <span>Generate with AI</span>
                        </button>
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText('');
                          setShowingAiFor(null);
                        }}
                        className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReplySubmit(review.reviewId)}
                        disabled={isSubmittingReply || !replyText.trim()}
                        className="px-3 py-1 text-sm bg-slate-blue text-white rounded hover:bg-slate-blue/90 disabled:opacity-50 flex items-center space-x-1"
                      >
                        {isSubmittingReply ? (
                          <>
                            <FaSpinner className="w-3 h-3 animate-spin" />
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <span>Submit Reply</span>
                        )}
                      </button>
                    </div>
                  </div>
                ) : !review.reviewReply && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => setReplyingTo(review.reviewId)}
                        className="flex items-center space-x-2 text-sm text-slate-blue hover:text-slate-blue/80"
                      >
                        <FaReply className="w-3 h-3" />
                        <span>Reply to this review</span>
                      </button>
                      <button
                        onClick={() => {
                          setReplyingTo(review.reviewId);
                          setShowingAiFor(review.reviewId);
                        }}
                        className="flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-800"
                      >
                        <FaRobot className="w-3 h-3" />
                        <span>Generate AI Response</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : selectedLocation ? (
            <div className="p-8 text-center">
              <FaStar className="w-8 h-8 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No reviews found for this location</p>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-600">Select a location to view reviews</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
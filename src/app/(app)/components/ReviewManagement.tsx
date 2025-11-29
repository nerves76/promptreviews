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
import LocationPicker from '@/components/GoogleBusinessProfile/LocationPicker';
import { apiClient } from '@/utils/apiClient';

interface GoogleBusinessLocation {
  id: string;
  name: string;
  address: string;
  status?: string; // Optional, not displayed
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
  // Auto-select single location
  const [selectedLocation, setSelectedLocation] = useState<string>(() => {
    return locations.length === 1 ? locations[0].id : '';
  });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showingAiFor, setShowingAiFor] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState<string | null>(null);
  
  // Edit reply state
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [editReplyText, setEditReplyText] = useState('');
  const [isUpdatingReply, setIsUpdatingReply] = useState(false);
  const [showingAiForEdit, setShowingAiForEdit] = useState<string | null>(null);
  const [isGeneratingAiEdit, setIsGeneratingAiEdit] = useState<string | null>(null);

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
      const data = await apiClient.post<{ reviews: Review[]; success: boolean }>('/reviews-management/fetch-reviews', { locationId });
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
      await apiClient.post('/reviews-management/respond-review', {
        locationId: selectedLocation,
        reviewId,
        replyText: replyText.trim(),
      });

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

  const handleUpdateReply = async (reviewId: string) => {
    if (!editReplyText.trim()) return;

    setIsUpdatingReply(true);
    setError(null);

    try {
      await apiClient.put('/reviews-management/update-review-reply', {
        locationId: selectedLocation,
        reviewId,
        updatedReplyText: editReplyText.trim(),
      });

      // Refresh reviews to show the updated reply
      await fetchReviews(selectedLocation);
      
      // Clear edit state
      setEditingReply(null);
      setEditReplyText('');
      setShowingAiForEdit(null);
      
      alert('Reply updated successfully!');
    } catch (error) {
      console.error('Error updating reply:', error);
      setError('Failed to update reply. Please try again.');
    } finally {
      setIsUpdatingReply(false);
    }
  };

  const handleEditReply = (reviewId: string, currentReplyText: string) => {
    setEditingReply(reviewId);
    setEditReplyText(currentReplyText);
    // Close any other open forms
    setReplyingTo(null);
    setReplyText('');
    setShowingAiFor(null);
  };

  const handleCancelEdit = () => {
    setEditingReply(null);
    setEditReplyText('');
    setShowingAiForEdit(null);
  };

  const handleAiResponseGenerated = (response: string) => {
    setReplyText(response);
    setShowingAiFor(null);
  };

  const handleAiEditResponseGenerated = (response: string) => {
    setEditReplyText(response);
    setShowingAiForEdit(null);
  };

  // Direct AI generation without modal
  const generateAiResponse = async (review: Review) => {
    setIsGeneratingAi(review.reviewId);
    setReplyingTo(review.reviewId);
    setError(null);

    try {
      // First, try to fetch Google Business Profile data for richer context
      let businessContext = undefined;
      try {
        const profileData = await apiClient.get<{ success: boolean; data: any }>(`/google-business-profile/business-information/location-details?locationId=${encodeURIComponent(selectedLocation)}`);
        if (profileData.success && profileData.data) {
          const location = profileData.data;
          // Extract relevant business context from Google Business Profile
          businessContext = {
            businessName: location.title || location.locationName || '',
            city: location.address?.locality || '',
            industry: location.categories?.primaryCategory?.displayName ?
              [location.categories.primaryCategory.displayName] :
              (location.primaryCategory?.displayName ? [location.primaryCategory.displayName] : []),
            companyValues: location.profile?.description || '',
            differentiators: location.serviceItems?.map((s: any) => s.structuredServiceItem?.serviceName || s.freeFormServiceItem?.label?.displayName || '').filter(Boolean).join(', ') || '',
            taglines: location.profile?.shortDescription || '',
            websiteUrl: location.websiteUri || '',
            phoneNumber: location.phoneNumbers?.primaryPhone || location.primaryPhone || '',
            // Add more specific details that can help personalize responses
            regularHours: location.regularHours ? 'mentioned' : undefined,
            specialHours: location.specialHours ? 'has special hours' : undefined,
          };
        }
      } catch (profileError) {
      }

      const result = await apiClient.post<{ success: boolean; response: string; error?: string }>('/ai/google-business/generate-review-response', {
        reviewText: review.comment || '',
        reviewRating: STAR_RATINGS[review.starRating],
        reviewerName: review.reviewer.displayName,
        businessContext: businessContext,
      });

      if (result.success) {
        setReplyText(result.response);
      } else {
        setError(result.error || 'Failed to generate response');
      }
    } catch (err) {
      setError('Failed to generate AI response. Please try again.');
      console.error('AI generation error:', err);
    } finally {
      setIsGeneratingAi(null);
    }
  };

  // Direct AI generation for editing
  const generateAiEditResponse = async (review: Review) => {
    setIsGeneratingAiEdit(review.reviewId);
    setError(null);

    try {
      // First, try to fetch Google Business Profile data for richer context
      let businessContext = undefined;
      try {
        const profileData = await apiClient.get<{ success: boolean; data: any }>(`/google-business-profile/business-information/location-details?locationId=${encodeURIComponent(selectedLocation)}`);
        if (profileData.success && profileData.data) {
          const location = profileData.data;
          // Extract relevant business context from Google Business Profile
          businessContext = {
            businessName: location.title || location.locationName || '',
            city: location.address?.locality || '',
            industry: location.categories?.primaryCategory?.displayName ?
              [location.categories.primaryCategory.displayName] :
              (location.primaryCategory?.displayName ? [location.primaryCategory.displayName] : []),
            companyValues: location.profile?.description || '',
            differentiators: location.serviceItems?.map((s: any) => s.structuredServiceItem?.serviceName || s.freeFormServiceItem?.label?.displayName || '').filter(Boolean).join(', ') || '',
            taglines: location.profile?.shortDescription || '',
            websiteUrl: location.websiteUri || '',
            phoneNumber: location.phoneNumbers?.primaryPhone || location.primaryPhone || '',
            // Add more specific details that can help personalize responses
            regularHours: location.regularHours ? 'mentioned' : undefined,
            specialHours: location.specialHours ? 'has special hours' : undefined,
          };
        }
      } catch (profileError) {
      }

      const result = await apiClient.post<{ success: boolean; response: string; error?: string }>('/ai/google-business/generate-review-response', {
        reviewText: review.comment || '',
        reviewRating: STAR_RATINGS[review.starRating],
        reviewerName: review.reviewer.displayName,
        businessContext: businessContext,
      });

      if (result.success) {
        setEditReplyText(result.response);
      } else {
        setError(result.error || 'Failed to generate response');
      }
    } catch (err) {
      setError('Failed to generate AI response. Please try again.');
      console.error('AI generation error:', err);
    } finally {
      setIsGeneratingAiEdit(null);
    }
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

  const hasSingleLocation = locations.length <= 1;
  const resolvedSingleLocation = hasSingleLocation ? locations[0] : undefined;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Manage Reviews</h2>
            <p className="text-sm text-gray-600 mt-1">
              Reply quickly to improve your visibility on Google and keep customers happy.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Locations:</p>
          {hasSingleLocation ? (
            <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              Google Business Profile: {resolvedSingleLocation?.name || 'No locations connected'}
            </div>
          ) : (
            <LocationPicker
              className="bg-gray-50 rounded-lg p-4"
              mode="single"
              locations={locations}
              selectedId={selectedLocation || locations[0]?.id}
              onSelect={(id) => setSelectedLocation(id)}
              placeholder="Select a location..."
            />
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
                    <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
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
              <Icon name="FaSpinner" className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
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
                        <Icon name="FaUser" className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{review.reviewer.displayName}</div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        {renderStars(STAR_RATINGS[review.starRating])}
                        <span>•</span>
                        <Icon name="FaCalendarAlt" className="w-3 h-3 text-slate-blue" />
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
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">Your Reply</span>
                        <span className="text-xs text-gray-600">
                          {formatDate(review.reviewReply.updateTime)}
                        </span>
                      </div>
                      {editingReply !== review.reviewId && (
                        <button
                          onClick={() => handleEditReply(review.reviewId, review.reviewReply!.comment)}
                          className="flex items-center space-x-1 text-xs text-slate-blue hover:text-slate-blue/80 border border-slate-blue/30 rounded px-2 py-1 hover:bg-slate-blue/5"
                        >
                          <Icon name="FaEdit" className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">{review.reviewReply.comment}</p>
                  </div>
                )}

                {/* Edit Reply Form */}
                {editingReply === review.reviewId && (
                  <div className="border border-amber-200 rounded-lg p-4 mb-4 bg-amber-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-amber-900">Edit Your Reply</h4>
                      <button
                        onClick={handleCancelEdit}
                        className="text-amber-600 hover:text-amber-800 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <textarea
                      value={editReplyText}
                      onChange={(e) => setEditReplyText(e.target.value)}
                      placeholder="Edit your reply..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-slate-blue resize-none mb-4"
                      rows={3}
                    />
                    
                    {/* AI Response Generator Option for Edit */}
                    {showingAiForEdit === review.reviewId ? (
                      <div className="border border-purple-200 rounded-lg p-4 bg-purple-50 mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-purple-900">AI Review Response Generator</h4>
                          <button
                            onClick={() => setShowingAiForEdit(null)}
                            className="text-purple-600 hover:text-purple-800 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                        <ReviewResponseGenerator 
                          onResponseGenerated={handleAiEditResponseGenerated}
                        />
                      </div>
                    ) : (
                      <div className="flex justify-start mb-4">
                        <button
                          onClick={() => generateAiEditResponse(review)}
                          disabled={isGeneratingAiEdit === review.reviewId}
                          className="flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-800 border border-purple-300 rounded px-3 py-1 hover:bg-purple-50 disabled:opacity-50"
                        >
                          {isGeneratingAiEdit === review.reviewId ? (
                            <>
                              <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <Icon name="prompty" className="w-3 h-3 text-slate-blue" size={12} />
                              <span>Improve with AI</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdateReply(review.reviewId)}
                        disabled={isUpdatingReply || !editReplyText.trim()}
                        className="px-3 py-1 text-sm bg-slate-blue text-white rounded hover:bg-slate-blue/90 disabled:opacity-50 flex items-center space-x-1"
                      >
                        {isUpdatingReply ? (
                          <>
                            <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <span>Update Reply</span>
                        )}
                      </button>
                    </div>
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
                          onClick={() => generateAiResponse(review)}
                          disabled={isGeneratingAi === review.reviewId}
                          className="flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-800 border border-purple-300 rounded px-3 py-1 hover:bg-purple-50 disabled:opacity-50"
                        >
                          {isGeneratingAi === review.reviewId ? (
                            <>
                              <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <Icon name="prompty" className="w-3 h-3 text-slate-blue" size={12} />
                              <span>Generate with AI</span>
                            </>
                          )}
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
                            <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
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
                        <Icon name="MdReply" className="w-3 h-3 text-slate-blue" />
                        <span>Reply to this review</span>
                      </button>
                      <button
                        onClick={() => generateAiResponse(review)}
                        disabled={isGeneratingAi === review.reviewId}
                        className="flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-800 disabled:opacity-50"
                      >
                        {isGeneratingAi === review.reviewId ? (
                          <>
                            <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <Icon name="prompty" className="w-3 h-3 text-slate-blue" size={12} />
                            <span>Generate AI Response</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : selectedLocation ? (
            <div className="p-8 text-center">
              <Icon name="FaStar" className="w-8 h-8 text-gray-400 mx-auto mb-4" />
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

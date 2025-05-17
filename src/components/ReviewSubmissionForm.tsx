"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useReviewer } from '@/contexts/ReviewerContext';
import type { PromptPage } from '@/utils/supabase';

const PLATFORM_OPTIONS = [
  'Google Business Profile',
  'Yelp',
  'Facebook',
  'TripAdvisor',
  'Angi',
  'Houzz',
  'BBB',
  'Thumbtack',
  'HomeAdvisor',
  'Trustpilot',
  'Other',
];

interface ReviewSubmissionFormProps {
  promptPageId: string;
  platform?: string;
  reviewContent: string;
  promptPage?: PromptPage;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function ReviewSubmissionForm({
  promptPageId,
  platform: initialPlatform = '',
  reviewContent,
  promptPage,
  onSuccess,
  onError
}: ReviewSubmissionFormProps) {
  const { reviewerInfo, updateReviewerInfo } = useReviewer();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [platform, setPlatform] = useState(initialPlatform || 'Google Business Profile');
  const [customPlatform, setCustomPlatform] = useState('');

  // Auto-populate name from prompt page if available
  useEffect(() => {
    if (promptPage?.first_name && !reviewerInfo.name) {
      updateReviewerInfo({ 
        name: promptPage.first_name,
        role: promptPage.role || ''
      });
    }
  }, [promptPage, reviewerInfo.name, updateReviewerInfo]);

  // Get the review group ID from localStorage or create a new one
  const getReviewGroupId = () => {
    const storedGroupId = localStorage.getItem('reviewGroupId');
    if (storedGroupId) return storedGroupId;
    const newGroupId = crypto.randomUUID();
    localStorage.setItem('reviewGroupId', newGroupId);
    return newGroupId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerInfo.name.trim()) {
      setError('Please enter your name');
      return;
    }
    const platformToSave = platform === 'Other' ? customPlatform.trim() : platform;
    if (!platformToSave) {
      setError('Please select or enter a platform');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const { error: submissionError } = await supabase
        .from('review_submissions')
        .insert({
          prompt_page_id: promptPageId,
          platform: platformToSave,
          status: 'submitted',
          reviewer_name: reviewerInfo.name.trim(),
          reviewer_role: reviewerInfo.role.trim() || null,
          review_content: reviewContent,
          review_group_id: getReviewGroupId(),
          user_agent: navigator.userAgent,
          ip_address: null // This will be handled server-side for security
        });
      if (submissionError) throw submissionError;
      onSuccess?.();
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review. Please try again.');
      onError?.(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="reviewerName" className="block text-sm font-medium text-gray-700">
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="reviewerName"
            value={reviewerInfo.name}
            onChange={(e) => updateReviewerInfo({ name: e.target.value })}
            placeholder="Ezra C"
            className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
            required
          />
        </div>
        <div className="flex-1">
          <label htmlFor="reviewerRole" className="block text-sm font-medium text-gray-700">
            Role/Position/Occupation
          </label>
          <input
            type="text"
            id="reviewerRole"
            value={reviewerInfo.role}
            onChange={(e) => updateReviewerInfo({ role: e.target.value })}
            placeholder="Store Manager, GreenSprout Co-Op"
            className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
          />
        </div>
      </div>
      <div>
        <label htmlFor="platform" className="block text-sm font-medium text-gray-700">
          Platform <span className="text-red-500">*</span>
        </label>
        <select
          id="platform"
          value={platform}
          onChange={e => setPlatform(e.target.value)}
          className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
          required
        >
          <option value="">Select a platform</option>
          {PLATFORM_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {platform === 'Other' && (
          <input
            type="text"
            className="mt-2 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
            placeholder="Enter platform name"
            value={customPlatform}
            onChange={e => setCustomPlatform(e.target.value)}
            required
          />
        )}
      </div>
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}
      <button
        type="submit"
        className="w-full py-3 px-6 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
} 
/**
 * Review Response Generator Component
 * 
 * AI-powered tool for generating responses to customer reviews
 * with brand-appropriate tone and messaging.
 */

'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';

interface ReviewResponseGeneratorProps {
  onResponseGenerated?: (response: string) => void;
}

export default function ReviewResponseGenerator({ onResponseGenerated }: ReviewResponseGeneratorProps) {
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewerName, setReviewerName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [responseTone, setResponseTone] = useState<'professional' | 'friendly' | 'apologetic' | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerateResponse = async () => {
    if (!reviewText.trim()) {
      setError('Please enter the review text');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/ai/google-business/generate-review-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewText: reviewText.trim(),
          reviewRating,
          reviewerName: reviewerName.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedResponse(result.response);
        setResponseTone(result.tone);
        onResponseGenerated?.(result.response);
      } else {
        setError(result.error || 'Failed to generate response');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Review response generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyResponse = async () => {
    if (generatedResponse) {
      await navigator.clipboard.writeText(generatedResponse);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const clearForm = () => {
    setReviewText('');
    setReviewerName('');
    setReviewRating(5);
    setGeneratedResponse('');
    setResponseTone(null);
    setError('');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Icon name="FaRobot" className="w-5 h-5 text-slate-blue" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold">AI Review Response Generator</h3>
          <p className="text-sm text-gray-600">
            Generate professional responses to customer reviews using AI
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Review Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review Rating
          </label>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => setReviewRating(rating)}
                className="focus:outline-none"
              >
                <Icon
                  name="FaStar"
                  className={`w-6 h-6 ${
                    rating <= reviewRating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  size={24}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {reviewRating} star{reviewRating !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Reviewer Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reviewer Name (Optional)
          </label>
          <input
            type="text"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            placeholder="e.g., John Smith"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-blue focus:border-slate-blue"
          />
        </div>

        {/* Review Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review Text
          </label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Paste the customer's review here..."
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-blue focus:border-slate-blue"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleGenerateResponse}
            disabled={isGenerating}
            className="px-4 py-2 bg-slate-blue text-white rounded-md hover:bg-slate-blue/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isGenerating ? (
              <>
                <Icon name="FaSpinner" className="w-4 h-4 animate-spin" size={16} />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Icon name="FaRobot" className="w-4 h-4 text-slate-blue" size={16} />
                <span>Generate Response</span>
              </>
            )}
          </button>

          {generatedResponse && (
            <button
              onClick={clearForm}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Generated Response */}
        {generatedResponse && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Generated Response</h4>
              <div className="flex items-center space-x-2">
                {responseTone && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    responseTone === 'friendly' ? 'bg-green-100 text-green-800' :
                    responseTone === 'professional' ? 'bg-blue-100 text-blue-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {responseTone}
                  </span>
                )}
                <button
                  onClick={handleCopyResponse}
                  className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
                >
                  {copied ? (
                    <>
                      <Icon name="FaCheck" className="w-3 h-3 text-green-600" size={12} />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Icon name="FaCopy" className="w-3 h-3" size={12} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-gray-800 whitespace-pre-wrap">{generatedResponse}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
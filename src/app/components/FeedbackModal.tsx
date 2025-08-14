/**
 * FeedbackModal component for collecting detailed feedback from users
 * This component provides a modal form with feedback categories and submission functionality
 */

'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';
import { createClient, getSessionOrMock } from '@/auth/providers/supabase';
import { trackEvent } from '../../utils/analytics';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackCategory = 'bug_report' | 'feature_request' | 'general_feedback';

const categoryOptions = [
  {
    value: 'bug_report' as FeedbackCategory,
    label: 'Bug Report',
    icon: 'FaExclamationTriangle',
    description: 'Something isn\'t working as expected'
  },
  {
    value: 'feature_request' as FeedbackCategory,
    label: 'Feature Request',
    icon: 'FaHeart',
    description: 'I\'d like to see a new feature'
  },
  {
    value: 'general_feedback' as FeedbackCategory,
    label: 'General Feedback',
    icon: 'FaCommentAlt',
    description: 'General thoughts or suggestions'
  }
];

export default function FeedbackModal({
  isOpen, 
  onClose 
}: FeedbackModalProps) {
  const supabase = createClient();
  const [category, setCategory] = useState<FeedbackCategory>('general_feedback');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Try to get the current session (optional)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if we have a session
      if (session && !sessionError) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Headers are already prepared above

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          category,
          message: message.trim(),
          email: email.trim() || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Feedback submitted successfully:', result);
        
        setSubmitStatus('success');
        setMessage('');
        setEmail('');
        
        // Track the feedback submission
        trackEvent('feedback_submitted', {
          category,
          has_email: !!email.trim(),
          message_length: message.length,
          feedback_id: result.feedback_id,
        });

        // Close modal after a short delay
        setTimeout(() => {
          onClose();
          setSubmitStatus('idle');
        }, 2000);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Feedback submission failed:', errorData);
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setMessage('');
      setEmail('');
      setSubmitStatus('idle');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          className="absolute -top-4 -right-4 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 focus:outline-none"
          style={{ zIndex: 20, width: 40, height: 40 }}
          onClick={handleClose}
          disabled={isSubmitting}
          aria-label="Close"
        >
          <Icon name="FaTimes" className="w-5 h-5 text-red-600" size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Send feedback</h2>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What type of feedback do you have?
            </label>
            <div className="space-y-2">
              {categoryOptions.map((option) => {
                return (
                  <label
                    key={option.value}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      category === option.value
                        ? 'border-slate-blue bg-slate-blue/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={option.value}
                      checked={category === option.value}
                      onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
                      className="sr-only"
                    />
                    <Icon name={option.icon as any} className={`w-5 h-5 mr-3 ${
                      category === option.value ? 'text-slate-blue' : 'text-gray-400'
                    }`} size={20} />
                    <div>
                      <div className={`font-medium ${
                        category === option.value ? 'text-slate-blue' : 'text-gray-900'
                      }`}>
                        {option.label}
                      </div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Your feedback *
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
              placeholder="Tell us what you think..."
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Email (Optional) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email (optional)
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
              placeholder="your@email.com"
              disabled={isSubmitting}
            />
            <p className="text-sm text-gray-500 mt-1">
              We'll only use this to follow up on your feedback if needed.
            </p>
          </div>

          {/* Submit Status */}
          {submitStatus === 'success' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 text-sm">Thank you for your feedback! We'll review it shortly.</p>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">
                Unable to submit feedback. Please try again or contact support if the issue persists.
              </p>
              <p className="text-red-600 text-xs mt-1">
                If this keeps happening, please email your feedback directly to support.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !message.trim()}
            className="w-full text-white py-3 px-6 rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            style={{ backgroundColor: '#2E4A7D' }}
          >
            {isSubmitting ? 'Sending...' : 'Send feedback'}
          </button>
        </form>
      </div>
    </div>
  );
} 
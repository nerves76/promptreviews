/**
 * Issues/Feedback tab component for the help modal
 */

'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';
import { createClient } from '@/auth/providers/supabase';
import { FeedbackCategory, CategoryOption } from './types';
import { trackEvent } from '@/utils/analytics';

interface IssuesTabProps {
  pathname: string;
  contextKeywords: string[];
  onClose: () => void;
}

const categoryOptions: CategoryOption[] = [
  {
    value: 'bug_report',
    label: 'Bug Report',
    icon: 'FaWrench',
    description: 'Something isn\'t working as expected'
  },
  {
    value: 'feature_request',
    label: 'Feature Request',
    icon: 'FaLightbulb',
    description: 'I\'d like to see a new feature'
  },
  {
    value: 'general_feedback',
    label: 'General Feedback',
    icon: 'FaCommentAlt',
    description: 'General thoughts or suggestions'
  }
];

export default function IssuesTab({ 
  pathname, 
  contextKeywords,
  onClose 
}: IssuesTabProps) {
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
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (session && !sessionError) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          category,
          message: message.trim(),
          email: email.trim() || undefined,
          context: {
            pathname,
            contextKeywords
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSubmitStatus('success');
        setMessage('');
        setEmail('');
        
        trackEvent('feedback_submitted', {
          category,
          has_email: !!email.trim(),
          message_length: message.length,
          feedback_id: result.feedback_id,
          context: pathname,
          source: 'help_modal'
        });

        setTimeout(() => {
          onClose();
          setSubmitStatus('idle');
        }, 2000);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* Quick tips based on category */}
      {category === 'bug_report' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Icon name="FaLightbulb" className="w-4 h-4 text-amber-600 mt-0.5" size={16} />
            <div>
              <p className="text-sm font-medium text-amber-800 mb-1">
                Reporting a bug?
              </p>
              <p className="text-sm text-amber-700">
                Please include: What you were trying to do, what happened instead, and any error messages you saw.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-white mb-3">
          What type of feedback do you have?
        </label>
        <div className="space-y-2">
          {categoryOptions.map((option) => (
            <label
              key={option.value}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                category === option.value
                  ? 'border-white/30 bg-white/10'
                  : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
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
              <Icon
                name={option.icon as any}
                className={`w-5 h-5 mr-3 ${
                  category === option.value ? 'text-white' : 'text-white/60'
                }`}
                size={20}
              />
              <div>
                <div className={`font-medium ${
                  category === option.value ? 'text-white' : 'text-white'
                }`}>
                  {option.label}
                </div>
                <div className="text-sm text-white/80">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Context info */}
      <div className="p-3 bg-white/10 rounded-lg border border-white/20">
        <div className="flex items-center space-x-2 mb-1">
          <Icon name="FaInfoCircle" className="w-4 h-4 text-white/80" size={16} />
          <span className="text-sm font-medium text-white">Context Information</span>
        </div>
        <p className="text-xs text-white/90">
          Current page: {pathname}
        </p>
        <p className="text-xs text-white/70 mt-1">
          This information helps us better understand and resolve your issue.
        </p>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-white mb-2">
          Your feedback *
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="w-full px-3 py-2 border border-white/20 bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent resize-none text-white placeholder-white/50"
          placeholder={
            category === 'bug_report'
              ? "Describe the issue you're experiencing..."
              : category === 'feature_request'
              ? "Describe the feature you'd like to see..."
              : "Tell us what you think..."
          }
          required
          disabled={isSubmitting}
        />
        <p className="text-xs text-white/70 mt-1">
          {message.length}/1000 characters
        </p>
      </div>

      {/* Email (Optional) */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
          Email (optional)
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-white/20 bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent text-white placeholder-white/50"
          placeholder="your@email.com"
          disabled={isSubmitting}
        />
        <p className="text-sm text-white/70 mt-1">
          We'll only use this to follow up on your feedback if needed.
        </p>
      </div>

      {/* Submit Status */}
      {submitStatus === 'success' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-start space-x-2">
            <Icon name="FaCheckCircle" className="w-5 h-5 text-green-600 mt-0.5" size={20} />
            <div>
              <p className="text-green-800 font-medium">Thank you for your feedback!</p>
              <p className="text-green-700 text-sm mt-1">
                We'll review it shortly and get back to you if needed.
              </p>
            </div>
          </div>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start space-x-2">
            <Icon name="FaExclamationTriangle" className="w-5 h-5 text-red-600 mt-0.5" size={20} />
            <div>
              <p className="text-red-800 font-medium">Unable to submit feedback</p>
              <p className="text-red-700 text-sm mt-1">
                Please try again or email us directly at support@promptreviews.app
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !message.trim() || message.length > 1000}
        className="w-full text-white py-3 px-6 rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center"
        style={{ backgroundColor: '#2E4A7D' }}
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Sending...
          </>
        ) : (
          <>
            <Icon name="FaEnvelope" className="w-4 h-4 mr-2" size={16} />
            Send feedback
          </>
        )}
      </button>
    </form>
  );
}
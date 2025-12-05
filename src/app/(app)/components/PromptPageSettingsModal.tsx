/**
 * Default Prompt Page Settings Modal
 * 
 * Modal component for managing default settings that are applied to NEW prompt pages only.
 * These settings do not override or update existing prompt pages.
 * Uses existing prompt feature modules for consistency.
 * 
 * Features:
 * - Review platforms configuration
 * - Keywords for SEO and AI
 * - AI dos and don'ts
 * - Special offer settings
 * - AI generation and grammar fixing
 * - Emoji sentiment flow
 * - Falling stars animation
 * - Friendly note
 * - Recent reviews display
 * - Kickstarters feature
 */

import React, { useState, useEffect } from 'react';
import Icon from "@/components/Icon";
import RobotTooltip from './RobotTooltip';
import { markTaskAsCompleted } from '@/utils/onboardingTasks';
import { useAuthUser } from '@/auth/hooks/granularAuthHooks';
import { KeywordsInputLegacyAdapter as KeywordsInput } from '@/features/keywords/components';

// Import all the existing prompt feature modules
import {
  ReviewPlatformsFeature,
  OfferFeature,
  AISettingsFeature,
  EmojiSentimentFeature,
  FallingStarsFeature,
  PersonalizedNoteFeature,
  RecentReviewsFeature,
  KickstartersFeature
} from './prompt-features';

interface PromptPageSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settingsData: any) => Promise<void>;
  initialSettings?: any;
  businessName?: string;
  accountId: string; // Account ID for security
  businessInfo?: any; // Full business profile for keyword generation
}

export default function PromptPageSettingsModal({
  isOpen,
  onClose,
  onSave,
  initialSettings = {},
  businessName = '',
  accountId,
  businessInfo
}: PromptPageSettingsModalProps) {
  const { user } = useAuthUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Draggable modal state
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Form state for all settings
  const [formData, setFormData] = useState({
    // Review Platforms
    review_platforms: [],

    // Keywords (stored as array)
    keywords: [] as string[],
    
    // AI Dos and Don'ts
    ai_dos: '',
    ai_donts: '',
    
    // Special Offer
    default_offer_enabled: false,
    default_offer_title: 'Special Offer',
    default_offer_body: '',
    default_offer_url: '',
    default_offer_timelock: false,
    
    // AI Settings
    ai_button_enabled: false,
    fix_grammar_enabled: false,
    
    // Emoji Sentiment
    emoji_sentiment_enabled: false,
    emoji_sentiment_question: 'How was your experience?',
    emoji_feedback_message: 'Please tell us more about your experience',
    emoji_thank_you_message: 'Thank you for your feedback!',
    emoji_feedback_popup_header: 'How can we improve?',
    emoji_feedback_page_header: 'Your feedback helps us grow',
    
    // Falling Stars
    falling_enabled: true,
    falling_icon: 'star',
    falling_icon_color: '#FFD700',
    
    // Friendly Note
    show_friendly_note: false,
    friendly_note: '',
    
    // Recent Reviews
    recent_reviews_enabled: false,
    recent_reviews_scope: 'current_page',
    
    // Kickstarters
    kickstarters_enabled: true,
    selected_kickstarters: [],
    custom_kickstarters: [],
    kickstarters_background_design: false,
    
    ...initialSettings
  });

  // Update form data when modal opens (not on every initialSettings change)
  // This prevents the form from resetting while the user is editing
  useEffect(() => {
    if (isOpen && initialSettings) {
      // Convert keywords from string to array if needed
      const keywords = Array.isArray(initialSettings.keywords)
        ? initialSettings.keywords
        : typeof initialSettings.keywords === 'string' && initialSettings.keywords
          ? initialSettings.keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
          : [];

      setFormData((prev: any) => ({
        ...prev,
        ...initialSettings,
        keywords
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Only run when modal opens, not when initialSettings changes

  // Center modal on mount
  useEffect(() => {
    if (isOpen) {
      const modalWidth = 896; // max-w-4xl
      const modalHeight = Math.min(window.innerHeight * 0.9, 800); // Use 90% of viewport height or 800px max
      const x = Math.max(0, (window.innerWidth - modalWidth) / 2);
      const y = Math.max(0, (window.innerHeight - modalHeight) / 2);
      setModalPos({ x, y });
    }
  }, [isOpen]);

  // Handle dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setModalPos({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
    // Clear any existing error for this field
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setErrors({}); // Clear any previous errors
    try {
      // Convert keywords array to comma-separated string for storage
      const dataToSave = {
        ...formData,
        keywords: Array.isArray(formData.keywords) ? formData.keywords : []
      };

      await onSave(dataToSave);

      // Check if prompt-page-settings task should be completed
      // The task is complete if keywords and either AI dos or don'ts are filled in
      const hasKeywords = Array.isArray(formData.keywords) && formData.keywords.length > 0;
      if (accountId && hasKeywords && (formData.ai_dos?.trim() || formData.ai_donts?.trim())) {
        // Mark the onboarding task as complete
        await markTaskAsCompleted(accountId, 'prompt-page-settings');
      }
      
      // Show success message in the modal instead of closing
      setErrors({ success: 'Settings saved successfully!' });
      // Clear success message after 3 seconds
      setTimeout(() => {
        setErrors((prev) => {
          const { success, ...rest } = prev;
          return rest;
        });
      }, 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setErrors({ general: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('.modal-header')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - modalPos.x,
        y: e.clientY - modalPos.y,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
          aria-label="Close modal"
        />
        
        {/* Modal */}
        <div
          className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-2xl shadow-2xl w-full max-w-4xl relative flex flex-col border border-white/20 backdrop-blur-sm"
          style={{
            position: 'absolute',
            left: modalPos.x,
            top: modalPos.y,
            transform: 'none',
            maxHeight: '90vh',
            height: 'auto',
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Draggable header */}
          <div className="modal-header flex items-center justify-between p-4 cursor-move bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 rounded-t-2xl">
            <div className="w-1/3">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Prompt Page Settings
                </h2>
                <p className="text-xs text-white/80 mt-1">
                  Set global defaults for keywords, AI, review platforms, and more.
                </p>
              </div>
            </div>
            <div className="w-1/3 flex justify-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                <Icon name="FaArrowsAlt" className="text-white/90" size={16} />
              </div>
            </div>
            <div className="w-1/3 flex justify-end pr-8">
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition text-sm border border-white/30 flex items-center gap-2"
              >
                {isSubmitting && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                )}
                {isSubmitting ? 'Saving...' : 'Save settings'}
              </button>
            </div>
          </div>

          {/* Circular close button that exceeds modal borders */}
          <button
            className="absolute -top-3 -right-3 bg-white/70 backdrop-blur-sm border border-white/40 rounded-full shadow-lg flex items-center justify-center hover:bg-white/90 focus:outline-none z-20 transition-colors p-2"
            style={{ width: 36, height: 36 }}
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close prompt settings modal"
          >
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 10rem)' }}>
              
              {/* General Error */}
              {errors.general && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{errors.general}</p>
                </div>
              )}

              {/* GLOBAL SETTINGS - Apply to all prompt pages immediately */}
              <div className="mb-8">
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-white/30">
                  <h2 className="text-xl font-bold text-slate-blue mb-1">Global</h2>
                  <p className="text-sm text-gray-600 mb-6">These settings apply immediately to all prompt pages.</p>
                  
                  {/* Keyword Phrases Section */}
                  <section className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-blue mb-2 flex items-center">
                    Keyword-Powered Reviews
                    <RobotTooltip text="These keyword phrases will be pre-populated on all new prompt pages. Each page can then customize their keyword phrases without affecting these global defaults." />
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Add phrases that you would like to appear in your reviews. These can be added manually by your customers or included in AI generations.
                  </p>
                  <KeywordsInput
                    keywords={formData.keywords || []}
                    onChange={(keywords) => handleInputChange('keywords', keywords)}
                    placeholder="Enter phrases separated by comma: best tax accountant in Bend, save money on taxes, affordable tax services"
                    businessInfo={businessInfo}
                  />
                </section>

                {/* AI Dos and Don'ts Section */}
                <section className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-blue mb-4 flex items-center">
                    AI guidelines
                    <RobotTooltip text="These guidelines help AI generate better content across all prompt pages." />
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* AI Dos */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        AI dos
                        <RobotTooltip text="Things you want the AI to emphasize or include." />
                      </label>
                      <textarea
                        value={formData.ai_dos}
                        onChange={(e) => handleInputChange('ai_dos', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                        placeholder="e.g., Always mention our excellent customer service..."
                      />
                    </div>

                    {/* AI Don'ts */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        AI don'ts
                        <RobotTooltip text="Things you want the AI to avoid or not mention." />
                      </label>
                      <textarea
                        value={formData.ai_donts}
                        onChange={(e) => handleInputChange('ai_donts', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                        placeholder="e.g., Never mention pricing or costs..."
                      />
                    </div>
                  </div>
                </section>
                </div>
              </div>

              {/* Divider */}
              <hr className="my-8 border-gray-200" />

              {/* DEFAULT SETTINGS - Only for new prompt pages */}
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-white/30">
                <h2 className="text-xl font-bold text-slate-blue mb-4">Defaults</h2>
                
                {/* Info Notice */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex">
                    <Icon name="FaInfoCircle" className="text-blue-600 mr-2 flex-shrink-0" size={20} />
                    <div className="text-sm text-blue-800">
                      <strong>Note:</strong> The settings below only apply to new prompt pages you create. 
                      Existing prompt pages will keep their current settings. Each prompt page can override 
                      these defaults with its own custom settings.
                    </div>
                  </div>
                </div>

                {/* Review Platforms */}
                <div className="mb-6">
                  <ReviewPlatformsFeature
                    platforms={formData.review_platforms}
                    onPlatformsChange={(platforms) => handleInputChange('review_platforms', platforms)}
                    initialData={{
                      review_platforms: formData.review_platforms
                    }}
                  />
                </div>

                {/* Special Offer */}
                <div className="mb-6">
                  <OfferFeature
                  enabled={formData.default_offer_enabled}
                  title={formData.default_offer_title}
                  description={formData.default_offer_body}
                  url={formData.default_offer_url}
                  timelock={formData.default_offer_timelock}
                  onEnabledChange={(enabled) => handleInputChange('default_offer_enabled', enabled)}
                  onTitleChange={(title) => handleInputChange('default_offer_title', title)}
                  onDescriptionChange={(description) => handleInputChange('default_offer_body', description)}
                  onUrlChange={(url) => handleInputChange('default_offer_url', url)}
                  onTimelockChange={(timelock) => handleInputChange('default_offer_timelock', timelock)}
                  initialData={{
                    offer_enabled: formData.default_offer_enabled,
                    offer_title: formData.default_offer_title,
                    offer_body: formData.default_offer_body,
                    offer_url: formData.default_offer_url,
                    offer_timelock: formData.default_offer_timelock
                  }}
                />
                </div>

                {/* AI Generation Settings */}
                <div className="mb-6">
                  <AISettingsFeature
                  aiGenerationEnabled={formData.ai_button_enabled}
                  fixGrammarEnabled={formData.fix_grammar_enabled}
                  onAIEnabledChange={(enabled) => handleInputChange('ai_button_enabled', enabled)}
                  onGrammarEnabledChange={(enabled) => handleInputChange('fix_grammar_enabled', enabled)}
                  initialData={{
                    ai_button_enabled: formData.ai_button_enabled,
                    fix_grammar_enabled: formData.fix_grammar_enabled
                  }}
                />
                </div>

                {/* Emoji Sentiment */}
                <div className="mb-6">
                  <EmojiSentimentFeature
                  enabled={formData.emoji_sentiment_enabled}
                  question={formData.emoji_sentiment_question}
                  feedbackMessage={formData.emoji_feedback_message}
                  thankYouMessage={formData.emoji_thank_you_message}
                  feedbackPopupHeader={formData.emoji_feedback_popup_header}
                  feedbackPageHeader={formData.emoji_feedback_page_header}
                  editMode={true}
                  onEnabledChange={(enabled) => handleInputChange('emoji_sentiment_enabled', enabled)}
                  onQuestionChange={(question) => handleInputChange('emoji_sentiment_question', question)}
                  onFeedbackMessageChange={(message) => handleInputChange('emoji_feedback_message', message)}
                  onThankYouMessageChange={(message) => handleInputChange('emoji_thank_you_message', message)}
                  onFeedbackPopupHeaderChange={(header) => handleInputChange('emoji_feedback_popup_header', header)}
                  onFeedbackPageHeaderChange={(header) => handleInputChange('emoji_feedback_page_header', header)}
                  initialData={{
                    emoji_sentiment_enabled: formData.emoji_sentiment_enabled,
                    emoji_sentiment_question: formData.emoji_sentiment_question,
                    emoji_feedback_message: formData.emoji_feedback_message,
                    emoji_thank_you_message: formData.emoji_thank_you_message,
                    emoji_feedback_popup_header: formData.emoji_feedback_popup_header,
                    emoji_feedback_page_header: formData.emoji_feedback_page_header
                  }}
                />
                </div>

                {/* Falling Stars */}
                <div className="mb-6">
                  <FallingStarsFeature
                  enabled={formData.falling_enabled}
                  icon={formData.falling_icon}
                  color={formData.falling_icon_color}
                  editMode={true}
                  onEnabledChange={(enabled) => handleInputChange('falling_enabled', enabled)}
                  onIconChange={(icon) => handleInputChange('falling_icon', icon)}
                  onColorChange={(color) => handleInputChange('falling_icon_color', color)}
                  initialData={{
                    falling_enabled: formData.falling_enabled,
                    falling_icon: formData.falling_icon,
                    falling_icon_color: formData.falling_icon_color
                  }}
                />
                </div>

                {/* Friendly Note */}
                <div className="mb-6">
                  <PersonalizedNoteFeature
                  enabled={formData.show_friendly_note}
                  note={formData.friendly_note}
                  emojiSentimentEnabled={formData.emoji_sentiment_enabled}
                  editMode={true}
                  onEnabledChange={(enabled) => handleInputChange('show_friendly_note', enabled)}
                  onNoteChange={(note) => handleInputChange('friendly_note', note)}
                  initialData={{
                    show_friendly_note: formData.show_friendly_note,
                    friendly_note: formData.friendly_note
                  }}
                />
                </div>

                {/* Recent Reviews */}
                <div className="mb-6">
                  <RecentReviewsFeature
                  enabled={formData.recent_reviews_enabled}
                  scope={formData.recent_reviews_scope}
                  editMode={true}
                  onEnabledChange={(enabled) => handleInputChange('recent_reviews_enabled', enabled)}
                  onScopeChange={(scope) => handleInputChange('recent_reviews_scope', scope)}
                  initialData={{
                    recent_reviews_enabled: formData.recent_reviews_enabled,
                    recent_reviews_scope: formData.recent_reviews_scope
                  }}
                />
                </div>

                {/* Kickstarters */}
                <div className="mb-6">
                  <KickstartersFeature
                  enabled={formData.kickstarters_enabled}
                  selectedKickstarters={formData.selected_kickstarters}
                  customKickstarters={formData.custom_kickstarters}
                  backgroundDesign={formData.kickstarters_background_design}
                  businessName={businessName}
                  editMode={true}
                  onEnabledChange={(enabled) => handleInputChange('kickstarters_enabled', enabled)}
                  onKickstartersChange={(kickstarters) => handleInputChange('selected_kickstarters', kickstarters)}
                  onCustomKickstartersChange={(custom) => handleInputChange('custom_kickstarters', custom)}
                  onBackgroundDesignChange={(backgroundDesign) => handleInputChange('kickstarters_background_design', backgroundDesign)}
                  accountId={accountId}
                />
                </div>
              </div>

            </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 flex-shrink-0">
            {/* Success/Error Messages */}
            <div className="flex-1">
              {errors.success && (
                <div className="text-green-600 text-sm font-medium flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {errors.success}
                </div>
              )}
              {errors.general && (
                <div className="text-red-600 text-sm font-medium flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.general}
                </div>
              )}
            </div>
            
            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-6 py-2 bg-slate-blue text-white rounded-lg font-semibold hover:bg-slate-blue/90 transition text-sm flex items-center gap-2"
            >
              {isSubmitting && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              )}
              {isSubmitting ? 'Saving...' : 'Save settings'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
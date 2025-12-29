"use client";

/**
 * Prompt Page Settings Page
 *
 * Full page for managing default settings applied to NEW prompt pages.
 * Converted from modal to page to allow keyword details sidebar.
 *
 * Features:
 * - Review platforms configuration
 * - Keywords for SEO and AI with details sidebar
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
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from "@/components/Icon";
import RobotTooltip from '@/app/(app)/components/RobotTooltip';
import { markTaskAsCompleted } from '@/utils/onboardingTasks';
import { useAuthUser, useAccountData, useBusinessData } from '@/auth/hooks/granularAuthHooks';
import { apiClient } from '@/utils/apiClient';

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
} from '@/app/(app)/components/prompt-features';

export default function PromptPageSettingsPage() {
  const router = useRouter();
  const { user } = useAuthUser();
  const { accountId } = useAccountData();
  const { business: businessData, businessName } = useBusinessData();
  // Cast to any for accessing additional business settings fields
  const business = businessData as any;
  const [businessLoading, setBusinessLoading] = useState(true);

  // Track when business data is loaded
  useEffect(() => {
    if (businessData !== undefined) {
      setBusinessLoading(false);
    }
  }, [businessData]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Form state for all settings
  const [formData, setFormData] = useState({
    // Review Platforms
    review_platforms: [] as any[],

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
    recent_reviews_scope: 'current_page' as 'current_page' | 'all_pages',

    // Kickstarters
    kickstarters_enabled: true,
    selected_kickstarters: [] as string[],
    custom_kickstarters: [] as any[],
    kickstarters_background_design: false,
  });

  // Load business data into form
  useEffect(() => {
    if (business && !isLoaded) {
      setFormData({
        review_platforms: business.review_platforms || [],
        ai_dos: business.ai_dos || '',
        ai_donts: business.ai_donts || '',
        default_offer_enabled: business.default_offer_enabled || false,
        default_offer_title: business.default_offer_title || 'Special Offer',
        default_offer_body: business.default_offer_body || '',
        default_offer_url: business.default_offer_url || '',
        default_offer_timelock: business.default_offer_timelock || false,
        ai_button_enabled: business.ai_button_enabled || false,
        fix_grammar_enabled: business.fix_grammar_enabled || false,
        emoji_sentiment_enabled: business.emoji_sentiment_enabled || false,
        emoji_sentiment_question: business.emoji_sentiment_question || 'How was your experience?',
        emoji_feedback_message: business.emoji_feedback_message || 'Please tell us more about your experience',
        emoji_thank_you_message: business.emoji_thank_you_message || 'Thank you for your feedback!',
        emoji_feedback_popup_header: business.emoji_feedback_popup_header || 'How can we improve?',
        emoji_feedback_page_header: business.emoji_feedback_page_header || 'Your feedback helps us grow',
        falling_enabled: business.falling_enabled !== undefined ? business.falling_enabled : true,
        falling_icon: business.falling_icon || 'star',
        falling_icon_color: business.falling_icon_color || '#FFD700',
        show_friendly_note: business.show_friendly_note || false,
        friendly_note: business.friendly_note || '',
        recent_reviews_enabled: business.recent_reviews_enabled || false,
        recent_reviews_scope: business.recent_reviews_scope || 'current_page',
        kickstarters_enabled: business.kickstarters_enabled !== undefined ? business.kickstarters_enabled : true,
        selected_kickstarters: business.selected_kickstarters || [],
        custom_kickstarters: business.custom_kickstarters || [],
        kickstarters_background_design: business.kickstarters_background_design || false,
      });
      setIsLoaded(true);
    }
  }, [business, isLoaded]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    // Clear any existing error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSave = async () => {
    if (!accountId || !business) {
      setErrors({ general: 'Business data not available' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await apiClient.put(`/businesses/${accountId}`, formData);

      // Check if task should be completed (now based on AI dos/donts only)
      if (accountId && (formData.ai_dos?.trim() || formData.ai_donts?.trim())) {
        await markTaskAsCompleted(accountId, 'prompt-page-settings');
      }

      setErrors({ success: 'Settings saved successfully!' });
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

  if (businessLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-indigo-600">
          <Icon name="FaSpinner" className="w-6 h-6 animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header with Navigation Tabs */}
      <div className="bg-white/20 backdrop-blur-md border-b border-white/30 pb-6">
        {/* Page Title */}
        <div className="px-4 sm:px-6 lg:px-8 pt-8">
          <div className="max-w-7xl mx-auto flex flex-col items-center mb-3">
            <div className="flex items-center gap-4 mb-3">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                Prompt pages
              </h1>
              {/* Style Icon */}
              <Link
                href="/prompt-pages?tab=catch-all"
                className="w-10 h-10 rounded-full bg-slate-blue/10 border border-slate-blue/30 flex items-center justify-center hover:bg-slate-blue/20 transition"
                title="Style settings"
              >
                <Icon name="FaPalette" className="w-5 h-5 text-slate-blue" size={20} />
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center w-full mt-0 mb-0 z-20 px-4">
          <div className="grid grid-cols-2 sm:flex bg-white/10 backdrop-blur-sm border border-white/30 rounded-2xl sm:rounded-full p-1 shadow-lg w-full max-w-2xl gap-1 sm:gap-0">
            <Link
              href="/prompt-pages?tab=catch-all"
              className="px-3 sm:px-6 py-2 sm:py-1.5 font-semibold text-sm focus:outline-none transition-all duration-200 rounded-xl sm:rounded-full flex items-center justify-center gap-2 sm:flex-1 bg-transparent text-white hover:bg-white/10"
            >
              <Icon name="FaUsers" className="w-5 h-5" size={20} />
              <span className="whitespace-nowrap">Catch-all</span>
            </Link>
            <Link
              href="/prompt-pages?tab=campaign"
              className="px-3 sm:px-6 py-2 sm:py-1.5 font-semibold text-sm focus:outline-none transition-all duration-200 rounded-xl sm:rounded-full flex items-center justify-center gap-2 sm:flex-1 bg-transparent text-white hover:bg-white/10"
            >
              <Icon name="FaUserCircle" className="w-5 h-5" size={20} />
              <span className="whitespace-nowrap">Campaign</span>
            </Link>
            <Link
              href="/prompt-pages?tab=locations"
              className="px-3 sm:px-6 py-2 sm:py-1.5 font-semibold text-sm focus:outline-none transition-all duration-200 rounded-xl sm:rounded-full flex items-center justify-center gap-2 sm:flex-1 bg-transparent text-white hover:bg-white/10"
            >
              <Icon name="FaMapMarker" className="w-5 h-5" size={20} />
              <span className="whitespace-nowrap">Locations</span>
            </Link>
            <span
              className="px-3 sm:px-6 py-2 sm:py-1.5 font-semibold text-sm focus:outline-none transition-all duration-200 rounded-xl sm:rounded-full flex items-center justify-center gap-2 sm:flex-1 bg-slate-blue text-white"
            >
              <Icon name="FaCog" className="w-5 h-5" size={20} />
              <span className="whitespace-nowrap">Settings</span>
            </span>
          </div>
        </div>
      </div>

      {/* Page Title Section - Glassmorphic */}
      <div className="bg-white/20 backdrop-blur-md border-b border-white/30 -mt-px">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Icon name="FaCog" className="w-8 h-8 text-slate-blue" size={32} />
                Prompt page settings
              </h2>
              <p className="text-gray-600 mt-1">
                Set global defaults for keywords, AI, review platforms, and more.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-slate-blue text-white rounded-lg font-semibold hover:bg-slate-blue/90 transition text-sm flex items-center gap-2"
            >
              {isSubmitting && (
                <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
              )}
              {isSubmitting ? 'Saving...' : 'Save settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Success/Error Messages */}
        {errors.success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <Icon name="FaCheck" className="w-5 h-5 text-green-600" />
            <span className="text-green-700">{errors.success}</span>
          </div>
        )}
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <Icon name="FaInfoCircle" className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{errors.general}</span>
          </div>
        )}

        {/* GLOBAL SETTINGS - Apply to all prompt pages immediately */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 shadow-sm">
            <h2 className="text-xl font-bold text-slate-blue mb-1">Global Settings</h2>
            <p className="text-sm text-gray-600 mb-6">These settings apply immediately to all prompt pages.</p>

            {/* Keyword Concepts Link */}
            <section className="mb-6">
              <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div>
                  <h3 className="text-lg font-semibold text-slate-blue flex items-center gap-2">
                    <Icon name="FaKey" className="w-5 h-5" />
                    Keyword Concepts
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage your suggested phrases and keywords in &quot;Keyword Concepts.&quot; Note: You can also add and manage keyword phrases on individual Prompt Pages.
                  </p>
                </div>
                <Link
                  href="/dashboard/keywords"
                  className="px-4 py-2 bg-slate-blue text-white rounded-lg font-medium hover:bg-slate-blue/90 transition flex items-center gap-2"
                >
                  Go
                  <Icon name="FaArrowRight" className="w-4 h-4" />
                </Link>
              </div>
            </section>

            {/* AI Dos and Don'ts Section */}
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-slate-blue mb-4 flex items-center">
                AI Guidelines
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

        {/* DEFAULT SETTINGS - Only for new prompt pages */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 shadow-sm">
          <h2 className="text-xl font-bold text-slate-blue mb-4">Default Settings</h2>

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
              businessName={business?.name || businessName}
              editMode={true}
              onEnabledChange={(enabled) => handleInputChange('kickstarters_enabled', enabled)}
              onKickstartersChange={(kickstarters) => handleInputChange('selected_kickstarters', kickstarters)}
              onCustomKickstartersChange={(custom) => handleInputChange('custom_kickstarters', custom)}
              onBackgroundDesignChange={(backgroundDesign) => handleInputChange('kickstarters_background_design', backgroundDesign)}
              accountId={accountId || ''}
            />
          </div>

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-8 py-3 bg-slate-blue text-white rounded-lg font-semibold hover:bg-slate-blue/90 transition flex items-center gap-2"
            >
              {isSubmitting && (
                <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
              )}
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

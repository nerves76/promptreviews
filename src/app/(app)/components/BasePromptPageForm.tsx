/**
 * BasePromptPageForm Component
 * 
 * A base form component that provides common state management and composition pattern
 * for all prompt page types. This component handles shared features and delegates
 * type-specific fields to child components.
 * 
 * Features:
 * - Common state management for all shared features
 * - Shared validation logic
 * - Unified save/publish handlers
 * - Feature composition pattern
 * - TypeScript interfaces for all props
 */

"use client";
import React, { useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  PersonalizedNoteFeature,
  EmojiSentimentFeature,
  FallingStarsFeature,
  AISettingsFeature,
  OfferFeature,
  ReviewPlatformsFeature,
  KickstartersFeature,
  type PersonalizedNoteFeatureProps,
  type EmojiSentimentFeatureProps,
  type FallingStarsFeatureProps,
  type AISettingsFeatureProps,
  type OfferFeatureProps,
  type ReviewPlatformsFeatureProps,
  type KickstartersFeatureProps,
  type ReviewPlatform,
  type Kickstarter,
} from "./prompt-features";

export interface BasePromptPageFormProps {
  /** The mode of the form (create or edit) */
  mode: "create" | "edit";
  /** Initial data for the form */
  initialData: any;
  /** Callback when form is saved */
  onSave: (data: any) => void;
  /** Callback when form is published */
  onPublish?: (data: any) => void;
  /** The title of the page */
  pageTitle: string;
  /** Supabase client instance */
  supabase: any;
  /** Business profile data */
  businessProfile: any;
  /** Whether this is a universal page */
  isUniversal?: boolean;
  /** Callback when publish is successful */
  onPublishSuccess?: (slug: string) => void;
  /** The type of campaign */
  campaignType: string;
  /** Callback for AI review generation */
  onGenerateReview?: (index: number) => void;
  /** Type-specific fields to render */
  children?: ReactNode;
  /** Whether to show all features or only specific ones */
  enabledFeatures?: {
    personalizedNote?: boolean;
    emojiSentiment?: boolean;
    fallingStars?: boolean;
    aiSettings?: boolean;
    offer?: boolean;
    reviewPlatforms?: boolean;
    kickstarters?: boolean;
  };
  /** Whether the form is disabled */
  disabled?: boolean;
}

export interface BaseFormState {
  // Personalized Note
  show_friendly_note: boolean;
  friendly_note: string;
  
  // Emoji Sentiment
  emoji_sentiment_enabled: boolean;
  emoji_sentiment_question: string;
  emoji_feedback_message: string;
  emoji_thank_you_message: string;
  emoji_feedback_popup_header: string;
  emoji_feedback_page_header: string;
  
  // Falling Stars
  falling_enabled: boolean;
  falling_icon: string;
  falling_icon_color: string;
  
  // AI Settings
  ai_button_enabled: boolean;
  fix_grammar_enabled: boolean;
  
  // Offer
  offer_enabled: boolean;
  offer_title: string;
  offer_body: string;
  offer_url: string;
  
  // Review Platforms
  review_platforms: ReviewPlatform[];
  
  // Kickstarters
  kickstarters_enabled: boolean;
  selected_kickstarters: string[];
  
  // Common fields
  slug?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function BasePromptPageForm({
  mode,
  initialData,
  onSave,
  onPublish,
  pageTitle,
  supabase,
  businessProfile,
  isUniversal = false,
  onPublishSuccess,
  campaignType,
  onGenerateReview,
  children,
  enabledFeatures = {
    personalizedNote: true,
    emojiSentiment: true,
    fallingStars: true,
    aiSettings: true,
    offer: true,
    reviewPlatforms: true,
    kickstarters: true,
  },
  disabled = false,
}: BasePromptPageFormProps) {
  const router = useRouter();
  
  // Generate a unique key for this form instance to persist data
  const formStorageKey = `promptPageForm_${campaignType || 'unknown'}_${initialData?.id || 'new'}`;
  
  // Initialize form state with defaults, checking localStorage first
  const [formData, setFormData] = useState<BaseFormState>(() => {
    // Try to restore from localStorage if available
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(formStorageKey);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          console.log('📝 Restored form data from localStorage');
          return parsed;
        } catch (e) {
          console.error('Failed to parse saved form data:', e);
        }
      }
    }
    
    // Fall back to initial data
    return {
    // Personalized Note
    show_friendly_note: initialData?.show_friendly_note ?? false,
    friendly_note: initialData?.friendly_note ?? "",
    
    // Emoji Sentiment
    emoji_sentiment_enabled: initialData?.emoji_sentiment_enabled ?? false,
    emoji_sentiment_question: initialData?.emoji_sentiment_question ?? "How was your experience?",
    emoji_feedback_message: initialData?.emoji_feedback_message ?? "How can we improve?",
    emoji_thank_you_message: initialData?.emoji_thank_you_message ?? "Thank you for your feedback!",
    emoji_feedback_popup_header: initialData?.emoji_feedback_popup_header ?? "",
    emoji_feedback_page_header: initialData?.emoji_feedback_page_header ?? "",
    
    // Falling Stars
    falling_enabled: initialData?.falling_enabled ?? true,
    falling_icon: initialData?.falling_icon ?? "star",
    falling_icon_color: initialData?.falling_icon_color ?? "#fbbf24",
    
    // AI Settings
    ai_button_enabled: initialData?.ai_button_enabled ?? true,
    fix_grammar_enabled: initialData?.fix_grammar_enabled ?? true,
    
    // Offer
    offer_enabled: initialData?.offer_enabled ?? false,
    offer_title: initialData?.offer_title ?? "",
    offer_body: initialData?.offer_body ?? "",
    offer_url: initialData?.offer_url ?? "",
    
    // Review Platforms
    review_platforms: initialData?.review_platforms ?? [],
    
    // Kickstarters
    kickstarters_enabled: initialData?.kickstarters_enabled ?? false,
    selected_kickstarters: initialData?.selected_kickstarters ?? [],
    
    // Common fields
    slug: initialData?.slug,
    is_active: initialData?.is_active ?? true,
    created_at: initialData?.created_at,
    updated_at: initialData?.updated_at,
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showPopupConflictModal, setShowPopupConflictModal] = useState<string | null>(null);
  
  // Local state for kickstarters background design to provide immediate UI feedback
  const [localBackgroundDesign, setLocalBackgroundDesign] = useState<boolean>(
    businessProfile?.kickstarters_background_design ?? false
  );

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  // Update local background design when businessProfile changes
  useEffect(() => {
    setLocalBackgroundDesign(businessProfile?.kickstarters_background_design ?? false);
  }, [businessProfile?.kickstarters_background_design]);
  
  // Auto-save form data to localStorage
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (typeof window !== 'undefined' && formData) {
        localStorage.setItem(formStorageKey, JSON.stringify(formData));
        console.log('💾 Auto-saved form data to localStorage');
      }
    }, 1000); // Debounce for 1 second
    
    return () => clearTimeout(saveTimeout);
  }, [formData, formStorageKey]);

  // Generic update function
  const updateFormData = (field: keyof BaseFormState, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Validation function
  const validateForm = (): string[] => {
    const newErrors: string[] = [];
    
    // Add type-specific validation here
    // This will be extended by child components
    
    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    setErrors([]);

    try {
      if (onPublish) {
        await onPublish(formData);
      } else {
        await onSave(formData);
      }
      
      // Clear saved form data after successful submission
      if (typeof window !== 'undefined') {
        localStorage.removeItem(formStorageKey);
        console.log('🗑️ Cleared saved form data after successful submission');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors(['An error occurred while saving. Please try again.']);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle personalized note changes with conflict checking
  const handlePersonalizedNoteChange = (enabled: boolean, note: string) => {
    // Check for conflicts when enabling friendly note
    if (enabled && formData.emoji_sentiment_enabled) {
      setShowPopupConflictModal("emoji");
      return;
    }
    updateFormData('show_friendly_note', enabled);
    updateFormData('friendly_note', note);
  };

  // Handle emoji sentiment changes with conflict checking
  const handleEmojiSentimentChange = (
    enabled: boolean,
    question: string,
    feedbackMessage: string,
    thankYouMessage: string,
    popupHeader?: string,
    pageHeader?: string
  ) => {
    // Check for conflicts when enabling emoji sentiment
    if (enabled && formData.show_friendly_note) {
      setShowPopupConflictModal("note");
      return;
    }
    updateFormData('emoji_sentiment_enabled', enabled);
    updateFormData('emoji_sentiment_question', question);
    updateFormData('emoji_feedback_message', feedbackMessage);
    updateFormData('emoji_thank_you_message', thankYouMessage);
    if (popupHeader !== undefined) updateFormData('emoji_feedback_popup_header', popupHeader);
    if (pageHeader !== undefined) updateFormData('emoji_feedback_page_header', pageHeader);
  };

  // Handle falling stars changes
  const handleFallingStarsChange = (enabled: boolean, icon: string, color: string) => {
    updateFormData('falling_enabled', enabled);
    updateFormData('falling_icon', icon);
    updateFormData('falling_icon_color', color);
  };



  // Handle AI settings changes
  const handleAISettingsChange = (aiEnabled: boolean, grammarEnabled: boolean) => {
    updateFormData('ai_button_enabled', aiEnabled);
    updateFormData('fix_grammar_enabled', grammarEnabled);
  };

  // Handle offer changes
  const handleOfferChange = (enabled: boolean, title: string, body: string, url: string) => {
    updateFormData('offer_enabled', enabled);
    updateFormData('offer_title', title);
    updateFormData('offer_body', body);
    updateFormData('offer_url', url);
  };

  // Handle review platforms changes
  const handleReviewPlatformsChange = (platforms: ReviewPlatform[]) => {
    updateFormData('review_platforms', platforms);
  };

  // Handle kickstarters changes
  const handleKickstartersChange = (enabled: boolean, selectedKickstarters: string[]) => {
    updateFormData('kickstarters_enabled', enabled);
    updateFormData('selected_kickstarters', selectedKickstarters);
  };

  // Handle kickstarters background design changes (updates global business setting)
  const handleKickstartersBackgroundDesignChange = async (backgroundDesign: boolean) => {
    // Update local state immediately for UI feedback
    setLocalBackgroundDesign(backgroundDesign);
    
    try {
      // Update the global business setting
      const { error } = await supabase
        .from('businesses')
        .update({ kickstarters_background_design: backgroundDesign })
        .eq('account_id', businessProfile?.account_id);

      if (error) {
        console.error('Error updating kickstarters background design:', error);
        // Revert local state if database update failed
        setLocalBackgroundDesign(businessProfile?.kickstarters_background_design ?? false);
      } else {
  
        // Update the business profile object for immediate sync with live page
        if (businessProfile) {
          businessProfile.kickstarters_background_design = backgroundDesign;
        }
      }
    } catch (error) {
      console.error('Error updating kickstarters background design:', error);
      // Revert local state if database update failed
      setLocalBackgroundDesign(businessProfile?.kickstarters_background_design ?? false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type-specific fields */}
      {children}

      {/* Shared Features */}
      {enabledFeatures.kickstarters && (
        <KickstartersFeature
          enabled={formData.kickstarters_enabled}
          selectedKickstarters={formData.selected_kickstarters}
          backgroundDesign={localBackgroundDesign}
          businessName={businessProfile?.name || businessProfile?.business_name || "Business Name"}
          onEnabledChange={(enabled) => handleKickstartersChange(enabled, formData.selected_kickstarters)}
          onKickstartersChange={(kickstarters) => handleKickstartersChange(formData.kickstarters_enabled, kickstarters)}
          onBackgroundDesignChange={handleKickstartersBackgroundDesignChange}
          initialData={{
            kickstarters_enabled: initialData?.kickstarters_enabled,
            selected_kickstarters: initialData?.selected_kickstarters,
            kickstarters_background_design: localBackgroundDesign,
          }}
          disabled={disabled}

          businessProfile={{
            primary_color: businessProfile?.primary_color,
            card_bg: businessProfile?.card_bg,
            card_text: businessProfile?.card_text,
            card_transparency: businessProfile?.card_transparency,
            background_type: businessProfile?.background_type,
            gradient_start: businessProfile?.gradient_start,
            gradient_end: businessProfile?.gradient_end,
            background_color: businessProfile?.background_color,
          }}
        />
      )}

      {enabledFeatures.personalizedNote && (
        <PersonalizedNoteFeature
          enabled={formData.show_friendly_note}
          note={formData.friendly_note}
          emojiSentimentEnabled={formData.emoji_sentiment_enabled}
          onEnabledChange={(enabled) => handlePersonalizedNoteChange(enabled, formData.friendly_note)}
          onNoteChange={(note) => handlePersonalizedNoteChange(formData.show_friendly_note, note)}
          initialData={{
            show_friendly_note: initialData?.show_friendly_note,
            friendly_note: initialData?.friendly_note,
          }}
          disabled={disabled}
          editMode={true}
        />
      )}

      {enabledFeatures.emojiSentiment && (
        <EmojiSentimentFeature
          enabled={formData.emoji_sentiment_enabled}
          question={formData.emoji_sentiment_question}
          feedbackMessage={formData.emoji_feedback_message}
          thankYouMessage={formData.emoji_thank_you_message}
          feedbackPopupHeader={formData.emoji_feedback_popup_header}
          feedbackPageHeader={formData.emoji_feedback_page_header}
          personalizedNoteEnabled={formData.show_friendly_note}
          onEnabledChange={(enabled) => handleEmojiSentimentChange(
            enabled,
            formData.emoji_sentiment_question,
            formData.emoji_feedback_message,
            formData.emoji_thank_you_message,
            formData.emoji_feedback_popup_header,
            formData.emoji_feedback_page_header
          )}
          onQuestionChange={(question) => handleEmojiSentimentChange(
            formData.emoji_sentiment_enabled,
            question,
            formData.emoji_feedback_message,
            formData.emoji_thank_you_message,
            formData.emoji_feedback_popup_header,
            formData.emoji_feedback_page_header
          )}
          onFeedbackMessageChange={(message) => handleEmojiSentimentChange(
            formData.emoji_sentiment_enabled,
            formData.emoji_sentiment_question,
            message,
            formData.emoji_thank_you_message,
            formData.emoji_feedback_popup_header,
            formData.emoji_feedback_page_header
          )}
          onThankYouMessageChange={(message) => handleEmojiSentimentChange(
            formData.emoji_sentiment_enabled,
            formData.emoji_sentiment_question,
            formData.emoji_feedback_message,
            message,
            formData.emoji_feedback_popup_header,
            formData.emoji_feedback_page_header
          )}
          onFeedbackPopupHeaderChange={(header) => handleEmojiSentimentChange(
            formData.emoji_sentiment_enabled,
            formData.emoji_sentiment_question,
            formData.emoji_feedback_message,
            formData.emoji_thank_you_message,
            header,
            formData.emoji_feedback_page_header
          )}
          onFeedbackPageHeaderChange={(header) => handleEmojiSentimentChange(
            formData.emoji_sentiment_enabled,
            formData.emoji_sentiment_question,
            formData.emoji_feedback_message,
            formData.emoji_thank_you_message,
            formData.emoji_feedback_popup_header,
            header
          )}
          initialData={{
            emoji_sentiment_enabled: initialData?.emoji_sentiment_enabled,
            emoji_sentiment_question: initialData?.emoji_sentiment_question,
            emoji_feedback_message: initialData?.emoji_feedback_message,
            emoji_thank_you_message: initialData?.emoji_thank_you_message,
            emoji_feedback_popup_header: initialData?.emoji_feedback_popup_header,
            emoji_feedback_page_header: initialData?.emoji_feedback_page_header,
          }}
          disabled={disabled}
          editMode={true}
        />
      )}

      {enabledFeatures.fallingStars && (
        <FallingStarsFeature
          enabled={formData.falling_enabled}
          icon={formData.falling_icon}
          color={formData.falling_icon_color}
          onEnabledChange={(enabled) => handleFallingStarsChange(enabled, formData.falling_icon, formData.falling_icon_color)}
          onIconChange={(icon) => handleFallingStarsChange(formData.falling_enabled, icon, formData.falling_icon_color)}
          onColorChange={(color) => handleFallingStarsChange(formData.falling_enabled, formData.falling_icon, color)}
          initialData={{
            falling_enabled: initialData?.falling_enabled,
            falling_icon: initialData?.falling_icon,
            falling_icon_color: initialData?.falling_icon_color,
          }}
          disabled={disabled}
          editMode={true}
        />
      )}

      {enabledFeatures.aiSettings && (
        <AISettingsFeature
          aiGenerationEnabled={formData.ai_button_enabled}
          fixGrammarEnabled={formData.fix_grammar_enabled}
          onAIEnabledChange={(enabled) => handleAISettingsChange(enabled, formData.fix_grammar_enabled)}
          onGrammarEnabledChange={(enabled) => handleAISettingsChange(formData.ai_button_enabled, enabled)}
          initialData={{
            ai_button_enabled: initialData?.ai_button_enabled,
            fix_grammar_enabled: initialData?.fix_grammar_enabled,
          }}
          disabled={disabled}
        />
      )}

      {enabledFeatures.offer && (
        <OfferFeature
          enabled={formData.offer_enabled}
          title={formData.offer_title}
          description={formData.offer_body}
          url={formData.offer_url}
          onEnabledChange={(enabled) => handleOfferChange(enabled, formData.offer_title, formData.offer_body, formData.offer_url)}
          onTitleChange={(title) => handleOfferChange(formData.offer_enabled, title, formData.offer_body, formData.offer_url)}
          onDescriptionChange={(body) => handleOfferChange(formData.offer_enabled, formData.offer_title, body, formData.offer_url)}
          onUrlChange={(url) => handleOfferChange(formData.offer_enabled, formData.offer_title, formData.offer_body, url)}
          initialData={{
            offer_enabled: initialData?.offer_enabled,
            offer_title: initialData?.offer_title,
            offer_body: initialData?.offer_body,
            offer_url: initialData?.offer_url,
          }}
          disabled={disabled}
        />
      )}

      {enabledFeatures.reviewPlatforms && (
        <ReviewPlatformsFeature
          platforms={formData.review_platforms}
          onPlatformsChange={handleReviewPlatformsChange}
          onGenerateReview={onGenerateReview}
          initialData={{
            review_platforms: initialData?.review_platforms,
          }}
          disabled={disabled}
        />
      )}

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                There were errors with your submission
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-between pt-8 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.push('/prompt-pages')}
          className="inline-flex justify-center rounded-md border border-gray-300 py-2 px-4 text-sm font-medium text-gray-700 bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
          disabled={disabled}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSaving || disabled}
        >
          {isSaving ? "Saving..." : "Save & publish"}
        </button>
      </div>

      {/* Popup Conflict Modal */}
      {showPopupConflictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
              onClick={() => setShowPopupConflictModal(null)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold text-red-700 mb-4">
              Cannot Enable Multiple Popups
            </h2>
            <p className="mb-6 text-gray-700">
              You cannot have 2 popups enabled at the same time. You must disable{" "}
              <strong>
                {showPopupConflictModal === "note" 
                  ? "Emoji Sentiment Flow" 
                  : "Friendly Note Pop-up"}
              </strong>{" "}
              first.
            </p>
            <button
              onClick={() => setShowPopupConflictModal(null)}
              className="bg-slate-blue text-white px-6 py-2 rounded hover:bg-slate-blue/90 font-semibold mt-2"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </form>
  );
} 
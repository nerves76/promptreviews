/**
 * ServicePromptPageForm component
 * 
 * Handles the service-specific prompt page form with all its sections:
 * - Customer details (for individual campaigns)
 * - Campaign name (for public campaigns)
 * - Services provided
 * - Outcomes
 * - Review platforms
 * - Additional settings (offers, notes, emoji sentiment, etc.)
 */

"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CustomerDetailsSection from "./sections/CustomerDetailsSection";
import ReviewWriteSection from "../dashboard/edit-prompt-page/components/ReviewWriteSection";
import {
  OfferFeature,
  EmojiSentimentFeature,
  FallingStarsFeature,
  AISettingsFeature,
  KickstartersFeature,
  RecentReviewsFeature,
  KeywordInspirationFeature
} from "./prompt-features";
import { useFallingStars } from "@/hooks/useFallingStars";
import { Input } from "@/app/(app)/components/ui/input";
import { Textarea } from "@/app/(app)/components/ui/textarea";
import SectionHeader from "./SectionHeader";
import { TopNavigation, BottomNavigation } from "./sections/StepNavigation";
import { generateContextualReview } from "@/utils/aiReviewGeneration";
import Icon from "@/components/Icon";
import { getWordLimitOrDefault } from "@/constants/promptPageWordLimits";
import FiveStarSpinner from "./FiveStarSpinner";
import KeywordsInput from "./KeywordsInput";

/**
 * ServicePromptPageForm component
 *
 * Purpose: Handles the creation and editing of service-specific prompt pages.
 * This component is extracted from the main PromptPageForm to improve maintainability
 * and reduce complexity. It includes service-specific fields like services provided
 * and outcomes, while sharing common sections with other form types.
 */

interface ServicePromptPageFormProps {
  mode: "create" | "edit";
  initialData: any;
  onSave: (data: any) => void;
  onPublish?: (data: any) => void;
  pageTitle: string;
  supabase: any;
  businessProfile: any;
  isUniversal?: boolean;
  onPublishSuccess?: (slug: string) => void;
  campaignType?: string;
  onGenerateReview?: (index: number) => void;
}

export default function ServicePromptPageForm({
  mode,
  initialData,
  onSave,
  onPublish,
  pageTitle,
  supabase,
  businessProfile,
  isUniversal = false,
  onPublishSuccess,
  campaignType = 'individual',
  onGenerateReview,
}: ServicePromptPageFormProps) {
  const router = useRouter();
  
  // Initialize all state hooks first (before any early returns)
  const [formData, setFormData] = useState(() => {
    // Initialize keywords with business keywords if this is a new prompt page
    let initialKeywords: string[] = [];
    if (Array.isArray(initialData?.keywords) && initialData.keywords.length > 0) {
      // Editing existing page - use saved keywords
      initialKeywords = initialData.keywords;
    } else if (mode === "create" && Array.isArray(businessProfile?.keywords)) {
      // Creating new page - pre-populate with business keywords
      initialKeywords = businessProfile.keywords;
    }

    return {
      first_name: initialData?.first_name || "",
      last_name: initialData?.last_name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      role: initialData?.role || "",
      review_platforms: initialData?.review_platforms || [],
      friendly_note: initialData?.friendly_note || "",
      show_friendly_note: initialData?.show_friendly_note ?? false,
      emoji_sentiment_enabled: initialData?.emoji_sentiment_enabled ?? false,
      emoji_sentiment_question: initialData?.emoji_sentiment_question || "",
      emoji_feedback_message: initialData?.emoji_feedback_message || "",
      emoji_thank_you_message: initialData?.emoji_thank_you_message || "",
      emoji_feedback_popup_header: initialData?.emoji_feedback_popup_header || "",
      emoji_feedback_page_header: initialData?.emoji_feedback_page_header || "",
      name: initialData?.name || "",
      features_or_benefits: initialData?.features_or_benefits || [""],
      services_offered: initialData?.services_offered || [""],
      outcomes: initialData?.outcomes || [""],
      offer_enabled: initialData?.offer_enabled ?? false,
      offer_title: initialData?.offer_title || "",
      offer_body: initialData?.offer_body || "",
      offer_url: initialData?.offer_url || "",
      // Handle both snake_case and camelCase for offer_timelock
      offer_timelock: initialData?.offer_timelock ?? initialData?.offerTimelock ?? false,
      aiButtonEnabled: initialData?.aiButtonEnabled ?? true,
      falling_enabled: initialData?.falling_enabled ?? true,
      falling_icon: initialData?.falling_icon || "star",
      falling_icon_color: initialData?.falling_icon_color || "#fbbf24",
      kickstarters_enabled: initialData?.kickstarters_enabled ?? false,
      selected_kickstarters: Array.isArray(initialData?.selected_kickstarters) ? initialData.selected_kickstarters : [],
      recent_reviews_enabled: initialData?.recent_reviews_enabled ?? false,
      // Handle both snake_case and camelCase for recent_reviews_scope
      recent_reviews_scope: initialData?.recent_reviews_scope || initialData?.recentReviewsScope || "current_page",
      keyword_inspiration_enabled: initialData?.keyword_inspiration_enabled ?? businessProfile?.default_keyword_inspiration_enabled ?? false,
      selected_keyword_inspirations: Array.isArray(initialData?.selected_keyword_inspirations)
        ? initialData.selected_keyword_inspirations
        : (Array.isArray(businessProfile?.default_selected_keyword_inspirations) ? businessProfile.default_selected_keyword_inspirations : []),
      slug: initialData?.slug || "",
      service_name: initialData?.service_name || "",
      product_description: initialData?.product_description || "",
      client_name: initialData?.client_name || "",
      location: initialData?.location || "",
      keywords: initialKeywords,
      date_completed: initialData?.date_completed || "",
      team_member: initialData?.team_member || "",
      assigned_team_members: initialData?.assigned_team_members || [],
    };
  });
  
  const [fixGrammarEnabled, setFixGrammarEnabled] = useState(initialData?.fix_grammar_enabled ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [emojiSentimentEnabled, setEmojiSentimentEnabled] = useState(
    initialData?.emoji_sentiment_enabled ?? false
  );
  const [emojiSentimentQuestion, setEmojiSentimentQuestion] = useState(
    initialData?.emoji_sentiment_question || "How was your experience?"
  );
  const [emojiFeedbackMessage, setEmojiFeedbackMessage] = useState(
    initialData?.emoji_feedback_message || "We value your feedback! Let us know how we can do better."
  );
  const [emojiFeedbackPopupHeader, setEmojiFeedbackPopupHeader] = useState(
    initialData?.emoji_feedback_popup_header || "How can we improve?"
  );
  const [emojiFeedbackPageHeader, setEmojiFeedbackPageHeader] = useState(
    initialData?.emoji_feedback_page_header || "Please share your feedback"
  );
  const [emojiThankYouMessage, setEmojiThankYouMessage] = useState(
    initialData?.emoji_thank_you_message || "Thank you for your feedback! We appreciate you taking the time to help us improve."
  );
  const [showPopupConflictModal, setShowPopupConflictModal] = useState<string | null>(null);
  const [conflictAcknowledged, setConflictAcknowledged] = useState(false);
  const [aiGeneratingIndex, setAiGeneratingIndex] = useState<number | null>(null);
  
  // Helper function to process services from business profile
  const processBusinessServices = (services: any): string[] => {
    if (!services) return [""];
    
    if (Array.isArray(services)) {
      const filtered = services.filter(Boolean);
      return filtered.length > 0 ? filtered : [""];
    }
    
    if (typeof services === "string") {
      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(services);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(Boolean);
          return filtered.length > 0 ? filtered : [""];
        }
      } catch {
        // If not JSON, split by newlines or commas
        const splitServices = services.split(/[\n,]/).map((s: string) => s.trim()).filter(Boolean);
        return splitServices.length > 0 ? splitServices : [""];
      }
    }
    
    return [""];
  };

  // Update form data helper (no auto-save)
  const updateFormData = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Synchronize emoji sentiment state with form data
  useEffect(() => {
    if (formData.emoji_sentiment_enabled !== undefined && formData.emoji_sentiment_enabled !== emojiSentimentEnabled) {
      setEmojiSentimentEnabled(formData.emoji_sentiment_enabled);
    }
  }, [formData.emoji_sentiment_enabled, emojiSentimentEnabled]);

  // Check for conflicts on initial load
  useEffect(() => {
    // Check if both features are enabled on initial load
    if (formData.show_friendly_note && emojiSentimentEnabled && !conflictAcknowledged) {
      // Show conflict modal immediately - disable emoji sentiment first
      setShowPopupConflictModal("emoji");
    }
  }, [formData.show_friendly_note, emojiSentimentEnabled, conflictAcknowledged]);

  // Pre-populate services from business profile when available
  useEffect(() => {
    if (mode === "create" && businessProfile?.services_offered && 
        (!formData.features_or_benefits || formData.features_or_benefits.length === 0 || 
         (formData.features_or_benefits.length === 1 && formData.features_or_benefits[0] === ""))) {
      const processedServices = processBusinessServices(businessProfile.services_offered);
      if (processedServices.length > 0 && processedServices[0] !== "") {
        updateFormData('features_or_benefits', processedServices);
        updateFormData('services_offered', processedServices);
      }
    }
  }, [businessProfile?.services_offered, mode]);

  // Update form data when initialData changes (for inheritance)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData((prev: any) => {
        // Only update if formData is empty or if we're dealing with a different record
        if (!prev || Object.keys(prev).length === 0 || prev.id !== initialData.id) {
          const newData = { ...prev, ...initialData };
          return newData;
        }
        // Don't overwrite existing form data
        return prev;
      });
      // Also update fixGrammarEnabled if it's in initialData
      if (initialData.fix_grammar_enabled !== undefined) {
        setFixGrammarEnabled(initialData.fix_grammar_enabled);
      }
      // Update emoji sentiment state if in initialData
      if (initialData.emoji_sentiment_enabled !== undefined) {
        setEmojiSentimentEnabled(initialData.emoji_sentiment_enabled);
      }
      if (initialData.emoji_sentiment_question !== undefined) {
        setEmojiSentimentQuestion(initialData.emoji_sentiment_question);
      }
      if (initialData.emoji_feedback_message !== undefined) {
        setEmojiFeedbackMessage(initialData.emoji_feedback_message);
      }
      if (initialData.emoji_feedback_popup_header !== undefined) {
        setEmojiFeedbackPopupHeader(initialData.emoji_feedback_popup_header);
      }
      if (initialData.emoji_feedback_page_header !== undefined) {
        setEmojiFeedbackPageHeader(initialData.emoji_feedback_page_header);
      }
      if (initialData.emoji_thank_you_message !== undefined) {
        setEmojiThankYouMessage(initialData.emoji_thank_you_message);
      }
    }
  }, [initialData?.id]); // Only depend on initialData.id, not the whole object

  // Add safety check for required props
  if (!supabase) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Error: Database connection not available</p>
        </div>
      </div>
    );
  }

  if (!businessProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FiveStarSpinner size={24} />
          <p className="mt-4 text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null); // Clear any previous errors
    
    try {
      // Validate personalized note if enabled
      if (formData.show_friendly_note && (!formData.friendly_note || formData.friendly_note.trim() === '')) {
        setFormError('Please enter a personalized note when the feature is enabled.');
        setIsSaving(false);
        return;
      }
      
      // Validate emoji sentiment fields if enabled
      if (emojiSentimentEnabled) {
        const requiredFields = [
          { field: 'emojiSentimentQuestion', name: 'Popup header', value: emojiSentimentQuestion },
          { field: 'emojiFeedbackPopupHeader', name: 'Feedback header in popup', value: emojiFeedbackPopupHeader },
          { field: 'emojiFeedbackPageHeader', name: 'Feedback page header', value: emojiFeedbackPageHeader },
          { field: 'emojiFeedbackMessage', name: 'Feedback prompt message', value: emojiFeedbackMessage },
          { field: 'emojiThankYouMessage', name: 'Thank you message', value: emojiThankYouMessage },
        ];
        
        const emptyFields = requiredFields.filter(({ value }) => {
          return !value || value.trim() === '';
        });
        
        if (emptyFields.length > 0) {
          const fieldNames = emptyFields.map(f => f.name).join(', ');
          setFormError(`Please fill in the following emoji sentiment fields: ${fieldNames}`);
          setIsSaving(false);
          return;
        }
      }
      
      // Use onSave to save the form data (like ProductPromptPageForm does)
      if (onSave) {
        const saveData = {
          ...formData,
          review_type: "service",
          formComplete: true,
          fix_grammar_enabled: fixGrammarEnabled,
          // Explicitly include personalized note fields
          show_friendly_note: formData.show_friendly_note,
          friendly_note: formData.friendly_note,
          // Include emoji sentiment fields with correct field names
          emoji_sentiment_enabled: emojiSentimentEnabled,
          emoji_sentiment_question: emojiSentimentQuestion,
          emoji_feedback_message: emojiFeedbackMessage,
          emoji_feedback_popup_header: emojiFeedbackPopupHeader,
          emoji_feedback_page_header: emojiFeedbackPageHeader,
          emoji_thank_you_message: emojiThankYouMessage,
          // Explicitly include kickstarters fields to ensure they're saved
          kickstarters_enabled: formData.kickstarters_enabled,
          selected_kickstarters: formData.selected_kickstarters,
          // Explicitly include keyword inspiration fields
          keyword_inspiration_enabled: formData.keyword_inspiration_enabled,
          selected_keyword_inspirations: formData.selected_keyword_inspirations,
        };



        
        const result = await onSave(saveData);
        
        // Call success callback if provided
        if (onPublishSuccess && result && typeof result === 'object' && 'slug' in result) {
          const typedResult = result as { slug: string };
          onPublishSuccess(typedResult.slug);
        }
      }
    } catch (error) {
      console.error('Error saving service prompt page:', error);
      setFormError('Failed to save prompt page. Please try again.');
    } finally {
      // Keep loading state for a moment to prevent flash
      setTimeout(() => {
        setIsSaving(false);
      }, 100);
    }
  };

  // Handle AI review generation
  const handleGenerateAIReview = async (idx: number) => {
    if (!businessProfile) {
      return;
    }
    
    const platforms = formData.review_platforms || [];
    if (!platforms[idx]) {
      return;
    }
    
    setAiGeneratingIndex(idx);
    
    try {
      const platform = platforms[idx];
      
      // Create comprehensive service page context
      const servicePageData = {
        review_type: 'service',
        service_name: formData.service_name || (formData.features_or_benefits && formData.features_or_benefits[0]) || 'service',
        services_provided: formData.features_or_benefits || [],
        project_type: formData.features_or_benefits?.join(", ") || 'service',
        product_description: formData.product_description,
        outcomes: formData.product_description,
        client_name: formData.client_name,
        location: formData.location,
        friendly_note: formData.friendly_note,
        date_completed: formData.date_completed,
        team_member: formData.team_member,
        assigned_team_members: formData.assigned_team_members,
        keywords: formData.keywords || [], // Use page-level keywords
      };
      
      const reviewerData = {
        firstName: formData.first_name || "",
        lastName: formData.last_name || "",
        role: formData.role || "",
      };
      
      const review = await generateContextualReview(
        businessProfile,
        servicePageData,
        reviewerData,
        platform.name || platform.platform || "Google Business Profile",
        getWordLimitOrDefault(platform.wordCount),
        platform.customInstructions || "",
        "customer"
      );
      
      // Update the review text for this platform
      const updatedPlatforms = [...platforms];
      updatedPlatforms[idx] = {
        ...updatedPlatforms[idx],
        reviewText: review
      };
      
      setFormData((prev: any) => ({
        ...prev,
        review_platforms: updatedPlatforms
      }));
      
    } catch (error) {
      console.error("Failed to generate AI review:", error);
    } finally {
      setAiGeneratingIndex(null);
    }
  }

  // Add safety check to prevent rendering if formData is not ready
  if (!formData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FiveStarSpinner size={24} />
          <p className="mt-4 text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <form 
      onSubmit={handleSubmit}
      className="max-w-4xl mx-auto px-6 py-8">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold leading-6 text-slate-blue">
            {pageTitle}
          </h1>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save & Publish"}
          </button>
        </div>
        
        {formError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {formError}
          </div>
        )}
        
        {/* Customer/client details - only for individual campaigns */}
        {!isUniversal && campaignType !== 'public' && (
          <CustomerDetailsSection
            formData={formData}
            onFormDataChange={(updateFn) => {
              if (typeof updateFn === 'function') {
                setFormData(updateFn);
              } else {
                // Legacy: direct object passed
                setFormData((prev: any) => ({ ...prev, ...updateFn }));
              }
            }}
            campaignType={campaignType}
          />
        )}
        
        {/* Campaign name for public campaigns */}
        {(isUniversal || campaignType === 'public') && (
          <div className="mb-6">
            <div className="mb-6 flex items-center gap-3">
              <Icon name="FaInfoCircle" className="w-7 h-7 text-slate-blue" size={28} />
              <h2 className="text-2xl font-bold text-slate-blue">
                Campaign name
              </h2>
            </div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Campaign name <span className="text-red-600">(required)</span>
            </label>
            <Input
              type="text"
              id="name"
              value={formData.name || ""}
              onChange={(e) => updateFormData('name', e.target.value.slice(0, 50))}
              className="mt-1 block w-full max-w-md"
              placeholder={isUniversal ? "Holiday email campaign" : "Summer service campaign"}
              maxLength={50}
              required
            />
            <div className="text-sm text-gray-500 mt-1">
              {(formData.name || "").length}/50 characters
            </div>
          </div>
        )}
        
        {/* Services */}
        <div>
          <div className="mb-4 flex items-center gap-2">
                            <Icon name="FaStar" className="w-5 h-5 text-[#1A237E]" size={20} />
            <h2 className="text-2xl font-bold text-slate-blue">
              Services
            </h2>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service list <span className="text-red-600">(required)</span>
            </label>
          </div>
          <div className="space-y-2">
            {(formData.features_or_benefits || [""]).map((service: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  type="text"
                  value={service}
                  onChange={(e) => {
                    const newServices = [...(formData.features_or_benefits || [])];
                    newServices[idx] = e.target.value;
                    updateFormData('features_or_benefits', newServices);
                  }}
                  className="flex-1"
                  placeholder="e.g., Web Design"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newServices = (formData.features_or_benefits || []).filter((_: any, i: number) => i !== idx);
                    updateFormData('features_or_benefits', newServices);
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                                      <Icon name="FaTrash" className="w-4 h-4" size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const newServices = [...(formData.features_or_benefits || []), ""];
                updateFormData('features_or_benefits', newServices);
              }}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-slate-blue bg-slate-blue/10 hover:bg-slate-blue/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue"
            >
                              <Icon name="FaPlus" className="-ml-1 mr-2 h-4 w-4" size={16} />
              Add Service
            </button>
          </div>
        </div>

        {/* Outcome */}
        <div>
          <div className="mb-4 flex items-center gap-2">
                          <Icon name="FaGift" className="w-5 h-5 text-[#1A237E]" size={20} />
            <h2 className="text-2xl font-bold text-slate-blue">
              Outcome
            </h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            What outcome or benefit should the customer experience?
          </p>
          <Textarea
            id="product_description"
            value={formData.product_description || ""}
            onChange={(e) => updateFormData('product_description', e.target.value)}
            rows={4}
            className="mt-1 block w-full"
            placeholder="e.g., increased website traffic, improved online visibility, streamlined business operations"
          />
        </div>

        {/* Review Platforms Section */}
        <ReviewWriteSection
          value={formData.review_platforms || []}
          onChange={(platforms) => updateFormData('review_platforms', platforms)}
          onGenerateReview={handleGenerateAIReview}
          hideReviewTemplateFields={campaignType === 'public'}
          aiGeneratingIndex={aiGeneratingIndex}
        />

        {/* Keyword Phrases Section */}
        <div className="rounded-lg p-6 bg-green-50 border border-green-200 shadow">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="FaKey" className="w-7 h-7 text-slate-blue" size={28} />
            <h3 className="text-2xl font-bold text-slate-blue">Keyword-Powered Reviews</h3>
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Suggest keyword-powered phrases that your customers can use in reviews. This will improve your visibility in search and AI engines
            </label>
            <KeywordsInput
              keywords={Array.isArray(formData.keywords) ? formData.keywords : []}
              onChange={(keywords) => updateFormData('keywords', keywords)}
              placeholder="Enter keywords separated by commas (e.g., best pizza Seattle, wood-fired oven, authentic Italian)"
              businessInfo={{
                name: businessProfile?.name,
                industry: businessProfile?.industry,
                industries_other: businessProfile?.industries_other,
                industry_other: businessProfile?.industry_other,
                address_city: businessProfile?.address_city,
                address_state: businessProfile?.address_state,
                accountId: businessProfile?.account_id,
                about_us: businessProfile?.about_us,
                differentiators: businessProfile?.differentiators,
                years_in_business: businessProfile?.years_in_business,
                services_offered: businessProfile?.services_offered,
                industries_served: businessProfile?.industries_served
              }}
            />
          </div>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>How it works:</strong> Keywords are pre-populated from your global settings for new pages.
              You can add, remove, or customize them for this specific prompt page without affecting your global keywords.
            </p>
          </div>
        </div>

        {/* Keyword Inspiration Section */}
        <KeywordInspirationFeature
          enabled={formData.keyword_inspiration_enabled}
          onEnabledChange={(enabled) => updateFormData('keyword_inspiration_enabled', enabled)}
          selectedKeywords={formData.selected_keyword_inspirations}
          onKeywordsChange={(keywords) => updateFormData('selected_keyword_inspirations', keywords)}
          availableKeywords={formData.keywords || []}
          initialData={initialData}
          editMode={true}
        />

        {/* Kickstarters Section */}
        <KickstartersFeature
          enabled={formData.kickstarters_enabled}
          selectedKickstarters={formData.selected_kickstarters}
          businessName={businessProfile?.name || businessProfile?.business_name || "Business Name"}
          onEnabledChange={(enabled) => updateFormData('kickstarters_enabled', enabled)}
          onKickstartersChange={(kickstarters) => updateFormData('selected_kickstarters', kickstarters)}
          initialData={{
            kickstarters_enabled: initialData?.kickstarters_enabled,
            selected_kickstarters: initialData?.selected_kickstarters,
          }}
          editMode={true}
          accountId={businessProfile?.account_id}
        />

        {/* Recent Reviews Section */}
        <RecentReviewsFeature
          enabled={formData.recent_reviews_enabled}
          onEnabledChange={(enabled) => updateFormData('recent_reviews_enabled', enabled)}
          scope={formData.recent_reviews_scope || formData.recentReviewsScope || 'current_page'}
          onScopeChange={(scope) => updateFormData('recent_reviews_scope', scope)}
          initialData={{
            recent_reviews_enabled: initialData?.recent_reviews_enabled || initialData?.recentReviewsEnabled,
            recent_reviews_scope: initialData?.recent_reviews_scope || initialData?.recentReviewsScope,
          }}
          editMode={true}
        />

        {/* Offer Section */}
        <OfferFeature
          enabled={formData.offer_enabled}
          onToggle={() => updateFormData('offer_enabled', !formData.offer_enabled)}
          title={formData.offer_title}
          onTitleChange={(title) => updateFormData('offer_title', title)}
          description={formData.offer_body}
          onDescriptionChange={(body) => updateFormData('offer_body', body)}
          url={formData.offer_url}
          onUrlChange={(url) => updateFormData('offer_url', url)}
          timelock={formData.offer_timelock}
          onTimelockChange={(timelock) => updateFormData('offer_timelock', timelock)}
        />

        {/* Personalized note section */}
        <div className="rounded-lg p-4 bg-slate-50 border border-slate-200 flex flex-col gap-2 shadow relative">
          <div className="flex items-center justify-between mb-2 px-2 py-2">
            <div className="flex items-center gap-3">
              <Icon name="FaStickyNote" className="w-7 h-7 text-slate-blue" size={28} />
              <span className="text-2xl font-bold text-slate-blue">
                Friendly Note Pop-up
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (emojiSentimentEnabled) {
                  setShowPopupConflictModal("emoji");
                  return;
                }
                const newValue = !formData.show_friendly_note;
                updateFormData('show_friendly_note', newValue);
                // Reset conflict acknowledgment when state changes
                setConflictAcknowledged(false);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.show_friendly_note ? "bg-slate-blue" : "bg-gray-200"}`}
              aria-pressed={!!formData.show_friendly_note}
              disabled={emojiSentimentEnabled}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${formData.show_friendly_note ? "translate-x-5" : "translate-x-1"}`}
              />
            </button>
          </div>
          <div className="text-sm text-gray-700 mb-3 max-w-[85ch] px-2">
            Add a note that pops up when a customer or client visits your review page.
          </div>
          {formData.show_friendly_note && (
            <div className="px-2">
              <Textarea
                id="friendly_note"
                value={formData.friendly_note || ""}
                onChange={(e) => {
                  updateFormData('friendly_note', e.target.value);
                }}
                rows={4}
                className="block w-full"
                placeholder="e.g., Hi John! Thanks for using your service today. We'd love to hear about your experience."
              />
            </div>
          )}
        </div>

        {/* Emoji Sentiment Section */}
        <EmojiSentimentFeature
          enabled={emojiSentimentEnabled}
          onToggle={() => {
            if (formData.show_friendly_note) {
              setShowPopupConflictModal("note");
              return;
            }
            const newValue = !emojiSentimentEnabled;
            setEmojiSentimentEnabled(newValue);
            // Also update form data to keep them in sync
            updateFormData('emoji_sentiment_enabled', newValue);
            // Clear any previous errors when enabling
            if (newValue) {
              setFormError(null);
            }
            // Reset conflict acknowledgment when state changes
            setConflictAcknowledged(false);
          }}
          question={emojiSentimentQuestion}
          onQuestionChange={(question) => setEmojiSentimentQuestion(question)}
          feedbackMessage={emojiFeedbackMessage}
          onFeedbackMessageChange={(message) => setEmojiFeedbackMessage(message)}
          thankYouMessage={emojiThankYouMessage}
          onThankYouMessageChange={(val: string) => setEmojiThankYouMessage(val)}
          feedbackPopupHeader={emojiFeedbackPopupHeader}
          onFeedbackPopupHeaderChange={(header) => setEmojiFeedbackPopupHeader(header)}
          feedbackPageHeader={emojiFeedbackPageHeader}
          onFeedbackPageHeaderChange={(header) => setEmojiFeedbackPageHeader(header)}
          slug={formData.slug}
          disabled={!!formData.show_friendly_note}
          editMode={true}
        />
        
        {/* AI Generation Toggle */}
        <AISettingsFeature
          aiGenerationEnabled={formData.aiButtonEnabled}
          fixGrammarEnabled={fixGrammarEnabled}
          onAIEnabledChange={(enabled) => updateFormData('aiButtonEnabled', enabled)}
          onGrammarEnabledChange={(enabled) => setFixGrammarEnabled(enabled)}
        />
        
        {/* Falling Stars Section */}
        <FallingStarsFeature
          enabled={formData.falling_enabled}
          onToggle={() => updateFormData('falling_enabled', !formData.falling_enabled)}
          icon={formData.falling_icon}
          onIconChange={(icon) => updateFormData('falling_icon', icon)}
          color={formData.falling_icon_color}
          onColorChange={(color) => {
            updateFormData('falling_icon_color', color);
          }}
          editMode={true}
        />

        {/* Bottom Buttons */}
        <div className="flex justify-between pt-8 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.push('/prompt-pages')}
            className="inline-flex justify-center rounded-md border border-gray-300 py-2 px-4 text-sm font-medium text-gray-700 bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save & Publish"}
          </button>
        </div>
      </div>

      {/* Popup conflict modal */}
      {showPopupConflictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
              onClick={() => {
                setShowPopupConflictModal(null);
                setConflictAcknowledged(true);
              }}
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
                  ? "Emoji Feedback Flow" 
                  : "Friendly Note Pop-up"}
              </strong>{" "}
              first.
            </p>
            <button
              onClick={() => {
                setShowPopupConflictModal(null);
                setConflictAcknowledged(true);
              }}
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

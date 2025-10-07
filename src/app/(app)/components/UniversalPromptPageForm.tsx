/**
 * UniversalPromptPageForm component
 * 
 * Standardized Universal Prompt Page form that follows the same architecture as other prompt page types.
 * 
 * Features:
 * - Public campaign type (no customer details)
 * - Simplified AI context (business profile only)  
 * - All shared prompt-features components
 * - Business defaults fallback logic
 * - Standard save/publish flow
 * - One per account (auto-created)
 */

"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReviewWriteSection from "../dashboard/edit-prompt-page/components/ReviewWriteSection";
import KeywordsInput from "./KeywordsInput";
import {
  OfferFeature,
  EmojiSentimentFeature,
  FallingStarsFeature,
  AISettingsFeature,
  PersonalizedNoteFeature,
  KickstartersFeature,
  RecentReviewsFeature,
  KeywordInspirationFeature,
  type ReviewPlatform
} from "./prompt-features";
import { generateContextualReview } from "@/utils/aiReviewGeneration";
import Icon from "@/components/Icon";
import { getWordLimitOrDefault } from "@/constants/promptPageWordLimits";

/**
 * UniversalPromptPageForm component
 *
 * Purpose: Handles the creation and editing of Universal Prompt Pages using the standardized 
 * prompt page architecture. Universal pages are public campaigns with simplified AI context
 * that rely only on business profile information.
 */

interface UniversalPromptPageFormProps {
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

export default function UniversalPromptPageForm({
  mode,
  initialData,
  onSave,
  onPublish,
  pageTitle,
  supabase,
  businessProfile,
  isUniversal = true, // Always true for Universal
  onPublishSuccess,
  campaignType = 'public', // Always public for Universal
  onGenerateReview,
}: UniversalPromptPageFormProps) {
  const router = useRouter();
  
  // Initialize form data with business defaults fallback
  const [formData, setFormData] = useState({
    // Universal pages have no customer details (public campaign)
    review_type: "universal",
    is_universal: true,
    campaign_type: "public",
    
    // Review platforms with business defaults fallback
    review_platforms: initialData?.review_platforms || businessProfile?.review_platforms || [],
    
    // Shared feature states with business defaults fallback
    offer_enabled: initialData?.offer_enabled ?? businessProfile?.default_offer_enabled ?? false,
    offer_title: initialData?.offer_title || businessProfile?.default_offer_title || "",
    offer_body: initialData?.offer_body || businessProfile?.default_offer_body || "",
    offer_url: initialData?.offer_url || businessProfile?.default_offer_url || "",
    // Handle both snake_case and camelCase for offer_timelock
    offer_timelock: initialData?.offer_timelock ?? initialData?.offerTimelock ?? businessProfile?.default_offer_timelock ?? false,
    
    emoji_sentiment_enabled: initialData?.emoji_sentiment_enabled ?? businessProfile?.default_emoji_sentiment_enabled ?? false,
    emoji_sentiment_question: initialData?.emoji_sentiment_question || businessProfile?.default_emoji_sentiment_question || "How was your experience?",
    emoji_feedback_message: initialData?.emoji_feedback_message || businessProfile?.default_emoji_feedback_message || "We value your feedback! Let us know how we can do better.",
    emoji_thank_you_message: initialData?.emoji_thank_you_message || businessProfile?.default_emoji_thank_you_message || "Thank you for your feedback. It's important to us.",
    emoji_feedback_popup_header: initialData?.emoji_feedback_popup_header || businessProfile?.default_emoji_feedback_popup_header || "How can we improve?",
    emoji_feedback_page_header: initialData?.emoji_feedback_page_header || businessProfile?.default_emoji_feedback_page_header || "Your feedback helps us grow",
    
    falling_enabled: initialData?.falling_enabled ?? businessProfile?.default_falling_enabled ?? true,
    falling_icon: initialData?.falling_icon || businessProfile?.default_falling_icon || "star",
    falling_icon_color: initialData?.falling_icon_color || businessProfile?.default_falling_icon_color || "#fbbf24",
    
    ai_button_enabled: initialData?.ai_button_enabled ?? businessProfile?.default_ai_button_enabled ?? true,
    fix_grammar_enabled: initialData?.fix_grammar_enabled ?? businessProfile?.default_fix_grammar_enabled ?? true,
    
    show_friendly_note: initialData?.show_friendly_note ?? businessProfile?.default_show_friendly_note ?? false,
    friendly_note: initialData?.friendly_note || businessProfile?.default_friendly_note || "",
    
    kickstarters_enabled: initialData?.kickstarters_enabled ?? businessProfile?.default_kickstarters_enabled ?? false,
    selected_kickstarters: Array.isArray(initialData?.selected_kickstarters) 
      ? initialData.selected_kickstarters 
      : (Array.isArray(businessProfile?.default_selected_kickstarters) ? businessProfile.default_selected_kickstarters : []),
    
    recent_reviews_enabled: initialData?.recent_reviews_enabled ?? businessProfile?.default_recent_reviews_enabled ?? false,
    recent_reviews_scope: initialData?.recent_reviews_scope || businessProfile?.default_recent_reviews_scope || 'current_page',

    keyword_inspiration_enabled: initialData?.keyword_inspiration_enabled ?? businessProfile?.default_keyword_inspiration_enabled ?? false,
    selected_keyword_inspirations: Array.isArray(initialData?.selected_keyword_inspirations)
      ? initialData.selected_keyword_inspirations
      : (Array.isArray(businessProfile?.default_selected_keyword_inspirations) ? businessProfile.default_selected_keyword_inspirations : []),
  });

  const [aiGeneratingIndex, setAiGeneratingIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Keywords state
  const [keywords, setKeywords] = useState<string[]>(() => {
    if (Array.isArray(initialData?.keywords) && initialData.keywords.length > 0) {
      return initialData.keywords;
    } else if (mode === "create" && Array.isArray(businessProfile?.keywords)) {
      return businessProfile.keywords;
    }
    return [];
  });

  // Handle AI review generation with simplified Universal context
  const handleGenerateAIReview = async (index: number) => {
    if (!businessProfile) {
      setFormError("Business profile not loaded. Please try again.");
      return;
    }
    
    setAiGeneratingIndex(index);
    setFormError(null);
    
    try {
      // Create simplified Universal page context (business profile only)
      const universalPageData = {
        review_type: 'universal',
        is_universal: true,
        project_type: businessProfile.services_offered || "business services",
        product_description: businessProfile.description || "great business experience",
        friendly_note: formData.friendly_note,
        keywords: keywords,
        // No customer/client specific details for Universal pages
        outcomes: "",
        client_name: "",
        location: "",
        date_completed: "",
        team_member: "",
        assigned_team_members: "",
      };
      
      // No specific reviewer data for Universal pages
      const reviewerData = {
        firstName: "",
        lastName: "",
        role: "",
      };
      
      const review = await generateContextualReview(
        businessProfile,
        universalPageData,
        reviewerData,
        formData.review_platforms[index].name || formData.review_platforms[index].platform || "Google Business Profile",
        getWordLimitOrDefault(formData.review_platforms[index].wordCount),
        formData.review_platforms[index].customInstructions,
        "customer"
      );
      
      setFormData((prev: any) => ({
        ...prev,
        review_platforms: prev.review_platforms.map((platform: any, i: number) =>
          i === index ? { ...platform, reviewText: review } : platform,
        ),
      }));
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to generate review",
      );
    } finally {
      setAiGeneratingIndex(null);
    }
  };

  // Handle form submission
  const handleSave = async () => {
    setIsSaving(true);
    setFormError(null);

    try {
      const saveData = {
        ...formData,
        keywords: keywords,
      };
      await onSave(saveData);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (onPublish) {
      setIsSaving(true);
      setFormError(null);
      
      try {
        await onPublish(formData);
      } catch (error) {
        setFormError(error instanceof Error ? error.message : "Failed to publish");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSave();
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="max-w-4xl mx-auto bg-white px-6 py-8">
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
            {isSaving ? "Saving..." : "Save & publish"}
          </button>
        </div>
        
        {formError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {formError}
          </div>
        )}

      {/* Review Platforms Section */}
      <ReviewWriteSection
        value={formData.review_platforms || []}
        onChange={(platforms) => {
          setFormData((prev: any) => ({ ...prev, review_platforms: platforms }));
        }}
        onGenerateReview={handleGenerateAIReview}
        hideReviewTemplateFields={true} // Universal pages are public so hide review template fields
        aiGeneratingIndex={aiGeneratingIndex}
      />

      {/* Keywords Section */}
      <div className="rounded-lg p-6 bg-slate-50 border border-slate-200 shadow">
        <div className="flex items-center gap-3 mb-4">
          <Icon name="FaSearch" className="w-7 h-7 text-slate-blue" size={28} />
          <h3 className="text-2xl font-bold text-slate-blue">Keywords</h3>
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add keywords to help guide reviewers and improve SEO
          </label>
          <KeywordsInput
            keywords={keywords}
            onChange={setKeywords}
            placeholder="Enter keywords separated by commas (e.g., best pizza Seattle, wood-fired oven, authentic Italian)"
          />
        </div>
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>How it works:</strong> Keywords are pre-populated from your global settings for new pages.
            You can add, remove, or customize them for this specific prompt page without affecting your global keywords.
          </p>
        </div>
      </div>

      {/* Special Offer Feature */}
      <OfferFeature
        enabled={formData.offer_enabled}
        onEnabledChange={(enabled) => {
          setFormData((prev: any) => ({ ...prev, offer_enabled: enabled }));
        }}
        title={formData.offer_title}
        onTitleChange={(title) => {
          setFormData((prev: any) => ({ ...prev, offer_title: title }));
        }}
        description={formData.offer_body}
        onDescriptionChange={(description) => {
          setFormData((prev: any) => ({ ...prev, offer_body: description }));
        }}
        url={formData.offer_url}
        onUrlChange={(url) => {
          setFormData((prev: any) => ({ ...prev, offer_url: url }));
        }}
        timelock={formData.offer_timelock}
        onTimelockChange={(timelock) => {
          setFormData((prev: any) => ({ ...prev, offer_timelock: timelock }));
        }}
        initialData={initialData}
      />

      {/* Personalized Note Feature */}
      <PersonalizedNoteFeature
        enabled={formData.show_friendly_note}
        onEnabledChange={(enabled) => {
          setFormData((prev: any) => ({ ...prev, show_friendly_note: enabled }));
        }}
        note={formData.friendly_note}
        onNoteChange={(note) => {
          setFormData((prev: any) => ({ ...prev, friendly_note: note }));
        }}
        emojiSentimentEnabled={formData.emoji_sentiment_enabled}
        initialData={initialData}
        editMode={true}
      />

      {/* Emoji Sentiment Feature */}
      <EmojiSentimentFeature
        enabled={formData.emoji_sentiment_enabled}
        onEnabledChange={(enabled) => {
          setFormData((prev: any) => ({ ...prev, emoji_sentiment_enabled: enabled }));
        }}
        question={formData.emoji_sentiment_question}
        onQuestionChange={(question) => {
          setFormData((prev: any) => ({ ...prev, emoji_sentiment_question: question }));
        }}
        feedbackMessage={formData.emoji_feedback_message}
        onFeedbackMessageChange={(message) => {
          setFormData((prev: any) => ({ ...prev, emoji_feedback_message: message }));
        }}
        feedbackPageHeader={formData.emoji_feedback_page_header}
        onFeedbackPageHeaderChange={(header) => {
          setFormData((prev: any) => ({ ...prev, emoji_feedback_page_header: header }));
        }}
        thankYouMessage={formData.emoji_thank_you_message}
        onThankYouMessageChange={(message) => {
          setFormData((prev: any) => ({ ...prev, emoji_thank_you_message: message }));
        }}
        personalizedNoteEnabled={formData.show_friendly_note}
        slug={initialData?.slug}
        editMode={true}
      />

      {/* Falling Stars Feature */}
      <FallingStarsFeature
        enabled={formData.falling_enabled}
        onEnabledChange={(enabled) => {
          setFormData((prev: any) => ({ ...prev, falling_enabled: enabled }));
        }}
        icon={formData.falling_icon}
        onIconChange={(icon) => {
          setFormData((prev: any) => ({ ...prev, falling_icon: icon }));
        }}
        color={formData.falling_icon_color}
        onColorChange={(color) => {
          setFormData((prev: any) => ({ ...prev, falling_icon_color: color }));
        }}
        editMode={true}
      />

      {/* Kickstarters Feature */}
      <KickstartersFeature
        enabled={formData.kickstarters_enabled}
        onEnabledChange={(enabled) => {
          setFormData((prev: any) => ({ ...prev, kickstarters_enabled: enabled }));
        }}
        selectedKickstarters={formData.selected_kickstarters}
        onKickstartersChange={(kickstarters) => {
          setFormData((prev: any) => ({ ...prev, selected_kickstarters: kickstarters }));
        }}
        businessProfile={businessProfile}
        initialData={initialData}
        editMode={true}
        accountId={businessProfile?.account_id}
      />

      {/* Recent Reviews Feature */}
      <RecentReviewsFeature
        enabled={formData.recent_reviews_enabled}
        onEnabledChange={(enabled) => {
          setFormData((prev: any) => ({ ...prev, recent_reviews_enabled: enabled }));
        }}
        scope={formData.recent_reviews_scope}
        onScopeChange={(scope) => {
          setFormData((prev: any) => ({ ...prev, recent_reviews_scope: scope }));
        }}
        initialData={initialData}
        editMode={true}
      />

      {/* Keyword Inspiration Feature */}
      <KeywordInspirationFeature
        enabled={formData.keyword_inspiration_enabled}
        onEnabledChange={(enabled) => {
          setFormData((prev: any) => ({ ...prev, keyword_inspiration_enabled: enabled }));
        }}
        selectedKeywords={formData.selected_keyword_inspirations}
        onKeywordsChange={(keywords) => {
          setFormData((prev: any) => ({ ...prev, selected_keyword_inspirations: keywords }));
        }}
        availableKeywords={keywords}
        initialData={initialData}
        editMode={true}
      />

      {/* AI Settings Feature */}
      <AISettingsFeature
        aiGenerationEnabled={formData.ai_button_enabled}
        fixGrammarEnabled={formData.fix_grammar_enabled}
        onAIEnabledChange={(enabled) => {
          setFormData((prev: any) => ({ ...prev, ai_button_enabled: enabled }));
        }}
        onGrammarEnabledChange={(enabled) => {
          setFormData((prev: any) => ({ ...prev, fix_grammar_enabled: enabled }));
        }}
        initialData={initialData}
      />
      
      {/* Bottom Save Button */}
      <div className="flex justify-end pt-8 border-t border-gray-200">
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save & publish"}
        </button>
      </div>
      </div>
    </form>
  );
}

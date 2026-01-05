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
import {
  OfferFeature,
  EmojiSentimentFeature,
  FallingStarsFeature,
  AISettingsFeature,
  PersonalizedNoteFeature,
  KickstartersFeature,
  RecentReviewsFeature,
  KeywordInspirationFeature,
  MotivationalNudgeFeature,
  RoleFieldFeature,
  SuggestedPhrasesFeature,
  FunFactsFeature,
  type ReviewPlatform
} from "./prompt-features";
import { generateContextualReview } from "@/utils/aiReviewGeneration";
import Icon from "@/components/Icon";
import { getWordLimitOrDefault } from "@/constants/promptPageWordLimits";
import { KeywordDetailsSidebar } from "@/features/keywords/components";
import { apiClient } from "@/utils/apiClient";
import type { KeywordData } from "@/features/keywords/keywordUtils";

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

    fun_facts_enabled: initialData?.fun_facts_enabled ?? false,
    selected_fun_facts: Array.isArray(initialData?.selected_fun_facts)
      ? initialData.selected_fun_facts
      : [],

    recent_reviews_enabled: initialData?.recent_reviews_enabled ?? businessProfile?.default_recent_reviews_enabled ?? false,
    recent_reviews_scope: initialData?.recent_reviews_scope || businessProfile?.default_recent_reviews_scope || 'current_page',

    keyword_inspiration_enabled: initialData?.keyword_inspiration_enabled ?? businessProfile?.default_keyword_inspiration_enabled ?? false,
    selected_keyword_inspirations: Array.isArray(initialData?.selected_keyword_inspirations)
      ? initialData.selected_keyword_inspirations
      : (Array.isArray(businessProfile?.default_selected_keyword_inspirations) ? businessProfile.default_selected_keyword_inspirations : []),

    // Motivational Nudge
    motivational_nudge_enabled: initialData?.motivational_nudge_enabled ?? true,
    motivational_nudge_text: initialData?.motivational_nudge_text ?? "{business_name} needs your STAR POWER so more people find them online!",

    // Role Field - off by default for universal/catch-all pages
    role_field_enabled: initialData?.role_field_enabled ?? false,

    // Suggested Phrases auto-rotation - tracks phrase usage and rotates overused ones
    keyword_auto_rotate_enabled: initialData?.keyword_auto_rotate_enabled ?? false,
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

  // Local state for kickstarters background design (synced with business profile)
  const [localBackgroundDesign, setLocalBackgroundDesign] = useState(
    businessProfile?.kickstarters_background_design ?? false
  );

  // Keyword sidebar state
  const [sidebarKeyword, setSidebarKeyword] = useState<KeywordData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarPromptPages, setSidebarPromptPages] = useState<Array<{ id: string; name?: string; slug?: string }>>([]);

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

  // Handle kickstarters color changes (updates global business setting)
  const handleKickstartersColorChange = async (color: string) => {
    try {
      // Use the API endpoint for proper account isolation and authentication
      const response = await fetch('/api/businesses/update-style', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Selected-Account': businessProfile?.account_id || '',
        },
        credentials: 'include',
        body: JSON.stringify({
          businessId: businessProfile?.id,
          kickstarters_primary_color: color,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        console.error('Error updating kickstarters primary color:', result.error);
      } else {
        // Update the business profile object for immediate sync with live page
        if (businessProfile) {
          businessProfile.kickstarters_primary_color = color;
        }
      }
    } catch (error) {
      console.error('Error updating kickstarters primary color:', error);
    }
  };

  // Synchronize form data with initialData when it changes
  useEffect(() => {
    if (initialData?.motivational_nudge_enabled !== undefined) {
      setFormData(prev => ({
        ...prev,
        motivational_nudge_enabled: initialData.motivational_nudge_enabled,
      }));
    }
    if (initialData?.motivational_nudge_text !== undefined) {
      setFormData(prev => ({
        ...prev,
        motivational_nudge_text: initialData.motivational_nudge_text,
      }));
    }
  }, [initialData?.motivational_nudge_enabled, initialData?.motivational_nudge_text]);

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

  // Handle keyword click to open details sidebar
  const handleKeywordClick = async (phrase: string) => {
    try {
      const data = await apiClient.get<{ keyword: KeywordData | null; promptPages?: Array<{ id: string; name?: string; slug?: string }> }>(
        `/keywords/by-phrase?phrase=${encodeURIComponent(phrase)}`
      );
      if (data.keyword) {
        setSidebarKeyword(data.keyword);
        setSidebarPromptPages(data.promptPages || []);
        setSidebarOpen(true);
      }
    } catch (err) {
      console.error('Failed to find keyword:', err);
    }
  };

  // Handle keyword update from sidebar
  const handleKeywordUpdate = async (id: string, updates: Partial<{
    phrase: string;
    groupId: string;
    status: 'active' | 'paused';
    reviewPhrase: string;
    searchQuery: string;
    searchTerms: any[];
    aliases: string[];
    locationScope: string | null;
    relatedQuestions: any[];
  }>) => {
    try {
      const data = await apiClient.put<{ keyword: KeywordData }>(`/keywords/${id}`, updates);
      if (data.keyword) {
        setSidebarKeyword(data.keyword);
      }
      return data.keyword;
    } catch (err) {
      console.error('Failed to update keyword:', err);
      return null;
    }
  };

  // Refresh keyword data in sidebar
  const refreshSidebarKeyword = async () => {
    if (sidebarKeyword?.id) {
      try {
        const data = await apiClient.get<{ keyword: KeywordData | null; promptPages?: Array<{ id: string; name?: string; slug?: string }> }>(
          `/keywords/by-phrase?phrase=${encodeURIComponent(sidebarKeyword.phrase)}`
        );
        if (data.keyword) {
          setSidebarKeyword(data.keyword);
          setSidebarPromptPages(data.promptPages || []);
        }
      } catch (err) {
        console.error('Failed to refresh keyword:', err);
      }
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
      className="max-w-4xl mx-auto px-6 py-8">
      <div className="space-y-8">
        
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

      {/* Suggested Phrases Section */}
      <SuggestedPhrasesFeature
        keywords={keywords}
        onKeywordsChange={setKeywords}
        autoRotateEnabled={formData.keyword_auto_rotate_enabled}
        onAutoRotateEnabledChange={(enabled) => setFormData((prev: any) => ({ ...prev, keyword_auto_rotate_enabled: enabled }))}
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
        initialData={initialData}
        promptPageId={initialData?.id}
        onKeywordClick={handleKeywordClick}
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
        backgroundDesign={localBackgroundDesign}
        onBackgroundDesignChange={handleKickstartersBackgroundDesignChange}
        onKickstartersColorChange={handleKickstartersColorChange}
        businessName={businessProfile?.name || businessProfile?.business_name || "Business Name"}
        businessProfile={businessProfile}
        initialData={initialData}
        editMode={true}
        accountId={businessProfile?.account_id}
      />

      {/* Fun Facts Feature */}
      <FunFactsFeature
        enabled={formData.fun_facts_enabled}
        selectedFactIds={formData.selected_fun_facts}
        allFacts={businessProfile?.fun_facts || []}
        businessName={businessProfile?.name || businessProfile?.business_name || "Business Name"}
        onEnabledChange={(enabled) => {
          setFormData((prev: any) => ({ ...prev, fun_facts_enabled: enabled }));
        }}
        onSelectedChange={(factIds) => {
          setFormData((prev: any) => ({ ...prev, selected_fun_facts: factIds }));
        }}
        onFactsChange={() => { /* Handled by API */ }}
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

      {/* Motivational Nudge */}
      <MotivationalNudgeFeature
        enabled={formData.motivational_nudge_enabled}
        text={formData.motivational_nudge_text}
        onEnabledChange={(enabled) => {
          setFormData((prev: any) => ({ ...prev, motivational_nudge_enabled: enabled }));
        }}
        onTextChange={(text) => {
          setFormData((prev: any) => ({ ...prev, motivational_nudge_text: text }));
        }}
        editMode={true}
        businessName={businessProfile?.name}
      />

      {/* Role Field */}
      <RoleFieldFeature
        enabled={formData.role_field_enabled}
        onEnabledChange={(enabled) => {
          setFormData((prev: any) => ({ ...prev, role_field_enabled: enabled }));
        }}
        editMode={true}
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

      {/* Keyword Details Sidebar */}
      <KeywordDetailsSidebar
        isOpen={sidebarOpen}
        keyword={sidebarKeyword}
        onClose={() => {
          setSidebarOpen(false);
          setSidebarKeyword(null);
        }}
        onUpdate={handleKeywordUpdate}
        promptPages={sidebarPromptPages}
        onRefresh={refreshSidebarKeyword}
      />
    </form>
  );
}

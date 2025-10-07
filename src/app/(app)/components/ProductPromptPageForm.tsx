/**
 * ProductPromptPageForm component
 * 
 * Main form component for creating/editing product prompt pages.
 * Now built using modular components for better maintainability.
 */

"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFallingStars } from "@/hooks/useFallingStars";
import { generateContextualReview } from "@/utils/aiReviewGeneration";

// Import all the new modular components
import CustomerDetailsSection from "./sections/CustomerDetailsSection";
import ProductDetailsSection from "./sections/ProductDetailsSection";
import ProductImageUpload from "./sections/ProductImageUpload";
import FeaturesBenefitsSection from "./sections/FeaturesBenefitsSection";
import { TopNavigation, BottomNavigation } from "./sections/StepNavigation";

// Import step 2 components (already existing)
import ReviewWriteSection from "../dashboard/edit-prompt-page/components/ReviewWriteSection";
import { 
  OfferFeature,
  EmojiSentimentFeature,
  FallingStarsFeature,
  AISettingsFeature,
  KickstartersFeature,
  RecentReviewsFeature
} from "./prompt-features";
import Icon from "@/components/Icon";
import SectionHeader from "./SectionHeader";
import { BusinessProfile } from "@/types/business";
import {
  createLocationPromptPageData,
} from "@/utils/locationUtils";
import { ChevronRightIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { getWordLimitOrDefault } from "@/constants/promptPageWordLimits";
import KeywordsInput from "./KeywordsInput";

export default function ProductPromptPageForm({
  mode,
  initialData,
  onSave,
  onPublish,
  pageTitle,
  supabase,
  businessProfile,
  accountId,
  successMessage,
  error,
  isLoading = false,
  isUniversal = false,
  onPublishSuccess,
  step = 1,
  onStepChange,
  slug,
  campaignType = 'individual',
  ...rest
}: {
  mode: "create" | "edit";
  initialData: any;
  onSave: (data: any) => void;
  onPublish?: (data: any) => void;
  isLoading?: boolean;
  pageTitle: string;
  supabase: any;
  businessProfile: any;
  accountId: string;
  successMessage?: string | null;
  error?: string | null;
  isUniversal?: boolean;
  onPublishSuccess?: (slug: string) => void;
  step?: number;
  onStepChange?: (step: number) => void;
  slug?: string;
  campaignType?: string;
  [key: string]: any;
}) {
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState(initialData || {});
  const [productName, setProductName] = useState(initialData?.product_name || "");
  const [productPhotoUrl, setProductPhotoUrl] = useState(initialData?.product_photo || null);
  const [productPhotoFile, setProductPhotoFile] = useState<File | null>(null);
  const [nfcTextEnabled, setNfcTextEnabled] = useState(initialData?.nfc_text_enabled ?? false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [aiGeneratingIndex, setAiGeneratingIndex] = useState<number | null>(null);

  // Initialize keywords with business keywords if this is a new prompt page
  const [keywords, setKeywords] = useState<string[]>(() => {
    if (Array.isArray(initialData?.keywords) && initialData.keywords.length > 0) {
      return initialData.keywords;
    } else if (mode === "create" && Array.isArray(businessProfile?.keywords)) {
      return businessProfile.keywords;
    }
    return [];
  });

  // Step 2 state (when step === 2 or mode === "edit")
  const [offerEnabled, setOfferEnabled] = useState(initialData?.offer_enabled ?? false);
  const [offerTitle, setOfferTitle] = useState(initialData?.offer_title || "Special Offer");
  const [offerBody, setOfferBody] = useState(
    initialData?.offer_body || "Use this code \"1234\" to get a discount on your next purchase."
  );
  const [offerUrl, setOfferUrl] = useState(initialData?.offer_url || "");
  // Handle both snake_case and camelCase for offer_timelock
  const [offerTimelock, setOfferTimelock] = useState(initialData?.offer_timelock ?? initialData?.offerTimelock ?? false);
  const [aiReviewEnabled, setAiReviewEnabled] = useState(initialData?.ai_button_enabled ?? true);
  const [fixGrammarEnabled, setFixGrammarEnabled] = useState(initialData?.fix_grammar_enabled ?? true);
  const [notePopupEnabled, setNotePopupEnabled] = useState(initialData?.show_friendly_note ?? false);
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
    initialData?.emoji_feedback_page_header || "Your feedback helps us grow"
  );
  const [emojiThankYouMessage, setEmojiThankYouMessage] = useState(
    initialData?.emoji_thank_you_message || "Thank you for your feedback. It's important to us."
  );
  const [showPopupConflictModal, setShowPopupConflictModal] = useState<string | null>(null);
  const [fallingEnabled, setFallingEnabled] = useState(initialData?.falling_enabled ?? true);
  const [kickstartersEnabled, setKickstartersEnabled] = useState(initialData?.kickstarters_enabled ?? false);
  const [recentReviewsEnabled, setRecentReviewsEnabled] = useState(initialData?.recent_reviews_enabled ?? false);
  // Handle both snake_case and camelCase for recent_reviews_scope
  const [recentReviewsScope, setRecentReviewsScope] = useState(initialData?.recent_reviews_scope || initialData?.recentReviewsScope || "current_page");
  const [selectedKickstarters, setSelectedKickstarters] = useState<string[]>(initialData?.selected_kickstarters ?? []);


  // Helper function to update form data
  const updateFormData = (data: any) => {
    setFormData((prev: any) => {
      const newData = { ...prev, ...data };
      return newData;
    });
  };

  // Update form data when initialData changes (for inheritance)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData((prev: any) => {
        const newData = { ...prev, ...initialData };
        return newData;
      });
    }
  }, [initialData]);

  // Sync product name with form data
  useEffect(() => {
    if (productName !== formData.product_name) {
      setFormData((prev: any) => ({ ...prev, product_name: productName }));
    }
  }, [productName, formData.product_name]);

  // Initialize values from useFallingStars hook
  const { fallingIcon, fallingIconColor, handleIconChange, handleColorChange, initializeValues } = useFallingStars({
    initialIcon: initialData?.falling_icon ?? "star",
    initialColor: initialData?.falling_icon_color ?? "#fbbf24",
    onFormDataChange: (data) => {
      setFormData((prev: any) => ({ ...prev, ...data }));
    }
  });

  // Initialize falling stars values
  useEffect(() => {
    if (initialData?.falling_icon || initialData?.falling_icon_color) {
      initializeValues(initialData.falling_icon, initialData.falling_icon_color);
    }
  }, [initialData, initializeValues]);

  // Handle product photo upload
  const handleProductPhotoUpload = async () => {
    if (!productPhotoFile) return null;
    const userId = accountId || businessProfile?.account_id || businessProfile?.id || "unknown";
    const fileExt = productPhotoFile.name.split(".").pop();
    const filePath = `product-photos/${userId}-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(filePath, productPhotoFile, {
        upsert: true,
        contentType: productPhotoFile.type,
      });
    
    if (uploadError) {
      throw new Error("Failed to upload product photo.");
    }
    
    const { data: publicUrlData } = supabase.storage
      .from("products")
      .getPublicUrl(filePath);
    
    return publicUrlData?.publicUrl || null;
  };

  // Handle step 1 continue
  const handleStep1Continue = async () => {
    setFormError(null);

    try {
        let uploadedPhotoUrl = productPhotoUrl;
      if (productPhotoFile && (!formData.product_photo || productPhotoUrl !== formData.product_photo)) {
          uploadedPhotoUrl = await handleProductPhotoUpload();
        }

      const step1Data = {
          ...formData,
          review_type: "product",
          product_name: productName, // Ensure product name is included
          product_photo: uploadedPhotoUrl,
        };
        
      await onSave(step1Data);
      onStepChange?.(2);
    } catch (error: any) {
      console.error(`🔥 Step 1 save failed:`, error);
      console.error(`🔥 Step 1 error details:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
      setFormError(error.message || "Failed to save. Please try again.");
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
      
      // Create comprehensive product page context
      const productPageData = {
        review_type: 'product',
        product_name: formData.product_name,
        product_description: formData.product_description,
        product_subcopy: formData.product_subcopy,
        features_or_benefits: formData.features_or_benefits || [],
        category: formData.category,
        project_type: formData.product_name || 'product',
        outcomes: formData.product_description,
        client_name: formData.client_name,
        location: formData.location,
        friendly_note: formData.friendly_note,
        date_completed: formData.date_completed,
        team_member: formData.team_member,
        assigned_team_members: formData.assigned_team_members,
        keywords: keywords, // Use page-level keywords
      };
      
      const reviewerData = {
        firstName: formData.first_name || "",
        lastName: formData.last_name || "",
        role: formData.role || "",
      };
      
      const review = await generateContextualReview(
        businessProfile,
        productPageData,
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
  };

  // Handle falling stars toggle
  const handleToggleFalling = () => {
    setFallingEnabled((prev: boolean) => !prev);
  };

  // Form validation
  const validateForm = () => {
    const campaignType = formData.campaign_type || 'individual';
    
    
    if (campaignType !== 'public') {
      // For individual campaigns, validate customer details
      if (!formData.first_name?.trim()) {
        setFormError("First name is required for individual campaigns.");
        return false;
      }
      if (!formData.last_name?.trim()) {
        setFormError("Last name is required for individual campaigns.");
        return false;
      }
      if (!formData.email?.trim()) {
        setFormError("Email is required for individual campaigns.");
        return false;
      }
    } else {
      // For public campaigns, require a campaign name
      if (!formData.name?.trim()) {
        setFormError("Campaign name is required for public campaigns.");
        return false;
      }
    }

    return true;
  };

  // Product save handler - completely rewritten to force cache refresh
  const handleEditSave = React.useCallback(async () => {
    const operationId = Date.now() + Math.random();
    
    
    if (isLoading) {
      return;
    }
    
    setFormError("");
    
    // Validate form before saving
    if (!validateForm()) {
      return;
    }
    
    try {
      let photoUrl = productPhotoUrl;
      if (productPhotoFile && (!formData.product_photo || productPhotoUrl !== formData.product_photo)) {
        photoUrl = await handleProductPhotoUpload();
      }
      
      const saveData = {
        ...formData,
        review_type: "product", // Ensure review_type is always set
        product_name: productName, // Ensure product name is included
        product_photo: photoUrl,
        business_name: businessProfile?.business_name || "",
        contact_id: businessProfile?.contact_id || null,
        offerEnabled,
        offerTitle,
        offerBody,
        offerUrl,
        offer_timelock: offerTimelock,
        emojiSentimentEnabled,
        emojiSentimentQuestion,
        emojiFeedbackMessage,
        emojiFeedbackPopupHeader,
        emojiFeedbackPageHeader,
        emojiThankYouMessage,
        reviewPlatforms: formData.review_platforms || [],
        fallingEnabled,
        fallingIcon,
        aiButtonEnabled: aiReviewEnabled,
        fixGrammarEnabled,
        notePopupEnabled,
        nfcTextEnabled,
        friendlyNote: formData.friendly_note || "",
        recentReviewsEnabled,
        recent_reviews_scope: recentReviewsScope,
        keywords: keywords, // Include page-level keywords
      };
      
      await onSave(saveData);
    } catch (error: any) {
      console.error(`🔥 Save failed:`, error);
      console.error(`🔥 Full error details:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
      setFormError(error.message || "Failed to save page");
    }
  }, [
    isLoading,
    formData,
    productName, // Add productName to dependencies
    productPhotoFile,
    productPhotoUrl,
    onSave,
    businessProfile,
    offerEnabled,
    offerTitle,
    offerBody,
    offerUrl,
    offerTimelock,
    emojiSentimentEnabled,
    emojiSentimentQuestion,
    emojiFeedbackMessage,
    emojiFeedbackPopupHeader,
    emojiFeedbackPageHeader,
    emojiThankYouMessage,
    fallingEnabled,
    fallingIcon,
    keywords,
    aiReviewEnabled,
    fixGrammarEnabled,
    notePopupEnabled,
    nfcTextEnabled,
    recentReviewsEnabled,
    recentReviewsScope,
    handleProductPhotoUpload,
    validateForm // Add validateForm to dependencies
  ]);

  // Handle form submission to prevent page reload
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <form 
      className="relative space-y-8"
      onSubmit={handleFormSubmit}
    >
      {/* Page Header with Title and Save Button */}
      <div className="flex justify-between items-start mt-0 md:mt-[3px] mb-4">
        <div className="flex flex-col">
          <h1 className="text-4xl font-bold text-slate-blue mt-0 mb-2">
            {pageTitle}
          </h1>
          <p className="text-gray-600 text-base max-w-md mt-0 mb-10">
            Let's get a review from a customer who loves your product.
          </p>
        </div>
        
        {/* Top Navigation */}
        <TopNavigation 
          mode={mode}
          isSaving={isLoading}
          onSave={handleEditSave}
        />
      </div>

      <div className="space-y-8">
                {/* Error Messages */}
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                {formError}
              </div>
            )}

        {/* Product Prompt Page Header - only for public campaigns */}
        {(formData.campaign_type || 'individual') === 'public' && (
          <div className="space-y-6">
                         <div className="mb-6 flex items-center gap-3">
               <Icon name="FaCommentAlt" className="w-7 h-7 text-slate-blue" size={28} />
               <div>
                 <h2 className="text-xl font-semibold text-slate-blue">Prompt page name</h2>
                 <p className="text-gray-600 text-sm">Give your product prompt page a clear, descriptive name</p>
               </div>
             </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name <span className="text-red-600">(required)</span>
              </label>
                             <input
                 type="text"
                 value={formData.name || ""}
                 onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-blue focus:border-slate-blue sm:text-sm"
                 placeholder="e.g., Eight-Nozzled Elephant-Toted Boom Blitz 2.0"
                 required
               />
            </div>
          </div>
        )}

        {/* Customer Details Section - only for individual campaigns */}
        {(formData.campaign_type || 'individual') !== 'public' && (
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
            campaignType={formData.campaign_type || 'individual'}
          />
        )}

        {/* Product Details Section */}
        <ProductDetailsSection 
          productName={productName}
          onProductNameChange={setProductName}
          formData={formData}
          onFormDataChange={updateFormData}
        />

        {/* Product Image Upload Section */}
        <ProductImageUpload 
          productPhotoUrl={productPhotoUrl}
          onPhotoUrlChange={setProductPhotoUrl}
          productPhotoFile={productPhotoFile}
          onPhotoFileChange={setProductPhotoFile}
          businessProfile={businessProfile}
          supabase={supabase}
        />

        {/* Features/Benefits Section */}
        <FeaturesBenefitsSection 
          formData={formData}
          onFormDataChange={updateFormData}
        />

        {/* Review Writing Section */}
            <ReviewWriteSection
              value={formData.review_platforms}
              onChange={(platforms) =>
                setFormData((prev: any) => ({
                  ...prev,
                  review_platforms: platforms,
                }))
              }
              onGenerateReview={handleGenerateAIReview}
              hideReviewTemplateFields={campaignType === 'public'}
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

        {/* Kickstarters Feature */}
        <KickstartersFeature
          enabled={kickstartersEnabled || false}
          selectedKickstarters={selectedKickstarters || []}
          businessName={businessProfile?.name || businessProfile?.business_name || "Business Name"}
          onEnabledChange={setKickstartersEnabled}
          onKickstartersChange={setSelectedKickstarters}
          initialData={{
            kickstarters_enabled: kickstartersEnabled,
            selected_kickstarters: selectedKickstarters,
          }}
          editMode={true}
          accountId={businessProfile?.account_id}
        />

        {/* Recent Reviews Feature */}
        <RecentReviewsFeature
          enabled={recentReviewsEnabled}
          onEnabledChange={(enabled) => setRecentReviewsEnabled(enabled)}
          scope={recentReviewsScope}
          onScopeChange={(scope) => setRecentReviewsScope(scope)}
          initialData={{
            recent_reviews_enabled: recentReviewsEnabled,
            recent_reviews_scope: recentReviewsScope,
          }}
          editMode={true}
        />

        {/* Offer Section */}
            <OfferFeature
              enabled={offerEnabled}
              onToggle={() => setOfferEnabled((v: boolean) => !v)}
              title={offerTitle}
              onTitleChange={setOfferTitle}
              description={offerBody}
              onDescriptionChange={setOfferBody}
              url={offerUrl}
              onUrlChange={setOfferUrl}
              timelock={offerTimelock}
              onTimelockChange={setOfferTimelock}
            />

            {/* Personalized Note Pop-up Section */}
        <div className="rounded-lg p-4 bg-slate-50 border border-slate-200 flex flex-col gap-2 shadow relative">
              <div className="flex items-center justify-between mb-2 px-2 py-2">
                <div className="flex items-center gap-3">
                  <Icon name="FaStickyNote" className="w-7 h-7" style={{ color: "#1A237E" }} size={28} />
                  <span className="text-2xl font-bold text-slate-blue">
                    Friendly note pop-up
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (emojiSentimentEnabled) {
                      setShowPopupConflictModal("note");
                      return;
                    }
                    setNotePopupEnabled((v: boolean) => !v);
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${notePopupEnabled ? "bg-slate-blue" : "bg-gray-200"}`}
                  aria-pressed={!!notePopupEnabled}
                  disabled={emojiSentimentEnabled}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${notePopupEnabled ? "translate-x-5" : "translate-x-1"}`}
                  />
                </button>
              </div>
              <div className="text-sm text-gray-700 mb-3 max-w-[85ch] px-2">
                This note appears as a pop-up at the top of the review page. Use
                it to set the context and tone for your customer.
              </div>
              {notePopupEnabled && (
                <textarea
                  id="friendly_note"
                  value={formData.friendly_note}
                  onChange={(e) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      friendly_note: e.target.value,
                    }))
                  }
                  rows={4}
                  className="block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-inner"
                  placeholder="Jonas, it was so good to catch up yesterday. I'm excited about the project. Would you mind dropping us a review? I have a review template you can use or you can write your own. Thanks!"
                />
              )}
            </div>

        {/* Emoji Sentiment Section */}
            <EmojiSentimentFeature
              enabled={emojiSentimentEnabled}
              onToggle={() => {
                if (notePopupEnabled) {
                  setShowPopupConflictModal("emoji");
                  return;
                }
                setEmojiSentimentEnabled((v: boolean) => !v);
              }}
              question={emojiSentimentQuestion}
              onQuestionChange={setEmojiSentimentQuestion}
              feedbackMessage={emojiFeedbackMessage}
              onFeedbackMessageChange={setEmojiFeedbackMessage}
              thankYouMessage={formData.emojiThankYouMessage}
              onThankYouMessageChange={(val: string) =>
                setFormData((prev: any) => ({
                  ...prev,
                  emojiThankYouMessage: val,
                }))
              }
              feedbackPopupHeader={emojiFeedbackPopupHeader}
              onFeedbackPopupHeaderChange={setEmojiFeedbackPopupHeader}
              feedbackPageHeader={emojiFeedbackPageHeader}
              onFeedbackPageHeaderChange={setEmojiFeedbackPageHeader}
              slug={formData.slug}
              disabled={!!notePopupEnabled}
              editMode={true}
            />

        {/* AI Generation Settings Section */}
            <AISettingsFeature
              aiGenerationEnabled={aiReviewEnabled}
              fixGrammarEnabled={fixGrammarEnabled}
              onAIEnabledChange={(enabled) => setAiReviewEnabled(enabled)}
              onGrammarEnabledChange={(enabled) => setFixGrammarEnabled(enabled)}
            />

        {/* Falling Stars Section */}
        <FallingStarsFeature
          enabled={fallingEnabled}
          onToggle={handleToggleFalling}
          icon={fallingIcon}
          onIconChange={handleIconChange}
          color={fallingIconColor}
          onColorChange={handleColorChange}
          editMode={true}
        />
        

      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <div className="text-sm text-green-800">{successMessage}</div>
          </div>
        </div>
      )}
      
      {(error || formError) && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="text-sm text-red-800">{error || formError}</div>
          </div>
        </div>
      )}

      {/* Bottom Navigation - placed at the very end */}
      <BottomNavigation 
        mode={mode}
        isSaving={isLoading}
        onSave={handleEditSave}
        onCancel={() => router.push('/prompt-pages')}
      />

      {/* Popup conflict modal */}
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
                {showPopupConflictModal === "note" ? "Emoji Sentiment Flow" : "Friendly Note Pop-up"}
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

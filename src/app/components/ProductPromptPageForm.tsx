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
import { generateAIReview } from "@/utils/ai";

// Import all the new modular components
import CustomerDetailsSection from "./sections/CustomerDetailsSection";
import ProductDetailsSection from "./sections/ProductDetailsSection";
import ProductImageUpload from "./sections/ProductImageUpload";
import FeaturesBenefitsSection from "./sections/FeaturesBenefitsSection";
import { TopNavigation, BottomNavigation } from "./sections/StepNavigation";

// Import step 2 components (already existing)
import ReviewWriteSection from "../dashboard/edit-prompt-page/components/ReviewWriteSection";
import OfferSection from "../dashboard/edit-prompt-page/components/OfferSection";
import EmojiSentimentSection from "../dashboard/edit-prompt-page/components/EmojiSentimentSection";
import DisableAIGenerationSection from "./DisableAIGenerationSection";
import FallingStarsSection from "./FallingStarsSection";
import { FaCommentDots, FaMobile } from "react-icons/fa";
import SectionHeader from "./SectionHeader";

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
  [key: string]: any;
}) {
  console.log('🔥 FIXED VERSION - ProductPromptPageForm loaded at', new Date().toISOString());
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState(initialData || {});
  const [productName, setProductName] = useState(initialData?.product_name || "");

  const [formError, setFormError] = useState<string | null>(null);

  // Product photo state
  const [productPhotoFile, setProductPhotoFile] = useState<File | null>(null);
  const [productPhotoUrl, setProductPhotoUrl] = useState<string | null>(
    initialData?.product_photo || null
  );

  // Step 2 state (when step === 2 or mode === "edit")
  const [offerEnabled, setOfferEnabled] = useState(initialData?.offer_enabled ?? false);
  const [offerTitle, setOfferTitle] = useState(initialData?.offer_title || "Special Offer");
  const [offerBody, setOfferBody] = useState(
    initialData?.offer_body || "Use this code \"1234\" to get a discount on your next purchase."
  );
  const [offerUrl, setOfferUrl] = useState(initialData?.offer_url || "");
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
  const [fallingEnabled, setFallingEnabled] = useState(initialData?.falling_enabled ?? false);
  const [nfcTextEnabled, setNfcTextEnabled] = useState(initialData?.nfc_text_enabled ?? false);

  // Helper function to update form data
  const updateFormData = (data: any) => {
    console.log('🔄 FORM UPDATE: Updating form data with:', data);
    setFormData((prev: any) => {
      const newData = { ...prev, ...data };
      console.log('🔄 FORM UPDATE: New form data state:', newData);
      return newData;
    });
  };

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
          product_name: productName,
          product_photo: uploadedPhotoUrl,
          review_type: "product",
        };
        
      await onSave(step1Data);
      onStepChange?.(2);
    } catch (error: any) {
              setFormError(error.message || "Failed to save. Please try again.");
    }
  };

  // Handle AI review generation
  const handleGenerateAIReview = async (idx: number) => {
    if (!businessProfile) {
      console.error("Business profile not loaded");
      return;
    }
    
    const platforms = formData.review_platforms || [];
    if (!platforms[idx]) {
      console.error("Platform not found at index", idx);
      return;
    }
    
    const platform = platforms[idx];
    const promptPageData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      project_type: (formData.features_or_benefits || []).join(", "),
      product_description: formData.product_description,
    };
    
    try {
      const review = await generateAIReview(
        businessProfile,
        promptPageData,
        platform.name || platform.platform || "Google Business Profile",
        platform.wordCount || 200,
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
    }
  };

  // Handle falling stars toggle
  const handleToggleFalling = () => {
    setFallingEnabled((prev: boolean) => !prev);
  };

  // Product save handler - completely rewritten to force cache refresh
  const handleEditSave = React.useCallback(async () => {
    const operationId = Date.now() + Math.random();
    
    console.log(`🔥 NEW SAVE HANDLER: Starting save ${operationId}`);
    
    if (isLoading) {
      console.log(`🚫 Save blocked - already loading`);
      return;
    }
    
    setFormError("");
    
    try {
      let photoUrl = productPhotoUrl;
      if (productPhotoFile && (!formData.product_photo || productPhotoUrl !== formData.product_photo)) {
        photoUrl = await handleProductPhotoUpload();
      }
      
      const saveData = {
        ...formData,
        product_photo: photoUrl,
        business_name: businessProfile?.business_name || "",
        contact_id: businessProfile?.contact_id || null,
        offerEnabled,
        offerTitle,
        offerBody,
        offerUrl,
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
        friendlyNote: formData.friendly_note || ""
      };
      
      console.log(`🔥 Calling onSave...`);
      await onSave(saveData);
      console.log(`🔥 Save completed successfully`);
    } catch (error: any) {
      console.error(`🔥 Save failed:`, error);
      setFormError(error.message || "Failed to save page");
    }
  }, [isLoading, formData, productPhotoFile, productPhotoUrl, onSave, businessProfile]);

  // Handle form submission to prevent page reload
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🚫 Form submission prevented - using custom save handler");
  };

  return (
    <form 
      className="relative space-y-8"
      onSubmit={handleFormSubmit}
    >
      {/* Page Title */}
      <div className="flex flex-col mt-0 md:mt-[3px] mb-4">
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

      <div className="space-y-8">
                {/* Error Messages */}
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                {formError}
              </div>
            )}

        {/* Customer Details Section */}
        <CustomerDetailsSection 
          formData={formData}
          onFormDataChange={updateFormData}
        />

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
              hideReviewTemplateFields={isUniversal}
            />

        {/* Offer Section */}
            <OfferSection
              enabled={offerEnabled}
              onToggle={() => setOfferEnabled((v: boolean) => !v)}
              title={offerTitle}
              onTitleChange={setOfferTitle}
              description={offerBody}
              onDescriptionChange={setOfferBody}
              url={offerUrl}
              onUrlChange={setOfferUrl}
            />

            {/* Personalized Note Pop-up Section */}
        <div className="rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-2 shadow relative">
              <div className="flex items-center justify-between mb-2 px-2 py-2">
                <div className="flex items-center gap-3">
                  <FaCommentDots className="w-7 h-7 text-slate-blue" />
                  <span className="text-2xl font-bold text-[#1A237E]">
                    Personalized note pop-up
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
            <EmojiSentimentSection
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
            />

        {/* AI Generation Settings Section */}
            <DisableAIGenerationSection
              aiGenerationEnabled={aiReviewEnabled}
          fixGrammarEnabled={fixGrammarEnabled}
              onToggleAI={() => setAiReviewEnabled((v: boolean) => !v)}
          onToggleGrammar={() => setFixGrammarEnabled((v: boolean) => !v)}
        />

        {/* Falling Stars Section */}
        <FallingStarsSection
          enabled={fallingEnabled}
          onToggle={handleToggleFalling}
          icon={fallingIcon}
          onIconChange={handleIconChange}
          color={fallingIconColor}
          onColorChange={handleColorChange}
        />
        
        {/* NFC QR Code Text Section */}
        <div className="rounded-lg p-4 bg-green-50 border border-green-200 flex flex-col gap-2 shadow relative mb-8">
          <div className="flex flex-row justify-between items-start px-2 py-2">
            <SectionHeader
              icon={<FaMobile className="w-7 h-7 text-green-600" />}
              title="NFC scanning text"
              subCopy={
                nfcTextEnabled
                  ? 'QR codes will show "Tap phone or scan with camera" text underneath.'
                  : "QR codes will not show NFC instructions."
              }
              className="!mb-0"
              subCopyLeftOffset="ml-9"
            />
            <div className="flex flex-col justify-start pt-1">
              <button
                type="button"
                onClick={() => setNfcTextEnabled((v: boolean) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${nfcTextEnabled ? "bg-green-600" : "bg-gray-200"}`}
                aria-pressed={!!nfcTextEnabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${nfcTextEnabled ? "translate-x-5" : "translate-x-1"}`}
                />
              </button>
            </div>
          </div>
        </div>
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
                {showPopupConflictModal === "note" ? "Emoji Sentiment Flow" : "Personalized Note Pop-up"}
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

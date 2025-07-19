/**
 * ProductPromptPageForm component
 * 
 * Main form component for creating/editing product prompt pages.
 * Now built using modular components for better maintainability.
 */

"use client";
import React, { useState, useEffect } from "react";
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
import { FaCommentDots } from "react-icons/fa";

export default function ProductPromptPageForm({
  mode,
  initialData,
  onSave,
  onPublish,
  pageTitle,
  supabase,
  businessProfile,
  isUniversal = false,
  onPublishSuccess,
  step = 1,
  onStepChange,
  ...rest
}: {
  mode: "create" | "edit";
  initialData: any;
  onSave: (data: any) => void;
  onPublish?: (data: any) => void;
  pageTitle: string;
  supabase: any;
  businessProfile: any;
  isUniversal?: boolean;
  onPublishSuccess?: (slug: string) => void;
  step?: number;
  onStepChange?: (step: number) => void;
  [key: string]: any;
}) {
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState(initialData || {});
  const [productName, setProductName] = useState(initialData?.product_name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

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
  const [emojiThankYouMessage, setEmojiThankYouMessage] = useState(
    initialData?.emoji_thank_you_message || "Thank you for your feedback. It's important to us."
  );
  const [showPopupConflictModal, setShowPopupConflictModal] = useState<string | null>(null);
  const [fallingEnabled, setFallingEnabled] = useState(initialData?.falling_enabled ?? false);

  // Use shared falling stars hook
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
    const userId = businessProfile?.account_id || businessProfile?.id || "unknown";
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
    setIsSaving(true);
    setFormError(null);
    setSaveError(null);

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
      setSaveError(error.message || "Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle AI review generation
  const handleGenerateAIReview = async (platform: string) => {
    const prompt = `Generate a positive product review for ${productName}. Product description: ${formData.product_description}. Features: ${(formData.features_or_benefits || []).join(", ")}. Customer: ${formData.first_name} ${formData.last_name}, Role: ${formData.role}`;
    
    try {
      const review = await generateAIReview(prompt, businessProfile, supabase);
      return review;
    } catch (error) {
      console.error("Failed to generate AI review:", error);
      throw error;
    }
  };

  // Handle falling stars toggle
  const handleToggleFalling = () => {
    setFallingEnabled((prev: boolean) => !prev);
  };

  // Handle edit mode save
  const handleEditSave = () => {
    const completeFormData = {
      ...formData,
      product_name: productName,
      product_photo: productPhotoUrl,
      review_type: "product",
      review_platforms: formData.review_platforms,
      offer_enabled: offerEnabled,
      offer_title: offerTitle,
      offer_body: offerBody,
      offer_url: offerUrl,
      emoji_sentiment_enabled: emojiSentimentEnabled,
      emoji_sentiment_question: emojiSentimentQuestion,
      emoji_feedback_message: emojiFeedbackMessage,
      emoji_thank_you_message: emojiThankYouMessage,
      falling_enabled: fallingEnabled,
      falling_icon: fallingIcon,
      falling_icon_color: fallingIconColor,
      ai_button_enabled: aiReviewEnabled,
      show_friendly_note: notePopupEnabled,
      fix_grammar_enabled: fixGrammarEnabled,
    };
    onSave(completeFormData);
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setIsSaving(true);
        
        try {
          let uploadedPhotoUrl = productPhotoUrl;
          if (productPhotoFile && (!formData.product_photo || productPhotoUrl !== formData.product_photo)) {
            uploadedPhotoUrl = await handleProductPhotoUpload();
          }
          
          const formDataToSubmit = {
            ...formData,
            product_name: productName,
            product_photo: uploadedPhotoUrl,
            ai_button_enabled: aiReviewEnabled,
            fix_grammar_enabled: fixGrammarEnabled,
            falling_icon: fallingIcon,
            falling_icon_color: fallingIconColor,
            review_type: "product",
          };
          
          if (mode === "create" && step === 2 && onPublish) {
            await onPublish(formDataToSubmit);
          } else {
            await onSave(formDataToSubmit);
          }
          
          if (mode === "create" && step === 2 && typeof onPublishSuccess === "function" && formData.slug) {
            onPublishSuccess(formData.slug);
          }
        } catch (error: any) {
          setFormError(error.message || "Failed to save. Please try again.");
        } finally {
          setIsSaving(false);
        }
      }}
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

      {/* Step Navigation */}
      <TopNavigation 
        mode={mode}
        step={step}
        isSaving={isSaving}
        formData={formData}
        onSave={handleEditSave}
        onStepChange={onStepChange}
        onStep1Continue={handleStep1Continue}
      />

      <div>
        {/* Step 1 Content */}
        {(mode === "create" && step === 1) || mode === "edit" ? (
          <div className="custom-space-y">
            {/* Error Messages */}
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                {formError}
              </div>
            )}
            {saveError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                {saveError}
              </div>
            )}

            {/* Customer Details Section */}
            <CustomerDetailsSection 
              formData={formData}
              onFormDataChange={(data) => setFormData((prev: any) => ({ ...prev, ...data }))}
            />

            {/* Product Details Section */}
            <ProductDetailsSection 
              productName={productName}
              onProductNameChange={setProductName}
              formData={formData}
              onFormDataChange={(data) => setFormData((prev: any) => ({ ...prev, ...data }))}
            />

            {/* Product Image Upload */}
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
              onFormDataChange={(data) => setFormData((prev: any) => ({ ...prev, ...data }))}
            />
          </div>
        ) : mode === "create" ? (
          // Step 2 content for create mode
          <div className="space-y-12">
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
            <div className="rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-2 shadow relative mb-8">
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
              slug={formData.slug}
              disabled={!!notePopupEnabled}
            />

            <DisableAIGenerationSection
              aiGenerationEnabled={aiReviewEnabled}
              fixGrammarEnabled={fixGrammarEnabled}
              onToggleAI={() => setAiReviewEnabled((v: boolean) => !v)}
              onToggleGrammar={() => setFixGrammarEnabled((v: boolean) => !v)}
            />

            <FallingStarsSection
              enabled={fallingEnabled}
              onToggle={handleToggleFalling}
              icon={fallingIcon}
              onIconChange={handleIconChange}
              color={fallingIconColor}
              onColorChange={handleColorChange}
            />
          </div>
        ) : null}

        {/* Edit mode also shows step 2 content */}
        {mode === "edit" && (
          <div className="space-y-12 mt-12">
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

            {/* Personalized Note Pop-up Section for Edit Mode */}
            <div className="rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-2 shadow relative mb-8">
              <div className="flex items-center justify-between mb-2 px-2 py-2">
                <div className="flex items-center gap-2">
                  <FaCommentDots className="w-7 h-7 text-slate-blue" />
                  <span className="text-2xl font-bold text-slate-blue">Personalized Note Pop-up</span>
                </div>
                <button
                  type="button"
                  onClick={() => setNotePopupEnabled((v: boolean) => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${notePopupEnabled ? "bg-slate-blue" : "bg-gray-200"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${notePopupEnabled ? "translate-x-5" : "translate-x-1"}`}
                  />
                </button>
              </div>
              {notePopupEnabled && (
                <div className="px-2">
                  <label
                    htmlFor="friendly_note"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Friendly note content
                  </label>
                  <textarea
                    id="friendly_note"
                    value={formData.friendly_note || ""}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        friendly_note: e.target.value,
                      }))
                    }
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-slate-blue focus:border-slate-blue"
                    rows={4}
                    placeholder="Enter a friendly note to show in a popup before the review form..."
                  />
                </div>
              )}
            </div>

            <EmojiSentimentSection
              enabled={emojiSentimentEnabled}
              onToggle={() => setEmojiSentimentEnabled((v: boolean) => !v)}
              question={emojiSentimentQuestion}
              onQuestionChange={setEmojiSentimentQuestion}
              feedbackMessage={emojiFeedbackMessage}
              onFeedbackMessageChange={setEmojiFeedbackMessage}
              thankYouMessage={emojiThankYouMessage}
              onThankYouMessageChange={setEmojiThankYouMessage}
            />

            <DisableAIGenerationSection
              aiGenerationEnabled={aiReviewEnabled}
              fixGrammarEnabled={fixGrammarEnabled}
              onToggleAI={() => setAiReviewEnabled((v: boolean) => !v)}
              onToggleGrammar={() => setFixGrammarEnabled((v: boolean) => !v)}
            />

            <FallingStarsSection
              enabled={fallingEnabled}
              onToggle={handleToggleFalling}
              icon={fallingIcon}
              onIconChange={handleIconChange}
              color={fallingIconColor}
              onColorChange={handleColorChange}
            />
          </div>
        )}
      </div>

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

      {/* Bottom Navigation - placed at the very end */}
      <BottomNavigation 
        mode={mode}
        step={step}
        isSaving={isSaving}
        formData={formData}
        onSave={handleEditSave}
        onStepChange={onStepChange}
        onStep1Continue={handleStep1Continue}
      />
    </form>
  );
}

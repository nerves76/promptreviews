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
import React from "react";
import { 
  FaInfoCircle, 
  FaWrench, 
  FaTrophy, 
  FaCommentDots, 
  FaMobile 
} from "react-icons/fa";
import RobotTooltip from "./RobotTooltip";
import ReviewWriteSection from "./ReviewWriteSection";
import OfferSection from "./OfferSection";
import EmojiSentimentSection from "./EmojiSentimentSection";
import DisableAIGenerationSection from "./DisableAIGenerationSection";
import FallingStarsSection from "./FallingStarsSection";
import SectionHeader from "./SectionHeader";

interface ServicePromptPageFormProps {
  formData: any;
  setFormData: (data: any) => void;
  onPublish: (data: any) => void;
  mode: string;
  isSaving: boolean;
  formError: string | null;
  campaignType: string;
  isUniversal: boolean;
  services: string[];
  setServices: (services: string[]) => void;
  offerEnabled: boolean;
  setOfferEnabled: (enabled: boolean) => void;
  offerTitle: string;
  setOfferTitle: (title: string) => void;
  offerBody: string;
  setOfferBody: (body: string) => void;
  offerUrl: string;
  setOfferUrl: (url: string) => void;
  notePopupEnabled: boolean;
  setNotePopupEnabled: (enabled: boolean) => void;
  emojiSentimentEnabled: boolean;
  setEmojiSentimentEnabled: (enabled: boolean) => void;
  emojiSentimentQuestion: string;
  setEmojiSentimentQuestion: (question: string) => void;
  emojiFeedbackMessage: string;
  setEmojiFeedbackMessage: (message: string) => void;
  emojiFeedbackPopupHeader: string;
  setEmojiFeedbackPopupHeader: (header: string) => void;
  emojiFeedbackPageHeader: string;
  setEmojiFeedbackPageHeaderChange: (header: string) => void;
  setShowPopupConflictModal: (type: string) => void;
  aiReviewEnabled: boolean;
  setAiReviewEnabled: (enabled: boolean) => void;
  fallingEnabled: boolean;
  handleToggleFalling: () => void;
  fallingIcon: string;
  handleIconChange: (icon: string) => void;
  fallingIconColor: string;
  handleColorChange: (color: string) => void;
  nfcTextEnabled: boolean;
  setNfcTextEnabled: (enabled: boolean) => void;
  handleGenerateAIReview: (platform: string) => void;
}

export default function ServicePromptPageForm({
  formData,
  setFormData,
  onPublish,
  mode,
  isSaving,
  formError,
  campaignType,
  isUniversal,
  services,
  setServices,
  offerEnabled,
  setOfferEnabled,
  offerTitle,
  setOfferTitle,
  offerBody,
  setOfferBody,
  offerUrl,
  setOfferUrl,
  notePopupEnabled,
  setNotePopupEnabled,
  emojiSentimentEnabled,
  setEmojiSentimentEnabled,
  emojiSentimentQuestion,
  setEmojiSentimentQuestion,
  emojiFeedbackMessage,
  setEmojiFeedbackMessage,
  emojiFeedbackPopupHeader,
  setEmojiFeedbackPopupHeader,
  emojiFeedbackPageHeader,
  setEmojiFeedbackPageHeaderChange,
  setShowPopupConflictModal,
  aiReviewEnabled,
  setAiReviewEnabled,
  fallingEnabled,
  handleToggleFalling,
  fallingIcon,
  handleIconChange,
  fallingIconColor,
  handleColorChange,
  nfcTextEnabled,
  setNfcTextEnabled,
  handleGenerateAIReview,
}: ServicePromptPageFormProps) {
  return (
    <form 
      onSubmit={(e) => {
        e.preventDefault();
        if (onPublish) {
          onPublish({
            ...formData,
            formComplete: true,
          });
        }
      }}
    >
      <div className="flex flex-col mt-0 md:mt-[3px]">
        <h1 className="text-4xl font-bold text-slate-blue mt-0 mb-2">
          {mode === "create" ? "Create service prompt page" : "Edit service prompt page"}
        </h1>
        <p className="text-gray-600 text-base max-w-md mt-0 mb-10">
          Create a personalized prompt page to collect reviews from your service customers.
        </p>
      </div>
      
      {/* Top right button - single Save & Publish */}
      <div className="absolute top-4 right-8 z-20 flex gap-2">
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
          disabled={isSaving}
        >
          {isSaving ? "Publishing..." : "Save & publish"}
        </button>
      </div>
      
      <div className="space-y-12">
        {formError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {formError}
          </div>
        )}
        
        {/* Customer/client details - only for individual campaigns */}
        {!isUniversal && campaignType !== 'public' && (
          <div className="mb-6">
            <div className="mb-6 flex items-center gap-3">
              <FaInfoCircle className="w-7 h-7 text-slate-blue" />
              <h2 className="text-2xl font-bold text-slate-blue">
                Customer/client details
              </h2>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label
                  htmlFor="first_name"
                  className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center gap-1"
                >
                  First name{" "}
                  <span className="text-red-600">(required)</span>
                  <RobotTooltip text="This field is passed to AI for prompt generation." />
                </label>
                <input
                  type="text"
                  id="first_name"
                  value={formData.first_name || ""}
                  onChange={(e) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      first_name: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                  placeholder="First name"
                  required
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="last_name"
                  className="block text-sm font-medium text-gray-700 mt-4 mb-2"
                >
                  Last name
                </label>
                <input
                  type="text"
                  id="last_name"
                  value={formData.last_name || ""}
                  onChange={(e) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      last_name: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mt-4 mb-2"
                >
                  Phone number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                  placeholder="Phone number"
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mt-4 mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                  placeholder="Email"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center max-w-[85ch] gap-1"
              >
                Role/position
                <RobotTooltip text="This field is passed to AI for prompt generation." />
              </label>
              <input
                type="text"
                id="role"
                value={formData.role || ""}
                onChange={(e) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    role: e.target.value,
                  }))
                }
                className="mt-1 block w-full max-w-md rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                placeholder="e.g., store manager, marketing director, student"
              />
            </div>
          </div>
        )}
        
        {/* Campaign name - only for public/universal campaigns */}
        {(isUniversal || campaignType === 'public') && (
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              {isUniversal ? 'Prompt page name' : 'Campaign name'} <span className="text-red-600">(required)</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name || ""}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value.slice(0, 50) }))}
              className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
              placeholder={isUniversal ? "Holiday email campaign" : "Summer service campaign"}
              maxLength={50}
              required
            />
          </div>
        )}

        {/* Services Section */}
        <div>
          <div className="mt-20 mb-2 flex items-center gap-2">
            <FaWrench className="w-5 h-5 text-[#1A237E]" />
            <h2 className="text-xl font-semibold text-slate-blue flex items-center gap-1">
              Services provided{" "}
              <RobotTooltip text="This field is passed to AI for prompt generation." />
            </h2>
          </div>
          <div className="space-y-2">
            {services.map((service, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded"
                  value={service}
                  onChange={(e) => {
                    const newServices = [...services];
                    newServices[idx] = e.target.value;
                    setServices(newServices);
                    setFormData((prev: any) => ({
                      ...prev,
                      features_or_benefits: newServices,
                    }));
                  }}
                  required
                  placeholder="e.g., Web Design"
                />
                {services.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newServices = services.filter((_, i) => i !== idx);
                      setServices(newServices);
                      setFormData((prev: any) => ({
                        ...prev,
                        features_or_benefits: newServices,
                      }));
                    }}
                    className="text-red-600 font-bold"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const newServices = [...services, ""];
                setServices(newServices);
                setFormData((prev: any) => ({
                  ...prev,
                  features_or_benefits: newServices,
                }));
              }}
              className="text-blue-600 underline mt-2"
            >
              + Add Service
            </button>
          </div>
        </div>

        {/* Outcome Section */}
        <div>
          <div className="mt-10 mb-2 flex items-center gap-2">
            <FaTrophy className="w-5 h-5 text-[#1A237E]" />
            <h2 className="text-xl font-semibold text-slate-blue flex items-center gap-1">
              Outcome{" "}
              <RobotTooltip text="This field is passed to AI for prompt generation." />
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1 mb-5 max-w-[85ch]">
            Describe the service you provided and how it benefited this client.
          </p>
          <textarea
            id="product_description"
            value={formData.product_description || ""}
            onChange={(e) =>
              setFormData((prev: any) => ({
                ...prev,
                product_description: e.target.value,
              }))
            }
            rows={4}
            className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
            placeholder="Describe the outcome for your client"
            required
          />
        </div>
        
        {/* Review Platforms Section */}
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
              value={formData.friendly_note || ""}
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
          onFeedbackPageHeaderChange={setEmojiFeedbackPageHeaderChange}
          slug={formData.slug}
          disabled={!!notePopupEnabled}
        />
        
        {/* AI Generation Toggle */}
        <DisableAIGenerationSection
          aiGenerationEnabled={aiReviewEnabled}
          fixGrammarEnabled={false}
          onToggleAI={() => setAiReviewEnabled((v: boolean) => !v)}
          onToggleGrammar={() => {}}
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
    </form>
  );
} 
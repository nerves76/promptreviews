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
import CustomerDetailsSection from "./sections/CustomerDetailsSection";
import ReviewWriteSection from "../dashboard/edit-prompt-page/components/ReviewWriteSection";
import OfferSection from "../dashboard/edit-prompt-page/components/OfferSection";
import EmojiSentimentSection from "../dashboard/edit-prompt-page/components/EmojiSentimentSection";
import DisableAIGenerationSection from "./DisableAIGenerationSection";
import FallingStarsSection from "@/app/components/FallingStarsSection";
import { useFallingStars } from "@/hooks/useFallingStars";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import SectionHeader from "./SectionHeader";
import {
  FaInfoCircle,
  FaStar,
  FaGift,
  FaSmile,
  FaBoxOpen,
  FaPlus,
  FaTrash,
} from "react-icons/fa";

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
  campaignType: string;
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
  campaignType,
}: ServicePromptPageFormProps) {
  // Initialize form data state from initialData
  const [formData, setFormData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Update form data when initialData changes
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  // Update form data helper (no auto-save)
  const updateFormData = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Only publish, don't auto-save during form submission
      if (onPublish) {
        const publishData = {
          ...formData,
          formComplete: true,
        };
        
        // onPublish should return the created prompt page data with slug
        const result = await onPublish(publishData);
        
        // Call success callback with the slug from the response
        if (onPublishSuccess) {
          // Check if result has slug, otherwise generate one
          const slug = result?.slug || 
                      publishData.name || 
                      publishData.service_name || 
                      formData.services_offered?.[0] ||
                      'new-service-campaign';
          onPublishSuccess(slug);
        }
      }
    } catch (error) {
      console.error('Error publishing service prompt page:', error);
      setFormError('Failed to publish prompt page. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="max-w-4xl mx-auto bg-white px-6 py-8">
      <div className="space-y-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold leading-6 text-slate-blue">
            {pageTitle}
          </h1>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
            disabled={isSaving}
          >
            {isSaving ? "Publishing..." : "Save & publish"}
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
            onFormDataChange={setFormData}
            campaignType={campaignType}
          />
        )}
        
        {/* Campaign name for public campaigns */}
        {(isUniversal || campaignType === 'public') && (
          <div className="mb-6">
            <div className="mb-6 flex items-center gap-3">
              <FaInfoCircle className="w-7 h-7 text-slate-blue" />
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
        
        {/* Services provided */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <FaStar className="w-5 h-5 text-[#1A237E]" />
            <h2 className="text-xl font-semibold text-slate-blue flex items-center gap-1">
              Services provided{" "}
              <span className="text-red-600">(required)</span>
            </h2>
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
                {(formData.features_or_benefits || []).length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newServices = (formData.features_or_benefits || []).filter((_: any, i: number) => i !== idx);
                      updateFormData('features_or_benefits', newServices);
                    }}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const newServices = [...(formData.features_or_benefits || []), ""];
                updateFormData('features_or_benefits', newServices);
              }}
              className="flex items-center gap-2 text-slate-blue hover:text-slate-blue/80"
            >
              <FaPlus className="w-4 h-4" />
              Add another service
            </button>
          </div>
        </div>

        {/* Outcome */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <FaGift className="w-5 h-5 text-[#1A237E]" />
            <h2 className="text-xl font-semibold text-slate-blue flex items-center gap-1">
              Outcome{" "}
              <span className="text-red-600">(required)</span>
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
            required
          />
        </div>

        {/* Review Platforms Section */}
        <ReviewWriteSection
          value={formData.review_platforms}
          onChange={(platforms) => updateFormData('review_platforms', platforms)}
          onGenerateReview={() => {}} // AI generation handled elsewhere
          hideReviewTemplateFields={isUniversal}
        />
        
        {/* Offer Section */}
        <OfferSection
          enabled={formData.offer_enabled}
          onToggle={() => updateFormData('offer_enabled', !formData.offer_enabled)}
          title={formData.offer_title}
          onTitleChange={(title) => updateFormData('offer_title', title)}
          description={formData.offer_body}
          onDescriptionChange={(body) => updateFormData('offer_body', body)}
          url={formData.offer_url}
          onUrlChange={(url) => updateFormData('offer_url', url)}
        />
        
        {/* Personalized note section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaSmile className="w-7 h-7 text-slate-blue" />
              <span className="text-2xl font-bold text-[#1A237E]">
                Personalized note pop-up
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (formData.emojiSentimentEnabled) {
                  // Show conflict modal would go here
                  return;
                }
                updateFormData('show_friendly_note', !formData.show_friendly_note);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.show_friendly_note ? "bg-slate-blue" : "bg-gray-200"}`}
              aria-pressed={!!formData.show_friendly_note}
              disabled={formData.emojiSentimentEnabled}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${formData.show_friendly_note ? "translate-x-5" : "translate-x-1"}`}
              />
            </button>
          </div>
          <div className="text-sm text-gray-600 mb-4">
            Add a personalized note that appears as a pop-up when customers visit your review page. Use 
            it to set the context and tone for your customer.
          </div>
          {formData.show_friendly_note && (
            <Textarea
              id="friendly_note"
              value={formData.friendly_note || ""}
              onChange={(e) => updateFormData('friendly_note', e.target.value)}
              rows={4}
              className="block w-full"
              placeholder="e.g., Hi John! Thanks for using our service today. We'd love to hear about your experience."
            />
          )}
        </div>

        {/* Emoji Sentiment Section */}
        <EmojiSentimentSection
          enabled={formData.emojiSentimentEnabled}
          onToggle={() => {
            if (formData.show_friendly_note) {
              // Show conflict modal would go here
              return;
            }
            updateFormData('emojiSentimentEnabled', !formData.emojiSentimentEnabled);
          }}
          question={formData.emojiSentimentQuestion}
          onQuestionChange={(question) => updateFormData('emojiSentimentQuestion', question)}
          feedbackMessage={formData.emojiFeedbackMessage}
          onFeedbackMessageChange={(message) => updateFormData('emojiFeedbackMessage', message)}
          thankYouMessage={formData.emojiThankYouMessage}
          onThankYouMessageChange={(val: string) => updateFormData('emojiThankYouMessage', val)}
          feedbackPopupHeader={formData.emojiFeedbackPopupHeader}
          onFeedbackPopupHeaderChange={(header) => updateFormData('emojiFeedbackPopupHeader', header)}
          feedbackPageHeader={formData.emojiFeedbackPageHeader}
          onFeedbackPageHeaderChange={(header) => updateFormData('emojiFeedbackPageHeader', header)}
          slug={formData.slug}
          disabled={!!formData.show_friendly_note}
        />
        
        {/* AI Generation Toggle */}
        <DisableAIGenerationSection
          aiGenerationEnabled={formData.aiButtonEnabled}
          fixGrammarEnabled={false}
          onToggleAI={() => updateFormData('aiButtonEnabled', !formData.aiButtonEnabled)}
          onToggleGrammar={() => {}}
        />
        
        {/* Falling Stars Section */}
        <FallingStarsSection
          enabled={formData.fallingEnabled}
          onToggle={() => updateFormData('fallingEnabled', !formData.fallingEnabled)}
          icon={formData.falling_icon}
          onIconChange={(icon) => updateFormData('falling_icon', icon)}
          color={formData.falling_icon_color}
          onColorChange={(color) => updateFormData('falling_icon_color', color)}
        />

        {/* Bottom Save Button */}
        <div className="flex justify-end pt-8 border-t border-gray-200">
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
            disabled={isSaving}
          >
            {isSaving ? "Publishing..." : "Save & Publish"}
          </button>
        </div>
      </div>
    </form>
  );
} 
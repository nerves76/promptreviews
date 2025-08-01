/**
 * EventPromptPageForm component
 * 
 * Handles the event-specific prompt page form with all its sections:
 * - Customer details (for individual campaigns)
 * - Campaign name (for public campaigns)  
 * - Event information (name, date, venue, description, etc.)
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
  PersonalizedNoteFeature,
  KickstartersFeature
} from "./prompt-features";
import { useFallingStars } from "@/hooks/useFallingStars";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import SectionHeader from "./SectionHeader";
import { TopNavigation, BottomNavigation } from "./sections/StepNavigation";
import { generateContextualReview } from "../../utils/aiReviewGeneration";
import {
  FaInfoCircle,
  FaStar,
  FaGift,
  FaSmile,
  FaCalendarAlt,
  FaPlus,
  FaTrash,
  FaStickyNote,
  FaMapMarkerAlt,
  FaClock,
  FaRobot,
} from "react-icons/fa";
import { MdEvent } from "react-icons/md";


/**
 * EventPromptPageForm component
 *
 * Purpose: Handles the creation and editing of event-specific prompt pages.
 * This component allows businesses to create review pages for specific events,
 * perfect for collecting feedback after conferences, workshops, parties, etc.
 */

interface EventPromptPageFormProps {
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
  onGenerateReview?: (index: number) => void;
}

export default function EventPromptPageForm({
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
}: EventPromptPageFormProps) {
  const router = useRouter();
  
  // Initialize form data state from initialData with safety checks
  const safeInitialData = {
    ...initialData,
    review_platforms: Array.isArray(initialData.review_platforms) ? initialData.review_platforms : [],
    fallingEnabled: initialData.fallingEnabled ?? initialData.falling_enabled ?? true,
    show_friendly_note: initialData.show_friendly_note ?? false,
    // Event-specific fields (using eve_ prefix)
    eve_name: initialData.eve_name || '',
    eve_date: initialData.eve_date || '',
    eve_type: initialData.eve_type || '',
    eve_location: initialData.eve_location || '',
    eve_description: initialData.eve_description || '',
    eve_duration: initialData.eve_duration || '',
    eve_capacity: initialData.eve_capacity || '',
    eve_organizer: initialData.eve_organizer || '',
    eve_special_features: Array.isArray(initialData.eve_special_features) ? initialData.eve_special_features : [''],
    eve_review_guidance: initialData.eve_review_guidance || '',
  };
  
  const [formData, setFormData] = useState(safeInitialData);

  // Update form data when initialData changes (for inheritance)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      console.log('🔄 EventPromptPageForm: initialData changed, updating form data:', initialData);
      setFormData((prev: any) => {
        const newData = { ...prev, ...initialData };
        console.log('🔄 EventPromptPageForm: Updated form data:', newData);
        return newData;
      });
    }
  }, [initialData]);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [aiGeneratingIndex, setAiGeneratingIndex] = useState<number | null>(null);
  
  // AI settings state
  const [aiGenerationEnabled, setAiGenerationEnabled] = useState(
    initialData?.aiButtonEnabled !== false
  );
  const [fixGrammarEnabled, setFixGrammarEnabled] = useState(
    initialData?.fix_grammar_enabled !== false
  );

  // Initialize form data only once on mount or when initialData changes significantly
  useEffect(() => {
    const isInitialLoad = !formData || Object.keys(formData).length === 0;
    const isDifferentRecord = initialData?.id && formData?.id && initialData.id !== formData.id;
    
    if (!isSaving && initialData && (isInitialLoad || isDifferentRecord)) {
      setFormData(safeInitialData);
    }
  }, [initialData, isSaving]);

  // Form data update helper
  const updateFormData = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  // Handle array field updates (event special features)
  const updateArrayField = (fieldName: string, index: number, value: string) => {
    const currentArray = formData[fieldName] || [];
    const newArray = [...currentArray];
    newArray[index] = value;
    updateFormData(fieldName, newArray);
  };

  const addArrayItem = (fieldName: string) => {
    const currentArray = formData[fieldName] || [];
    updateFormData(fieldName, [...currentArray, '']);
  };

  const removeArrayItem = (fieldName: string, index: number) => {
    const currentArray = formData[fieldName] || [];
    const newArray = currentArray.filter((_: any, i: number) => i !== index);
    updateFormData(fieldName, newArray);
  };

  // Generate AI review with event context
  const handleGenerateAIReview = async (idx: number) => {
    setAiGeneratingIndex(idx);
    
    if (!businessProfile) {
      console.error("Business profile not loaded");
      setAiGeneratingIndex(null);
      return;
    }

    const platforms = formData.review_platforms || [];
    if (!platforms[idx]) {
      console.error("Platform not found at index", idx);
      setAiGeneratingIndex(null);
      return;
    }

    const platform = platforms[idx];

    // Create comprehensive event page context
    const eventPageData = {
      review_type: 'event',
      event_name: formData.eve_name,
      event_type: formData.eve_type,
      event_date: formData.eve_date,
      event_location: formData.eve_location,
      event_special_features: formData.eve_special_features?.filter((feature: any) => feature.trim()),
      event_organizer: formData.eve_organizer,
      client_name: formData.first_name || '',
      client_role: formData.role || '',
      friendly_note: formData.friendly_note || '',
    };

    try {
      const generatedReview = await generateContextualReview(
        formData.eve_review_guidance || '',
        formData.eve_description || '',
        formData.eve_special_features?.join(', ') || '',
        'google',
        businessProfile,
        JSON.stringify(eventPageData),
        platform.name
      );

      const updatedPlatforms = [...platforms];
      updatedPlatforms[idx] = {
        ...updatedPlatforms[idx],
        review_text: generatedReview,
      };
      updateFormData('review_platforms', updatedPlatforms);
    } catch (error) {
      console.error("Error generating AI review:", error);
      alert("Failed to generate AI review. Please try again.");
    } finally {
      setAiGeneratingIndex(null);
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = [];
    
    if (!formData.eve_name?.trim()) {
      errors.push('Event name is required');
    }
    
    if (formData.campaign_type === 'public' && !formData.name?.trim()) {
      errors.push('Prompt page name is required for public campaigns');
    }
    
    if (formData.campaign_type === 'individual') {
      if (!formData.first_name?.trim()) {
        errors.push('Customer first name is required for individual campaigns');
      }
      if (!formData.last_name?.trim()) {
        errors.push('Customer last name is required for individual campaigns');
      }
    }
    
    return errors;
  };

  // Handle form submission
  const handleSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    setFormError(null);
    
    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      setFormError(errors.join('. '));
      setIsSaving(false);
      return;
    }
    
    try {
      const saveData = {
        ...formData,
        aiButtonEnabled: aiGenerationEnabled,
        fix_grammar_enabled: fixGrammarEnabled,
        // Explicitly include kickstarters fields to ensure they're saved
        kickstarters_enabled: formData.kickstarters_enabled,
        selected_kickstarters: formData.selected_kickstarters,
      };
      const result = await onSave(saveData);
      if (onPublishSuccess && (result as any)?.slug) {
        onPublishSuccess((result as any).slug);
      }
    } catch (error) {
      console.error('Error saving event prompt page:', error);
      setFormError(
        error instanceof Error 
          ? error.message 
          : 'Failed to save event prompt page. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Falling stars setup
  const { startCelebration, submitted } = useFallingStars() as any;

  return (
    <>
      {/* Page Title and Top Navigation */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-blue">
            {mode === 'create' ? 'Create' : 'Edit'} Event Review Page
          </h1>
          <p className="text-gray-600 mt-2">
            {mode === 'create' 
              ? 'Create a review page for events, rentals, tours, and more.'
              : 'Edit your event review page settings and content.'
            }
          </p>
        </div>
        <TopNavigation
          mode={mode}
          onSave={handleSave}
          isSaving={isSaving}
        />
      </div>

      {/* Falling stars animation */}
      {submitted && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {[...Array(40)].map((_, i) => {
            const left = Math.random() * 98 + Math.random() * 2;
            const animationDelay = Math.random() * 2;
            const animationDuration = 3 + Math.random() * 2;
            return (
              <div
                key={i}
                className="absolute text-yellow-400 text-2xl animate-bounce"
                style={{
                  left: `${left}%`,
                  animationDelay: `${animationDelay}s`,
                  animationDuration: `${animationDuration}s`,
                  top: "-50px",
                }}
              >
                ⭐
              </div>
            );
          })}
        </div>
      )}

      {/* Error Display */}
      {formError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="text-sm text-red-700">
              <strong>Please fix the following errors:</strong>
              <div className="mt-1">{formError}</div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-8">

        {/* Campaign Name (Public campaigns only) */}
        {campaignType === 'public' && (
          <div className="mb-6">
            <div className="mb-6 flex items-center gap-3">
              <MdEvent className="w-7 h-7 text-slate-blue" />
              <h2 className="text-2xl font-bold text-slate-blue">
                Prompt page name
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
              placeholder="Review page for [Event Name]"
              value={formData.name || ''}
              onChange={(e) => updateFormData('name', e.target.value)}
              className="mt-1 block w-full max-w-md"
              required={campaignType === 'public'}
            />
          </div>
        )}

        {/* Customer Details (Individual campaigns only) */}
        {campaignType === 'individual' && (
          <CustomerDetailsSection
            formData={formData}
            onFormDataChange={(updates) => {
              if (typeof updates === 'function') {
                setFormData(updates);
              } else {
                setFormData((prev: any) => ({ ...prev, ...updates }));
              }
            }}
            campaignType={campaignType}
          />
        )}

        {/* Event Information */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <MdEvent className="w-5 h-5 text-[#1A237E]" />
            <h2 className="text-xl font-semibold text-slate-blue">
              Event Information
            </h2>
          </div>
          <div className="mb-4">
            <p className="text-gray-600">Provide details about the event that attendees will review.</p>
          </div>
          
          <div className="space-y-6">
            {/* Event Name and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  Event Name <span className="text-red-600">(required)</span>
                  <div className="group relative">
                    <FaRobot className="w-4 h-4 text-blue-500 cursor-help" />
                    <div className="absolute left-0 bottom-6 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      AI uses this for event-specific review suggestions
                    </div>
                  </div>
                </label>
                <Input
                  placeholder="Annual Conference 2024, Product Launch, etc."
                  value={formData.eve_name}
                  onChange={(e) => updateFormData('eve_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  Event Type
                  <div className="group relative">
                    <FaRobot className="w-4 h-4 text-blue-500 cursor-help" />
                    <div className="absolute left-0 bottom-6 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      AI creates type-specific review content
                    </div>
                  </div>
                </label>
                <Input
                  placeholder="Conference, Workshop, Webinar, Party, etc."
                  value={formData.eve_type}
                  onChange={(e) => updateFormData('eve_type', e.target.value)}
                />
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Date
                </label>
                <Input
                  type="date"
                  value={formData.eve_date}
                  onChange={(e) => updateFormData('eve_date', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration
                </label>
                <Input
                  placeholder="2 hours, Half day, 3 days, etc."
                  value={formData.eve_duration}
                  onChange={(e) => updateFormData('eve_duration', e.target.value)}
                />
              </div>
            </div>

            {/* Location and Capacity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  Event Location
                  <div className="group relative">
                    <FaRobot className="w-4 h-4 text-blue-500 cursor-help" />
                    <div className="absolute left-0 bottom-6 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      AI uses location for venue-specific review context
                    </div>
                  </div>
                </label>
                <Input
                  placeholder="Convention Center, Hotel Ballroom, Online, etc."
                  value={formData.eve_location}
                  onChange={(e) => updateFormData('eve_location', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity (optional)
                </label>
                <Input
                  type="number"
                  placeholder="50, 200, 1000"
                  value={formData.eve_capacity}
                  onChange={(e) => updateFormData('eve_capacity', parseInt(e.target.value) || '')}
                />
              </div>
            </div>

            {/* Event Description */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                Event Description
                <div className="group relative">
                  <FaRobot className="w-4 h-4 text-blue-500 cursor-help" />
                  <div className="absolute left-0 bottom-6 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    AI uses this to create detailed, contextual reviews
                  </div>
                </div>
              </label>
              <Textarea
                placeholder="Provide a detailed description of the event, its purpose, agenda, and what attendees can expect..."
                value={formData.eve_description}
                onChange={(e) => updateFormData('eve_description', e.target.value)}
                rows={4}
              />
            </div>

            {/* Event Organizer */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                Event Organizer
                <div className="group relative">
                  <FaRobot className="w-4 h-4 text-blue-500 cursor-help" />
                  <div className="absolute left-0 bottom-6 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    AI mentions organizer in review content
                  </div>
                </div>
              </label>
              <Input
                placeholder="Your company name or organizing team"
                value={formData.eve_organizer}
                onChange={(e) => updateFormData('eve_organizer', e.target.value)}
              />
            </div>

            {/* Event Special Features */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                Special Features
                <div className="group relative">
                  <FaRobot className="w-4 h-4 text-blue-500 cursor-help" />
                  <div className="absolute left-0 bottom-6 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    AI highlights these features in review suggestions
                  </div>
                </div>
              </label>
              <p className="text-sm text-gray-600 mb-4">
                List key highlights, speakers, activities, or memorable moments from the event.
              </p>
              {(formData.eve_special_features || []).map((feature: any, index: number) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    placeholder={`Special feature ${index + 1}`}
                    value={feature}
                    onChange={(e) => updateArrayField('eve_special_features', index, e.target.value)}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('eve_special_features', index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('eve_special_features')}
                className="inline-flex items-center gap-2 text-slate-blue hover:text-slate-blue/80"
              >
                <FaPlus className="w-4 h-4" />
                Add special feature
              </button>
            </div>

            {/* Review Guidance */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                What should attendees mention in reviews?
                <div className="group relative">
                  <FaRobot className="w-4 h-4 text-blue-500 cursor-help" />
                  <div className="absolute left-0 bottom-6 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    AI uses this to guide review content and suggestions
                  </div>
                </div>
              </label>
              <Textarea
                placeholder="Suggest what attendees should highlight when reviewing this event..."
                value={formData.eve_review_guidance}
                onChange={(e) => updateFormData('eve_review_guidance', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Review Platforms Section */}
        <ReviewWriteSection
          value={Array.isArray(formData.review_platforms) ? formData.review_platforms : []}
          onChange={(platforms) => updateFormData('review_platforms', platforms)}
          onGenerateReview={handleGenerateAIReview}
          hideReviewTemplateFields={campaignType === 'public'}
          aiGeneratingIndex={aiGeneratingIndex}
        />

        {/* Shared Feature Components */}
        <div className="space-y-8">
          {/* Kickstarters Feature */}
          <KickstartersFeature
            enabled={formData.kickstarters_enabled || false}
            selectedKickstarters={formData.selected_kickstarters || []}
            businessName={businessProfile?.name || businessProfile?.business_name || "Business Name"}
            onEnabledChange={(enabled) => updateFormData('kickstarters_enabled', enabled)}
            onKickstartersChange={(kickstarters) => updateFormData('selected_kickstarters', kickstarters)}
            initialData={{
              kickstarters_enabled: formData.kickstarters_enabled,
              selected_kickstarters: formData.selected_kickstarters,
            }}
            editMode={true}
          />

          {/* Offer Feature */}
          <OfferFeature
            enabled={formData.offer_enabled || false}
            onToggle={() => updateFormData('offer_enabled', true)}
            title={formData.offer_title || ''}
            onTitleChange={(title) => updateFormData('offer_title', title)}
            description={formData.offer_body || ''}
            onDescriptionChange={(description) => updateFormData('offer_body', description)}
            url={formData.offer_url || ''}
            onUrlChange={(url) => updateFormData('offer_url', url)}
          />

          {/* Personalized Note Feature */}
          <PersonalizedNoteFeature
            enabled={formData.show_friendly_note || false}
            onToggle={() => {
              if (formData.emojiSentimentEnabled) {
                // Show conflict modal would go here
                return;
              }
              updateFormData('show_friendly_note', !formData.show_friendly_note);
            }}
            note={formData.friendly_note || ''}
            onNoteChange={(note) => updateFormData('friendly_note', note)}
            disabled={formData.emojiSentimentEnabled}
            editMode={true}
          />

          {/* Emoji Sentiment Feature */}
          <EmojiSentimentFeature
            enabled={formData.emojiSentimentEnabled || false}
            onToggle={() => {
              if (formData.show_friendly_note) {
                // Show conflict modal would go here
                return;
              }
              updateFormData('emojiSentimentEnabled', true);
            }}
            question={formData.emojiSentimentQuestion || ''}
            onQuestionChange={(question) => updateFormData('emojiSentimentQuestion', question)}
            feedbackMessage={formData.emojiFeedbackMessage || ''}
            onFeedbackMessageChange={(message) => updateFormData('emojiFeedbackMessage', message)}
            feedbackPageHeader={formData.emojiFeedbackPageHeader || ''}
            onFeedbackPageHeaderChange={(header) => updateFormData('emojiFeedbackPageHeader', header)}
            thankYouMessage={formData.emojiThankYouMessage || ''}
            onThankYouMessageChange={(message) => updateFormData('emojiThankYouMessage', message)}
            disabled={!!formData.show_friendly_note}
            slug={formData.slug}
            editMode={true}
          />

          {/* Falling Stars Feature */}
          <FallingStarsFeature
            enabled={formData.fallingEnabled || false}
            onToggle={() => updateFormData('fallingEnabled', true)}
            icon={formData.fallingIcon || formData.falling_icon || 'star'}
            onIconChange={(icon) => updateFormData('fallingIcon', icon)}
            color={formData.falling_icon_color || '#facc15'}
            onColorChange={(color) => updateFormData('falling_icon_color', color)}
            editMode={true}
          />

          {/* AI Settings Feature */}
          <AISettingsFeature
            aiGenerationEnabled={formData.ai_generation_enabled !== false}
            fixGrammarEnabled={formData.fix_grammar_enabled || false}
            onAIEnabledChange={(enabled) => updateFormData('ai_generation_enabled', enabled)}
            onGrammarEnabledChange={(enabled) => updateFormData('fix_grammar_enabled', enabled)}
          />
        </div>



        {/* Error Display */}
        {formError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <FaInfoCircle className="w-5 h-5" />
              <span>{formError}</span>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <BottomNavigation
          mode="create"
          onSave={handleSave}
          isSaving={isSaving}
          onCancel={() => router.push('/prompt-pages')}
        />
      </form>
    </>
  );
} 
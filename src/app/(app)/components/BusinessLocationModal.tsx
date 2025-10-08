// -----------------------------------------------------------------------------
// Business Location Modal Component
// A single-step form for creating and editing business locations with sharing functionality
// -----------------------------------------------------------------------------

import React, { useState, useEffect, useCallback } from 'react';
import { BusinessLocation } from '@/types/business';
import Icon from '@/components/Icon';
import { 
  OfferFeature,
  EmojiSentimentFeature,
  FallingStarsFeature,
  AISettingsFeature
} from "./prompt-features";
import ReviewPlatformsSection, { ReviewPlatformLink } from '../dashboard/edit-prompt-page/components/ReviewPlatformsSection';
const QRCodeModal = React.lazy(() => import('./QRCodeModal'));
const Cropper = React.lazy(() => import('react-easy-crop'));
import type { Area } from 'react-easy-crop';
import imageCompression from 'browser-image-compression';
import RobotTooltip from './RobotTooltip';

interface BusinessLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (locationData: Partial<BusinessLocation>) => Promise<void>;
  location?: BusinessLocation | null;
  canCreateMore: boolean;
  currentCount: number;
  maxLocations: number;
  businessLogoUrl?: string | null;
  businessReviewPlatforms?: ReviewPlatformLink[];
}

export default function BusinessLocationModal({
  isOpen,
  onClose,
  onSave,
  location,
  canCreateMore,
  currentCount,
  maxLocations,
  businessLogoUrl,
  businessReviewPlatforms,
}: BusinessLocationModalProps) {
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState("");
  const [qrModal, setQrModal] = useState<{
    open: boolean;
    url: string;
    clientName: string;
    logoUrl?: string;
    showNfcText?: boolean;
  } | null>(null);
  
  // Form data state
  const [formData, setFormData] = useState<Partial<BusinessLocation>>({
    name: '',
    address_street: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    address_country: 'USA',
    business_description: '',
    unique_aspects: '',
    ai_dos: '',
    ai_donts: '',
  });

  // Module states
  const [fallingEnabled, setFallingEnabled] = useState(false);
  const [fallingIcon, setFallingIcon] = useState('star');
  const [fallingIconColor, setFallingIconColor] = useState('#fbbf24');
  const [emojiSentimentEnabled, setEmojiSentimentEnabled] = useState(false);
  const [emojiSentimentQuestion, setEmojiSentimentQuestion] = useState('How was your experience?');
  const [emojiFeedbackMessage, setEmojiFeedbackMessage] = useState('How can we improve?');
  const [emojiThankYouMessage, setEmojiThankYouMessage] = useState(
    location?.emoji_thank_you_message || "Thank you for your feedback. It's important to us."
  );
  const [offerEnabled, setOfferEnabled] = useState(false);
  const [offerTitle, setOfferTitle] = useState('');
  const [offerBody, setOfferBody] = useState('');
  const [offerUrl, setOfferUrl] = useState('');
  const [aiReviewEnabled, setAiReviewEnabled] = useState(
    location?.ai_review_enabled !== false,
  );
  const [reviewPlatforms, setReviewPlatforms] = useState<ReviewPlatformLink[]>([]);
  
  // Personalized note state
  const [notePopupEnabled, setNotePopupEnabled] = useState(false);
  const [friendlyNote, setFriendlyNote] = useState('');

  // Photo upload state
  const [locationPhotoUrl, setLocationPhotoUrl] = useState<string | null>(null);
  const [locationPhotoFile, setLocationPhotoFile] = useState<File | null>(null);
  const [locationPhotoError, setLocationPhotoError] = useState('');
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [rawLocationPhotoFile, setRawLocationPhotoFile] = useState<File | null>(null);

  // Reset form when modal opens/closes or location changes
  useEffect(() => {
    if (location) {
      setFormData(location);
      
      // Load module data
      setFallingEnabled(location.falling_enabled || false);
      setFallingIcon(location.falling_icon || 'star');
      setFallingIconColor(location.falling_icon_color || '#fbbf24');
      setEmojiSentimentEnabled(location.emoji_sentiment_enabled || false);
      setEmojiSentimentQuestion(location.emoji_sentiment_question || 'How was your experience?');
      setEmojiFeedbackMessage(location.emoji_feedback_message || 'How can we improve?');
      setEmojiThankYouMessage(location.emoji_thank_you_message || 'Thank you for your feedback. It\'s important to us.');
      setOfferEnabled(location.offer_enabled || false);
      setOfferTitle(location.offer_title || '');
      setOfferBody(location.offer_body || '');
      setOfferUrl(location.offer_url || '');
      setAiReviewEnabled(location.ai_review_enabled !== false);
      setReviewPlatforms(location.review_platforms || []);
      
      // Load personalized note data
      setNotePopupEnabled(location.show_friendly_note || false);
      setFriendlyNote(location.friendly_note || '');
      
      // Load photo data
      setLocationPhotoUrl(location.location_photo_url || null);
      setLocationPhotoFile(null); // Will be set when uploading
    } else {
      setFormData({
        name: '',
        address_street: '',
        address_city: '',
        address_state: '',
        address_zip: '',
        address_country: 'USA',
        business_description: '',
        unique_aspects: '',
        ai_dos: '',
        ai_donts: '',
      });
      
      // Reset module data
      setFallingEnabled(false);
      setFallingIcon('star');
      setFallingIconColor('#fbbf24');
      setEmojiSentimentEnabled(false);
      setEmojiSentimentQuestion('How was your experience?');
      setEmojiFeedbackMessage('How can we improve?');
      setEmojiThankYouMessage('Thank you for your feedback. It\'s important to us.');
      setOfferEnabled(false);
      setOfferTitle('');
      setOfferBody('');
      setOfferUrl('');
      setAiReviewEnabled(true);
      setReviewPlatforms(businessReviewPlatforms || []);
      
      // Reset photo data
      setLocationPhotoUrl(null);
      setLocationPhotoFile(null);
      setLocationPhotoError('');
    }
    setErrors({});
  }, [location, isOpen, businessReviewPlatforms]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear submit error when user starts typing
    if (errors.submit) {
      setErrors(prev => ({ ...prev, submit: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Location name is required';
    }
    
    if (reviewPlatforms.length === 0) {
      newErrors.reviewPlatforms = 'At least one review platform is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!canCreateMore && !location) {
      setShowLimitModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      // Combine form data with module data
      const locationData = {
        ...formData,
        // Module data
        falling_enabled: fallingEnabled,
        falling_icon: fallingIcon,
        falling_icon_color: fallingIconColor,
        emoji_sentiment_enabled: emojiSentimentEnabled,
        emoji_sentiment_question: emojiSentimentQuestion,
        emoji_feedback_message: emojiFeedbackMessage,
        emoji_thank_you_message: emojiThankYouMessage,
        emoji_labels: ['Excellent', 'Satisfied', 'Neutral', 'Unsatisfied', 'Frustrated'], // Default emoji labels
        offer_enabled: offerEnabled,
        offer_title: offerTitle,
        offer_body: offerBody,
        offer_url: offerUrl,
        ai_review_enabled: aiReviewEnabled,
        review_platforms: reviewPlatforms,
        // Personalized note data
        show_friendly_note: notePopupEnabled,
        friendly_note: friendlyNote,
        // Photo data (only send URL, file will be handled separately)
        location_photo_url: locationPhotoUrl,
      };
      
      await onSave(locationData);
      
      // If we just created a location with a prompt page, show success modal
      if (!location) {
        // Set up success modal data - the actual URL will be fetched on the prompt-pages page
        const modalData = {
          url: "", // Will be populated once we fetch the created location's prompt page
          first_name: "",
          phone: "",
          email: "",
          isLocationCreation: true, // Flag to indicate this was a location creation
          locationName: formData.name || "New Location"
        };
        
        localStorage.setItem("showPostSaveModal", JSON.stringify(modalData));
        
        // Close the modal first, then redirect to prompt-pages with locations tab to show the success modal
        onClose();
        
        // Navigate immediately to prompt-pages with locations tab
        window.location.href = "/prompt-pages?tab=locations";
        return;
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving location:', error);
      
      // Extract the specific error message from the API response
      let errorMessage = 'Failed to save location. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as any).message;
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!location?.prompt_page_slug) return;
    
    try {
      const url = `${window.location.origin}/r/${location.prompt_page_slug}`;
      await navigator.clipboard.writeText(url);
      setCopySuccess("Copied!");
      setTimeout(() => setCopySuccess(""), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      setCopySuccess("Failed to copy");
      setTimeout(() => setCopySuccess(""), 2000);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setLocationPhotoError('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setLocationPhotoError('Image must be less than 5MB');
      return;
    }

    try {
      // Compress the image
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      });

      // Create a preview URL
      const previewUrl = URL.createObjectURL(compressedFile);
      setLocationPhotoUrl(previewUrl);
      setLocationPhotoFile(compressedFile);
      setRawLocationPhotoFile(file);
      setLocationPhotoError('');
      setShowCropper(true);
    } catch (error) {
      console.error('Error processing image:', error);
      setLocationPhotoError('Error processing image. Please try again.');
    }
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!rawLocationPhotoFile || !croppedAreaPixels) return;

    try {
      const canvas = document.createElement('canvas');
      const image = new Image();
      
      image.onload = () => {
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );
        
        canvas.toBlob((blob) => {
          if (blob) {
            const croppedFile = new File([blob], rawLocationPhotoFile.name, {
              type: rawLocationPhotoFile.type,
            });
            setLocationPhotoFile(croppedFile);
            setLocationPhotoUrl(URL.createObjectURL(blob));
          }
        }, rawLocationPhotoFile.type);
      };
      
      image.src = URL.createObjectURL(rawLocationPhotoFile);
      setShowCropper(false);
    } catch (error) {
      console.error('Error cropping image:', error);
      setLocationPhotoError('Error cropping image. Please try again.');
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setLocationPhotoUrl(null);
    setLocationPhotoFile(null);
    setRawLocationPhotoFile(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="mx-auto max-w-4xl w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 relative">
            <div className="flex items-center gap-3">
              <Icon name="FaMapMarker" className="w-6 h-6 text-slate-blue" size={24} />
              <h2 className="text-xl font-bold text-slate-blue">
                {location ? 'Edit location' : 'Add new location'}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {/* Save button at top right */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || (!canCreateMore && !location)}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-md hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : (location ? 'Update location' : 'Create location')}
              </button>
              <button
                onClick={onClose}
                className="absolute -top-4 -right-4 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 z-20"
                style={{ width: 48, height: 48 }}
                aria-label="Close modal"
              >
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Location limit indicator */}
          {!location && (
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="text-center">
                <span className="text-sm text-gray-600">
                  {currentCount} of {maxLocations} locations used
                </span>
              </div>
            </div>
          )}

          {/* Form Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {errors.submit}
              </div>
            )}

            <div className="space-y-4">
              {/* Location Photo/Logo Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Location photo/logo
                </label>
                <div className="flex items-center gap-6">
                  {/* Photo Preview */}
                  <div className="flex-shrink-0">
                    {locationPhotoUrl ? (
                      <img
                        src={locationPhotoUrl}
                        alt="Location preview"
                        className="w-24 h-24 rounded-lg object-cover border shadow-sm"
                      />
                    ) : businessLogoUrl ? (
                      <img
                        src={businessLogoUrl}
                        alt="Business logo preview"
                        className="w-24 h-24 rounded-lg object-cover border shadow-sm"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                        <Icon name="FaImage" className="w-8 h-8 text-gray-400" size={32} />
                      </div>
                    )}
                  </div>
                  
                  {/* Upload Controls */}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="location-photo-upload"
                    />
                    <label
                      htmlFor="location-photo-upload"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue cursor-pointer"
                    >
                      <Icon name="FaImage" className="w-4 h-4 mr-2" style={{ color: "#1A237E" }} size={16} />
                      Upload photo
                    </label>
                    {locationPhotoError && (
                      <p className="mt-2 text-sm text-red-600">{locationPhotoError}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Location name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Downtown Seattle Location"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-slate-blue focus:border-slate-blue ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="address_street" className="block text-sm font-medium text-gray-700 mb-1">
                      Street address
                    </label>
                    <input
                      id="address_street"
                      type="text"
                      value={formData.address_street || ''}
                      onChange={(e) => handleInputChange('address_street', e.target.value)}
                      placeholder="123 Main Street"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-blue focus:border-slate-blue"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="address_city" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        City
                        <RobotTooltip text="This field is passed to AI for prompt generation." />
                      </label>
                      <input
                        id="address_city"
                        type="text"
                        value={formData.address_city || ''}
                        onChange={(e) => handleInputChange('address_city', e.target.value)}
                        placeholder="Seattle"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-blue focus:border-slate-blue"
                      />
                    </div>
                    <div>
                      <label htmlFor="address_state" className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <input
                        id="address_state"
                        type="text"
                        value={formData.address_state || ''}
                        onChange={(e) => handleInputChange('address_state', e.target.value)}
                        placeholder="WA"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-blue focus:border-slate-blue"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="address_zip" className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code
                      </label>
                      <input
                        id="address_zip"
                        type="text"
                        value={formData.address_zip || ''}
                        onChange={(e) => handleInputChange('address_zip', e.target.value)}
                        placeholder="98101"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-blue focus:border-slate-blue"
                      />
                    </div>
                    <div>
                      <label htmlFor="address_country" className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <input
                        id="address_country"
                        type="text"
                        value={formData.address_country || 'USA'}
                        onChange={(e) => handleInputChange('address_country', e.target.value)}
                        placeholder="USA"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-blue focus:border-slate-blue"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Training Fields */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="business_description" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    Business description
                    <RobotTooltip text="This helps AI generate better prompts for your location." />
                  </label>
                  <textarea
                    id="business_description"
                    value={formData.business_description || ''}
                    onChange={(e) => handleInputChange('business_description', e.target.value)}
                    placeholder="Describe what your business does at this location..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-blue focus:border-slate-blue"
                  />
                </div>

                <div>
                  <label htmlFor="unique_aspects" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    Unique aspects
                    <RobotTooltip text="What makes this location special? This helps AI generate more personalized prompts." />
                  </label>
                  <textarea
                    id="unique_aspects"
                    value={formData.unique_aspects || ''}
                    onChange={(e) => handleInputChange('unique_aspects', e.target.value)}
                    placeholder="What makes this location unique? Special services, atmosphere, staff, etc..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-blue focus:border-slate-blue"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="ai_dos" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      AI dos
                      <RobotTooltip text="What should AI emphasize when generating prompts for this location?" />
                    </label>
                    <textarea
                      id="ai_dos"
                      value={formData.ai_dos || ''}
                      onChange={(e) => handleInputChange('ai_dos', e.target.value)}
                      placeholder="What should AI emphasize? (e.g., 'emphasize our friendly staff', 'mention our convenient location')"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-blue focus:border-slate-blue"
                    />
                  </div>
                  <div>
                    <label htmlFor="ai_donts" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      AI don'ts
                      <RobotTooltip text="What should AI avoid when generating prompts for this location?" />
                    </label>
                    <textarea
                      id="ai_donts"
                      value={formData.ai_donts || ''}
                      onChange={(e) => handleInputChange('ai_donts', e.target.value)}
                      placeholder="What should AI avoid? (e.g., 'don\'t mention parking issues', 'avoid discussing wait times')"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-blue focus:border-slate-blue"
                    />
                  </div>
                </div>
              </div>

              {/* Review Platforms Section */}
              <ReviewPlatformsSection
                value={reviewPlatforms}
                onChange={setReviewPlatforms}
                errors={errors.reviewPlatforms ? [errors.reviewPlatforms] : []}
              />

              {/* Personalized Note Section */}
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
                        // Show conflict modal would go here
                        return;
                      }
                      setNotePopupEnabled(!notePopupEnabled);
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
                  Add a friendly, personal message to make this location review request feel special.
                </div>
                {notePopupEnabled && (
                  <div className="px-2">
                    <textarea
                      placeholder="Write a personal note to make this location review request feel special..."
                      value={friendlyNote}
                      onChange={(e) => setFriendlyNote(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-blue focus:border-slate-blue bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Modules */}
              <FallingStarsFeature
                enabled={fallingEnabled}
                onToggle={() => setFallingEnabled(!fallingEnabled)}
                icon={fallingIcon}
                onIconChange={setFallingIcon}
                color={fallingIconColor}
                onColorChange={setFallingIconColor}
                editMode={true}
              />

              <EmojiSentimentFeature
                enabled={emojiSentimentEnabled}
                onToggle={() => setEmojiSentimentEnabled(!emojiSentimentEnabled)}
                question={emojiSentimentQuestion}
                onQuestionChange={setEmojiSentimentQuestion}
                feedbackMessage={emojiFeedbackMessage}
                onFeedbackMessageChange={setEmojiFeedbackMessage}
                thankYouMessage={emojiThankYouMessage}
                onThankYouMessageChange={setEmojiThankYouMessage}
                editMode={true}
              />

              <OfferFeature
                enabled={offerEnabled}
                onToggle={() => setOfferEnabled(!offerEnabled)}
                title={offerTitle}
                onTitleChange={setOfferTitle}
                description={offerBody}
                onDescriptionChange={setOfferBody}
                url={offerUrl}
                onUrlChange={setOfferUrl}
              />

              <AISettingsFeature
                aiGenerationEnabled={aiReviewEnabled}
                fixGrammarEnabled={true} // TODO: Add fix_grammar_enabled column
                onAIEnabledChange={(enabled) => setAiReviewEnabled(enabled)}
                onGrammarEnabledChange={() => {}} // TODO: Implement when column is added
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end border-t border-gray-200 px-6 py-4">
            <div className="flex space-x-3">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || (!canCreateMore && !location)}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-md hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : (location ? 'Update location' : 'Create location')}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Location Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-md w-full relative border-2 border-white">
            <button
              className="absolute -top-3 -right-3 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-200 z-10"
              onClick={() => setShowLimitModal(false)}
              aria-label="Close modal"
            >
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Prompty Image */}
            <div className="mb-6 flex justify-center">
              <img
                src="https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/small-prompty-success.png"
                alt="Prompty"
                className="w-16 h-16 object-contain"
              />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-blue mb-2 text-center">
              Location limit reached
            </h2>
            <p className="mb-6 text-gray-700 text-center">
              You've reached the maximum of {maxLocations} business locations for your plan. 
              Contact us if you need more locations for your business.
            </p>
            <a
              href="mailto:support@promptreviews.app?subject=Need more than 10 business locations"
              className="inline-block px-4 py-2 bg-slate-blue text-white rounded-lg font-medium hover:bg-slate-blue/90 transition mb-2 w-full text-center"
            >
              Contact us
            </a>
          </div>
        </div>
      )}

      {/* Cropping Modal */}
      {showCropper && (locationPhotoUrl || businessLogoUrl) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 overflow-y-auto">
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-2xl relative max-w-2xl w-full border-2 border-white">
            <div className="w-full h-96 relative mb-8">
              <React.Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
                <Cropper
                image={locationPhotoUrl || businessLogoUrl || ''}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
              </React.Suspense>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={handleCropCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-slate-blue text-white rounded"
                onClick={handleCropConfirm}
              >
                Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <React.Suspense fallback={null}>
        <QRCodeModal
          isOpen={qrModal?.open || false}
          onClose={() => setQrModal(null)}
          url={qrModal?.url || ""}
          clientName={qrModal?.clientName || ""}
          logoUrl={qrModal?.logoUrl}
          showNfcText={qrModal?.showNfcText}
        />
      </React.Suspense>
    </div>
  );
} 
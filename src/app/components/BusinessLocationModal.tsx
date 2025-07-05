// -----------------------------------------------------------------------------
// Business Location Modal Component
// A 2-step wizard for creating and editing business locations.
// Step 1: Basic information (name, address, contact) + Review Platform Selection
// Step 2: AI training fields (description, unique aspects, dos/don'ts)
// -----------------------------------------------------------------------------

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { BusinessLocation } from '@/types/business';
import { FaMapMarkerAlt, FaImage } from 'react-icons/fa';
import FallingStarsSection from './FallingStarsSection';
import EmojiSentimentSection from '../dashboard/edit-prompt-page/components/EmojiSentimentSection';
import OfferSection from '../dashboard/edit-prompt-page/components/OfferSection';
import ReviewPlatformsSection, { ReviewPlatformLink } from '../dashboard/edit-prompt-page/components/ReviewPlatformsSection';
import DisableAIGenerationSection from './DisableAIGenerationSection';
import Cropper from 'react-easy-crop';
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
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
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
  const [emojiSentimentEnabled, setEmojiSentimentEnabled] = useState(false);
  const [emojiSentimentQuestion, setEmojiSentimentQuestion] = useState('How was your experience?');
  const [emojiFeedbackMessage, setEmojiFeedbackMessage] = useState('How can we improve?');
  const [emojiThankYouMessage, setEmojiThankYouMessage] = useState('Thank you for your feedback. It\'s important to us.');
  const [emojiLabels, setEmojiLabels] = useState(['Excellent', 'Satisfied', 'Neutral', 'Unsatisfied', 'Frustrated']);
  const [offerEnabled, setOfferEnabled] = useState(false);
  const [offerTitle, setOfferTitle] = useState('');
  const [offerBody, setOfferBody] = useState('');
  const [offerUrl, setOfferUrl] = useState('');
  const [aiReviewEnabled, setAiReviewEnabled] = useState(true);
  const [reviewPlatforms, setReviewPlatforms] = useState<ReviewPlatformLink[]>([]);

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
      setEmojiSentimentEnabled(location.emoji_sentiment_enabled || false);
      setEmojiSentimentQuestion(location.emoji_sentiment_question || 'How was your experience?');
      setEmojiFeedbackMessage(location.emoji_feedback_message || 'How can we improve?');
      setEmojiThankYouMessage(location.emoji_thank_you_message || 'Thank you for your feedback. It\'s important to us.');
      setEmojiLabels(location.emoji_labels || ['Excellent', 'Satisfied', 'Neutral', 'Unsatisfied', 'Frustrated']);
      setOfferEnabled(location.offer_enabled || false);
      setOfferTitle(location.offer_title || '');
      setOfferBody(location.offer_body || '');
      setOfferUrl(location.offer_url || '');
      setAiReviewEnabled(location.ai_review_enabled !== false); // Default to true
      
      // Load review platforms from location or business defaults
      if (location.review_platforms && location.review_platforms.length > 0) {
        setReviewPlatforms(location.review_platforms);
      } else if (businessReviewPlatforms && businessReviewPlatforms.length > 0) {
        setReviewPlatforms(businessReviewPlatforms);
      } else {
        setReviewPlatforms([]);
      }
      
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
      setEmojiSentimentEnabled(false);
      setEmojiSentimentQuestion('How was your experience?');
      setEmojiFeedbackMessage('How can we improve?');
      setEmojiThankYouMessage('Thank you for your feedback. It\'s important to us.');
      setEmojiLabels(['Excellent', 'Satisfied', 'Neutral', 'Unsatisfied', 'Frustrated']);
      setOfferEnabled(false);
      setOfferTitle('');
      setOfferBody('');
      setOfferUrl('');
      setAiReviewEnabled(true);
      
      // Initialize review platforms from business defaults
      setReviewPlatforms(businessReviewPlatforms || []);
      
      // Reset photo data
      setLocationPhotoUrl(null);
      setLocationPhotoFile(null);
      setLocationPhotoError('');
    }
    setCurrentStep(1);
    setErrors({});
  }, [location, isOpen, businessReviewPlatforms]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep1 = () => {
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

  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  // Photo upload functions
  const getCroppedImg = async (imageSrc: string, cropPixels: Area) => {
    const image = new window.Image();
    image.src = imageSrc;
    await new Promise((resolve) => {
      image.onload = resolve;
    });
    const canvas = document.createElement('canvas');
    canvas.width = cropPixels.width;
    canvas.height = cropPixels.height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(
      image,
      cropPixels.x,
      cropPixels.y,
      cropPixels.width,
      cropPixels.height,
      0,
      0,
      cropPixels.width,
      cropPixels.height,
    );
    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/webp');
    });
  };

  const handleLocationPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationPhotoError('');
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      setLocationPhotoError('Only PNG, JPG, or WEBP images are allowed.');
      return;
    }
    
    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.3, // 300KB
        maxWidthOrHeight: 600,
        useWebWorker: true,
        fileType: 'image/webp', // Always convert to webp
      });
      
      setRawLocationPhotoFile(compressedFile);
      setShowCropper(true);
      setLocationPhotoUrl(URL.createObjectURL(compressedFile));
    } catch (err) {
      setLocationPhotoError('Failed to compress image. Please try another file.');
      return;
    }
  };

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleCropConfirm = async () => {
    if (!locationPhotoUrl || !croppedAreaPixels) return;
    
    try {
      const croppedBlob = await getCroppedImg(locationPhotoUrl, croppedAreaPixels);
      const croppedFile = new File(
        [croppedBlob],
        (rawLocationPhotoFile?.name?.replace(/\.[^.]+$/, '') || 'location') + '.webp',
        { type: 'image/webp' },
      );
      setLocationPhotoFile(croppedFile);
      setLocationPhotoUrl(URL.createObjectURL(croppedFile));
      setShowCropper(false);
    } catch (err) {
      setLocationPhotoError('Failed to crop image. Please try again.');
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setLocationPhotoFile(null);
    setLocationPhotoUrl(null);
    setRawLocationPhotoFile(null);
  };

  const handleSubmit = async () => {
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }

    if (!canCreateMore && !location) {
      setErrors({ limit: `You've reached the maximum of ${maxLocations} locations for your plan.` });
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
        emoji_sentiment_enabled: emojiSentimentEnabled,
        emoji_sentiment_question: emojiSentimentQuestion,
        emoji_feedback_message: emojiFeedbackMessage,
        emoji_thank_you_message: emojiThankYouMessage,
        emoji_labels: emojiLabels,
        offer_enabled: offerEnabled,
        offer_title: offerTitle,
        offer_body: offerBody,
        offer_url: offerUrl,
        ai_review_enabled: aiReviewEnabled,
        // Review platforms
        review_platforms: reviewPlatforms,
        // Photo data
        location_photo: locationPhotoFile,
        location_photo_url: locationPhotoUrl,
      };
      
      await onSave(locationData);
      onClose();
    } catch (error) {
      console.error('Error saving location:', error);
      setErrors({ submit: 'Failed to save location. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 relative">
            <div className="flex items-center gap-3">
              <FaMapMarkerAlt className="w-6 h-6 text-slate-blue" />
              <Dialog.Title className="text-xl font-bold text-slate-blue">
                {location ? 'Edit Location' : 'Add New Location'}
              </Dialog.Title>
            </div>
            <button
              onClick={onClose}
              className="absolute -top-4 -right-4 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 focus:outline-none z-20 transition-colors"
              style={{ width: 40, height: 40 }}
              aria-label="Close modal"
            >
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step Indicator */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-center space-x-4">
              <div className={`flex items-center ${currentStep >= 1 ? 'text-slate-blue' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-slate-blue text-white' : 'bg-gray-200'}`}>
                  1
                </div>
                <span className="ml-2 text-sm font-medium">Basic Info</span>
              </div>
              <div className="w-16 h-0.5 bg-gray-200" />
              <div className={`flex items-center ${currentStep >= 2 ? 'text-slate-blue' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-slate-blue text-white' : 'bg-gray-200'}`}>
                  2
                </div>
                <span className="ml-2 text-sm font-medium">AI Training & Settings</span>
              </div>
            </div>
            
            {/* Location limit indicator */}
            {!location && (
              <div className="mt-3 text-center">
                <span className="text-sm text-gray-600">
                  {currentCount} of {maxLocations} locations used
                </span>
              </div>
            )}
          </div>

          {/* Form Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            {errors.limit && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {errors.limit}
              </div>
            )}
            
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {errors.submit}
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                {/* Location Photo/Logo Upload - FIRST ITEM */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Location Photo/Logo
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
                          <FaImage className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    {/* Upload Controls */}
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-2">
                        Upload a photo or logo for this location. If not provided, your business logo will be used as default.
                      </p>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleLocationPhotoChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-blue file:text-white hover:file:bg-slate-blue/90"
                      />
                      {locationPhotoError && (
                        <p className="text-sm text-red-600 mt-1">{locationPhotoError}</p>
                      )}
                    </div>
                  </div>
                </div>
                {/* Cropping Modal */}
                {showCropper && (locationPhotoUrl || businessLogoUrl) && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 overflow-y-auto">
                    <div className="bg-white p-6 rounded shadow-lg relative max-w-2xl w-full">
                      <div className="w-full h-96 relative mb-8">
                        <Cropper
                          image={locationPhotoUrl || businessLogoUrl || ''}
                          crop={crop}
                          zoom={zoom}
                          aspect={1}
                          onCropChange={setCrop}
                          onZoomChange={setZoom}
                          onCropComplete={onCropComplete}
                        />
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
                {/* Location Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    Business Location Name <span className="text-red-500">*</span>
                    <RobotTooltip text="This field is passed to AI for prompt generation." />
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Acme Dental - Downtown Seattle"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-slate-blue focus:border-slate-blue ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Enter the full business name as it appears at this location
                  </p>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Address Fields */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="address_street" className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address
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
                      <label htmlFor="address_state" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        State
                        <RobotTooltip text="This field is passed to AI for prompt generation." />
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
                      <label htmlFor="address_zip" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        ZIP Code
                        <RobotTooltip text="This field is passed to AI for prompt generation." />
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
                        value={formData.address_country || ''}
                        onChange={(e) => handleInputChange('address_country', e.target.value)}
                        placeholder="USA"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-blue focus:border-slate-blue"
                      />
                    </div>
                  </div>
                </div>

                {/* Review Platforms Section */}
                <div className="mt-8">
                  <ReviewPlatformsSection
                    value={reviewPlatforms}
                    onChange={setReviewPlatforms}
                    hideReviewTemplateFields={true}
                  />
                  {errors.reviewPlatforms && (
                    <p className="mt-2 text-sm text-red-600">{errors.reviewPlatforms}</p>
                  )}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                {/* Business Description */}
                <div>
                  <label htmlFor="business_description" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    Location Business Description
                    <RobotTooltip text="This field is passed to AI for prompt generation." />
                  </label>
                  <textarea
                    id="business_description"
                    value={formData.business_description || ''}
                    onChange={(e) => handleInputChange('business_description', e.target.value)}
                    rows={3}
                    placeholder="Describe what makes this location special..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-blue focus:border-slate-blue"
                  />
                </div>

                {/* Unique Aspects */}
                <div>
                  <label htmlFor="unique_aspects" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    Unique Aspects of This Location
                    <RobotTooltip text="This field is passed to AI for prompt generation." />
                  </label>
                  <textarea
                    id="unique_aspects"
                    value={formData.unique_aspects || ''}
                    onChange={(e) => handleInputChange('unique_aspects', e.target.value)}
                    rows={3}
                    placeholder="What makes this location different from others?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-blue focus:border-slate-blue"
                  />
                </div>

                {/* AI Training */}
                <div>
                  <label htmlFor="ai_dos" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    AI Do's (What AI should emphasize)
                    <RobotTooltip text="This field is passed to AI for prompt generation." />
                  </label>
                  <textarea
                    id="ai_dos"
                    value={formData.ai_dos || ''}
                    onChange={(e) => handleInputChange('ai_dos', e.target.value)}
                    rows={3}
                    placeholder="e.g., Mention our convenient parking, highlight our evening hours..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-blue focus:border-slate-blue"
                  />
                </div>

                <div>
                  <label htmlFor="ai_donts" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    AI Don'ts (What AI should avoid)
                    <RobotTooltip text="This field is passed to AI for prompt generation." />
                  </label>
                  <textarea
                    id="ai_donts"
                    value={formData.ai_donts || ''}
                    onChange={(e) => handleInputChange('ai_donts', e.target.value)}
                    rows={3}
                    placeholder="e.g., Don't mention competitors, avoid discussing pricing..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-blue focus:border-slate-blue"
                  />
                </div>

                {/* Module Sections */}
                <div className="space-y-6 mt-8">
                  {/* Special Offer Section */}
                  <OfferSection
                    enabled={offerEnabled}
                    onToggle={() => setOfferEnabled((v) => !v)}
                    title={offerTitle}
                    onTitleChange={setOfferTitle}
                    description={offerBody}
                    onDescriptionChange={setOfferBody}
                    url={offerUrl}
                    onUrlChange={setOfferUrl}
                  />

                  {/* Emoji Sentiment Section */}
                  <EmojiSentimentSection
                    enabled={emojiSentimentEnabled}
                    onToggle={() => setEmojiSentimentEnabled((v) => !v)}
                    question={emojiSentimentQuestion}
                    onQuestionChange={setEmojiSentimentQuestion}
                    feedbackMessage={emojiFeedbackMessage}
                    onFeedbackMessageChange={setEmojiFeedbackMessage}
                    thankYouMessage={emojiThankYouMessage}
                    onThankYouMessageChange={setEmojiThankYouMessage}
                    emojiLabels={emojiLabels}
                    onEmojiLabelChange={(idx: number, val: string) => {
                      const newLabels = [...emojiLabels];
                      newLabels[idx] = val;
                      setEmojiLabels(newLabels);
                    }}
                  />

                  {/* AI Review Generation Toggle */}
                  <DisableAIGenerationSection
                    enabled={aiReviewEnabled}
                    onToggle={() => setAiReviewEnabled((v) => !v)}
                  />

                  {/* Falling Stars Section */}
                  <FallingStarsSection
                    enabled={fallingEnabled}
                    onToggle={() => setFallingEnabled((v) => !v)}
                    icon={fallingIcon}
                    onIconChange={setFallingIcon}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end border-t border-gray-200 px-6 py-4">
            <div className="flex space-x-3">
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue"
                >
                  Back
                </button>
              )}
              {currentStep < 2 ? (
                <button
                  onClick={handleNext}
                  disabled={reviewPlatforms.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-md hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || (!canCreateMore && !location)}
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-md hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : (location ? 'Update Location' : 'Create Location')}
                </button>
              )}
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 
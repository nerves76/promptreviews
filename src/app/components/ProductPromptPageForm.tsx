'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { generateAIReview } from '@/utils/ai';
import { FaRobot, FaInfoCircle, FaStar, FaGift, FaBoxOpen, FaHeart, FaGoogle, FaYelp, FaFacebook, FaTripadvisor, FaRegStar, FaSmile, FaThumbsUp, FaBolt, FaRainbow, FaCoffee, FaWrench, FaGlassCheers, FaDumbbell, FaPagelines, FaPeace, FaImage } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import ReviewWriteSection from '../dashboard/edit-prompt-page/components/ReviewWriteSection';
import OfferSection from '../dashboard/edit-prompt-page/components/OfferSection';
import EmojiSentimentSection from '../dashboard/edit-prompt-page/components/EmojiSentimentSection';
import DisableAIGenerationSection from './DisableAIGenerationSection';
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

function getPlatformIcon(url: string, platform: string) {
  const lowerUrl = url?.toLowerCase?.() || '';
  const lowerPlatform = (platform || '').toLowerCase();
  if (lowerUrl.includes('google') || lowerPlatform.includes('google')) return { icon: FaGoogle, label: 'Google' };
  if (lowerUrl.includes('facebook') || lowerPlatform.includes('facebook')) return { icon: FaFacebook, label: 'Facebook' };
  if (lowerUrl.includes('yelp') || lowerPlatform.includes('yelp')) return { icon: FaYelp, label: 'Yelp' };
  if (lowerUrl.includes('tripadvisor') || lowerPlatform.includes('tripadvisor')) return { icon: FaTripadvisor, label: 'TripAdvisor' };
  return { icon: FaRegStar, label: 'Other' };
}

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
  ...rest
}: {
  mode: 'create' | 'edit';
  initialData: any;
  onSave: (data: any) => void;
  onPublish?: (data: any) => void;
  pageTitle: string;
  supabase: any;
  businessProfile: any;
  isUniversal?: boolean;
  onPublishSuccess?: (slug: string) => void;
  [key: string]: any;
}) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    ...initialData,
    emojiThankYouMessage: initialData.emoji_thank_you_message || initialData.emojiThankYouMessage || '',
  });

  useEffect(() => {
    setFormData({
      ...initialData,
      emojiThankYouMessage: initialData.emoji_thank_you_message || initialData.emojiThankYouMessage || '',
    });
    setOfferEnabled(initialData.offer_enabled ?? initialData.offerEnabled ?? false);
    setOfferTitle(initialData.offer_title ?? initialData.offerTitle ?? '');
    setOfferBody(initialData.offer_body ?? initialData.offerBody ?? '');
    setOfferUrl(initialData.offer_url ?? initialData.offerUrl ?? '');
    setEmojiSentimentEnabled(initialData.emoji_sentiment_enabled ?? initialData.emojiSentimentEnabled ?? false);
    setEmojiSentimentQuestion(initialData.emoji_sentiment_question ?? initialData.emojiSentimentQuestion ?? 'How was your experience?');
    setEmojiFeedbackMessage(initialData.emoji_feedback_message ?? initialData.emojiFeedbackMessage ?? 'We value your feedback! Let us know how we can do better.');
  }, [initialData]);

  useEffect(() => {
    if (!formData.slug) {
      let slug = initialData.slug;
      if (!slug && typeof window !== 'undefined') {
        const match = window.location.pathname.match(/edit-prompt-page\/(.+)$/);
        if (match && match[1]) {
          slug = match[1];
        }
      }
      if (slug) {
        setFormData((prev: any) => ({ ...prev, slug }));
      }
    }
  }, [formData.slug, initialData.slug]);

  const [step, setStep] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [features, setFeatures] = useState<string[]>(initialData.features_or_benefits || []);
  const [emojiSentimentEnabled, setEmojiSentimentEnabled] = useState(false);
  const [emojiSentimentQuestion, setEmojiSentimentQuestion] = useState('How was your experience?');
  const [emojiFeedbackMessage, setEmojiFeedbackMessage] = useState('We value your feedback! Let us know how we can do better.');
  const [generatingReview, setGeneratingReview] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noPlatformReviewTemplate, setNoPlatformReviewTemplate] = useState(formData.no_platform_review_template || '');
  const [aiLoadingPhoto, setAiLoadingPhoto] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [aiReviewEnabled, setAiReviewEnabled] = useState(
    initialData.aiReviewEnabled !== undefined ? initialData.aiReviewEnabled : true
  );
  const [fallingEnabled, setFallingEnabled] = useState(true);
  const [iconUpdating, setIconUpdating] = useState(false);
  const [fallingIcon, setFallingIcon] = useState('star');

  const [offerEnabled, setOfferEnabled] = useState(
    initialData.offer_enabled ?? initialData.offerEnabled ?? false
  );
  const [offerTitle, setOfferTitle] = useState(
    initialData.offer_title ?? initialData.offerTitle ?? ''
  );
  const [offerBody, setOfferBody] = useState(
    initialData.offer_body ?? initialData.offerBody ?? ''
  );
  const [offerUrl, setOfferUrl] = useState(
    initialData.offer_url ?? initialData.offerUrl ?? ''
  );

  const [productName, setProductName] = useState(formData.product_name || '');
  const [productPhotoUrl, setProductPhotoUrl] = useState(formData.product_photo || null);
  const [productPhotoFile, setProductPhotoFile] = useState<File | null>(null);
  const [productPhotoError, setProductPhotoError] = useState('');
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [rawProductPhotoFile, setRawProductPhotoFile] = useState<File | null>(null);

  const iconOptions = [
    { key: 'star', label: 'Stars', icon: <FaStar className="w-6 h-6 text-yellow-400" /> },
    { key: 'heart', label: 'Hearts', icon: <FaHeart className="w-6 h-6 text-red-500" /> },
    { key: 'rainbow', label: 'Rainbows', icon: <span className="w-6 h-6 text-2xl">🌈</span> },
    { key: 'thumb', label: 'Thumbs Up', icon: <span className="w-6 h-6 text-2xl">👍</span> },
    { key: 'flex', label: 'Flex', icon: <span className="w-6 h-6 text-2xl">💪</span> },
  ];

  const handleIconChange = (key: string) => {
    setFallingIcon(key);
    setFormData((prev: any) => ({ ...prev, falling_icon: key }));
  };

  const handleAddPlatform = () => {
    setFormData((prev: any) => ({
      ...prev,
      review_platforms: [...prev.review_platforms, { platform: '', url: '' }],
    }));
  };
  const handleRemovePlatform = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      review_platforms: prev.review_platforms.filter((_: any, i: number) => i !== index),
    }));
  };
  const handlePlatformChange = (index: number, field: keyof typeof formData.review_platforms[0], value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      review_platforms: prev.review_platforms.map((platform: any, i: number) => 
        i === index ? { ...platform, [field]: value } : platform
      )
    }));
  };

  const handleGenerateAIReview = async (index: number) => {
    if (!businessProfile) {
      setError('Business profile not loaded. Please try again.');
      return;
    }
    setGeneratingReview(index);
    try {
      const review = await generateAIReview(
        businessProfile,
        {
          first_name: formData.first_name,
          role: formData.role,
          project_type: formData.features_or_benefits.join(', '),
          product_description: formData.product_description,
        },
        formData.review_platforms[index].platform,
        formData.review_platforms[index].wordCount || 200,
        formData.review_platforms[index].customInstructions
      );
      setFormData((prev: any) => ({
        ...prev,
        review_platforms: prev.review_platforms.map((link: any, i: number) =>
          i === index ? { ...link, reviewText: review } : link
        ),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate review');
    } finally {
      setGeneratingReview(null);
    }
  };

  const handleGeneratePhotoTemplate = async () => {
    if (!businessProfile) {
      setError('Business profile not loaded. Please try again.');
      return;
    }
    setAiLoadingPhoto(true);
    try {
      const review = await generateAIReview(
        businessProfile,
        {
          first_name: formData.first_name,
          role: formData.role,
          project_type: formData.features_or_benefits.join(', '),
          product_description: formData.product_description,
        },
        'Photo Testimonial',
        120
      );
      setNoPlatformReviewTemplate(review);
      setFormData((prev: any) => ({ ...prev, no_platform_review_template: review }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate testimonial template');
    } finally {
      setAiLoadingPhoto(false);
    }
  };

  const handleStep1Continue = () => {
    setFormError(null);
    if (!formData.first_name.trim()) {
      setFormError('First name is required.');
      return;
    }
    if (!formData.email.trim() && !formData.phone.trim()) {
      setFormError('Please enter at least an email or phone number.');
      return;
    }
    setStep(2);
  };

  const handleToggleFalling = () => {
    setFallingEnabled((prev) => !prev);
  };

  useEffect(() => {
    if (isUniversal) {
      setFormData((prev: any) => ({
        ...prev,
        offer_enabled: offerEnabled,
        offer_title: offerTitle,
        offer_body: offerBody,
        offer_url: offerUrl,
        emoji_sentiment_enabled: emojiSentimentEnabled,
      }));
    }
  }, [offerEnabled, offerTitle, offerBody, offerUrl, emojiSentimentEnabled, isUniversal]);

  const getCroppedImg = async (imageSrc: string, cropPixels: Area) => {
    const image = new window.Image();
    image.src = imageSrc;
    await new Promise((resolve) => { image.onload = resolve; });
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
      cropPixels.height
    );
    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/png');
    });
  };

  const handleProductPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProductPhotoError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setProductPhotoError('Only PNG or JPG images are allowed.');
      return;
    }
    if (file.size > 600 * 1024) {
      setProductPhotoError('Product photo must be 600KB or less.');
      return;
    }
    setRawProductPhotoFile(file);
    setShowCropper(true);
    setProductPhotoUrl(URL.createObjectURL(file));
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!productPhotoUrl || !croppedAreaPixels) return;
    const croppedBlob = await getCroppedImg(productPhotoUrl, croppedAreaPixels);
    const croppedFile = new File([croppedBlob], rawProductPhotoFile?.name || 'product.png', { type: 'image/png' });
    setProductPhotoFile(croppedFile);
    setProductPhotoUrl(URL.createObjectURL(croppedFile));
    setShowCropper(false);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setProductPhotoFile(null);
    setProductPhotoUrl(null);
    setRawProductPhotoFile(null);
  };

  const handleProductPhotoUpload = async () => {
    if (!productPhotoFile) return null;
    const userId = businessProfile?.account_id || businessProfile?.id || 'unknown';
    const fileExt = productPhotoFile.name.split('.').pop();
    const filePath = `product-photos/${userId}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('products').upload(filePath, productPhotoFile, { upsert: true, contentType: productPhotoFile.type });
    if (uploadError) {
      setProductPhotoError('Failed to upload product photo.');
      return null;
    }
    const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(filePath);
    return publicUrlData?.publicUrl || null;
  };

  return (
    <form onSubmit={async e => { e.preventDefault();
      let uploadedPhotoUrl = productPhotoUrl;
      if (productPhotoFile && (!formData.product_photo || productPhotoUrl !== formData.product_photo)) {
        uploadedPhotoUrl = await handleProductPhotoUpload();
      }
      await onSave({ ...formData, product_name: productName, product_photo: uploadedPhotoUrl, ai_button_enabled: aiReviewEnabled, review_type: 'product' });
      if (mode === 'create' && step === 2 && typeof onPublishSuccess === 'function' && formData.slug) {
        onPublishSuccess(formData.slug);
      }
    }}>
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-3 text-slate-blue">
        {pageTitle}
      </h1>
      {/* Top right button for step 1 (both create and edit) */}
      {step === 1 && (
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
            onClick={handleStep1Continue}
            disabled={isSaving}
          >
            Save & Continue
          </button>
        </div>
      )}
      {/* Top right button group for step 2 (both create and edit) */}
      {step === 2 && (
        <div className="absolute top-4 right-4 z-20 flex flex-row-reverse gap-2">
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 w-28 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
            disabled={isSaving}
          >
            {mode === 'create' ? (isSaving ? 'Publishing...' : 'Save & publish') : (isSaving ? 'Saving...' : 'Save')}
          </button>
          {formData.slug && (
            <a
              href={`/r/${formData.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex justify-center rounded-md border border-slate-blue bg-white py-2 px-4 w-28 text-sm font-medium text-slate-blue shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
            >
              View
            </a>
          )}
        </div>
      )}
      <div>
        {step === 1 ? (
          <div className="custom-space-y">
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{formError}</div>
            )}
            <div className="mb-6 flex items-center gap-2">
              <FaInfoCircle className="w-5 h-5 text-slate-blue" />
              <h2 className="text-xl font-semibold text-slate-blue">Customer/client details</h2>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center gap-1">First name <span className='text-red-600'>(required)</span>
                  <RobotTooltip text="Made available for AI prompt generation." />
                </label>
                <input
                  type="text"
                  id="first_name"
                  value={formData.first_name}
                  onChange={e => setFormData((prev: any) => ({ ...prev, first_name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                  placeholder="First name"
                  required
                />
              </div>
              <div className="flex-1">
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mt-4 mb-2">Last name</label>
                <input
                  type="text"
                  id="last_name"
                  value={formData.last_name}
                  onChange={e => setFormData((prev: any) => ({ ...prev, last_name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                  placeholder="Last name"
                  required
                />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center">
                  Phone number
                  <Tooltip text="So you can text/email them the prompt page." />
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone || ''}
                  onChange={e => setFormData((prev: any) => ({ ...prev, phone: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                  placeholder="Phone number"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center">
                  Email
                  <Tooltip text="So you can text/email them the prompt page." />
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email || ''}
                  onChange={e => setFormData((prev: any) => ({ ...prev, email: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                  placeholder="Email address"
                />
              </div>
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center max-w-[85ch] gap-1">
                Role/position
                <RobotTooltip text="Made available for AI prompt generation." />
              </label>
              <input
                type="text"
                id="role"
                value={formData.role}
                onChange={e => setFormData((prev: any) => ({ ...prev, role: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                placeholder="e.g., store manager, marketing director, student (their role)"
              />
            </div>
            {/* Product Details Header */}
            <div className="flex items-center gap-3 mt-12 mb-6">
              <FaWrench className="w-7 h-7 text-slate-blue" />
              <h2 className="text-2xl font-bold text-slate-blue">Product details</h2>
            </div>
            {/* Product Name */}
            <label htmlFor="product_name" className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center gap-1">
              Product Name
              <RobotTooltip text="Made available for AI prompt generation." />
            </label>
            <input
              type="text"
              id="product_name"
              value={productName}
              onChange={e => setProductName(e.target.value)}
              className="mt-1 mb-4 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
              placeholder="Enter product name"
              required
            />
            {/* Product Sub Copy */}
            <label htmlFor="product_subcopy" className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center gap-1">
              Subcopy under product name
              <Tooltip text="This message appears below the product name on the public page. It's customer-facing and not used for AI training." />
            </label>
            <textarea
              id="product_subcopy"
              value={formData.product_subcopy ?? "Thanks so much for your business! We'd really appreciate it if you took a minute to leave us a review."}
              onChange={e => setFormData((prev: any) => ({ ...prev, product_subcopy: e.target.value }))}
              rows={2}
              className="mt-1 mb-4 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
              placeholder="Thanks so much for your business! We'd really appreciate it if you took a minute to leave us a review."
            />
            {/* Product Image */}
            <label htmlFor="product_photo" className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center gap-1">
              Product image
              <span className="text-xs text-gray-500 ml-2">Max size 300KB</span>
              <Tooltip text="Upload a photo of the product. This will be shown on the public page." />
            </label>
            {productPhotoUrl && (
              <img src={productPhotoUrl} alt="Product preview" className="mb-2 rounded w-40 h-40 object-cover border" />
            )}
            <input
              type="file"
              id="product_photo"
              accept="image/png, image/jpeg"
              onChange={handleProductPhotoChange}
              className="mb-2"
            />
            {productPhotoError && <div className="text-red-600 mb-2">{productPhotoError}</div>}
            {showCropper && productPhotoUrl && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 overflow-y-auto">
                <div className="bg-white p-6 rounded shadow-lg relative max-w-2xl w-full">
                  <div className="w-full h-96 relative mb-8">
                    <Cropper
                      image={productPhotoUrl}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" className="px-4 py-2 bg-gray-200 rounded" onClick={handleCropCancel}>Cancel</button>
                    <button type="button" className="px-4 py-2 bg-slate-blue text-white rounded" onClick={handleCropConfirm}>Crop</button>
                  </div>
                </div>
              </div>
            )}
            {/* Product Description */}
            <label htmlFor="product_description" className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center gap-1">
              Product Description
              <RobotTooltip text="Made available for AI prompt generation." />
              <Tooltip text="Describe the product in detail. This is used to help AI generate more relevant reviews, but is not shown to customers." />
            </label>
            <textarea
              id="product_description"
              value={formData.product_description || ''}
              onChange={e => setFormData((prev: any) => ({ ...prev, product_description: e.target.value }))}
              rows={4}
              className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
              placeholder="Describe the product being reviewed"
              required
            />
            <div className="mt-8 mb-2 flex items-center gap-2">
              <FaStar className="w-5 h-5 text-[#1A237E]" />
              <h2 className="text-xl font-semibold text-slate-blue flex items-center gap-1">
                Features or benefits
                <RobotTooltip text="Made available for AI prompt generation." />
              </h2>
            </div>
            <div className="space-y-2">
              {(formData.features_or_benefits || ['']).map((feature: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    className="w-full border px-3 py-2 rounded"
                    value={feature}
                    onChange={e => {
                      const newFeatures = [...(formData.features_or_benefits || [])];
                      newFeatures[idx] = e.target.value;
                      setFormData((prev: any) => ({ ...prev, features_or_benefits: newFeatures }));
                    }}
                    required
                    placeholder="e.g., Long battery life"
                  />
                  {(formData.features_or_benefits?.length > 1) && (
                    <button type="button" onClick={() => {
                      const newFeatures = (formData.features_or_benefits || []).filter((_: any, i: number) => i !== idx);
                      setFormData((prev: any) => ({ ...prev, features_or_benefits: newFeatures }));
                    }} className="text-red-600 font-bold">&times;</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => {
                setFormData((prev: any) => ({ ...prev, features_or_benefits: [...(formData.features_or_benefits || []), ''] }));
              }} className="text-blue-600 underline mt-2">+ Add Feature/Benefit</button>
            </div>
            <div>
              <label htmlFor="friendly_note" className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center">
                Note popup
                <Tooltip text="This note appears as a popup to the customer on your prompt page." />
              </label>
              <textarea
                key={businessProfile?.business_name || 'no-business-name'}
                id="friendly_note"
                value={formData.friendly_note}
                onChange={e => setFormData((prev: any) => ({ ...prev, friendly_note: e.target.value }))}
                rows={4}
                className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                placeholder="Add a personal note for this customer/client"
              />
            </div>
            <div className="w-full flex justify-end gap-2 mt-8">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
                onClick={handleStep1Continue}
                disabled={isSaving}
              >
                Save & Continue
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            <ReviewWriteSection
              value={formData.review_platforms}
              onChange={val => setFormData((prev: any) => ({ ...prev, review_platforms: val }))}
              onGenerateReview={handleGenerateAIReview}
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
            <EmojiSentimentSection
              enabled={emojiSentimentEnabled}
              onToggle={() => setEmojiSentimentEnabled((v: boolean) => !v)}
              question={emojiSentimentQuestion}
              onQuestionChange={setEmojiSentimentQuestion}
              feedbackMessage={emojiFeedbackMessage}
              onFeedbackMessageChange={setEmojiFeedbackMessage}
              thankYouMessage={formData.emojiThankYouMessage}
              onThankYouMessageChange={(val: string) => setFormData((prev: any) => ({ ...prev, emojiThankYouMessage: val }))}
              emojiLabels={formData.emojiLabels}
              onEmojiLabelChange={(idx: number, val: string) => setFormData((prev: any) => {
                const newLabels = [...(prev.emojiLabels || [])];
                newLabels[idx] = val;
                return { ...prev, emojiLabels: newLabels };
              })}
            />
            <DisableAIGenerationSection
              enabled={aiReviewEnabled}
              onToggle={() => setAiReviewEnabled((v: boolean) => !v)}
            />
            <div className="rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-2 shadow relative mb-8">
              <div className="flex items-center justify-between mb-2 px-2 py-2">
                <div className="flex items-center gap-3">
                  <FaStar className="w-7 h-7 text-slate-blue" />
                  <span className="text-2xl font-bold text-[#1A237E]">Falling star animation</span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleFalling}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${fallingEnabled ? 'bg-slate-blue' : 'bg-gray-200'}`}
                  aria-pressed={!!fallingEnabled}
                  disabled={iconUpdating}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${fallingEnabled ? 'translate-x-5' : 'translate-x-1'}`}
                  />
                </button>
              </div>
              <div className="text-sm text-gray-700 mb-3 max-w-[85ch] px-2">
                Enable a fun animation where stars (or other icons) rain down when the prompt page loads. You can choose the icon below.
              </div>
              <div className="flex gap-4 px-2 flex-wrap">
                {[
                  { key: 'star', label: 'Stars', icon: <FaStar className="w-6 h-6 text-yellow-400" /> },
                  { key: 'heart', label: 'Hearts', icon: <FaHeart className="w-6 h-6 text-red-500" /> },
                  { key: 'smile', label: 'Smiles', icon: <FaSmile className="w-6 h-6 text-yellow-400" /> },
                  { key: 'thumb', label: 'Thumbs Up', icon: <FaThumbsUp className="w-6 h-6 text-blue-500" /> },
                  { key: 'bolt', label: 'Bolts', icon: <FaBolt className="w-6 h-6 text-amber-400" /> },
                  { key: 'rainbow', label: 'Rainbows', icon: <FaRainbow className="w-6 h-6 text-fuchsia-400" /> },
                  { key: 'coffee', label: 'Coffee Cups', icon: <FaCoffee className="w-6 h-6 text-amber-800" /> },
                  { key: 'wrench', label: 'Wrenches', icon: <FaWrench className="w-6 h-6 text-gray-500" /> },
                  { key: 'confetti', label: 'Wine Glass', icon: <FaGlassCheers className="w-6 h-6 text-pink-400" /> },
                  { key: 'barbell', label: 'Barbell', icon: <FaDumbbell className="w-6 h-6 text-gray-600" /> },
                  { key: 'flower', label: 'Flower', icon: <FaPagelines className="w-6 h-6 text-green-500" /> },
                  { key: 'peace', label: 'Peace', icon: <FaPeace className="w-6 h-6 text-purple-500" /> },
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    className={`p-2 rounded-full border transition bg-white flex items-center justify-center ${fallingIcon === opt.key ? 'border-slate-blue ring-2 ring-slate-blue' : 'border-gray-300'}`}
                    onClick={() => setFallingIcon(opt.key)}
                    aria-label={opt.label}
                  >
                    {opt.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {(mode !== 'create' || step === 2) && (
        <>
          {/* Bottom action row: left (Back) and right (Save/View or Save & publish/View) for step 2 */}
          {step === 2 && (
            <div className="w-full flex justify-between items-center pr-2 pb-4 md:pr-6 md:pb-6 mt-8">
              {/* Bottom left Back button */}
              <div>
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-slate-blue shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
                  onClick={() => setStep(1)}
                  disabled={isSaving}
                >
                  Back
                </button>
              </div>
              {/* Bottom right Save/Publish and View buttons */}
              <div className="flex flex-row-reverse gap-2">
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 w-28 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
                  disabled={isSaving}
                >
                  {mode === 'create' ? (isSaving ? 'Publishing...' : 'Save & publish') : (isSaving ? 'Saving...' : 'Save')}
                </button>
                {formData.slug && (
                  <a
                    href={`/r/${formData.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex justify-center rounded-md border border-slate-blue bg-white py-2 px-4 w-28 text-sm font-medium text-slate-blue shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
                  >
                    View
                  </a>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </form>
  );
}

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block align-middle ml-1">
      <button
        type="button"
        tabIndex={0}
        aria-label="Show help"
        className="text-gray-400 hover:text-indigo-600 focus:outline-none"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        style={{ lineHeight: 1 }}
      >
        <span
          className="flex items-center justify-center rounded-full bg-blue-100"
          style={{ width: 16, height: 16, fontSize: 12, color: '#2563eb', fontWeight: 400 }}
        >
          ?
        </span>
      </button>
      {show && (
        <div className="absolute z-20 left-1/2 -translate-x-1/2 mt-2 w-56 p-2 bg-white border border-gray-200 rounded shadow text-xs text-gray-700">
          {text}
        </div>
      )}
    </span>
  );
}

function RobotTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block align-middle ml-1">
      <button
        type="button"
        tabIndex={0}
        aria-label="Show AI info"
        className="text-slate-blue hover:text-indigo-600 focus:outline-none"
        onClick={() => setShow(v => !v)}
        onBlur={() => setShow(false)}
        style={{ lineHeight: 1 }}
      >
        <FaRobot className="inline-block w-4 h-4 align-middle cursor-pointer" title={text} />
      </button>
      {show && (
        <div className="absolute z-20 left-1/2 -translate-x-1/2 mt-2 w-56 p-2 bg-white border border-gray-200 rounded shadow text-xs text-gray-700">
          {text}
        </div>
      )}
    </span>
  );
} 
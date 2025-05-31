'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { generateAIReview } from '@/utils/ai';
import { FaRobot, FaInfoCircle, FaStar, FaGift, FaVideo, FaImage, FaQuoteRight, FaCamera, FaHeart, FaGoogle, FaYelp, FaFacebook, FaTripadvisor, FaRegStar, FaSmile, FaGlobe } from 'react-icons/fa';
import dynamic from 'next/dynamic';
import { slugify } from '@/utils/slugify';
import { useRouter } from 'next/navigation';

// TODO: Move all form state, handlers, and UI from create-prompt-page/page.tsx and dashboard/edit-prompt-page/[slug]/page.tsx into this component.
// Accept props for mode (create/edit), initial data, onSave/onPublish handlers, and page title.
// Render the full prompt page form, including all steps, emoji sentiment flow, falling stars, review platforms, etc.
// This will be used by both create and edit flows for perfect consistency.

function getPlatformIcon(url: string, platform: string): { icon: any, label: string } {
  const lowerUrl = url?.toLowerCase?.() || '';
  const lowerPlatform = (platform || '').toLowerCase();
  if (lowerUrl.includes('google') || lowerPlatform.includes('google')) return { icon: FaGoogle, label: 'Google' };
  if (lowerUrl.includes('facebook') || lowerPlatform.includes('facebook')) return { icon: FaFacebook, label: 'Facebook' };
  if (lowerUrl.includes('yelp') || lowerPlatform.includes('yelp')) return { icon: FaYelp, label: 'Yelp' };
  if (lowerUrl.includes('tripadvisor') || lowerPlatform.includes('tripadvisor')) return { icon: FaTripadvisor, label: 'TripAdvisor' };
  return { icon: FaRegStar, label: 'Other' };
}

export default function PromptPageForm({
  mode,
  initialData,
  onSave,
  onPublish,
  pageTitle,
  supabase,
  businessProfile,
  isUniversal = false,
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

  // Ensure slug is set for the View button
  useEffect(() => {
    if (!formData.slug) {
      // Try to get slug from initialData or from the URL
      let slug = initialData.slug;
      if (!slug && typeof window !== 'undefined') {
        // Try to extract slug from the pathname (e.g. /dashboard/edit-prompt-page/universal-foo)
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
  const [services, setServices] = useState<string[]>(initialData.services_offered || []);
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
  const [fallingIcon, setFallingIcon] = useState('star'); // default icon key

  // Special Offer state
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

  // Handlers for review platforms
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

  // AI review generation
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
          last_name: formData.last_name,
          project_type: formData.services_offered.join(', '),
          outcomes: formData.outcomes,
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

  // Photo testimonial AI template
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
          last_name: formData.last_name,
          project_type: formData.services_offered.join(', '),
          outcomes: formData.outcomes,
        },
        'Photo Testimonial',
        120,
        formData.friendly_note
      );
      setNoPlatformReviewTemplate(review);
      setFormData((prev: any) => ({ ...prev, no_platform_review_template: review }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate testimonial template');
    } finally {
      setAiLoadingPhoto(false);
    }
  };

  // Step 1 validation
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

  // Sync special offer and emoji sentiment state into formData for universal pages
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

  // Render logic
  if (isUniversal) {
    // Render a single-page form for universal prompt pages and return immediately
    return (
      <form onSubmit={e => { 
        e.preventDefault();
        console.log('Universal form submitted!');
        onSave({
          ...formData,
          offer_enabled: offerEnabled,
          offer_title: offerTitle,
          offer_body: offerBody,
          offer_url: offerUrl,
          emoji_sentiment_enabled: emojiSentimentEnabled,
        });
      }}>
        <div className="flex justify-between items-start w-full">
          <div>
            <h1 className="text-4xl font-bold text-[#1A237E] mb-0">Edit Universal Prompt Page</h1>
            <p className="text-base text-gray-600 mb-4 max-w-[60ch] mt-3">
              The Universal Prompt Page are for general reviews. Use this page to collect reviews from anyone, not just specific customers or clients. Frame the QR code and display it prominantly in your business location or share it on social media or in an email newsletter.
            </p>
          </div>
          {/* Top right button group */}
          <div className="flex gap-2 pt-4 pr-4 md:pt-6 md:pr-6">
            {formData.slug ? (
              <a
                href={`/r/${formData.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                View
              </a>
            ) : (
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-gray-300 bg-gray-100 py-2 px-4 text-sm font-medium text-gray-400 shadow-sm cursor-not-allowed"
                disabled
              >
                View
              </button>
            )}
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
              disabled={isSaving}
            >
              Save
            </button>
          </div>
        </div>
        {/* Review Platforms Section */}
        <div className="flex flex-col mb-8 mt-8 px-0 py-2">
          <div className="flex items-center gap-3 mb-2">
            <FaStar className="w-7 h-7 text-[#1A237E]" />
            <h2 className="text-xl font-semibold text-[#1A237E]">Review Platforms</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1 mb-8 max-w-[85ch]">Your business profile platforms have been pre-loaded. You can add more if needed.</p>
          <div className="mt-1 space-y-8">
            {formData.review_platforms && formData.review_platforms.map((link: any, index: number) => (
              <div key={index} className="relative mb-8 mt-0 p-6 border border-indigo-200 rounded-2xl bg-indigo-50">
                {/* Platform icon in top left */}
                {link.url && (
                  <div className="absolute -top-4 -left-4 bg-white rounded-full shadow p-2 flex items-center justify-center" title={getPlatformIcon(link.url, link.platform).label}>
                    {(() => {
                      const { icon: Icon } = getPlatformIcon(link.url, link.platform);
                      return <Icon className="w-6 h-6" />;
                    })()}
                  </div>
                )}
                {/* Remove button in top right */}
                <button
                  type="button"
                  onClick={() => handleRemovePlatform(index)}
                  className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200 text-red-600 text-xl font-bold shadow focus:outline-none focus:ring-2 focus:ring-red-400"
                  aria-label="Remove platform"
                >
                  ×
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label htmlFor={`platform-${index}`} className="block text-sm font-semibold text-[#1A237E] mb-2 flex items-center">Platform name</label>
                    <select
                      id={`platform-${index}`}
                      value={link.platform}
                      onChange={e => handlePlatformChange(index, 'platform', e.target.value)}
                      className="block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                      required
                    >
                      <option value="">Select a platform</option>
                      <option value="Google Business Profile">Google Business Profile</option>
                      <option value="Yelp">Yelp</option>
                      <option value="Facebook">Facebook</option>
                      <option value="TripAdvisor">TripAdvisor</option>
                      <option value="Angi">Angi</option>
                      <option value="Houzz">Houzz</option>
                      <option value="BBB">BBB</option>
                      <option value="Thumbtack">Thumbtack</option>
                      <option value="HomeAdvisor">HomeAdvisor</option>
                      <option value="Trustpilot">Trustpilot</option>
                      <option value="Other">Other</option>
                    </select>
                    {link.platform === 'Other' && (
                      <input
                        type="text"
                        className="mt-2 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                        placeholder="Enter platform name"
                        value={link.customPlatform || ''}
                        onChange={e => handlePlatformChange(index, 'customPlatform', e.target.value)}
                        required
                      />
                    )}
                  </div>
                  <div className="mb-4">
                    <label htmlFor={`url-${index}`} className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      Review URL
                    </label>
                    <input
                      type="url"
                      id={`url-${index}`}
                      value={link.url}
                      onChange={e => handlePlatformChange(index, 'url', e.target.value)}
                      placeholder="https://..."
                      className="block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor={`wordCount-${index}`} className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      Word count limit
                    </label>
                    <input
                      type="number"
                      id={`wordCount-${index}`}
                      value={link.wordCount ?? 200}
                      onChange={e => handlePlatformChange(index, 'wordCount', Math.max(200, parseInt(e.target.value) || 200))}
                      className="block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                      placeholder="Word count limit"
                      min="200"
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor={`customInstructions-${index}`} className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      Custom instructions
                    </label>
                    <input
                      type="text"
                      id={`customInstructions-${index}`}
                      value={link.customInstructions || ''}
                      onChange={e => handlePlatformChange(index, 'customInstructions', e.target.value)}
                      placeholder="Add custom instructions for this platform"
                      className="block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4 min-h-[48px]"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddPlatform}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-2"
            >
              Add Platform
            </button>
          </div>
        </div>
        {/* Emoji Sentiment Flow Section */}
        <div className="flex flex-col mb-8 mt-8">
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <FaSmile className="w-7 h-7 text-[#1A237E]" />
                <h2 className="text-xl font-semibold text-[#1A237E]">Emoji Sentiment Flow</h2>
              </div>
              <button
                type="button"
                onClick={() => setEmojiSentimentEnabled(v => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${emojiSentimentEnabled ? 'bg-slate-blue' : 'bg-gray-200'}`}
                aria-pressed={!!emojiSentimentEnabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${emojiSentimentEnabled ? 'translate-x-5' : 'translate-x-1'}`}
                />
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-1 mb-2 max-w-[85ch]">
              Enabling this routes users to a feedback form if they are less than pleased with their experience. This keeps negative reviews off the web and allows you to respond directly while gathering valuable feedback. Users who select "Delighted" or "Satisfied" are sent to your public prompt page, while those who select "Neutral" or "Unsatisfied" are shown a private feedback form that is saved to your account but not shared publicly.
            </div>
            <div className="text-xs text-blue-700 bg-blue-100 border border-blue-200 rounded px-3 py-2 mb-2 max-w-[85ch]">
              Note: If you have Falling stars feature enabled, it will only run when a user selects "Delighted" or "Satisfied."
            </div>
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Popup question (shown above the emojis):</label>
              <input
                type="text"
                className="block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-2 px-3"
                value={emojiSentimentQuestion}
                onChange={e => setEmojiSentimentQuestion(e.target.value)}
                placeholder="How was your experience?"
                maxLength={80}
                disabled={!emojiSentimentEnabled}
              />
            </div>
            {/* Always show emojis with labels */}
            <div className="flex justify-center gap-3 my-3 select-none">
              <div className="flex flex-col items-center">
                <img src="/emojis/delighted.svg" width="40" height="40" alt="Delighted" title="Delighted" />
                <span className="text-xs mt-1 text-gray-700">Delighted</span>
              </div>
              <div className="flex flex-col items-center">
                <img src="/emojis/satisfied.svg" width="40" height="40" alt="Satisfied" title="Satisfied" />
                <span className="text-xs mt-1 text-gray-700">Satisfied</span>
              </div>
              <div className="flex flex-col items-center">
                <img src="/emojis/neutral.svg" width="40" height="40" alt="Neutral" title="Neutral" />
                <span className="text-xs mt-1 text-gray-700">Neutral</span>
              </div>
              <div className="flex flex-col items-center">
                <img src="/emojis/unsatisfied.svg" width="40" height="40" alt="Unsatisfied" title="Unsatisfied" />
                <span className="text-xs mt-1 text-gray-700">Unsatisfied</span>
              </div>
              <div className="flex flex-col items-center">
                <img src="/emojis/angry.svg" width="40" height="40" alt="Angry" title="Angry" />
                <span className="text-xs mt-1 text-gray-700">Angry</span>
              </div>
            </div>
            {/* Feedback message for indifferent/negative emoji */}
            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Feedback message (shown to customers who select an indifferent or negative emoji):</label>
              <textarea
                className="block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-2 px-3"
                value={emojiFeedbackMessage}
                onChange={e => setEmojiFeedbackMessage(e.target.value)}
                rows={2}
              />
            </div>
            {/* New: Submission thank you message */}
            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Submission thank you message (shown after feedback is submitted):</label>
              <input
                type="text"
                className="block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-2 px-3"
                value={formData.emojiThankYouMessage || ''}
                onChange={e => setFormData((prev: any) => ({ ...prev, emojiThankYouMessage: e.target.value }))}
                placeholder="Thank you for your feedback!"
                maxLength={120}
              />
            </div>
          </div>
        </div>
        {/* Falling Stars Section */}
        <div className="mb-8 mt-8">
          <div className="flex items-center justify-between mb-2 px-0 py-2">
            <h2 className="block text-xl font-semibold text-[#1A237E] flex items-center">
              <FaStar className="w-6 h-6 mr-2 text-slate-blue" />
              Falling star animation
            </h2>
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
          <div className="text-sm text-gray-700 mb-3 max-w-[85ch]">
            Enable a fun animation where stars (or other icons) rain down when the prompt page loads. You can choose the icon below.
          </div>
          <div className={`rounded-2xl border border-indigo-200 bg-indigo-50 p-4 ${!fallingEnabled ? 'opacity-60' : ''}`}>  
            <div className="flex gap-2 bg-white rounded-full px-3 py-1 border border-gray-200 shadow w-max">
              {iconOptions.map(opt => (
                <button
                  key={opt.key}
                  className={`p-1 rounded-full focus:outline-none transition-all ${fallingIcon === opt.key ? 'ring-2 ring-indigo-400 bg-indigo-50' : ''}`}
                  onClick={() => handleIconChange(opt.key)}
                  aria-label={opt.label}
                  type="button"
                  disabled={iconUpdating || !fallingEnabled}
                >
                  {opt.icon}
                  {iconUpdating && fallingIcon === opt.key && (
                    <span className="ml-1 animate-spin w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full inline-block align-middle"></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Special Offer Section */}
        <div className="mb-8 mt-8">
          <div className="flex items-center justify-between mb-2 px-0 py-2">
            <h2 className="block text-xl font-semibold text-[#1A237E] flex items-center">
              <FaGift className="w-6 h-6 mr-2 text-slate-blue" />
              Special offer
            </h2>
            <button
              type="button"
              onClick={() => {
                setOfferEnabled((prev: boolean) => {
                  const newValue = !prev;
                  console.log('[DEBUG] Universal offerEnabled toggled:', newValue);
                  return newValue;
                });
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${offerEnabled ? 'bg-indigo-500' : 'bg-gray-300'}`}
              aria-pressed={!!offerEnabled}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${offerEnabled ? 'translate-x-5' : 'translate-x-1'}`}
              />
            </button>
          </div>
          <div className={`rounded-2xl border border-indigo-200 bg-indigo-50 p-4 ${!offerEnabled ? 'opacity-60' : ''}`}> 
            <input
              type="text"
              value={offerTitle ?? 'Special Offer'}
              onChange={e => setOfferTitle(e.target.value)}
              placeholder="Offer Title (e.g., Special Offer)"
              className="block w-full rounded-md border border-indigo-200 bg-indigo-50 focus:ring-2 focus:ring-indigo-300 focus:outline-none sm:text-sm py-2 px-3 mb-2 font-semibold"
              disabled={!offerEnabled}
            />
            <textarea
              value={offerBody || ''}
              onChange={e => setOfferBody(e.target.value)}
              placeholder="Get 10% off your next visit"
              className="block w-full rounded-md border border-indigo-200 bg-indigo-50 focus:ring-2 focus:ring-indigo-300 focus:outline-none sm:text-sm py-3 px-4"
              rows={2}
              disabled={!offerEnabled}
            />
            <input
              type="url"
              value={offerUrl || ''}
              onChange={e => setOfferUrl(e.target.value)}
              placeholder="Offer URL (e.g., https://yourbusiness.com/claim-reward)"
              className="block w-full rounded-md border border-indigo-200 bg-indigo-50 focus:ring-2 focus:ring-indigo-300 focus:outline-none sm:text-sm py-2 px-3 mt-2"
              disabled={!offerEnabled}
            />
          </div>
          <div className="text-xs text-gray-500 mt-2 max-w-[85ch]">
            Note: Services like Google and Yelp have policies against providing rewards in exchange for reviews, so it's best not to promise a reward for "x" number of reviews, etc.
          </div>
        </div>
        {/* AI Generation Button Section (moved to last) */}
        <div className="flex flex-col mb-8 mt-8 px-0 py-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <FaRobot className="w-7 h-7 text-[#1A237E]" />
              <h2 className="text-xl font-semibold text-[#1A237E]">AI Generation Button</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setAiReviewEnabled((v: boolean) => {
                  const newValue = !v;
                  setFormData((prev: any) => ({ ...prev, aiReviewEnabled: newValue }));
                  return newValue;
                });
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${aiReviewEnabled ? 'bg-slate-blue' : 'bg-gray-200'}`}
              aria-pressed={!!aiReviewEnabled}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${aiReviewEnabled ? 'translate-x-5' : 'translate-x-1'}`}
              />
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2 ml-2 max-w-[85ch]">
            If you would rather not let your customers/clients use AI to generate a review you can turn this off. This can be useful in cases where you have written a custom review that you want your customer to use or if you want to ensure users write the review themselves.
          </p>
        </div>
        {/* Bottom right button group */}
        <div className="w-full flex justify-end gap-2 mt-2 sm:gap-4 z-10 pt-4 pr-4 md:pt-6 md:pr-6">
          {formData.slug ? (
            <a
              href={`/r/${formData.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              View
            </a>
          ) : (
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-gray-300 bg-gray-100 py-2 px-4 text-sm font-medium text-gray-400 shadow-sm cursor-not-allowed"
              disabled
            >
              View
            </button>
          )}
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
            disabled={isSaving}
          >
            Save
          </button>
        </div>
      </form>
    );
  }
  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...formData, aiReviewEnabled }); }}>
      <h1 className="text-4xl font-bold text-[#1A237E] mb-8">{pageTitle}</h1>
      <div>
        {step === 1 ? (
          <div className="custom-space-y">
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{formError}</div>
            )}
            {/* Only show customer/client fields if not universal */}
            {!isUniversal && (
              <>
                <div className="mb-6 flex items-center gap-2">
                  <FaInfoCircle className="w-5 h-5 text-slate-blue" />
                  <h2 className="text-xl font-semibold text-slate-blue">Customer/client details</h2>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mt-4 mb-2">Their first name <span className='text-red-600'>(required)</span></label>
                    <input
                      type="text"
                      id="first_name"
                      value={formData.first_name}
                      onChange={e => setFormData((prev: any) => ({ ...prev, first_name: e.target.value }))}
                      className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                      placeholder="Their first name"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mt-4 mb-2">Their last name</label>
                    <input
                      type="text"
                      id="last_name"
                      value={formData.last_name}
                      onChange={e => setFormData((prev: any) => ({ ...prev, last_name: e.target.value }))}
                      className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                      placeholder="Their last name"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center">
                      Their phone number
                      <Tooltip text="So you can text/email them the prompt page." />
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone || ''}
                      onChange={e => setFormData((prev: any) => ({ ...prev, phone: e.target.value }))}
                      className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                      placeholder="Their phone number"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center">
                      Their email
                      <Tooltip text="So you can text/email them the prompt page." />
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email || ''}
                      onChange={e => setFormData((prev: any) => ({ ...prev, email: e.target.value }))}
                      className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                      placeholder="Their email address"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center max-w-[85ch]">
                    Their role/position
                    <Tooltip text="The role or position of the reviewer helps AI generate more relevant and personalized reviews. For example, a Store Manager might focus on different aspects than a Customer." />
                  </label>
                  <input
                    type="text"
                    id="role"
                    value={formData.role}
                    onChange={e => setFormData((prev: any) => ({ ...prev, role: e.target.value }))}
                    className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                    placeholder="e.g., store manager, marketing director, student (their role)"
                  />
                </div>
                {/* Services Section */}
                <div className="mt-20 mb-2 flex items-center gap-2">
                  <FaStar className="w-5 h-5 text-[#1A237E]" />
                  <h2 className="text-xl font-semibold text-slate-blue">Services you provided</h2>
                </div>
                <div className="space-y-2">
                  {services.map((service, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        className="w-full border px-3 py-2 rounded"
                        value={service}
                        onChange={e => {
                          const newServices = [...services];
                          newServices[idx] = e.target.value;
                          setServices(newServices);
                          setFormData((prev: any) => ({ ...prev, services_offered: newServices }));
                        }}
                        required
                        placeholder="e.g., Web Design"
                      />
                      {services.length > 1 && (
                        <button type="button" onClick={() => {
                          const newServices = services.filter((_, i) => i !== idx);
                          setServices(newServices);
                          setFormData((prev: any) => ({ ...prev, services_offered: newServices }));
                        }} className="text-red-600 font-bold">&times;</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => {
                    setServices([...services, '']);
                    setFormData((prev: any) => ({ ...prev, services_offered: [...services, ''] }));
                  }} className="text-blue-600 underline mt-2">+ Add Service</button>
                </div>
                <div>
                  <label htmlFor="outcomes" className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center">
                    Outcome for them
                    <Tooltip text="Describe the results and benefits the client received. This information helps AI generate more specific and impactful reviews that highlight the value provided." />
                  </label>
                  <p className="text-xs text-gray-500 mt-1 mb-5 max-w-[85ch]">Describe the service you provided and how it benefited this individual.</p>
                  <textarea
                    id="outcomes"
                    value={formData.outcomes}
                    onChange={e => setFormData((prev: any) => ({ ...prev, outcomes: e.target.value }))}
                    rows={4}
                    className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                    placeholder="Describe the outcome for your client"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="friendly_note" className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center">
                    Personalized note to them
                    <Tooltip text="This note appears at the top of the review page. It helps set the context and tone for the review. The AI will use this information to generate more personalized and relevant reviews." />
                  </label>
                  <textarea
                    key={businessProfile?.business_name || 'no-business-name'}
                    id="friendly_note"
                    value={formData.friendly_note}
                    onChange={e => setFormData((prev: any) => ({ ...prev, friendly_note: e.target.value }))}
                    rows={4}
                    className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                    placeholder={`Hi ${formData.first_name || '[name]'}, thanks so much for doing business with ${businessProfile?.business_name || '[business name]'}. As a small business, getting reviews online is super valuable and extends our reach. Thank you for supporting us!\n\n- ${businessProfile?.business_name || '[Account holder name]'}`}
                  />
                  <p className="text-xs text-gray-500 mt-1 mb-5 max-w-[85ch]">This note will appear at the top of the review page for your customer/client. Make it personal!</p>
                </div>
              </>
            )}
            {/* Add universal prompt page fields here if needed */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleStep1Continue}
                className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
              >
                Save & continue
              </button>
            </div>
          </div>
        ) : (
          <div className="custom-space-y">
            {/* Step 2: Review platforms, dos/donts, AI toggle, emoji flow, etc. */}
            {/* ... migrate all step 2 UI here, similar to above ... */}
            {/* For brevity, not all code is shown here, but you would continue migrating all fields and handlers from the original step 2. */}
            <div className="flex justify-end gap-4 mt-12">
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
                disabled={isSaving}
              >
                {isSaving ? 'Publishing...' : 'Save & publish'}
              </button>
            </div>
          </div>
        )}
      </div>
      {!isSaving && (
        <div className="w-full flex justify-end pr-2 pb-4 md:pr-6 md:pb-6 mt-8">
          {formData.slug ? (
            <a
              href={`/r/${formData.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 mr-2"
            >
              View
            </a>
          ) : (
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-gray-300 bg-gray-100 py-2 px-4 text-sm font-medium text-gray-400 shadow-sm cursor-not-allowed"
              disabled
            >
              View
            </button>
          )}
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
            disabled={isSaving}
          >
            Save
          </button>
        </div>
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
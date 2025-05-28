import React from 'react';
import { useState, useEffect } from 'react';
import { generateAIReview } from '@/utils/ai';
import { FaFileAlt, FaInfoCircle, FaStar, FaGift, FaVideo, FaImage, FaQuoteRight, FaCamera, FaHeart, FaGoogle, FaYelp, FaFacebook, FaTripadvisor, FaRegStar, FaSmile } from 'react-icons/fa';
import dynamic from 'next/dynamic';
import { slugify } from '@/utils/slugify';
import { useRouter } from 'next/navigation';

// TODO: Move all form state, handlers, and UI from create-prompt-page/page.tsx and dashboard/edit-prompt-page/[slug]/page.tsx into this component.
// Accept props for mode (create/edit), initial data, onSave/onPublish handlers, and page title.
// Render the full prompt page form, including all steps, emoji sentiment flow, falling stars, review platforms, etc.
// This will be used by both create and edit flows for perfect consistency.

export default function PromptPageForm({
  mode,
  initialData,
  onSave,
  onPublish,
  pageTitle,
  supabase,
  businessProfile,
  ...rest
}: {
  mode: 'create' | 'edit';
  initialData: any;
  onSave: (data: any) => void;
  onPublish?: (data: any) => void;
  pageTitle: string;
  supabase: any;
  businessProfile: any;
  [key: string]: any;
}) {
  const router = useRouter();
  const [formData, setFormData] = useState(initialData);
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

  // Render logic
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(formData); }}>
      <h1 className="text-4xl font-bold text-[#1A237E] mb-8">{pageTitle}</h1>
      <div>
        {step === 1 ? (
          <div className="custom-space-y">
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{formError}</div>
            )}
            <div className="mb-6 flex items-center gap-2">
              <FaInfoCircle className="w-5 h-5 text-[#1A237E]" style={{ color: '#1A237E' }} />
              <h2 className="text-xl font-semibold" style={{ color: '#1A237E' }}>Customer/client details</h2>
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
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center">
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
              <h2 className="text-xl font-semibold" style={{ color: '#1A237E' }}>Services you provided</h2>
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
              <p className="text-xs text-gray-500 mt-1 mb-5">Describe the service you provided and how it benefited this individual.</p>
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
              <p className="text-xs text-gray-500 mt-1 mb-5">This note will appear at the top of the review page for your customer/client. Make it personal!</p>
            </div>
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
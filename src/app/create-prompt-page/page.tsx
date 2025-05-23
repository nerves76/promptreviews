'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { generateAIReview } from '@/utils/ai';
import Header from '../components/Header';
import { slugify } from '@/utils/slugify';
import { FaFileAlt, FaInfoCircle, FaStar, FaGift, FaVideo, FaImage, FaQuoteRight } from 'react-icons/fa';
import { checkAccountLimits } from '@/utils/accountLimits';
import { Dialog } from '@headlessui/react';
import { getUserOrMock } from '@/utils/supabase';
import { ZiggeoRecorder } from 'react-ziggeo';

interface ReviewPlatformLink {
  platform: string;
  url: string;
  wordCount?: number;
  customInstructions?: string;
  reviewText?: string;
  customPlatform?: string;
}

interface BusinessProfile {
  business_name: string;
  services_offered: string;
  company_values: string;
  differentiators: string;
  years_in_business: number;
  industries_served: string;
  taglines: string;
  team_founder_info: string;
  keywords: string;
  default_offer_enabled: boolean;
  default_offer_title: string;
  default_offer_body: string;
}

const REVIEW_TYPES = [
  {
    value: 'review',
    label: 'Prompt Review',
    icon: <FaQuoteRight className="w-6 h-6 text-indigo-500" />,
    description: 'Collect written reviews with AI assistance.'
  },
  {
    value: 'experience',
    label: 'Experiences & Spaces',
    icon: <FaStar className="w-6 h-6 text-yellow-500" />,
    description: 'Gather feedback about experiences or locations.'
  },
  {
    value: 'video',
    label: 'Video Testimonial',
    icon: <FaVideo className="w-6 h-6 text-pink-500" />,
    description: 'Request a video testimonial with custom questions.'
  },
  {
    value: 'photo',
    label: 'Photo + Testimonial',
    icon: <FaImage className="w-6 h-6 text-green-500" />,
    description: 'Collect a photo and a short written testimonial.'
  }
];

const VIDEO_PRESETS = [
  { key: 'quick', label: 'Quick & Easy', length: 30, quality: '720p', desc: '30s, 720p, fast upload' },
  { key: 'short', label: 'Short & High Quality', length: 30, quality: '1080p', desc: '30s, 1080p, best quality' },
  { key: 'standard', label: 'Standard', length: 60, quality: '720p', desc: '60s, 720p, slower upload' },
  { key: 'long', label: 'Long', length: 120, quality: '720p', desc: '120s, 720p, slowest upload' },
];

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

const initialFormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  outcomes: '',
  review_platforms: [] as ReviewPlatformLink[],
  services_offered: '',
  friendly_note: '',
  status: 'draft' as const,
  role: '',
  offer_enabled: false,
  offer_title: '',
  offer_body: '',
  offer_url: '',
  review_type: '',
  video_recipient: '',
  video_note: '',
  video_tips: '',
  video_questions: [''],
  video_preset: 'quick',
  video_max_length: 30,
  video_quality: '720p',
  falling_star: false,
};

function VideoTestimonialSetup({ formData, setFormData }: { formData: typeof initialFormData, setFormData: React.Dispatch<React.SetStateAction<typeof initialFormData>> }) {
  const ZIGGEO_API_KEY = process.env.NEXT_PUBLIC_ZIGGEO_API_KEY || '';
  const [videoToken, setVideoToken] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Name/Info (optional)</label>
        <input
          type="text"
          value={formData.video_recipient}
          onChange={e => setFormData((prev) => ({ ...prev, video_recipient: e.target.value }))}
          className="block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
          placeholder="e.g., John Doe, Customer"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Personalized Note</label>
        <textarea
          value={formData.video_note}
          onChange={e => setFormData((prev) => ({ ...prev, video_note: e.target.value }))}
          rows={3}
          className="block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
          placeholder="Add a personal message for the reviewer"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Video Tips/Advice</label>
        <textarea
          value={formData.video_tips}
          onChange={e => setFormData((prev) => ({ ...prev, video_tips: e.target.value }))}
          rows={2}
          className="block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
          placeholder="Tips for recording a great video (lighting, sound, etc.)"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Custom Questions (up to 5)</label>
        {formData.video_questions.map((q, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={q}
              onChange={e => setFormData((prev) => ({ ...prev, video_questions: prev.video_questions.map((qq, idx) => idx === i ? e.target.value : qq) }))}
              className="flex-1 rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-2 px-3"
              placeholder={`Question ${i + 1}`}
              maxLength={120}
            />
            <button type="button" onClick={() => setFormData((prev) => ({ ...prev, video_questions: prev.video_questions.filter((_, idx) => idx !== i) }))} className="text-red-500 hover:text-red-700 px-2">Remove</button>
          </div>
        ))}
        {formData.video_questions.length < 5 && (
          <button type="button" onClick={() => setFormData((prev) => ({ ...prev, video_questions: [...prev.video_questions, ''] }))} className="mt-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded">Add Question</button>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Falling Star Animation</label>
        <button
          type="button"
          onClick={() => setFormData((prev) => ({ ...prev, falling_star: !prev.falling_star }))}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.falling_star ? 'bg-indigo-500' : 'bg-gray-300'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${formData.falling_star ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
        <span className="ml-2 text-xs text-gray-500">Show animation on video upload</span>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Video Length & Quality</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {VIDEO_PRESETS.map(preset => (
            <label key={preset.key} className={`flex items-center gap-3 p-3 rounded border cursor-pointer ${formData.video_preset === preset.key ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'}`}>
              <input
                type="radio"
                name="video_preset"
                value={preset.key}
                checked={formData.video_preset === preset.key}
                onChange={() => setFormData((prev) => ({ ...prev, video_preset: preset.key, video_max_length: preset.length, video_quality: preset.quality }))}
                className="form-radio text-indigo-600"
              />
              <span className="font-medium">{preset.label}</span>
              <span className="text-xs text-gray-500">{preset.desc}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="mt-6">
        <div className="p-4 bg-gray-50 border border-gray-200 rounded">
          <div className="font-semibold mb-2">Video Recorder (Ziggeo)</div>
          <div className="text-xs text-gray-500 mb-2">Recorder will be configured for {formData.video_max_length}s, {formData.video_quality}.</div>
          <div className="w-full flex items-center justify-center bg-gray-100 rounded border border-dashed border-gray-300 min-h-48 py-4">
            {ZIGGEO_API_KEY ? (
              <ZiggeoRecorder
                apiKey={ZIGGEO_API_KEY}
                height={240}
                width={360}
                maxLength={formData.video_max_length}
                videoProfile={formData.video_quality === '1080p' ? 'hd' : 'standard'}
                onUploaded={(embedding: any) => {
                  setVideoToken(embedding.video.token);
                  setFormData(prev => ({ ...prev, ziggeo_video_token: embedding.video.token }));
                }}
                onError={(err: any) => {
                  alert('Video recording error: ' + (err?.message || err));
                }}
              />
            ) : (
              <span className="text-gray-400">[Ziggeo API key not set. Add NEXT_PUBLIC_ZIGGEO_API_KEY to your .env]</span>
            )}
          </div>
          {videoToken && (
            <div className="mt-2 text-xs text-green-600">Video uploaded! Token: {videoToken}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreatePromptPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [showTypeModal, setShowTypeModal] = useState(true);
  const [formData, setFormData] = useState(initialFormData);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [generatingReview, setGeneratingReview] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalMessage, setUpgradeModalMessage] = useState<string | null>(null);

  // Debug logging
  console.log('RENDER: review_type:', formData.review_type, 'showTypeModal:', showTypeModal);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const loadBusinessProfile = async () => {
      try {
        const { data: { user } } = await getUserOrMock(supabase);
        if (!user) {
          console.log('No user found');
          return;
        }

        const { data: businessData } = await supabase
          .from('businesses')
          .select('*')
          .eq('account_id', user.id)
          .single();

        console.log('Fetched businessData:', businessData);

        if (businessData) {
          setBusinessProfile(businessData);
          // Pre-fill offer fields from business default if enabled
          if (businessData.default_offer_enabled) {
            setFormData(prev => ({ ...prev, offer_enabled: true, offer_title: businessData.default_offer_title || 'Special Offer', offer_body: businessData.default_offer_body || '' }));
          }
          if (businessData.preferred_review_platforms) {
            try {
              console.log('Raw preferred_review_platforms:', businessData.preferred_review_platforms);
              const platforms = JSON.parse(businessData.preferred_review_platforms);
              console.log('Parsed platforms:', platforms);
              if (Array.isArray(platforms)) {
                setFormData(prev => ({
                  ...prev,
                  review_platforms: platforms.map(p => ({
                    platform: p.name || p.platform || '',
                    url: p.url,
                    wordCount: p.wordCount || 200
                  }))
                }));
              }
            } catch (e) {
              console.error('Error parsing platforms:', e);
            }
          }
        }
      } catch (err) {
        console.error('Error loading business profile:', err);
      }
    };
    loadBusinessProfile();
  }, [supabase]);

  // Debug: Log review_platforms whenever it changes
  useEffect(() => {
    console.log('Review platforms state updated:', formData.review_platforms);
  }, [formData.review_platforms]);

  const handleAddPlatform = () => {
    setFormData(prev => ({
      ...prev,
      review_platforms: [...prev.review_platforms, { platform: '', url: '' }],
    }));
  };

  const handleRemovePlatform = (index: number) => {
    setFormData(prev => ({
      ...prev,
      review_platforms: prev.review_platforms.filter((_, i) => i !== index),
    }));
  };

  const handlePlatformChange = (index: number, field: keyof typeof formData.review_platforms[0], value: any) => {
    setFormData(prev => ({
      ...prev,
      review_platforms: prev.review_platforms.map((platform, i) => 
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
          last_name: formData.last_name,
          project_type: formData.services_offered,
          outcomes: formData.outcomes,
        },
        formData.review_platforms[index].platform,
        formData.review_platforms[index].wordCount || 200,
        formData.review_platforms[index].customInstructions
      );
      setFormData(prev => ({
        ...prev,
        review_platforms: prev.review_platforms.map((link, i) =>
          i === index ? { ...link, reviewText: review } : link
        ),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate review');
    } finally {
      setGeneratingReview(null);
    }
  };

  const handleOfferFieldsChange = (offerBody: string) => {
    if (offerBody) {
      setFormData(prev => ({ ...prev, offer_body: offerBody }));
    } else {
      setFormData(prev => ({ ...prev, offer_body: '' }));
    }
  };

  const handleSubmit = async () => {
    try {
      const { data: { user } } = await getUserOrMock(supabase);
      if (!user) throw new Error('No user found');

      // Check account limits before creating prompt page
      const { allowed, reason } = await checkAccountLimits(supabase, user.id, 'prompt_page');
      if (!allowed) {
        setUpgradeModalMessage(reason || 'You have reached your plan limit. Please upgrade to create more prompt pages.');
        setShowUpgradeModal(true);
        return;
      }

      const { data: businessData } = await supabase
        .from('businesses')
        .select('*')
        .eq('account_id', user.id)
        .single();

      if (!businessData) throw new Error('No business found');

      const review_platforms_with_wordCount = formData.review_platforms.map(link => ({
        ...link,
        wordCount: link.wordCount ? Math.max(200, Number(link.wordCount)) : 200
      }));
      const { data, error } = await supabase
        .from('prompt_pages')
        .insert([
          {
            ...formData,
            review_platforms: review_platforms_with_wordCount,
            account_id: user.id,
            status: 'draft'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      router.push(`/dashboard/edit-prompt-page/${data.slug}`);
    } catch (error) {
      console.error('Error creating prompt page:', error);
      setError('Failed to create prompt page. Please try again.');
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mt-4 mb-2">Phone Number</label>
          <input
            type="tel"
            id="phone"
            value={formData.phone || ''}
            onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
            placeholder="Phone number"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mt-4 mb-2">Email</label>
          <input
            type="email"
            id="email"
            value={formData.email || ''}
            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
            placeholder="Email address"
          />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mt-16 mb-2">Customer/Client Details</h3>

      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mt-4 mb-2">First Name</label>
          <input
            type="text"
            id="first_name"
            value={formData.first_name}
            onChange={e => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
            className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
            placeholder="First Name"
            required
          />
        </div>
        <div className="flex-1">
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mt-4 mb-2">Last Name</label>
          <input
            type="text"
            id="last_name"
            value={formData.last_name}
            onChange={e => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
            className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
            placeholder="Last Name"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center">
          Role/Position
          <Tooltip text="The role or position of the reviewer helps AI generate more relevant and personalized reviews. For example, a Store Manager might focus on different aspects than a Customer." />
        </label>
        <input
          type="text"
          id="role"
          value={formData.role}
          onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
          className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
          placeholder="e.g., Store Manager, Marketing Director, Student"
        />
      </div>

      <div>
        <label htmlFor="services_offered" className="block text-sm font-medium text-gray-700 mt-4 mb-2">
          Services Provided (one per line)
        </label>
        <textarea
          id="services_offered"
          value={formData.services_offered || ''}
          onChange={e => setFormData(prev => ({ ...prev, services_offered: e.target.value }))}
          rows={3}
          className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
          placeholder="Enter each service on a new line"
          required
        />
      </div>

      <div>
        <label htmlFor="outcomes" className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center">
          Outcome
          <Tooltip text="Describe the results and benefits the client received. This information helps AI generate more specific and impactful reviews that highlight the value provided." />
        </label>
        <p className="text-xs text-gray-500 mt-1 mb-2">Describe the service you provided and how it benefited the individual.</p>
        <textarea
          id="outcomes"
          value={formData.outcomes}
          onChange={e => setFormData(prev => ({ ...prev, outcomes: e.target.value }))}
          rows={4}
          className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
          placeholder="Describe the outcome for your client"
          required
        />
      </div>

      <div>
        <label htmlFor="friendly_note" className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center">
          Personalized Note to Customer
          <Tooltip text="This note appears at the top of the review page. It helps set the context and tone for the review. The AI will use this information to generate more personalized and relevant reviews." />
        </label>
        <textarea
          id="friendly_note"
          value={formData.friendly_note}
          onChange={e => setFormData(prev => ({ ...prev, friendly_note: e.target.value }))}
          rows={4}
          className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
          placeholder={`Hi ${formData.first_name || '[name]'}, thanks so much for doing business with ${businessProfile?.business_name || '[business name]'}. As a small business, getting reviews online is super valuable and extends our reach. Thank you for supporting us!\n\n- ${businessProfile?.business_name || '[Account holder name]'}`}
        />
        <p className="text-xs text-gray-500 mt-1 mb-2">This note will appear at the top of the review page for your customer. Make it personal!</p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Special Offer Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-lg font-semibold text-indigo-800 flex items-center">
            <FaGift className="w-6 h-6 mr-2 text-indigo-500" />
            Special Offer
            <Tooltip text="Offer a discount or special offer and a link for users to redeem or learn about the steps they need to take." />
          </label>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, offer_enabled: !prev.offer_enabled }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.offer_enabled ? 'bg-indigo-500' : 'bg-gray-300'}`}
            aria-pressed={formData.offer_enabled}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${formData.offer_enabled ? 'translate-x-5' : 'translate-x-1'}`}
            />
          </button>
        </div>
        <div className={`rounded-lg border border-indigo-200 bg-indigo-50 p-4 ${!formData.offer_enabled ? 'opacity-60' : ''}`}>
          <input
            type="text"
            value={formData.offer_title ?? 'Special Offer'}
            onChange={e => setFormData(prev => ({ ...prev, offer_title: e.target.value }))}
            placeholder="Offer Title (e.g., Special Offer)"
            className="block w-full rounded-md border border-indigo-200 bg-indigo-50 focus:ring-2 focus:ring-indigo-300 focus:outline-none sm:text-sm py-2 px-3 mb-2 font-semibold"
            disabled={!formData.offer_enabled}
          />
          <textarea
            value={formData.offer_body || ''}
            onChange={e => setFormData(prev => ({ ...prev, offer_body: e.target.value }))}
            placeholder="Get 10% off your next visit"
            className="block w-full rounded-md border border-indigo-200 bg-indigo-50 focus:ring-2 focus:ring-indigo-300 focus:outline-none sm:text-sm py-3 px-4"
            rows={2}
            disabled={!formData.offer_enabled}
          />
          <input
            type="url"
            value={formData.offer_url || ''}
            onChange={e => setFormData(prev => ({ ...prev, offer_url: e.target.value }))}
            placeholder="Offer URL (e.g., https://yourbusiness.com/claim-reward)"
            className="block w-full rounded-md border border-indigo-200 bg-indigo-50 focus:ring-2 focus:ring-indigo-300 focus:outline-none sm:text-sm py-2 px-3 mt-2"
            disabled={!formData.offer_enabled}
          />
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Note: Services like Google and Yelp have policies against providing rewards in exchange for reviews, so it's best not to promise a reward for "x" number of reviews, etc.
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">Review Platforms</label>
        <p className="text-sm text-gray-500 mt-1 mb-2">Your business profile platforms have been pre-loaded. You can add more if needed.</p>
        <div className="mt-1 space-y-4">
          {formData.review_platforms.map((link, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-6 border rounded-lg bg-gray-50">
              <div className="space-y-4 flex flex-col justify-between">
                <div>
                  <label htmlFor={`platform-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Platform Name
                  </label>
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
                <div>
                  <label htmlFor={`url-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
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
                <div>
                  <label htmlFor={`wordCount-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Word Count Limit
                  </label>
                  <input
                    type="number"
                    id={`wordCount-${index}`}
                    value={link.wordCount ?? 200}
                    onChange={e => handlePlatformChange(index, 'wordCount', parseInt(e.target.value))}
                    className="block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                    placeholder="Word count limit"
                    min="50"
                    max="1000"
                  />
                </div>
                {formData.review_platforms.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePlatform(index)}
                    className="inline-flex items-center p-1.5 border border-transparent rounded-full text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 self-start mt-2"
                  >
                    <span className="sr-only">Remove platform</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div>
                    <label htmlFor={`customInstructions-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Custom Instructions
                    </label>
                    <input
                      type="text"
                      id={`customInstructions-${index}`}
                      value={link.customInstructions || ''}
                      onChange={e => handlePlatformChange(index, 'customInstructions', e.target.value)}
                      placeholder="Add custom instructions for this platform"
                      className="block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4 mb-4"
                    />
                  </div>
                  <div>
                    <label htmlFor={`reviewText-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Review Text
                    </label>
                    <textarea
                      id={`reviewText-${index}`}
                      value={link.reviewText || ''}
                      onChange={e => handlePlatformChange(index, 'reviewText', e.target.value)}
                      placeholder="Write or generate a review for this platform"
                      className="block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4 mb-2"
                      rows={5}
                    />
                  </div>
                  <div className="flex items-center gap-2 justify-between mt-2">
                    <button
                      type="button"
                      onClick={() => handleGenerateAIReview(index)}
                      disabled={generatingReview === index}
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium shadow disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                    >
                      {generatingReview === index ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        'Generate with AI'
                      )}
                    </button>
                    {link.reviewText && (
                      <span className="text-sm text-gray-500 ml-2">
                        {link.reviewText.split(/\s+/).length} words
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddPlatform}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Platform
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mt-8 pt-6 border-t">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Back
        </button>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {isLoading ? 'Loading...' : 'Preview'}
          </button>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={isLoading}
          >
            {isLoading ? 'Publishing...' : 'Save & Publish'}
          </button>
        </div>
      </div>

      {previewUrl && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700">
            Preview page created!{' '}
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline hover:text-green-800"
            >
              Click here to view
            </a>
          </p>
        </div>
      )}
    </div>
  );

  // When offer fields change, update formData.custom_incentive
  useEffect(() => {
    if (formData.offer_enabled) {
      setFormData(prev => ({ ...prev, custom_incentive: formData.offer_body }));
    } else {
      setFormData(prev => ({ ...prev, custom_incentive: '' }));
    }
  }, [formData.offer_enabled, formData.offer_body]);

  return (
    <>
      <Header />
      <Dialog open={showTypeModal} onClose={() => {}} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
          <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-auto p-8 z-10">
            <Dialog.Title className="text-lg font-bold mb-4">Select Prompt Page Type</Dialog.Title>
            <div className="grid grid-cols-1 gap-4">
              {REVIEW_TYPES.map(type => (
                <button
                  key={type.value}
                  className={`flex items-center gap-4 p-4 rounded border w-full text-left ${formData.review_type === type.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'} hover:border-indigo-400`}
                  onClick={() => { setFormData(prev => ({ ...prev, review_type: type.value })); setShowTypeModal(false); }}
                >
                  {type.icon}
                  <div>
                    <div className="font-semibold">{type.label}</div>
                    <div className="text-xs text-gray-500">{type.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Dialog>
      <div className="min-h-screen flex justify-center items-start">
        <div className="relative">
          {/* Floating Icon */}
          <div className="absolute -top-6 -left-6 z-10 bg-white rounded-full shadow p-3 flex items-center justify-center">
            <FaFileAlt className="w-9 h-9 text-indigo-500" />
          </div>
          {/* Main Card */}
          <div className="rounded-lg shadow-lg p-8 bg-white" style={{maxWidth: 1000}}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <h1 className="text-4xl font-bold text-indigo-500 flex items-center gap-3">
                  Create Prompt Page
                </h1>
                <div className="mt-1 text-xs text-gray-500 max-w-2xl">Create a landing page that makes it incredibly easy for your customers, clients, fans, and friends to post a positive review.</div>
              </div>
            </div>
            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">{error}</div>
            )}
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              {formData.review_type === 'video' ? <VideoTestimonialSetup formData={formData} setFormData={setFormData} /> : (step === 1 ? renderStep1() : renderStep2())}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
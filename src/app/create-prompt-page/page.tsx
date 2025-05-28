'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { generateAIReview } from '@/utils/ai';
import { FaFileAlt, FaInfoCircle, FaStar, FaGift, FaVideo, FaImage, FaQuoteRight, FaCamera, FaHeart, FaGoogle, FaYelp, FaFacebook, FaTripadvisor, FaRegStar, FaSmile } from 'react-icons/fa';
import { checkAccountLimits } from '@/utils/accountLimits';
import { Dialog } from '@headlessui/react';
import { getUserOrMock } from '@/utils/supabase';
import dynamic from 'next/dynamic';
import Header from '../components/Header';
import { slugify } from '@/utils/slugify';
import PromptPageForm from '../components/PromptPageForm';

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
  services_offered: string[];
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
  gradient_start: string;
  gradient_middle: string;
  gradient_end: string;
  background_type: string;
  background_color: string;
  text_color: string;
  header_color: string;
}

const REVIEW_TYPES = [
  {
    value: 'prompt',
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

const initialFormData: {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  outcomes: string;
  review_platforms: ReviewPlatformLink[];
  services_offered: string[];
  friendly_note: string;
  status: 'draft';
  role: string;
  offer_enabled: boolean;
  offer_title: string;
  offer_body: string;
  offer_url: string;
  review_type: string;
  video_recipient: string;
  video_note: string;
  video_tips: string;
  video_questions: string[];
  video_preset: string;
  video_max_length: number;
  video_quality: string;
  falling_icon: string | null;
  no_platform_review_template: string;
} = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  outcomes: '',
  review_platforms: [] as ReviewPlatformLink[],
  services_offered: [],
  friendly_note: '',
  status: 'draft',
  role: '',
  offer_enabled: false,
  offer_title: 'Special Offer',
  offer_body: 'Use this code "1234" to get a discount on your next purchase.',
  offer_url: '',
  review_type: 'custom',
  video_recipient: '',
  video_note: '',
  video_tips: '',
  video_questions: [''],
  video_preset: 'quick',
  video_max_length: 30,
  video_quality: '720p',
  falling_icon: 'star',
  no_platform_review_template: '',
};

function VideoTestimonialSetup({ formData, setFormData }: { formData: typeof initialFormData, setFormData: React.Dispatch<React.SetStateAction<typeof initialFormData>> }) {
  const ZIGGEO_API_KEY = process.env.NEXT_PUBLIC_ZIGGEO_API_KEY || '';
  const [videoToken, setVideoToken] = useState<string | null>(null);

  return (
    <div className="custom-space-y">
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

const ZiggeoRecorder = dynamic(() => import('react-ziggeo').then(mod => mod.ZiggeoRecorder), { ssr: false }) as any;

function getPlatformIcon(platform: string, url: string) {
  const lowerPlatform = (platform || '').toLowerCase();
  const lowerUrl = (url || '').toLowerCase();
  if (lowerPlatform.includes('google') || lowerUrl.includes('google')) return { icon: FaGoogle, label: 'Google' };
  if (lowerPlatform.includes('facebook') || lowerUrl.includes('facebook')) return { icon: FaFacebook, label: 'Facebook' };
  if (lowerPlatform.includes('yelp') || lowerUrl.includes('yelp')) return { icon: FaYelp, label: 'Yelp' };
  if (lowerPlatform.includes('tripadvisor') || lowerUrl.includes('tripadvisor')) return { icon: FaTripadvisor, label: 'TripAdvisor' };
  return { icon: FaRegStar, label: 'Other' };
}

export default function CreatePromptPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [generatingReview, setGeneratingReview] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalMessage, setUpgradeModalMessage] = useState<string | null>(null);
  const [noPlatformReviewTemplate, setNoPlatformReviewTemplate] = useState('');
  const [aiLoadingPhoto, setAiLoadingPhoto] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPostSaveModal, setShowPostSaveModal] = useState(false);
  const [savedPromptPageUrl, setSavedPromptPageUrl] = useState<string | null>(null);
  const [services, setServices] = useState<string[]>([]);
  const [pageOrigin, setPageOrigin] = useState('');
  const [emojiSentimentEnabled, setEmojiSentimentEnabled] = useState(false);
  const [emojiSentimentQuestion, setEmojiSentimentQuestion] = useState('How was your experience?');
  const [emojiFeedbackMessage, setEmojiFeedbackMessage] = useState('We value your feedback! Let us know how we can do better.');

  // Debug logging
  console.log('RENDER: review_type:', formData.review_type);

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
          setBusinessProfile({
            ...businessData,
            business_name: businessData.name || businessData.business_name,
            services_offered: Array.isArray(businessData.services_offered)
              ? businessData.services_offered
              : typeof businessData.services_offered === 'string'
                ? [businessData.services_offered]
                : [],
          });
          // Pre-fill offer fields from business default if enabled
          if (businessData.default_offer_enabled) {
            setFormData(prev => ({
              ...prev,
              offer_enabled: true,
              offer_title: businessData.default_offer_title || 'Special Offer',
              offer_body: businessData.default_offer_body || 'Use this code "1234" to get a discount on your next purchase.'
            }));
          }
          // Robustly pre-fill review platforms if not already set
          if ((!formData.review_platforms || formData.review_platforms.length === 0) && businessData.review_platforms) {
            let platforms = businessData.review_platforms;
            if (typeof platforms === 'string') {
              try { platforms = JSON.parse(platforms); } catch { platforms = []; }
            }
            if (!Array.isArray(platforms)) platforms = [];
            setFormData(prev => ({
              ...prev,
              review_platforms: platforms.map((p: any) => ({
                platform: p.name || p.platform || '',
                url: p.url || '',
                wordCount: p.wordCount || 200,
                customInstructions: p.customInstructions || '',
                reviewText: p.reviewText || '',
                customPlatform: p.customPlatform || ''
              }))
            }));
          }
          if (businessData.services_offered) {
            let arr = businessData.services_offered;
            if (typeof arr === 'string') {
              try { arr = JSON.parse(arr); } catch { arr = arr.split(/\r?\n/); }
            }
            if (!Array.isArray(arr)) arr = [];
            setServices(arr.filter(Boolean));
            setFormData(prev => ({ ...prev, services_offered: arr.filter(Boolean) }));
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
          project_type: formData.services_offered.join(', '),
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
      setFormData(prev => ({ ...prev, offer_body: 'Use this code "1234" to get a discount on your next purchase.' }));
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
          last_name: formData.last_name,
          project_type: formData.services_offered.join(', '),
          outcomes: formData.outcomes,
        },
        'Photo Testimonial',
        120,
        formData.friendly_note
      );
      setNoPlatformReviewTemplate(review);
      setFormData(prev => ({ ...prev, no_platform_review_template: review }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate testimonial template');
    } finally {
      setAiLoadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit called');
    setSaveError(null);
    setSaveSuccess(null);
    setIsSaving(true);
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

      let insertData: any = { ...formData, account_id: user.id, status: 'draft' };
      // Generate slug before insert
      insertData.slug = slugify(formData.first_name + '-' + formData.last_name, String(Date.now()));
      if (formData.review_type === 'photo') {
        insertData.review_platforms = undefined;
      } else {
        insertData.review_platforms = formData.review_platforms.map(link => ({
          ...link,
          wordCount: link.wordCount ? Math.max(200, Number(link.wordCount)) : 200
        }));
      }
      if (formData.review_type !== 'video') {
        delete insertData.video_max_length;
        delete insertData.video_quality;
        delete insertData.video_preset;
        delete insertData.video_questions;
        delete insertData.video_note;
        delete insertData.video_tips;
        delete insertData.video_recipient;
      }
      if (typeof insertData.services_offered === 'string') {
        const arr = insertData.services_offered
          .split(/\r?\n/)
          .map((s: string) => s.trim())
          .filter(Boolean);
        insertData.services_offered = arr.length > 0 ? arr : null;
      }
      // Add emoji sentiment fields
      insertData.emoji_sentiment_enabled = emojiSentimentEnabled;
      insertData.emoji_sentiment_question = emojiSentimentQuestion;
      insertData.emoji_feedback_message = emojiFeedbackMessage;
      const { data, error } = await supabase
        .from('prompt_pages')
        .insert([insertData])
        .select()
        .single();
      console.log('Supabase insert result:', { data, error });

      if (error) throw error;

      if (data && data.slug) {
        setSavedPromptPageUrl(`/r/${data.slug}`);
        // Option 1: Use localStorage flag
        localStorage.setItem('showPostSaveModal', JSON.stringify({ url: `/r/${data.slug}` }));
        router.push('/dashboard');
        return;
        // Option 2: Use query param (uncomment if preferred)
        // router.push(`/dashboard?showPostSaveModal=1&url=/r/${data.slug}`);
        // return;
      }
      setSaveSuccess('Changes saved and published successfully!');
    } catch (error) {
      console.error('Error creating prompt page:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Validation helpers
  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  function isValidPhone(phone: string) {
    // Accepts 10+ digits, allows spaces, dashes, parentheses, plus
    return /^(\+\d{1,3}[- ]?)?\(?\d{3,}\)?[- ]?\d{3,}[- ]?\d{4,}$/.test(phone.replace(/\s/g, ''));
  }

  // Update handleStep1Continue to validate before continuing
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
    if (formData.email.trim() && !isValidEmail(formData.email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (formData.phone.trim() && !isValidPhone(formData.phone.trim())) {
      setFormError('Please enter a valid phone number.');
      return;
    }
    setStep(2);
  };

  const renderStep1 = () => (
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
            onChange={e => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
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
            onChange={e => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
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
            onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
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
            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
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
          onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
          className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
          placeholder="e.g., store manager, marketing director, student (their role)"
        />
      </div>

      {/* Services Section Header */}
      <div className="mt-20 mb-2 flex items-center gap-2">
        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="w-5 h-5 text-[#1A237E]" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M80 368H16a16 16 0 0 0-16 16v64a16 16 0 0 0 16 16h64a16 16 0 0 0 16-16v-64a16 16 0 0 0-16-16zm0-320H16A16 16 0 0 0 0 64v64a16 16 0 0 0 16 16h64a16 16 0 0 0 16-16V64a16 16 0 0 0-16-16zm0 160H16a16 16 0 0 0-16 16v64a16 16 0 0 0 16 16h64a16 16 0 0 0 16-16v-64a16 16 0 0 0-16-16zm416 176H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zm0-320H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16V80a16 16 0 0 0-16-16zm0 160H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16z"></path></svg>
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
                setFormData(prev => ({ ...prev, services_offered: newServices }));
              }}
              required
              placeholder="e.g., Web Design"
            />
            {services.length > 1 && (
              <button type="button" onClick={() => {
                const newServices = services.filter((_, i) => i !== idx);
                setServices(newServices);
                setFormData(prev => ({ ...prev, services_offered: newServices }));
              }} className="text-red-600 font-bold">&times;</button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => {
          setServices([...services, '']);
          setFormData(prev => ({ ...prev, services_offered: [...services, ''] }));
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
          onChange={e => setFormData(prev => ({ ...prev, outcomes: e.target.value }))}
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
          onChange={e => setFormData(prev => ({ ...prev, friendly_note: e.target.value }))}
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
  );

  const renderStep2 = () => (
    <div className="custom-space-y">
      {/* Feedback messages */}
      {saveError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{saveError}</div>
      )}
      {saveSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">{saveSuccess}</div>
      )}
      {/* Page Title and top right action buttons */}
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-4xl font-bold text-[#1A237E]">Create Your Prompt Page</h1>
        <div className="flex gap-4 items-center">
          <a
            href={previewUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            View
          </a>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
            disabled={isSaving}
          >
            {isSaving ? 'Publishing...' : 'Save & publish'}
          </button>
        </div>
      </div>
      {/* Review Platforms Section - moved to top */}
      {!(formData.review_type === 'photo' || formData.review_type === 'photo_testimonial') && (
        <div>
          <div className="mt-8 mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FaStar className="w-5 h-5 text-[#1A237E]" />
              <h2 className="text-xl font-semibold" style={{ color: '#1A237E' }}>Review Platforms</h2>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1" style={{ marginBottom: 24 }}>Your business profile platforms have been pre-loaded. You can add more if needed.</p>
          <div className="mt-1 space-y-4">
            {formData.review_platforms.map((link, index) => (
              <div key={index} className="relative mb-6 p-6 border rounded-lg bg-gray-50">
                {/* Platform icon in top left */}
                {(link.platform || link.url) && (
                  <div className="absolute -top-4 -left-4 bg-white rounded-full shadow p-2 flex items-center justify-center" title={getPlatformIcon(link.platform, link.url).label}>
                    {(() => {
                      const { icon: Icon } = getPlatformIcon(link.platform, link.url);
                      return <Icon className="w-6 h-6" />;
                    })()}
                  </div>
                )}
                {/* 2-column grid for settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left column: Platform name and URL */}
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
                  </div>
                  {/* Right column: Custom instructions and word count */}
                  <div className="space-y-4 flex flex-col justify-between">
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
                    {/* Word count indicator in right column (desktop only) */}
                    <span className="hidden md:block text-sm text-gray-500 mb-2 mt-auto">
                      {link.reviewText ? `${link.reviewText.split(/\s+/).length} words` : ''}
                    </span>
                  </div>
                </div>
                {/* Full-width review text input below the grid */}
                <div className="mt-6">
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
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleGenerateAIReview(index)}
                      disabled={generatingReview === index}
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium shadow disabled:opacity-50 disabled:cursor-not-allowed"
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
      )}
      {/* Special Offer Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-lg font-semibold flex items-center" style={{ color: '#1A237E' }}>
            <FaGift className="w-6 h-6 mr-2" style={{ color: '#1A237E' }} />
            Special Offer
            <Tooltip text="Offer a discount or special offer and a link for users to redeem or learn about the steps they need to take." />
          </label>
          <button
            type="button"
            onClick={() => setFormData(prev => ({
              ...prev,
              offer_enabled: !prev.offer_enabled,
              offer_title: 'Special Offer',
              offer_body: 'Use this code "1234" to get a discount on your next purchase.'
            }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${!!formData.offer_enabled ? 'bg-indigo-500' : 'bg-gray-300'}`}
            aria-pressed={!!formData.offer_enabled}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${!!formData.offer_enabled ? 'translate-x-5' : 'translate-x-1'}`}
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
            placeholder="Use this code '1234' to get a discount on your next purchase."
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

      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-lg font-semibold flex items-center" style={{ color: '#1A237E' }}>
            <FaStar className="w-6 h-6" style={{ color: '#FFD600' }} />
            Falling Icon Effect
            <Tooltip text="Choose an icon for the fun falling animation. This effect will trigger after a photo is uploaded." />
          </label>
          <button
            type="button"
            onClick={() => setFormData(prev => ({
              ...prev,
              falling_icon: !prev.falling_icon ? 'star' : null,
            }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${!!formData.falling_icon ? 'bg-indigo-500' : 'bg-gray-300'}`}
            aria-pressed={!!formData.falling_icon}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${!!formData.falling_icon ? 'translate-x-5' : 'translate-x-1'}`}
            />
          </button>
        </div>
        <div className={`flex gap-2 bg-white/80 rounded-full px-3 py-1 border border-gray-200 shadow w-max ${!formData.falling_icon ? 'opacity-60 pointer-events-none' : ''}`}>
          {[
            { key: 'star', label: 'Stars', icon: <FaStar className="w-6 h-6" style={{ color: '#FFD600' }} /> },
            { key: 'heart', label: 'Hearts', icon: <FaHeart className="w-6 h-6" style={{ color: '#E53935' }} /> },
            { key: 'rainbow', label: 'Rainbows', icon: <span className="w-6 h-6 text-2xl">🌈</span> },
            { key: 'thumb', label: 'Thumbs Up', icon: <span className="w-6 h-6 text-2xl">👍</span> },
          ].map(opt => (
            <button
              key={opt.key}
              className={`p-1 rounded-full focus:outline-none transition-all ${formData.falling_icon === opt.key ? 'ring-2 ring-indigo-400 bg-indigo-50' : ''}`}
              onClick={() => formData.falling_icon && setFormData(prev => ({ ...prev, falling_icon: opt.key }))}
              aria-label={opt.label}
              type="button"
              disabled={!formData.falling_icon}
            >
              {opt.icon}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-2">This animation will play after a photo is uploaded.</div>
      </div>

      {/* Emoji Sentiment Flow Section */}
      <div className="flex items-center justify-between mb-2 mt-8 px-4 py-2">
        <div className="flex items-center gap-3">
          <FaSmile className="w-7 h-7 text-[#1A237E]" />
          <span className="text-2xl font-bold text-[#1A237E]">Emoji Sentiment Flow</span>
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
      <div className="rounded-lg p-6 bg-blue-50 border border-blue-200 flex flex-col gap-4 shadow relative">
        <div className="text-xs text-gray-500 mt-1 mb-2">
          Enabling this routes users to a feedback form if they are less than pleased with their experience. This keeps negative reviews off the web and allows you to respond directly while gathering valuable feedback. Users who select "Delighted" or "Satisfied" are sent to your public prompt page, while those who select "Neutral" or "Unsatisfied" are shown a private feedback form that is saved to your account but not shared publicly.
        </div>
        <div className="text-xs text-blue-700 bg-blue-100 border border-blue-200 rounded px-3 py-2 mb-2">
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
        {emojiSentimentEnabled && (
          <div className="mt-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Feedback message (shown to customers who select an indifferent or negative emoji):</label>
            <textarea
              className="block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-2 px-3"
              value={emojiFeedbackMessage}
              onChange={e => setEmojiFeedbackMessage(e.target.value)}
              rows={2}
            />
          </div>
        )}
      </div>

      {/* Only show the review template section for photo/photo_testimonial types at the bottom */}
      {(formData.review_type === 'photo' || formData.review_type === 'photo_testimonial') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">Review Template</label>
          <textarea
            className="block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4 mb-2"
            rows={6}
            placeholder="Write or generate a testimonial template for your photo review."
            value={noPlatformReviewTemplate}
            onChange={e => {
              setNoPlatformReviewTemplate(e.target.value);
              setFormData(prev => ({ ...prev, no_platform_review_template: e.target.value }));
            }}
          />
          <button
            type="button"
            onClick={handleGeneratePhotoTemplate}
            disabled={aiLoadingPhoto}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium shadow disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {aiLoadingPhoto ? (
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
        </div>
      )}
      {/* Bottom right action buttons (duplicate of top) */}
      <div className="flex justify-end gap-4 mt-12">
        <a
          href={previewUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          View
        </a>
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
          disabled={isSaving}
        >
          {isSaving ? 'Publishing...' : 'Save & publish'}
        </button>
      </div>
    </div>
  );

  // Set review_type from query param on mount
  useEffect(() => {
    const typeParam = searchParams?.get('type');
    if (typeParam && formData.review_type !== typeParam) {
      setFormData(prev => ({ ...prev, review_type: typeParam === 'review' ? 'prompt' : typeParam }));
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPageOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    console.log('showPostSaveModal changed:', showPostSaveModal);
  }, [showPostSaveModal]);

  useEffect(() => {
    console.log('CreatePromptPage mounted');
    return () => {
      console.log('CreatePromptPage unmounted');
    };
  }, []);

  useEffect(() => {
    console.log('Router path or search params changed:', window.location.pathname, window.location.search);
  }, [searchParams]);

  if (!businessProfile) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen py-10 px-4 sm:px-8 md:px-16 lg:px-32">
        <div className="max-w-3xl mx-auto rounded-xl shadow-lg p-8 mt-0 md:mt-[30px]">
          <PromptPageForm
            mode="create"
            initialData={formData}
            onSave={handleSubmit}
            onPublish={handleSubmit}
            pageTitle="Create Your Prompt Page"
            supabase={supabase}
            businessProfile={businessProfile}
          />
        </div>
      </div>
    </>
  );
}
'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
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

const initialFormData = {
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

export default function CreatePromptPageClient() {
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
          if (businessData.default_offer_enabled) {
            setFormData(prev => ({
              ...prev,
              offer_enabled: true,
              offer_title: businessData.default_offer_title || 'Special Offer',
              offer_body: businessData.default_offer_body || 'Use this code "1234" to get a discount on your next purchase.'
            }));
          }
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

  // Add platform handlers
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
    setSaveError(null);
    setSaveSuccess(null);
    setIsSaving(true);
    try {
      const { data: { user } } = await getUserOrMock(supabase);
      if (!user) throw new Error('No user found');
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
      insertData.emoji_sentiment_enabled = emojiSentimentEnabled;
      insertData.emoji_sentiment_question = emojiSentimentQuestion;
      insertData.emoji_feedback_message = emojiFeedbackMessage;
      insertData.emoji_thank_you_message = formData.emojiThankYouMessage || '';
      const { data, error } = await supabase
        .from('prompt_pages')
        .insert([insertData])
        .select()
        .single();
      if (error) throw error;
      if (data && data.slug) {
        setSavedPromptPageUrl(`/r/${data.slug}`);
        localStorage.setItem('showPostSaveModal', JSON.stringify({ url: `/r/${data.slug}` }));
        router.push('/dashboard');
        return;
      }
      setSaveSuccess('Changes saved and published successfully!');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

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
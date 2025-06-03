'use client';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { generateAIReview } from '@/utils/ai';
import { FaGoogle, FaFacebook, FaYelp, FaTripadvisor, FaRegStar, FaGift, FaStar, FaHeart, FaThumbsUp, FaStore, FaSmile, FaGlobe, FaHandsHelping, FaUser, FaWrench, FaBoxOpen, FaTrophy, FaCommentDots } from 'react-icons/fa';
import { IconType } from 'react-icons';
import Link from 'next/link';
import { getUserOrMock, getSessionOrMock } from '@/utils/supabase';
import IndustrySelector from '@/app/components/IndustrySelector';
import PromptPageForm from '@/app/components/PromptPageForm';
import PageCard from '@/app/components/PageCard';
import EmojiSentimentSection from '../components/EmojiSentimentSection';
import FallingStarsSection from '@/app/components/FallingStarsSection';
import DisableAIGenerationSection from '@/app/components/DisableAIGenerationSection';
import ReviewWriteSection from '../components/ReviewWriteSection';
import ServicePromptPageForm, { ServicePromptFormState } from './ServicePromptPageForm';
import ProductPromptPageForm from '@/app/components/ProductPromptPageForm';
import React from 'react';
import AppLoader from '@/app/components/AppLoader';
import RobotTooltip from '@/app/components/RobotTooltip';

interface ReviewPlatformLink {
  name: string;
  url: string;
  wordCount?: number;
  reviewText?: string;
  customInstructions?: string;
  customPlatform?: string;
  platform?: string;
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
  industry: string[];
  industry_other: string;
  features_or_benefits: string[];
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

// Helper to get platform icon based on URL or platform name
function getPlatformIcon(url: string, platform: string): { icon: IconType, label: string } {
  const lowerUrl = url.toLowerCase();
  const lowerPlatform = (platform || '').toLowerCase();
  if (lowerUrl.includes('google') || lowerPlatform.includes('google')) return { icon: FaGoogle, label: 'Google' };
  if (lowerUrl.includes('facebook') || lowerPlatform.includes('facebook')) return { icon: FaFacebook, label: 'Facebook' };
  if (lowerUrl.includes('yelp') || lowerPlatform.includes('yelp')) return { icon: FaYelp, label: 'Yelp' };
  if (lowerUrl.includes('tripadvisor') || lowerPlatform.includes('tripadvisor')) return { icon: FaTripadvisor, label: 'TripAdvisor' };
  return { icon: FaRegStar, label: 'Other' };
}

export default function EditPromptPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    product_name: '',
    product_description: '',
    features_or_benefits: [''],
    review_platforms: [] as ReviewPlatformLink[],
    services_offered: [] as string[],
    friendly_note: '',
    status: 'in_queue' as 'in_queue' | 'in_progress' | 'complete' | 'draft',
    role: '',
    industry: [] as string[],
    industry_other: '',
    review_type: 'prompt',
    product_photo: '',
    emojiThankYouMessage: '',
    falling_icon: '',
  });
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [generatingReview, setGeneratingReview] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUniversal, setIsUniversal] = useState(false);
  const [offerEnabled, setOfferEnabled] = useState(false);
  const [offerTitle, setOfferTitle] = useState('Special Offer');
  const [offerBody, setOfferBody] = useState('');
  const [offerUrl, setOfferUrl] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'in_queue' | 'in_progress' | 'complete' | 'draft'>('in_queue');
  const [fallingIcon, setFallingIcon] = useState('star');
  const [fallingEnabled, setFallingEnabled] = useState(true);
  const [aiButtonEnabled, setAiButtonEnabled] = useState(true);
  const [lastIcon, setLastIcon] = useState('star');
  const [industryType, setIndustryType] = useState<'B2B' | 'B2C' | 'Both'>('Both');
  const [services, setServices] = useState<string[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [emojiSentimentEnabled, setEmojiSentimentEnabled] = useState(false);
  const [emojiFeedbackMessage, setEmojiFeedbackMessage] = useState('We value your feedback! Let us know how we can do better.');
  const [emojiSentimentQuestion, setEmojiSentimentQuestion] = useState('How was your experience?');

  // Add state for ServicePromptPageForm
  const formRef = React.useRef<any>(null);
  const [initialData, setInitialData] = useState<Partial<ServicePromptFormState> | null>(null);
  const [showResetButton, setShowResetButton] = useState(false);
  const [businessReviewPlatforms, setBusinessReviewPlatforms] = useState<ReviewPlatformLink[]>([]);
  const [accountId, setAccountId] = useState('');
  const [notePopupEnabled, setNotePopupEnabled] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Hoist loadData so it can be called from anywhere
  const loadData = async () => {
    try {
      const { data: { user } } = await getUserOrMock(supabase);
      if (!user) {
        console.log('No user found');
        return;
      }
      // Fetch the prompt page data
      const { data: promptData, error: promptError } = await supabase
        .from('prompt_pages')
        .select('*')
        .eq('slug', params.slug)
        .single();
      if (promptError) throw promptError;

      setAccountId(promptData.account_id || '');

      // Debug log
      console.log('Loaded promptData:', promptData);

      // Set form data from the prompt page, ensuring all string values have defaults
      let reviewPlatforms = Array.isArray(promptData.review_platforms) ? promptData.review_platforms : [];
      reviewPlatforms = reviewPlatforms.map((p: any) => ({
        name: p.name || p.platform || '',
        url: p.url || '',
        wordCount: p.wordCount ? Number(p.wordCount) : 200,
        customInstructions: p.customInstructions || '',
        reviewText: p.reviewText || '',
        customPlatform: p.customPlatform || '',
      }));
      console.log('Loaded reviewPlatforms:', reviewPlatforms);
      // If universal and no review platforms, use business profile's
      if ((promptData.is_universal || isUniversal) && reviewPlatforms.length === 0) {
        // Fetch business profile review platforms
        const { data: businessData } = await supabase
          .from('businesses')
          .select('review_platforms')
          .eq('account_id', user.id)
          .single();
        if (businessData && Array.isArray(businessData.review_platforms) && businessData.review_platforms.length > 0) {
          reviewPlatforms = businessData.review_platforms.map((p: any) => ({
            name: p.name || p.platform || '',
            url: p.url || '',
            wordCount: p.wordCount ? Number(p.wordCount) : 200,
            customInstructions: p.customInstructions || '',
            reviewText: '',
          }));
        }
      }
      setFormData({
        first_name: promptData.first_name || '',
        last_name: promptData.last_name || '',
        email: promptData.email || '',
        phone: promptData.phone || '',
        product_name: promptData.product_name || '',
        product_description: promptData.product_description || '',
        features_or_benefits: promptData.features_or_benefits || [''],
        review_platforms: reviewPlatforms,
        services_offered: Array.isArray(promptData.services_offered)
          ? promptData.services_offered
          : typeof promptData.services_offered === 'string' && promptData.services_offered.length > 0
            ? [promptData.services_offered]
            : [],
        friendly_note: promptData.friendly_note || '',
        status: promptData.status || 'in_queue' as 'in_queue' | 'in_progress' | 'complete' | 'draft',
        role: promptData.role || '',
        industry: promptData.industry || [],
        industry_other: promptData.industry_other || '',
        review_type: (promptData.review_type || '').toLowerCase().trim() === 'product' ? 'product' : 'service',
        product_photo: promptData.product_photo || '',
        emojiThankYouMessage: promptData.emoji_thank_you_message || '',
        falling_icon: promptData.falling_icon || '',
      });
      setPhotoUrl(promptData.product_photo || null);
      setIsUniversal(!!promptData.is_universal || isUniversal);
      setOfferEnabled(!!promptData.offer_enabled);
      setOfferTitle(promptData.offer_title || 'Special Offer');
      setOfferBody(promptData.offer_body || '');
      setOfferUrl(promptData.offer_url || '');
      if (promptData) {
        if (promptData.falling_icon) {
          setFallingIcon(promptData.falling_icon);
          setLastIcon(promptData.falling_icon);
          setFallingEnabled(true);
        } else {
          setFallingEnabled(false);
        }
      }
      if (promptData.services_offered) {
        let arr = promptData.services_offered;
        if (typeof arr === 'string') {
          try { arr = JSON.parse(arr); } catch { arr = arr.split(/\r?\n/); }
        }
        if (!Array.isArray(arr)) arr = [];
        setServices(arr.filter(Boolean));
        setFormData(prev => ({ ...prev, services_offered: arr.filter(Boolean) }));
      }
      setEmojiSentimentEnabled(!!promptData.emoji_sentiment_enabled);
      setEmojiFeedbackMessage(promptData.emoji_feedback_message || 'We value your feedback! Let us know how we can do better.');
      setEmojiSentimentQuestion(promptData.emoji_sentiment_question || 'How was your experience?');
      setNotePopupEnabled(promptData.show_friendly_note ?? true);
    
      // Fetch business profile
      const { data: businessData } = await supabase
        .from('businesses')
        .select('*')
        .eq('account_id', user.id)
        .single();

      // Normalize business review platforms
      const normalizePlatforms = (platforms: any[] = []) =>
        platforms.map((p) => ({
          name: p.name || p.platform || '',
          url: p.url || '',
          wordCount: p.wordCount ? Number(p.wordCount) : 200,
          customInstructions: p.customInstructions || '',
          reviewText: p.reviewText || '',
          customPlatform: p.customPlatform || '',
        }));
      const businessPlatforms = normalizePlatforms(businessData?.review_platforms);
      setBusinessReviewPlatforms(businessPlatforms);

      if (businessData) {
        setBusinessProfile({
          ...businessData,
          business_name: businessData.name,
          services_offered: Array.isArray(businessData.services_offered)
            ? businessData.services_offered
            : typeof businessData.services_offered === 'string'
              ? [businessData.services_offered]
              : [],
          features_or_benefits: businessData.features_or_benefits || [],
        });
        setFormData(prev => ({
          ...prev,
          industry: businessData.industry || [],
          industry_other: businessData.industry_other || '',
        }));
      }

      // After loading promptData and businessProfile, set initialData for ServicePromptPageForm
      setInitialData({
        offerEnabled: offerEnabled,
        offerTitle: offerTitle,
        offerBody: offerBody,
        offerUrl: offerUrl,
        emojiSentimentEnabled: emojiSentimentEnabled,
        emojiSentimentQuestion: emojiSentimentQuestion,
        emojiFeedbackMessage: emojiFeedbackMessage,
        emojiThankYouMessage: promptData.emoji_thank_you_message || '',
        emojiLabels: [
          'Excellent', 'Satisfied', 'Neutral', 'Unsatisfied', 'Frustrated'
        ],
        reviewPlatforms: (promptData.review_platforms || []).map((p: any) => ({
          name: p.name || p.platform || '',
          url: p.url || '',
          wordCount: p.wordCount ? Number(p.wordCount) : 200,
          customPlatform: p.customPlatform || '',
          customInstructions: p.customInstructions || '',
        })),
        fallingEnabled: !!promptData.falling_icon,
        fallingIcon: promptData.falling_icon || 'star',
        aiButtonEnabled: promptData.ai_button_enabled !== false,
      });
      // Show reset button if there are custom platforms or the list is empty
      setShowResetButton(
        (formData.review_platforms && formData.review_platforms.length > 0) ||
        (businessPlatforms && businessPlatforms.length > 0)
      );
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load page data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params.slug) {
      loadData();
    }
  }, [params.slug, supabase]);

  useEffect(() => {
    if (offerEnabled) {
      setFormData(prev => ({ ...prev, custom_incentive: offerBody }));
    } else {
      setFormData(prev => ({ ...prev, custom_incentive: '' }));
    }
  }, [offerEnabled, offerBody]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!params.slug) return;
      
      setAnalyticsLoading(true);
      try {
        // First, get the prompt page ID by slug
        const { data: promptPage, error: fetchError } = await supabase
          .from('prompt_pages')
          .select('id')
          .eq('slug', params.slug)
          .single();
          
        if (fetchError || !promptPage) throw fetchError || new Error('Prompt page not found');
        
        const { data: events, error } = await supabase
          .from('analytics_events')
          .select('*')
          .eq('prompt_page_id', promptPage.id);
          
        if (error) throw error;
        
        const analyticsData = {
          totalClicks: events.length,
          aiGenerations: events.filter((e: any) => e.event_type === 'ai_generate').length,
          copySubmits: events.filter((e: any) => e.event_type === 'copy_submit').length,
        };
        setAnalytics(analyticsData);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setAnalytics(null);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, [params.slug, supabase]);

  useEffect(() => {
    const logCurrentUserUid = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        console.log('[DEBUG] Current user UID:', session.user.id);
      } else {
        console.log('[DEBUG] No user session found');
      }
    };
    logCurrentUserUid();
  }, [supabase]);

  const handleAddPlatform = () => {
    setFormData(prev => ({
      ...prev,
      review_platforms: [...prev.review_platforms, { name: '', url: '', wordCount: 200 }],
    }));
  };

  const handleRemovePlatform = (index: number) => {
    setFormData(prev => ({
      ...prev,
      review_platforms: prev.review_platforms.filter((_, i) => i !== index),
    }));
  };

  const handlePlatformChange = (index: number, field: keyof ReviewPlatformLink, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      review_platforms: prev.review_platforms.map((link, i) =>
        i === index ? {
          ...link,
          [field]: field === 'wordCount' 
            ? Math.max(200, Number(value) || 200)
            : value
        } : link
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
      // Determine reviewerType based on industryType
      let reviewerType: 'customer' | 'client' | 'customer or client' = 'customer or client';
      if (industryType === 'B2B') reviewerType = 'client';
      else if (industryType === 'B2C') reviewerType = 'customer';
      // Call generateAIReview with reviewerType
      const review = await generateAIReview(
        businessProfile,
        {
          first_name: formData.first_name,
          last_name: formData.last_name,
          project_type: Array.isArray(formData.services_offered) ? formData.services_offered.join(', ') : formData.services_offered,
          product_description: formData.product_description,
        },
        formData.review_platforms[index].name,
        formData.review_platforms[index].wordCount || 200,
        formData.review_platforms[index].customInstructions,
        reviewerType
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

  const handleSubmit = async (e: React.FormEvent, action: 'save' | 'publish', data?: any) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const { data: { session } } = await getSessionOrMock(supabase);
      if (!session) {
        throw new Error('You must be signed in to edit a prompt page');
      }

      // First, get the prompt page ID
      const { data: promptPage, error: fetchError } = await supabase
        .from('prompt_pages')
        .select('id')
        .eq('slug', params.slug)
        .single();

      if (fetchError) throw fetchError;
      if (!promptPage) throw new Error('Prompt page not found');

      // Build update object
      let updateData: any = {};
      if (isUniversal) {
        updateData = {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          product_name: data.product_name,
          product_description: data.product_description,
          product_photo: data.product_photo,
          review_platforms: data.review_platforms && data.review_platforms.length > 0
            ? data.review_platforms.map((link: any) => ({
                name: link.name,
                url: link.url,
                wordCount: Math.max(200, Number(link.wordCount) || 200),
                customInstructions: link.customInstructions || '',
                reviewText: link.reviewText || ''
              })).filter((link: any) => link.name && link.url)
            : null,
          services_offered: data.services_offered && data.services_offered.length > 0 ? data.services_offered : null,
          friendly_note: data.friendly_note,
          status: 'draft',
          role: data.role,
          review_type: data.review_type,
          offer_enabled: data.offer_enabled,
          offer_title: data.offer_title,
          offer_body: data.offer_body,
          offer_url: data.offer_url,
          emoji_sentiment_enabled: data.emoji_sentiment_enabled,
          emoji_feedback_message: data.emoji_feedback_message,
          emoji_sentiment_question: data.emoji_sentiment_question,
          emoji_thank_you_message: data.emoji_thank_you_message,
          falling_icon: data.falling_icon,
        };
      } else {
        updateData = {
          offer_enabled: offerEnabled,
          offer_title: offerTitle,
          offer_body: offerBody,
          offer_url: offerUrl || null,
          status: (formData.status || 'in_queue') as 'in_queue' | 'in_progress' | 'complete' | 'draft',
          first_name: formData.first_name || null,
          last_name: formData.last_name || null,
          phone: formData.phone || null,
          email: formData.email || null,
          product_name: formData.product_name || null,
          product_description: formData.product_description || null,
          product_photo: formData.product_photo || null,
          friendly_note: formData.friendly_note || null,
          role: formData.role || null,
          review_type: formData.review_type || 'prompt',
          emoji_thank_you_message: formData.emojiThankYouMessage || '',
          falling_icon: formData.falling_icon,
          emoji_sentiment_enabled: emojiSentimentEnabled,
          emoji_feedback_message: emojiFeedbackMessage,
          emoji_sentiment_question: emojiSentimentQuestion,
          show_friendly_note: notePopupEnabled,
        };

        // Handle review_platforms
        if (formData.review_platforms && formData.review_platforms.length > 0) {
          updateData.review_platforms = formData.review_platforms
            .map(link => ({
              name: link.name,
              url: link.url,
              wordCount: link.wordCount ? Math.max(200, Number(link.wordCount)) : 200,
              customInstructions: link.customInstructions || '',
              reviewText: link.reviewText || ''
            }))
            .filter(link => link.name && link.url);
        } else {
          updateData.review_platforms = null;
        }

        // Handle services_offered
        if (formData.services_offered && formData.services_offered.length > 0) {
          updateData.services_offered = formData.services_offered;
        } else {
          updateData.services_offered = null;
        }

        if (action === 'publish') {
          updateData.status = 'in_queue' as const;
        }
      }

      // Only include valid columns in the payload
      const validColumns = [
        'first_name', 'last_name', 'email', 'phone', 'product_name', 'product_description', 'product_photo', 'review_platforms', 'services_offered',
        'friendly_note', 'status', 'role', 'review_type', 'offer_enabled', 'offer_title', 'offer_body',
        'offer_url', 'emoji_sentiment_enabled', 'emoji_sentiment_question', 'emoji_feedback_message',
        'emoji_thank_you_message', 'falling_icon', 'is_universal', 'slug', 'account_id', 'category',
        'no_platform_review_template', 'ai_button_enabled', 'show_friendly_note'
      ];
      const payload = Object.fromEntries(
        Object.entries(updateData).filter(([key]) => validColumns.includes(key))
      );

      console.log('[DEBUG] Payload sent to Supabase:', payload);

      const { data: updateDataResult, error: updateError } = await supabase
        .from('prompt_pages')
        .update(payload)
        .eq('id', promptPage.id);

      // Log the full response for debugging
      console.log('[DEBUG] Supabase update response:', { updateDataResult, updateError });
      if (updateError) {
        console.error('[DEBUG] Update error object:', updateError);
      }
      
      setShowShareModal(true);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update prompt page');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndContinue = async (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await handleSubmit({ preventDefault: () => {} } as React.FormEvent, 'save');
      setStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSave = async (formState: ServicePromptFormState | any) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const { data: { session } } = await getSessionOrMock(supabase);
      if (!session) {
        throw new Error('You must be signed in to edit a prompt page');
      }
      // Get the prompt page ID
      const { data: promptPage, error: fetchError } = await supabase
        .from('prompt_pages')
        .select('id, slug')
        .eq('slug', params.slug)
        .single();
      if (fetchError) throw fetchError;
      if (!promptPage) throw new Error('Prompt page not found');
      let updateData: any;
      if (formData.review_type === 'product') {
        // For product pages, formState is a flat object with all fields
        updateData = { ...formData, ...formState };
      } else {
        // For service pages, formState is ServicePromptFormState
        updateData = {
          // Step 1 fields
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          product_name: formData.product_name,
          product_description: formData.product_description,
          product_photo: formData.product_photo,
          services_offered: formData.services_offered,
          friendly_note: formData.friendly_note,
          status: formData.status,
          role: formData.role,
          review_type: formData.review_type,
          // Step 2 fields
          offer_enabled: formState.offerEnabled,
          offer_title: formState.offerTitle,
          offer_body: formState.offerBody,
          offer_url: formState.offerUrl,
          emoji_sentiment_enabled: formState.emojiSentimentEnabled,
          emoji_sentiment_question: formState.emojiSentimentQuestion,
          emoji_feedback_message: formState.emojiFeedbackMessage,
          emoji_thank_you_message: formState.emojiThankYouMessage,
          review_platforms: formState.reviewPlatforms,
          falling_icon: formState.fallingEnabled ? formState.fallingIcon : null,
          ai_button_enabled: formState.aiButtonEnabled,
          show_friendly_note: notePopupEnabled,
        };
      }
      // Only include valid columns in the payload
      const validColumns = [
        'first_name', 'last_name', 'email', 'phone', 'product_name', 'product_description', 'product_photo', 'services_offered', 'friendly_note', 'status', 'role', 'review_type',
        'offer_enabled', 'offer_title', 'offer_body', 'offer_url',
        'emoji_sentiment_enabled', 'emoji_sentiment_question', 'emoji_feedback_message',
        'emoji_thank_you_message', 'review_platforms', 'falling_icon', 'ai_button_enabled', 'show_friendly_note'
      ];
      const payload = Object.fromEntries(
        Object.entries(updateData).filter(([key]) => validColumns.includes(key))
      );
      // Debug logs for troubleshooting
      console.log('[DEBUG] Service Save review_platforms:', formState.reviewPlatforms);
      console.log('[DEBUG] Service Save payload:', payload);
      // Update the prompt page
      const { error: updateError } = await supabase
        .from('prompt_pages')
        .update(payload)
        .eq('id', promptPage.id);
      // Debug log for Supabase response
      console.log('[DEBUG] Supabase update error:', updateError);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      // Reload latest data from Supabase
      await loadData();
      // Show share modal or redirect
      setShowShareModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update prompt page');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormPublish = (data: any) => {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent, 'publish');
  };

  const iconOptions = [
    { key: 'star', label: 'Stars', icon: <FaStar className="w-6 h-6 text-yellow-400" /> },
    { key: 'heart', label: 'Hearts', icon: <FaHeart className="w-6 h-6 text-red-500" /> },
    { key: 'rainbow', label: 'Rainbows', icon: <span className="w-6 h-6 text-2xl">🌈</span> },
    { key: 'thumb', label: 'Thumbs Up', icon: <span className="w-6 h-6 text-2xl">👍</span> },
    { key: 'flex', label: 'Flex', icon: <span className="w-6 h-6 text-2xl">💪</span> },
  ];

  const handleToggleFalling = async () => {
    if (aiButtonEnabled) return;
    setAiButtonEnabled(true);
    try {
      const { data: promptPage, error: fetchError } = await supabase
        .from('prompt_pages')
        .select('id')
        .eq('slug', params.slug)
        .single();
      if (fetchError || !promptPage) throw fetchError || new Error('Prompt page not found');
      if (fallingEnabled) {
        // Turn off
        await supabase.from('prompt_pages').update({ falling_icon: null }).eq('id', promptPage.id);
        setFallingEnabled(false);
      } else {
        // Turn on, always set to 'star' by default
        await supabase.from('prompt_pages').update({ falling_icon: 'star' }).eq('id', promptPage.id);
        setFallingIcon('star');
        setLastIcon('star');
        setFallingEnabled(true);
      }
    } finally {
      setAiButtonEnabled(false);
    }
  };

  const handleIconChange = async (iconKey: string) => {
    if (aiButtonEnabled) return;
    setAiButtonEnabled(true);
    setFallingIcon(iconKey);
    setLastIcon(iconKey);
    try {
      const { data: promptPage, error: fetchError } = await supabase
        .from('prompt_pages')
        .select('id')
        .eq('slug', params.slug)
        .single();
      if (fetchError || !promptPage) throw fetchError || new Error('Prompt page not found');
      const { error } = await supabase
        .from('prompt_pages')
        .update({ falling_icon: iconKey })
        .eq('id', promptPage.id);
      if (error) {
        setFallingIcon('star');
      }
    } finally {
      setAiButtonEnabled(false);
    }
  };

  // Add this handler for toggling offerEnabled with debug logging
  const handleToggleOffer = () => {
    setOfferEnabled(v => {
      const newValue = !v;
      console.log('[DEBUG] Toggling offerEnabled:', newValue);
      return newValue;
    });
  };

  if (isLoading) {
    return (
      <div style={{ position: 'fixed', top: -190, left: 0, width: '100%', zIndex: 9999 }}>
        <AppLoader />
      </div>
    );
  }

  if (!businessProfile) {
    return null;
  }

  // Ensure all required fields are present and not undefined
  const safeBusinessProfile = {
    ...businessProfile,
    features_or_benefits: businessProfile.features_or_benefits || [],
    business_name: businessProfile.business_name || '',
  };

  // In the main render, for product pages, render only the unified ProductPromptPageForm and return immediately
  if (formData.review_type === 'product') {
    return (
      <PageCard icon={<FaBoxOpen className="w-16 h-16 text-slate-blue" />}>
        <ProductPromptPageForm
          mode="edit"
          initialData={formData}
          onSave={handleFormSave}
          pageTitle="Edit Product Prompt Page"
          supabase={supabase}
          businessProfile={businessProfile}
        />
      </PageCard>
    );
  }

  return (
    <PageCard
      icon={<FaHandsHelping className="w-9 h-9 text-slate-blue" />}
      topRightAction={step === 2 ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => formRef.current && formRef.current.submit && formRef.current.submit()}
            className="rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90"
            disabled={isLoading}
          >
            Save
          </button>
          <a
            href={params.slug ? `/r/${params.slug}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-4 py-2 rounded-md font-medium shadow border border-slate-blue text-slate-blue bg-white hover:bg-slate-50 transition ${!params.slug ? 'opacity-50 pointer-events-none' : ''}`}
            tabIndex={params.slug ? 0 : -1}
          >
            View
          </a>
        </div>
      ) : step === 1 ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSaveAndContinue}
            className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
            disabled={isLoading}
          >
            Save & Continue
          </button>
        </div>
      ) : undefined}
    >
      <h1 className="text-3xl font-bold text-slate-blue mb-8 mt-2">Service Prompt Page</h1>
      {step === 1 ? (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-blue mt-16 mb-2 flex items-center gap-2">
            <FaUser className="w-6 h-6 text-slate-blue" />
            Customer/Client Details
          </h3>
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center gap-1">First name
                <RobotTooltip text="This field is passed to AI for prompt generation." />
              </label>
              <input
                type="text"
                id="first_name"
                value={formData.first_name}
                onChange={e => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                placeholder="First Name"
                required
              />
            </div>
            <div className="flex-1">
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mt-4 mb-2">Last name</label>
              <input
                type="text"
                id="last_name"
                value={formData.last_name}
                onChange={e => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                placeholder="Last Name"
                required
              />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mt-4 mb-2">Phone Number</label>
              <input
                type="tel"
                id="phone"
                value={formData.phone || ''}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
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
                className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                placeholder="Email address"
              />
            </div>
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center gap-1">Role/position
              <RobotTooltip text="This field is passed to AI for prompt generation." />
            </label>
            <input
              type="text"
              id="role"
              value={formData.role}
              onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="mt-1 block w-full max-w-md rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
              placeholder="e.g., Store Manager, Marketing Director, Student"
            />
          </div>

          <div className="mt-20 mb-2 flex items-center gap-2">
            <FaWrench className="w-5 h-5 text-[#1A237E]" />
            <h2 className="text-xl font-semibold text-slate-blue flex items-center gap-1">Services provided <RobotTooltip text="This field is passed to AI for prompt generation." /></h2>
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

          <div className="mt-10 mb-2 flex items-center gap-2">
            <FaTrophy className="w-5 h-5 text-[#1A237E]" />
            <h2 className="text-xl font-semibold text-slate-blue flex items-center gap-1">Outcome <RobotTooltip text="This field is passed to AI for prompt generation." /></h2>
          </div>
          <p className="text-xs text-gray-500 mt-1 mb-5 max-w-[85ch]">Describe the service you provided and how it benefited this individual.</p>
          <textarea
            id="product_description"
            value={formData.product_description}
            onChange={e => setFormData(prev => ({ ...prev, product_description: e.target.value }))}
            rows={4}
            className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
            placeholder="Describe the outcome for your client"
            required
          />

          <div className="rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-2 shadow relative mb-8 mt-10">
            <div className="flex items-center justify-between mb-2 px-2 py-2">
              <div className="flex items-center gap-3">
                <FaCommentDots className="w-7 h-7 text-slate-blue" />
                <span className="text-2xl font-bold text-[#1A237E]">Personalized note pop-up</span>
              </div>
              <button
                type="button"
                onClick={() => setNotePopupEnabled(v => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${notePopupEnabled ? 'bg-slate-blue' : 'bg-gray-200'}`}
                aria-pressed={!!notePopupEnabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${notePopupEnabled ? 'translate-x-5' : 'translate-x-1'}`}
                />
              </button>
            </div>
            <div className="text-sm text-gray-700 mb-3 max-w-[85ch] px-2">
              This note appears as a pop-up at the top of the review page. Use it to set the context and tone for your customer.
            </div>
            {notePopupEnabled && (
              <textarea
                id="friendly_note"
                value={formData.friendly_note}
                onChange={e => setFormData(prev => ({ ...prev, friendly_note: e.target.value }))}
                rows={4}
                className="block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-inner"
                placeholder="Ty! It was so great having you in yesterday. You left your scarf! I can drop it by tomorrow on my way in. Thanks for leaving us a review, we need all the positivity we can get.  :)"
              />
            )}
          </div>

          <div className="flex justify-end items-center mt-8 pt-6 border-t pb-8">
            <button
              type="button"
              onClick={handleSaveAndContinue}
              className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
              disabled={isLoading}
            >
              Save & Continue
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-blue mt-16 mb-2 flex items-center gap-2">
            <FaUser className="w-6 h-6 text-slate-blue" />
            Customer/Client Details
          </h3>
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center gap-1">First name
                <RobotTooltip text="This field is passed to AI for prompt generation." />
              </label>
              <input
                type="text"
                id="first_name"
                value={formData.first_name}
                onChange={e => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                placeholder="First Name"
                required
              />
            </div>
            <div className="flex-1">
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mt-4 mb-2">Last name</label>
              <input
                type="text"
                id="last_name"
                value={formData.last_name}
                onChange={e => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                placeholder="Last Name"
                required
              />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mt-4 mb-2">Phone Number</label>
              <input
                type="tel"
                id="phone"
                value={formData.phone || ''}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
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
                className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                placeholder="Email address"
              />
            </div>
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center gap-1">Role/position
              <RobotTooltip text="This field is passed to AI for prompt generation." />
            </label>
            <input
              type="text"
              id="role"
              value={formData.role}
              onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="mt-1 block w-full max-w-md rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
              placeholder="e.g., Store Manager, Marketing Director, Student"
            />
          </div>

          <div className="mt-20 mb-2 flex items-center gap-2">
            <FaWrench className="w-5 h-5 text-[#1A237E]" />
            <h2 className="text-xl font-semibold text-slate-blue flex items-center gap-1">Services provided <RobotTooltip text="This field is passed to AI for prompt generation." /></h2>
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

          <div className="mt-10 mb-2 flex items-center gap-2">
            <FaTrophy className="w-5 h-5 text-[#1A237E]" />
            <h2 className="text-xl font-semibold text-slate-blue flex items-center gap-1">Outcome <RobotTooltip text="This field is passed to AI for prompt generation." /></h2>
          </div>
          <p className="text-xs text-gray-500 mt-1 mb-5 max-w-[85ch]">Describe the service you provided and how it benefited this individual.</p>
          <textarea
            id="product_description"
            value={formData.product_description}
            onChange={e => setFormData(prev => ({ ...prev, product_description: e.target.value }))}
            rows={4}
            className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
            placeholder="Describe the outcome for your client"
            required
          />

          <div className="rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-2 shadow relative mb-8 mt-10">
            <div className="flex items-center justify-between mb-2 px-2 py-2">
              <div className="flex items-center gap-3">
                <FaCommentDots className="w-7 h-7 text-slate-blue" />
                <span className="text-2xl font-bold text-[#1A237E]">Personalized note pop-up</span>
              </div>
              <button
                type="button"
                onClick={() => setNotePopupEnabled(v => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${notePopupEnabled ? 'bg-slate-blue' : 'bg-gray-200'}`}
                aria-pressed={!!notePopupEnabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${notePopupEnabled ? 'translate-x-5' : 'translate-x-1'}`}
                />
              </button>
            </div>
            <div className="text-sm text-gray-700 mb-3 max-w-[85ch] px-2">
              This note appears as a pop-up at the top of the review page. Use it to set the context and tone for your customer.
            </div>
            {notePopupEnabled && (
              <textarea
                id="friendly_note"
                value={formData.friendly_note}
                onChange={e => setFormData(prev => ({ ...prev, friendly_note: e.target.value }))}
                rows={4}
                className="block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-inner"
                placeholder="Ty! It was so great having you in yesterday. You left your scarf! I can drop it by tomorrow on my way in. Thanks for leaving us a review, we need all the positivity we can get.  :)"
              />
            )}
          </div>

          <div className="flex justify-end items-center mt-8 pt-6 border-t pb-8">
            <button
              type="button"
              onClick={handleSaveAndContinue}
              className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
              disabled={isLoading}
            >
              Save & Continue
            </button>
          </div>
        </div>
      )}
    </PageCard>
  );
}

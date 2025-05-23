'use client';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { generateAIReview } from '@/utils/ai';
import { FaGoogle, FaFacebook, FaYelp, FaTripadvisor, FaRegStar, FaGift, FaStar, FaHeart, FaThumbsUp } from 'react-icons/fa';
import { IconType } from 'react-icons';
import Link from 'next/link';
import { getUserOrMock, getSessionOrMock } from '@/utils/supabase';
import IndustrySelector from '@/app/components/IndustrySelector';

interface ReviewPlatformLink {
  platform: string;
  url: string;
  wordCount?: number;
  reviewText?: string;
  customInstructions?: string;
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
  industry: string[];
  industry_other: string;
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
    outcomes: '',
    review_platforms: [] as ReviewPlatformLink[],
    services_offered: '',
    friendly_note: '',
    status: 'in_queue' as 'in_queue' | 'in_progress' | 'complete' | 'draft',
    role: '',
    industry: [] as string[],
    industry_other: '',
    review_type: 'review',
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
  const [iconUpdating, setIconUpdating] = useState(false);
  const [fallingEnabled, setFallingEnabled] = useState(true);
  const [lastIcon, setLastIcon] = useState('star');
  const [industryType, setIndustryType] = useState<'B2B' | 'B2C' | 'Both'>('Both');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
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

        // Debug log
        console.log('Loaded promptData:', promptData);

        // Set form data from the prompt page, ensuring all string values have defaults
        setFormData({
          first_name: promptData.first_name || '',
          last_name: promptData.last_name || '',
          email: promptData.email || '',
          phone: promptData.phone || '',
          outcomes: promptData.outcomes || '',
          review_platforms: promptData.review_platforms || [],
          services_offered: Array.isArray(promptData.services_offered) 
            ? promptData.services_offered.join('\n')
            : '',
          friendly_note: promptData.friendly_note || '',
          status: promptData.status || 'in_queue' as 'in_queue' | 'in_progress' | 'complete' | 'draft',
          role: promptData.role || '',
          industry: promptData.industry || [],
          industry_other: promptData.industry_other || '',
          review_type: promptData.review_type || 'review',
        });
        setIsUniversal(!!promptData.is_universal);
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
      
        // Fetch business profile
        const { data: businessData } = await supabase
          .from('businesses')
          .select('*')
          .eq('account_id', user.id)
          .single();

        if (businessData) {
          setBusinessProfile({
            ...businessData,
            business_name: businessData.name
          });
          setFormData(prev => ({
            ...prev,
            industry: businessData.industry || [],
            industry_other: businessData.industry_other || '',
          }));
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load page data');
      } finally {
        setIsLoading(false);
      }
    };

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
          .from('prompt_page_events')
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
          project_type: formData.services_offered,
          outcomes: formData.outcomes,
        },
        formData.review_platforms[index].platform,
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

  const handleSubmit = async (e: React.FormEvent, action: 'save' | 'publish') => {
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
      let updateData: any;
      if (isUniversal) {
        updateData = {
          offer_enabled: offerEnabled,
          offer_title: offerTitle,
          offer_body: offerBody,
          offer_url: offerUrl || null,
          status: 'draft' as const,
        };
        if (formData.review_platforms && formData.review_platforms.length > 0) {
          const validPlatforms = formData.review_platforms
            .map(link => ({
              platform: link.platform,
              url: link.url,
              wordCount: Math.max(200, Number(link.wordCount) || 200),
              customInstructions: link.customInstructions || '',
              reviewText: link.reviewText || ''
            }))
            .filter(link => link.platform && link.url);
          if (validPlatforms.length > 0) {
            updateData.review_platforms = validPlatforms;
          }
        }
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
          outcomes: formData.outcomes || null,
          friendly_note: formData.friendly_note || null,
          role: formData.role || null,
          industry: formData.industry || [],
          industry_other: formData.industry_other || '',
          review_type: formData.review_type || 'review',
        };

        // Handle review_platforms
        if (formData.review_platforms && formData.review_platforms.length > 0) {
          updateData.review_platforms = formData.review_platforms
            .map(link => ({
              platform: link.platform,
              url: link.url,
              wordCount: link.wordCount ? Math.max(200, Number(link.wordCount)) : 200,
              customInstructions: link.customInstructions || '',
              reviewText: link.reviewText || ''
            }))
            .filter(link => link.platform && link.url);
        } else {
          updateData.review_platforms = null;
        }

        // Handle services_offered
        if (formData.services_offered) {
          const services = formData.services_offered.split('\n')
            .map(s => s.trim())
            .filter(Boolean);
          updateData.services_offered = services.length > 0 ? services : null;
        } else {
          updateData.services_offered = null;
        }

        if (action === 'publish') {
          updateData.status = 'in_queue' as const;
        }
      }

      // Debug log
      console.log('Saving prompt page with data:', updateData, 'PromptPage ID:', promptPage.id);

      const { error: updateError } = await supabase
        .from('prompt_pages')
        .update({
          ...updateData,
          role: formData.role || null,
        })
        .eq('id', promptPage.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }
      
      setSuccessMessage('Changes saved successfully!');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update prompt page');
    } finally {
      setIsLoading(false);
    }
  };

  const iconOptions = [
    { key: 'star', label: 'Stars', icon: <FaStar className="w-6 h-6 text-dustyPlum" /> },
    { key: 'heart', label: 'Hearts', icon: <FaHeart className="w-6 h-6 text-dustyPlum" /> },
    { key: 'rainbow', label: 'Rainbows', icon: <span className="w-6 h-6 text-2xl">🌈</span> },
    { key: 'thumb', label: 'Thumbs Up', icon: <FaThumbsUp className="w-6 h-6 text-dustyPlum" /> },
  ];

  const handleToggleFalling = async () => {
    if (iconUpdating) return;
    setIconUpdating(true);
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
        // Turn on, restore last icon or default
        await supabase.from('prompt_pages').update({ falling_icon: lastIcon || 'star' }).eq('id', promptPage.id);
        setFallingIcon(lastIcon || 'star');
        setFallingEnabled(true);
      }
    } finally {
      setIconUpdating(false);
    }
  };

  const handleIconChange = async (iconKey: string) => {
    if (iconUpdating) return;
    setIconUpdating(true);
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
      setIconUpdating(false);
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
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mt-4 mb-2">First name</label>
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
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mt-4 mb-2">Last name</label>
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
          Role/position
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
        <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center">
          Industry
          <Tooltip text="The industry the business operates in. This helps AI generate more relevant and personalized reviews." />
        </label>
        <IndustrySelector
          value={formData.industry || []}
          onChange={(industries, otherValue) => setFormData(f => ({ ...f, industry: industries, industry_other: otherValue ?? f.industry_other }))}
          otherValue={formData.industry_other || ''}
          onOtherChange={val => setFormData(f => ({ ...f, industry_other: val }))}
          required
          industryType={industryType}
          setIndustryType={setIndustryType}
        />
      </div>

      <div>
        <label htmlFor="services_offered" className="block text-sm font-medium text-gray-700 mt-4 mb-2">
          Services provided (one per line)
        </label>
        <textarea
          id="services_offered"
          value={formData.services_offered}
          onChange={e => setFormData(prev => ({ ...prev, services_offered: e.target.value }))}
          rows={3}
          className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
          placeholder="Enter each service on a new line"
          required
        />
      </div>

      <div>
        <label htmlFor="friendly_note" className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center">
          Personalized note to customer
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
      {/* Falling Animation Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-lg font-semibold text-indigo-800 flex items-center">
            <FaStar className="w-6 h-6 mr-2 text-indigo-500" />
            Falling star animation
          </label>
          <button
            type="button"
            onClick={handleToggleFalling}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${fallingEnabled ? 'bg-indigo-500' : 'bg-gray-300'}`}
            aria-pressed={!!fallingEnabled}
            disabled={iconUpdating}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${fallingEnabled ? 'translate-x-5' : 'translate-x-1'}`}
            />
          </button>
        </div>
        <div className={`rounded-2xl border border-indigo-200 bg-indigo-50 p-4 ${!fallingEnabled ? 'opacity-60' : ''}`}>
          <div className="text-sm text-gray-700 mb-3 max-w-xl">
            This creates a fun animation where stars (or other icons) rain down for a few seconds when the prompt page loads. You can choose the icon below.
          </div>
          <div className="flex gap-2 bg-white/80 rounded-full px-3 py-1 border border-gray-200 shadow w-max">
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
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-lg font-semibold text-indigo-800 flex items-center">
            <FaGift className="w-6 h-6 mr-2 text-indigo-500" />
            Special offer
            <Tooltip text="Offer a discount or special offer and a link for users to redeem or learn about the steps they need to take." />
          </label>
          <button
            type="button"
            onClick={() => setOfferEnabled(v => !v)}
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
        <div className="text-xs text-gray-500 mt-2">
          Note: Services like Google and Yelp have policies against providing rewards in exchange for reviews, so it's best not to promise a reward for "x" number of reviews, etc.
        </div>
      </div>
      <div>
        <label className="block text-xl font-semibold text-gray-800 mt-4 mb-4">Review platforms</label>
        <p className="text-sm text-gray-500 mt-1 mb-2">Your business profile platforms have been pre-loaded. You can add more if needed.</p>
        {/* Universal Prompt Page note */}
        {isUniversal && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-900 text-sm">
            Note: you cannot pre-write reviews on your Universal Prompt Page because you would get the same review over and over.
          </div>
        )}
        <div className="mt-1 space-y-4">
          {formData.review_platforms.map((link, index) => (
            <div key={index} className="relative mb-6 mt-6 p-6 border border-indigo-200 rounded-2xl bg-indigo-50">
              {/* Platform icon in top left */}
              {link.url && (
                <div className="absolute -top-4 -left-4 bg-white rounded-full shadow p-2 flex items-center justify-center" title={getPlatformIcon(link.url, link.platform).label}>
                  {(() => {
                    const { icon: Icon } = getPlatformIcon(link.url, link.platform);
                    return <Icon className="w-6 h-6" />;
                  })()}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label htmlFor={`platform-${index}`} className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    Platform name
                    <Tooltip text="The name of the review platform (e.g., Google Business Profile, Yelp, Trustpilot)." />
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
                <div className="mb-4">
                  <label htmlFor={`url-${index}`} className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    Review URL
                    <Tooltip text="Paste the direct link to your business's review page on this platform." />
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
                    <Tooltip text="Set a maximum word count for the review. Most platforms have a limit; 200 is a good default." />
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
                    <Tooltip text="These instructions will appear as a pop-up when the question mark is clicked on the public prompt page." />
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
              {/* Only show review text/AI controls if not universal */}
              {!isUniversal && (
                <div className="md:col-span-2 mt-2">
                  <label htmlFor={`reviewText-${index}`} className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    Review Text
                    <Tooltip text="Write or generate the review text that will be suggested to the customer. You can edit or personalize it as needed." />
                  </label>
                  <textarea
                    id={`reviewText-${index}`}
                    value={link.reviewText || ''}
                    onChange={e => handlePlatformChange(index, 'reviewText', e.target.value)}
                    placeholder="Write or generate a review for this platform"
                    className="block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4 mb-1"
                    rows={5}
                  />
                  <div className="flex justify-end mt-2">
                    {link.reviewText && (
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {link.reviewText.split(/\s+/).length} words
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-4">
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
              )}
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
            type="submit"
            onClick={(e) => handleSubmit(e, 'save')}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-800 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={isLoading}
          >
            Save
          </button>
          <a
            href={`/r/${params.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            View
          </a>
        </div>
      </div>

      {previewUrl && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-2xl">
          <p className="text-sm text-green-700">
            Preview page updated!{' '}
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

  // Add a loading guard before rendering the form
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div>Loading...</div></div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full mx-auto mt-6 relative">
        {/* Floating Icon */}
        <div className="absolute -top-6 -left-6 z-10 bg-white rounded-full shadow p-3 flex items-center justify-center w-16 h-16">
          <span className="text-[2.5rem] font-bold text-dustyPlum" style={{fontFamily: 'Inter, sans-serif'}}>[P]</span>
        </div>
        <div className="w-full mx-auto bg-white rounded-lg shadow-lg p-8 relative" style={{maxWidth: 1000}}>
          <div className="absolute -top-6 -left-6 z-10 bg-white rounded-full shadow p-3 flex items-center justify-center">
            <FaStar className="w-9 h-9 text-[#1A237E]" />
          </div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
              <h1 className="text-4xl font-bold text-[#1A237E]">Edit Prompt Page</h1>
            </div>
          </div>
          <form onSubmit={(e) => handleSubmit(e, 'publish')}>
            {isUniversal ? renderStep2() : (step === 1 ? renderStep1() : renderStep2())}
          </form>
        </div>
      </div>
    </div>
  );
} 
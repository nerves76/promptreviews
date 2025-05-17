'use client';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { generateAIReview } from '@/utils/ai';
import { FaGoogle, FaFacebook, FaYelp, FaTripadvisor, FaRegStar } from 'react-icons/fa';
import { IconType } from 'react-icons';
import Link from 'next/link';

interface ReviewPlatformLink {
  platform: string;
  url: string;
  wordCount?: number;
  reviewText?: string;
  customInstructions?: string;
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
    project_type: '',
    outcomes: '',
    review_platforms: [] as ReviewPlatformLink[],
    services_offered: '',
    friendly_note: '',
    status: 'in_queue' as 'in_queue' | 'in_progress' | 'complete' | 'draft',
  });
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [generatingReview, setGeneratingReview] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUniversal, setIsUniversal] = useState(false);
  const [offerEnabled, setOfferEnabled] = useState(false);
  const [offerTitle, setOfferTitle] = useState('Review Rewards');
  const [offerBody, setOfferBody] = useState('');
  const [offerUrl, setOfferUrl] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'in_queue' | 'in_progress' | 'complete' | 'draft'>('in_queue');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
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
          project_type: promptData.project_type || '',
          outcomes: promptData.outcomes || '',
          review_platforms: promptData.review_platforms || [],
          services_offered: Array.isArray(promptData.services_offered) 
            ? promptData.services_offered.join('\n')
            : '',
          friendly_note: promptData.friendly_note || '',
          status: promptData.status || 'in_queue' as 'in_queue' | 'in_progress' | 'complete' | 'draft',
        });
        setIsUniversal(!!promptData.is_universal);
        setOfferEnabled(!!promptData.offer_enabled);
        setOfferTitle(promptData.offer_title || 'Review Rewards');
        setOfferBody(promptData.offer_body || '');
        setOfferUrl(promptData.offer_url || '');
      
        // Fetch business profile
        const { data: businessData } = await supabase
          .from('businesses')
          .select('*')
          .eq('account_id', user.id)
          .single();

        if (businessData) {
          setBusinessProfile(businessData);
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
      const review = await generateAIReview(
        businessProfile,
        {
          first_name: formData.first_name,
          last_name: formData.last_name,
          project_type: formData.project_type,
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

  const handleSubmit = async (e: React.FormEvent, action: 'save' | 'publish') => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
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
          project_type: formData.project_type || null,
          outcomes: formData.outcomes || null,
          friendly_note: formData.friendly_note || null
        };

        // Handle review_platforms
        if (formData.review_platforms && formData.review_platforms.length > 0) {
          updateData.review_platforms = formData.review_platforms
            .map(link => ({
              platform: link.platform,
              url: link.url,
              wordCount: Math.max(200, Number(link.wordCount) || 200),
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
        .update(updateData)
        .eq('id', promptPage.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }
      
      setSuccessMessage('Changes saved successfully!');
      
      // Wait for 1.5 seconds to show the success message before redirecting
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update prompt page');
    } finally {
      setIsLoading(false);
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
        <label htmlFor="project_type" className="block text-sm font-medium text-gray-700 mt-4 mb-2">
          Service Rendered
        </label>
        <textarea
          id="project_type"
          value={formData.project_type}
          onChange={e => setFormData(prev => ({ ...prev, project_type: e.target.value }))}
          rows={4}
          className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
          placeholder="Describe the service you provided"
          required
        />
      </div>

      <div>
        <label htmlFor="outcomes" className="block text-sm font-medium text-gray-700 mt-4 mb-2">
          Outcome
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
        <label htmlFor="services_offered" className="block text-sm font-medium text-gray-700 mt-4 mb-2">
          Services Offered (one per line)
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
        <label htmlFor="friendly_note" className="block text-sm font-medium text-gray-700 mt-4 mb-2">
          Personalized Note to Customer
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
      {/* Review Rewards Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-lg font-semibold text-indigo-800">Review Rewards</label>
          <button
            type="button"
            onClick={() => setOfferEnabled(v => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${offerEnabled ? 'bg-indigo-500' : 'bg-gray-300'}`}
            aria-pressed={offerEnabled}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${offerEnabled ? 'translate-x-5' : 'translate-x-1'}`}
            />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-3">Reward users who complete a set number of reviews and include a link to your rewards page or contact form so they can claim their prize.</p>
        <div className={`rounded-lg border border-indigo-200 bg-indigo-50 p-4 ${!offerEnabled ? 'opacity-60' : ''}`}>
          <input
            type="text"
            value={offerTitle}
            onChange={e => setOfferTitle(e.target.value)}
            placeholder="Offer Title (e.g., Review Rewards)"
            className="block w-full rounded-md border border-indigo-200 bg-indigo-50 focus:ring-2 focus:ring-indigo-300 focus:outline-none sm:text-sm py-2 px-3 mb-2 font-semibold"
            disabled={!offerEnabled}
          />
          <textarea
            value={offerBody}
            onChange={e => setOfferBody(e.target.value)}
            placeholder="Review us on 3 platforms and get 10% off your next service!"
            className="block w-full rounded-md border border-indigo-200 bg-indigo-50 focus:ring-2 focus:ring-indigo-300 focus:outline-none sm:text-sm py-3 px-4"
            rows={2}
            disabled={!offerEnabled}
          />
          <input
            type="url"
            value={offerUrl}
            onChange={e => setOfferUrl(e.target.value)}
            placeholder="Offer URL (e.g., https://yourbusiness.com/claim-reward)"
            className="block w-full rounded-md border border-indigo-200 bg-indigo-50 focus:ring-2 focus:ring-indigo-300 focus:outline-none sm:text-sm py-2 px-3 mt-2"
            disabled={!offerEnabled}
          />
        </div>
      </div>
      <div>
        <label className="block text-xl font-semibold text-gray-800 mt-4 mb-4">Review Platforms</label>
        <p className="text-sm text-gray-500 mt-1 mb-2">Your business profile platforms have been pre-loaded. You can add more if needed.</p>
        {/* Universal Prompt Page note */}
        {isUniversal && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-900 text-sm">
            Note: you cannot pre-write reviews on your Universal Prompt Page because you would get the same review over and over.
          </div>
        )}
        <div className="mt-1 space-y-4">
          {formData.review_platforms.map((link, index) => (
            <div key={index} className="relative mb-6 mt-6 p-6 border rounded-lg bg-gray-50">
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
                    Platform Name
                    <Tooltip text="The name of the review platform (e.g., Google Reviews, Yelp, Trustpilot)." />
                  </label>
                  <input
                    type="text"
                    id={`platform-${index}`}
                    value={link.platform}
                    onChange={e => handlePlatformChange(index, 'platform', e.target.value)}
                    placeholder="e.g., Google Reviews, Yelp, Trustpilot"
                    className="block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                  />
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
                    Word Count Limit
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
                    Custom Instructions
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
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-indigo-300 to-purple-200">
      <div className="max-w-4xl mx-auto mt-6">
        <div className="bg-white shadow-xl rounded-2xl p-12">
          {/* Top Save and View Buttons - now at the very top */}
          {(isUniversal || step === 2) && (
            <div className="flex justify-between items-center mb-8" style={{ marginTop: '-15px' }}>
              <div></div>
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
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md">
              {successMessage}
            </div>
          )}

          <div>
            <div className="mb-8">
              {isUniversal ? (
                <>
                  <h1 className="text-2xl font-bold text-gray-900">Edit Universal Prompt Page</h1>
                  <p className="mt-2 text-sm text-gray-600">
                    The Universal prompt page can be sent to any client/customer. Put your QR code on business cards, flyers, or frame a picture of it and hang it in your business to make it easy for people to give you a review from their phone in seconds.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900">Edit Prompt Page</h1>
                  <p className="mt-2 text-sm text-gray-600">
                    Create a friendly and personalized prompt page for your customer or client.
                  </p>
                </>
              )}
            </div>

            {/* Compact Analytics Module */}
            <div className="mb-8">
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div>
                    <div className="text-xs text-indigo-700 font-semibold uppercase tracking-wide mb-1">Analytics</div>
                    {analyticsLoading ? (
                      <div className="text-xs text-gray-400">Loading...</div>
                    ) : analytics ? (
                      <div className="flex gap-6">
                        <div>
                          <div className="text-xs text-gray-500">Total Interactions</div>
                          <div className="text-lg font-bold text-indigo-900">{analytics.totalClicks}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">AI Generations</div>
                          <div className="text-lg font-bold text-indigo-900">{analytics.aiGenerations}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Copy & Submits</div>
                          <div className="text-lg font-bold text-indigo-900">{analytics.copySubmits}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">No data</div>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Link
                    href={`/dashboard/analytics`}
                    className="inline-flex items-center px-3 py-2 bg-indigo-100 text-indigo-800 rounded-md text-xs font-semibold shadow hover:bg-indigo-200 transition-colors"
                  >
                    View More
                  </Link>
                </div>
              </div>
            </div>

            {/* Status Change Section for Individual Prompt Pages */}
            {!isUniversal && (
              <div className="mb-8">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-gray-700">Page Status:</span>
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="radio"
                      name="status"
                      value="draft"
                      checked={formData.status === 'draft'}
                      onChange={() => setFormData(prev => ({ ...prev, status: 'draft' }))}
                      className="form-radio text-indigo-600"
                    />
                    <span className="text-sm">Draft</span>
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="radio"
                      name="status"
                      value="in_queue"
                      checked={formData.status === 'in_queue'}
                      onChange={() => setFormData(prev => ({ ...prev, status: 'in_queue' }))}
                      className="form-radio text-indigo-600"
                    />
                    <span className="text-sm">In Queue</span>
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="radio"
                      name="status"
                      value="in_progress"
                      checked={formData.status === 'in_progress'}
                      onChange={() => setFormData(prev => ({ ...prev, status: 'in_progress' }))}
                      className="form-radio text-indigo-600"
                    />
                    <span className="text-sm">In Progress</span>
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="radio"
                      name="status"
                      value="complete"
                      checked={formData.status === 'complete'}
                      onChange={() => setFormData(prev => ({ ...prev, status: 'complete' }))}
                      className="form-radio text-indigo-600"
                    />
                    <span className="text-sm">Complete</span>
                  </label>
                </div>
              </div>
            )}

            <form onSubmit={(e) => handleSubmit(e, 'publish')}>
              {isUniversal ? renderStep2() : (step === 1 ? renderStep1() : renderStep2())}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 
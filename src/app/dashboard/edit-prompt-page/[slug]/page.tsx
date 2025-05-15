'use client';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { generateAIReview } from '@/utils/ai';
import { FaGoogle, FaFacebook, FaYelp, FaTripadvisor, FaRegStar } from 'react-icons/fa';
import { IconType } from 'react-icons';

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
    title: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    project_type: '',
    outcomes: '',
    review_platforms: [] as ReviewPlatformLink[],
    custom_incentive: '',
    services_offered: '',
    personal_note: '',
  });
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [generatingReview, setGeneratingReview] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUniversal, setIsUniversal] = useState(false);
  const [offerEnabled, setOfferEnabled] = useState(false);

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

        // Set form data from the prompt page, ensuring all string values have defaults
        setFormData({
          title: promptData.title || '',
          first_name: promptData.first_name || '',
          last_name: promptData.last_name || '',
          email: promptData.email || '',
          phone: promptData.phone || '',
          project_type: promptData.project_type || '',
          outcomes: promptData.outcomes || '',
          review_platforms: promptData.review_platforms || [],
          custom_incentive: promptData.custom_incentive || '',
          services_offered: Array.isArray(promptData.services_offered) 
            ? promptData.services_offered.join('\n')
            : '',
          personal_note: promptData.personal_note || '',
        });
        setIsUniversal(!!promptData.is_universal);

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
      }
    };

    loadData();
  }, [params.slug, supabase]);

  // Enable offer if there is already an offer in formData
  useEffect(() => {
    if (formData.custom_incentive && formData.custom_incentive.trim() !== '') {
      setOfferEnabled(true);
    }
  }, [formData.custom_incentive]);

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
        i === index ? { ...link, [field]: value } : link
      ),
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
          title: formData.title,
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

      // Filter out empty platform links
      const filteredPlatformLinks = formData.review_platforms.filter(
        link => link.platform.trim() && link.url.trim()
      );

      // Build update object
      const updateData: any = {
        title: formData.title,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        email: formData.email,
        project_type: formData.project_type,
        outcomes: formData.outcomes,
        review_platforms: filteredPlatformLinks,
        custom_incentive: offerEnabled ? (formData.custom_incentive || null) : null,
        services_offered: (formData.services_offered || '').split('\n').map(s => s.trim()).filter(Boolean),
        personal_note: formData.personal_note,
      };
      if (action === 'publish') {
        updateData.status = 'published';
      }

      const { error: updateError } = await supabase
        .from('prompt_pages')
        .update(updateData)
        .eq('slug', params.slug);

      if (updateError) throw updateError;
      
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
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mt-10 mb-2">
          Title
        </label>
        <div className="text-xs text-gray-500 mt-1 mb-2">This can be the business you want a review from, or just something memorable like "Review From Mark".</div>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
          placeholder="Enter a title for your prompt page"
          required
        />
      </div>
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
        <label htmlFor="personal_note" className="block text-sm font-medium text-gray-700 mt-4 mb-2">
          Personalized Note to Customer
        </label>
        <textarea
          id="personal_note"
          value={formData.personal_note}
          onChange={e => setFormData(prev => ({ ...prev, personal_note: e.target.value }))}
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
        <div className={`rounded-lg border border-indigo-200 bg-indigo-50 p-4 ${!offerEnabled ? 'opacity-60' : ''}`}>
          <textarea
            id="custom_incentive"
            value={formData.custom_incentive}
            onChange={e => setFormData(prev => ({ ...prev, custom_incentive: e.target.value }))}
            placeholder="Review us on 3 platforms and get 10% off your next service!"
            className="block w-full rounded-md border border-indigo-200 bg-indigo-50 focus:ring-2 focus:ring-indigo-300 focus:outline-none sm:text-sm py-3 px-4"
            rows={2}
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
            Universal Prompt Pages are designed for sharing with many people. Each reviewer should generate their own unique review using AI. You cannot pre-set review text for these pages.
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
                    onChange={e => handlePlatformChange(index, 'wordCount', parseInt(e.target.value))}
                    className="block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                    placeholder="Word count limit"
                    min="50"
                    max="1000"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor={`customInstructions-${index}`} className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    Custom Instructions
                    <Tooltip text="Add any special instructions for this platform (optional). For example, mention if you want the reviewer to focus on a specific aspect." />
                  </label>
                  <input
                    type="text"
                    id={`customInstructions-${index}`}
                    value={link.customInstructions || ''}
                    onChange={e => handlePlatformChange(index, 'customInstructions', e.target.value)}
                    placeholder="Add custom instructions for this platform"
                    className="block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
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
            className="inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-indigo-300 to-purple-200">
      <div className="max-w-4xl mx-auto mt-10">
        <div className="bg-white shadow-xl rounded-2xl p-12">
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
                    Edit your universal prompt page for general use. This page is not customer-specific and is ideal for QR codes, business cards, or general review collection.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900">Edit Prompt Page</h1>
                  <p className="mt-2 text-sm text-gray-600">
                    Customize your prompt page to collect reviews from your customers.
                  </p>
                </>
              )}
            </div>

            {!isUniversal && (
              <div className="mb-8">
                <div className="flex items-center space-x-4">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    1
                  </div>
                  <div className={`text-sm ${step >= 1 ? 'text-indigo-600' : 'text-gray-500'}`}>
                    Basic Information
                  </div>
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    2
                  </div>
                  <div className={`text-sm ${step >= 2 ? 'text-indigo-600' : 'text-gray-500'}`}>
                    Review Platforms
                  </div>
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
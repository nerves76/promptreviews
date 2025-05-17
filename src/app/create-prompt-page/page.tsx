'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { generateAIReview } from '@/utils/ai';
import Header from '../components/Header';
import { slugify } from '@/utils/slugify';
import { FaFileAlt, FaInfoCircle, FaStar, FaGift } from 'react-icons/fa';

interface ReviewPlatformLink {
  platform: string;
  url: string;
  wordCount?: number;
  customInstructions?: string;
  reviewText?: string;
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

export default function CreatePromptPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    client_name: '',
    location: '',
    tone_of_voice: '',
    project_type: '',
    services_offered: '',
    outcomes: '',
    date_completed: '',
    team_member: '',
    review_platforms: [] as { platform: string; url: string }[],
    offer_enabled: false,
    offer_title: '',
    offer_body: '',
    status: 'draft' as const
  });
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [generatingReview, setGeneratingReview] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const loadBusinessProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
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
            setFormData(prev => ({ ...prev, offer_enabled: true, offer_title: businessData.default_offer_title || 'Review Rewards', offer_body: businessData.default_offer_body || '' }));
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
          first_name: formData.client_name,
          last_name: formData.location,
          project_type: formData.project_type,
          outcomes: formData.outcomes,
        },
        formData.review_platforms[index].platform,
        formData.review_platforms[index].wordCount || 200,
        formData.review_platforms[index].customInstructions
      );
      setFormData(prev => {
        const updated = {
          ...prev,
          review_platforms: prev.review_platforms.map((link, i) =>
            i === index ? { ...link, reviewText: review } : link
          ),
        };
        console.log('Set reviewText for index', index, 'to', review);
        console.log('Updated review_platforms:', updated.review_platforms);
        return updated;
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: businessData } = await supabase
        .from('businesses')
        .select('*')
        .eq('account_id', user.id)
        .single();

      if (!businessData) throw new Error('No business found');

      const { data, error } = await supabase
        .from('prompt_pages')
        .insert([
          {
            ...formData,
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
      <div>
        <label htmlFor="client_name" className="block text-sm font-medium text-gray-700 mt-4 mb-2">Client Name</label>
        <input
          type="text"
          id="client_name"
          value={formData.client_name}
          onChange={e => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
          className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
          placeholder="Client Name"
          required
        />
      </div>
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mt-4 mb-2">Location</label>
        <input
          type="text"
          id="location"
          value={formData.location}
          onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
          className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
          placeholder="Location"
          required
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="tone_of_voice" className="block text-sm font-medium text-gray-700 mt-4 mb-2">Tone of Voice</label>
          <input
            type="text"
            id="tone_of_voice"
            value={formData.tone_of_voice}
            onChange={e => setFormData(prev => ({ ...prev, tone_of_voice: e.target.value }))}
            className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
            placeholder="Tone of Voice"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="date_completed" className="block text-sm font-medium text-gray-700 mt-4 mb-2">Date Completed</label>
          <input
            type="date"
            id="date_completed"
            value={formData.date_completed}
            onChange={e => setFormData(prev => ({ ...prev, date_completed: e.target.value }))}
            className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
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
          value={formData.services_offered || ''}
          onChange={e => setFormData(prev => ({ ...prev, services_offered: e.target.value }))}
          rows={3}
          className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
          placeholder="Enter each service on a new line"
          required
        />
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
            value={formData.offer_title}
            onChange={e => setFormData(prev => ({ ...prev, offer_title: e.target.value }))}
            placeholder="Offer Title (e.g., Review Rewards)"
            className="block w-full rounded-md border border-indigo-200 bg-indigo-50 focus:ring-2 focus:ring-indigo-300 focus:outline-none sm:text-sm py-2 px-3 mb-2 font-semibold"
            disabled={!formData.offer_enabled}
          />
          <textarea
            value={formData.offer_body}
            onChange={e => handleOfferFieldsChange(e.target.value)}
            placeholder="Review us on 3 platforms and get 10% off your next service!"
            className="block w-full rounded-md border border-indigo-200 bg-indigo-50 focus:ring-2 focus:ring-indigo-300 focus:outline-none sm:text-sm py-3 px-4"
            rows={2}
            disabled={!formData.offer_enabled}
          />
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
                  <input
                    type="text"
                    id={`platform-${index}`}
                    value={link.platform}
                    onChange={e => handlePlatformChange(index, 'platform', e.target.value)}
                    placeholder="e.g., Google Reviews, Yelp, Trustpilot"
                    className="block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                  />
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
            onClick={(e) => handleSubmit(e, 'preview')}
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
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="md:flex md:items-center md:justify-between mb-8">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                  <FaFileAlt className="text-indigo-500" />
                  Create Prompt Page
                </h1>
                <div className="mt-1 text-xs text-gray-500 max-w-2xl">Create a landing page that makes it incredibly easy for your customers, clients, fans, and friends to post a positive review.</div>
              </div>
            </div>
            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">{error}</div>
            )}
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              {step === 1 ? renderStep1() : renderStep2()}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
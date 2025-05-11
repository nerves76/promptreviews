'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { generateAIReview } from '@/utils/ai';
import Header from '../components/Header';

interface ReviewPlatformLink {
  platform: string;
  url: string;
  buttonText: string;
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

export default function CreatePromptPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    project_type: '',
    outcomes: '',
    review_platform_links: [] as ReviewPlatformLink[],
    custom_incentive: '',
  });
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [generatingReview, setGeneratingReview] = useState<number | null>(null);

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
          .eq('owner_id', user.id)
          .single();

        console.log('Fetched businessData:', businessData);

        if (businessData) {
          setBusinessProfile(businessData);
          if (businessData.preferred_review_platforms) {
            try {
              console.log('Raw preferred_review_platforms:', businessData.preferred_review_platforms);
              const platforms = JSON.parse(businessData.preferred_review_platforms);
              console.log('Parsed platforms:', platforms);
              if (Array.isArray(platforms)) {
                setFormData(prev => ({
                  ...prev,
                  review_platform_links: platforms.map(p => ({
                    platform: p.name || p.platform || '',
                    url: p.url,
                    buttonText: p.buttonText || `Review me on ${p.name || p.platform || ''}`,
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

  const handleAddPlatform = () => {
    setFormData(prev => ({
      ...prev,
      review_platform_links: [...prev.review_platform_links, { platform: '', url: '', buttonText: '' }],
    }));
  };

  const handleRemovePlatform = (index: number) => {
    setFormData(prev => ({
      ...prev,
      review_platform_links: prev.review_platform_links.filter((_, i) => i !== index),
    }));
  };

  const handlePlatformChange = (index: number, field: keyof ReviewPlatformLink, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      review_platform_links: prev.review_platform_links.map((link, i) =>
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
        formData.review_platform_links[index].platform,
        formData.review_platform_links[index].wordCount || 200,
        formData.review_platform_links[index].customInstructions
      );
      setFormData(prev => ({
        ...prev,
        review_platform_links: prev.review_platform_links.map((link, i) =>
          i === index ? { ...link, reviewText: review } : link
        ),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate review');
    } finally {
      setGeneratingReview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be signed in to create a prompt page');
      }
      // Filter out empty platform links
      const filteredPlatformLinks = formData.review_platform_links.filter(
        link => link.platform.trim() && link.url.trim()
      );
      const { data, error: insertError } = await supabase
        .from('prompt_pages')
        .insert({
          business_id: session.user.id,
          title: formData.title,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          project_type: formData.project_type,
          outcomes: formData.outcomes,
          review_platform_links: filteredPlatformLinks,
          custom_incentive: formData.custom_incentive || null,
          status: 'published',
        })
        .select()
        .single();
      if (insertError) throw insertError;
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create prompt page');
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

      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mt-4 mb-2">Email</label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
            placeholder="Email address"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mt-4 mb-2">Phone Number</label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
            placeholder="Phone number"
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">Review Platforms</label>
        <p className="text-sm text-gray-500 mt-1 mb-2">Your business profile platforms have been pre-loaded. You can add more if needed.</p>
        <div className="mt-1 space-y-4">
          {formData.review_platform_links.map((link, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-6 border rounded-lg bg-gray-50">
              <div className="space-y-4 flex flex-col justify-between">
                <input
                  type="text"
                  value={link.platform}
                  onChange={e => handlePlatformChange(index, 'platform', e.target.value)}
                  placeholder="Platform name"
                  className="block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                />
                <input
                  type="url"
                  value={link.url}
                  onChange={e => handlePlatformChange(index, 'url', e.target.value)}
                  placeholder="Review URL"
                  className="block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                />
                <input
                  type="text"
                  value={link.buttonText}
                  onChange={e => handlePlatformChange(index, 'buttonText', e.target.value)}
                  placeholder="Button text"
                  className="block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                />
                <input
                  type="number"
                  value={link.wordCount ?? 200}
                  onChange={e => handlePlatformChange(index, 'wordCount', parseInt(e.target.value))}
                  className="block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                  placeholder="Word count limit"
                  min="50"
                  max="1000"
                />
                {formData.review_platform_links.length > 1 && (
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
                  <label className="block text-xs font-medium text-gray-700 mb-1">Custom Instructions</label>
                  <input
                    type="text"
                    value={link.customInstructions || ''}
                    onChange={e => handlePlatformChange(index, 'customInstructions', e.target.value)}
                    placeholder="Add custom instructions for this platform"
                    className="block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-xs border border-gray-200 py-2 px-3 mb-4"
                  />
                  <label className="block text-xs font-medium text-gray-700 mb-1">Review</label>
                  <textarea
                    value={link.reviewText || ''}
                    onChange={e => handlePlatformChange(index, 'reviewText', e.target.value)}
                    placeholder="Write or generate a review for this platform"
                    className="block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-xs border border-gray-200 py-2 px-3 mb-2"
                    rows={5}
                  />
                  <div className="flex items-center gap-2 justify-between mt-2">
                    <button
                      type="button"
                      onClick={() => handleGenerateAIReview(index)}
                      disabled={generatingReview === index}
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs font-medium shadow disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
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
                      <span className="text-xs text-gray-500 ml-2">
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
    </div>
  );

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="md:flex md:items-center md:justify-between mb-8">
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                  Create Prompt Page
                </h2>
                <div className="mt-1 text-xs text-gray-500 max-w-2xl">Create a landing page that makes it incredibly easy for your customers, clients, fans, and friends to post a positive review.</div>
              </div>
            </div>
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 ? renderStep1() : renderStep2()}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
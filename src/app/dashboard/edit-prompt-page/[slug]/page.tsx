'use client';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { generateAIReview } from '@/utils/ai';

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
  });
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [generatingReview, setGeneratingReview] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
        });

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
        custom_incentive: formData.custom_incentive || null,
        services_offered: (formData.services_offered || '').split('\n').map(s => s.trim()).filter(Boolean),
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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

        <div className="bg-white shadow rounded-lg p-12">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Edit Prompt Page</h1>
            <p className="mt-2 text-sm text-gray-600">
              Customize your prompt page to collect reviews from your customers.
            </p>
          </div>

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

          <form onSubmit={(e) => handleSubmit(e, 'publish')}>
            {step === 1 ? renderStep1() : renderStep2()}
          </form>
        </div>
      </div>
    </div>
  );
} 
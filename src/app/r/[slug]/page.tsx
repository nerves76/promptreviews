"use client";

import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import SocialMediaIcons from '@/app/components/SocialMediaIcons';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Card } from '@/app/components/ui/card';
import { FaStar, FaGoogle, FaFacebook, FaYelp, FaTripadvisor, FaRegStar, FaQuestionCircle } from 'react-icons/fa';
import { IconType } from 'react-icons';

interface StyleSettings {
  name: string;
  logo_url: string | null;
  primary_font: string;
  secondary_font: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  facebook_url: string | null;
  instagram_url: string | null;
  bluesky_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  linkedin_url: string | null;
  pinterest_url: string | null;
  background_type: string;
  gradient_start: string;
  gradient_middle: string;
  gradient_end: string;
}

interface ReviewPlatform {
  id: string;
  name: string;
  url: string;
  customInstructions?: string;
}

interface BusinessProfile {
  name: string;
  logo_url: string | null;
  primary_font: string;
  secondary_font: string;
  header_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  facebook_url: string | null;
  instagram_url: string | null;
  bluesky_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  linkedin_url: string | null;
  pinterest_url: string | null;
  background_type: 'solid' | 'gradient';
  gradient_start: string;
  gradient_middle: string;
  gradient_end: string;
  business_name: string;
  review_platforms: ReviewPlatform[];
  default_offer_enabled?: boolean;
  default_offer_title?: string;
  default_offer_body?: string;
  business_website?: string;
  offer_learn_more_url?: string;
}

// Helper to get platform icon based on URL or platform name
function getPlatformIcon(url: string, platform: string): { icon: IconType, label: string } {
  const lowerUrl = url?.toLowerCase() || '';
  const lowerPlatform = (platform || '').toLowerCase();
  if (lowerUrl.includes('google') || lowerPlatform.includes('google')) return { icon: FaGoogle, label: 'Google' };
  if (lowerUrl.includes('facebook') || lowerPlatform.includes('facebook')) return { icon: FaFacebook, label: 'Facebook' };
  if (lowerUrl.includes('yelp') || lowerPlatform.includes('yelp')) return { icon: FaYelp, label: 'Yelp' };
  if (lowerUrl.includes('tripadvisor') || lowerPlatform.includes('tripadvisor')) return { icon: FaTripadvisor, label: 'TripAdvisor' };
  return { icon: FaRegStar, label: 'Other' };
}

export default function PromptPage() {
  const router = useRouter();
  const params = useParams();
  const [promptPage, setPromptPage] = useState<any>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [platformReviewTexts, setPlatformReviewTexts] = useState<string[]>([]);
  const [aiRewriteCounts, setAiRewriteCounts] = useState<number[]>([]);
  const [aiLoading, setAiLoading] = useState<number | null>(null);
  const [showRewardsBanner, setShowRewardsBanner] = useState(true);
  const [showPersonalNote, setShowPersonalNote] = useState(true);
  const [openInstructionsIdx, setOpenInstructionsIdx] = useState<number | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const slug = params.slug as string;
      
      try {
        const { data: promptData, error: promptError } = await supabase
          .from('prompt_pages')
          .select('*')
          .eq('slug', slug)
          .single();

        if (promptError) {
          console.error('PromptPage Supabase error:', promptError);
          throw promptError;
        }
        setPromptPage(promptData);

        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('account_id', promptData.account_id)
          .single();

        if (businessError) {
          console.error('BusinessProfile Supabase error:', businessError);
          throw businessError;
        }
        console.log('Business data from Supabase:', businessData);
        setBusinessProfile({
          ...businessData,
          business_name: businessData.name,
          review_platforms: [],
          business_website: businessData.business_website,
          offer_learn_more_url: businessData.offer_learn_more_url
        });
        console.log('Set business profile with website:', businessData.business_website);
      } catch (err) {
        console.error('PromptPage fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load page');
      } finally {
        setLoading(false);
      }
    };

    if (params.slug) fetchData();
  }, [params.slug, supabase]);

  useEffect(() => {
    if (promptPage && Array.isArray(promptPage.review_platforms)) {
      setPlatformReviewTexts(promptPage.review_platforms.map((p: any) => p.reviewText || ''));
      setAiRewriteCounts(promptPage.review_platforms.map(() => 0));
    }
  }, [promptPage]);

  // Track page view (exclude logged-in users)
  useEffect(() => {
    async function trackView() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user && promptPage?.id) {
        fetch('/api/track-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            promptPageId: promptPage.id,
            eventType: 'view',
          }),
        });
      }
    }
    trackView();
  }, [promptPage, supabase]);

  const handleReviewTextChange = (idx: number, value: string) => {
    setPlatformReviewTexts(prev => prev.map((text, i) => i === idx ? value : text));
  };

  const handleCopyAndSubmit = (idx: number, url: string) => {
    const text = platformReviewTexts[idx] || '';
    if (text) {
      navigator.clipboard.writeText(text);
    }
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    // Track copy_submit event (exclude logged-in users)
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user && promptPage?.id && promptPage.review_platforms?.[idx]) {
        fetch('/api/track-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            promptPageId: promptPage.id,
            eventType: 'copy_submit',
            platform: promptPage.review_platforms[idx].platform || promptPage.review_platforms[idx].name || '',
          }),
        });
      }
    })();
  };

  const handleRewriteWithAI = async (idx: number) => {
    if (!promptPage || !businessProfile) return;
    setAiLoading(idx);
    try {
      const platform = promptPage.review_platforms[idx];
      const prompt = `Generate a positive review for ${businessProfile.business_name} on ${platform.platform || platform.name}. The review should be authentic, specific, and highlight the business's strengths.`;
      const response = await fetch('/api/generate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (!response.ok) throw new Error('Failed to generate review');
      const { text } = await response.json();
      setPlatformReviewTexts(prev => prev.map((t, i) => i === idx ? text : t));
      setAiRewriteCounts(prev => prev.map((c, i) => i === idx ? c + 1 : c));
    } catch (err) {
      // Optionally show error
    } finally {
      setAiLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: businessProfile?.background_color || '#FFFFFF' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: businessProfile?.header_color || '#4F46E5' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: businessProfile?.background_color || '#FFFFFF' }}>
        <div className="text-red-600" style={{ color: businessProfile?.text_color || '#1F2937' }}>{error}</div>
      </div>
    );
  }

  if (!promptPage || !businessProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: businessProfile?.background_color || '#FFFFFF' }}>
        <div style={{ color: businessProfile?.text_color || '#1F2937' }}>Page not found.</div>
      </div>
    );
  }

  // Only compute these after promptPage and businessProfile are loaded
  const showOffer = promptPage?.offer_enabled ?? businessProfile?.default_offer_enabled;
  const offerTitle = promptPage?.offer_title || businessProfile?.default_offer_title || 'Review Rewards';
  const offerBody = promptPage?.offer_body || businessProfile?.default_offer_body || '';
  const offerLearnMoreUrl = promptPage?.offer_learn_more_url || businessProfile?.offer_learn_more_url || '';

  // Review Rewards Banner logic
  const showBanner = showRewardsBanner && promptPage.offer_enabled && promptPage.offer_title && promptPage.offer_body;

  // Compute background style
  const backgroundStyle = businessProfile?.background_type === 'gradient'
    ? {
        background: `linear-gradient(to bottom right, ${businessProfile.gradient_start}, ${businessProfile.gradient_middle}, ${businessProfile.gradient_end})`,
        color: businessProfile?.text_color || '#1F2937',
      }
    : {
        backgroundColor: businessProfile?.background_color || '#FFFFFF',
        color: businessProfile?.text_color || '#1F2937',
      };

  return (
    <div className="min-h-screen" style={backgroundStyle}>
      {/* Review Rewards Banner */}
      {showBanner && (
        <div className="w-full flex items-center justify-center relative px-4 py-2 bg-yellow-50 border-b border-yellow-300 text-black text-sm font-medium shadow-sm" style={{ minHeight: 0, fontSize: '0.97rem' }}>
          <span className="flex items-center gap-2 mx-auto">
            {/* Yellow SVG Gift Icon with lighter lid, darker ribbon and bow */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex-shrink-0"
              style={{ display: 'inline', verticalAlign: 'middle' }}
            >
              {/* Box */}
              <rect x="3" y="8" width="18" height="13" rx="2" fill="#fde68a" />
              {/* Lid (lighter yellow) */}
              <rect x="2" y="6" width="20" height="4" rx="1.5" fill="#facc15" />
              {/* Bow left */}
              <path d="M12 6C10.5 2.5 6 3.5 7.5 6C9 8.5 12 6 12 6Z" fill="#ca8a04" />
              {/* Bow right */}
              <path d="M12 6C13.5 2.5 18 3.5 16.5 6C15 8.5 12 6 12 6Z" fill="#ca8a04" />
              {/* Ribbon */}
              <rect x="11" y="8" width="2" height="13" fill="#ca8a04" />
            </svg>
            <span className="font-semibold">{promptPage.offer_title}:</span>
            <span className="ml-1">{promptPage.offer_body}</span>
          </span>
          {offerLearnMoreUrl && (
            <a
              href={offerLearnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-blue-600 hover:text-blue-800 underline"
            >
              Learn More
            </a>
          )}
          <button
            className="absolute right-4 text-black text-lg font-bold hover:text-yellow-600 focus:outline-none"
            aria-label="Dismiss"
            onClick={() => setShowRewardsBanner(false)}
            style={{ lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      )}
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Business Info Card */}
          <div className="bg-white rounded-2xl shadow p-8 mb-8 flex flex-col items-center mx-auto max-w-md animate-slideup">
            {/* Business Logo */}
            <div className="flex justify-center mb-4">
              {businessProfile?.logo_url ? (
                <img
                  src={businessProfile.logo_url}
                  alt={`${businessProfile?.business_name || 'Business'} logo`}
                  className="h-32 w-32 object-contain rounded-full"
                />
              ) : (
                <div className="h-32 w-32 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-4xl text-gray-500">
                    {businessProfile?.business_name?.[0] || 'B'}
                  </span>
                </div>
              )}
            </div>
            {/* Business Name */}
            <h1 
              className={`text-3xl font-bold text-center mb-2 ${businessProfile?.primary_font || 'font-inter'}`}
              style={{ color: businessProfile?.header_color || '#4F46E5' }}
            >
              {businessProfile?.business_name ? `Give ${businessProfile.business_name} a Review` : 'Give Us a Review'}
            </h1>
            {/* Estimated time note */}
            <div className="text-center text-sm text-gray-500 mb-2">Estimated time to complete: 2-5 minutes</div>
          </div>
          {/* Personalized Note */}
          {promptPage?.friendly_note && !promptPage?.is_universal && showPersonalNote && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadein">
              <div className="bg-white rounded-lg p-6 max-w-lg mx-4 relative animate-slideup">
                <button
                  className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowPersonalNote(false)}
                  aria-label="Close note"
                >
                  ×
                </button>
                <div className="text-gray-900 text-base">
                  {promptPage.friendly_note}
                </div>
              </div>
            </div>
          )}

          {/* Review Platforms Section */}
          {Array.isArray(promptPage?.review_platforms) && promptPage.review_platforms.length > 0 && (
            <div className="mt-10 mb-12">
              <div className="bg-white rounded-2xl shadow pt-6 pb-8 px-8 mb-8">
                <h2
                  className={`text-xl font-bold mb-2 mt-0 ${businessProfile?.primary_font || 'font-inter'}`}
                  style={{ color: businessProfile?.header_color || '#4F46E5' }}
                >
                  Review Platforms
                </h2>
                <p className="text-gray-700 text-base">
                  Reviews help small businesses grow. Feel free to use an AI generated review and edit to your liking. Then click <b>"Copy &amp; Submit"</b> to be taken to the site in order to leave your review.
                </p>
              </div>
              <div className="flex flex-col gap-8">
                {promptPage.review_platforms.map((platform: any, idx: number) => {
                  const { icon: Icon, label } = getPlatformIcon(platform.url, platform.platform || platform.name);
                  const isUniversal = !!promptPage.is_universal;
                  return (
                    <div
                      key={idx}
                      className="relative bg-white rounded-xl shadow p-4 pt-8 flex flex-col items-start border border-gray-100 animate-slideup"
                      style={{ animationDelay: `${300 + idx * 100}ms` }}
                    >
                      {/* Icon in top-left corner */}
                      <div className="absolute -top-4 -left-4 bg-white rounded-full shadow p-2 flex items-center justify-center" title={label}>
                        <Icon className="w-7 h-7 text-indigo-500" />
                      </div>
                      <div className="flex items-center gap-3 mb-2 mt-0">
                        <div
                          className={`text-lg font-semibold ${businessProfile?.primary_font || 'font-inter'}`}
                          style={{ color: businessProfile?.header_color || '#4F46E5' }}
                        >
                          {platform.platform || platform.name}
                          {platform.customInstructions && platform.customInstructions.trim() && (
                            <button
                              type="button"
                              className="ml-2 text-yellow-600 hover:text-yellow-800 focus:outline-none"
                              onClick={() => setOpenInstructionsIdx(openInstructionsIdx === idx ? null : idx)}
                              aria-label="Show custom instructions"
                              style={{ verticalAlign: 'middle' }}
                            >
                              <FaQuestionCircle className="inline-block w-5 h-5 align-middle" />
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Popup for custom instructions */}
                      {openInstructionsIdx === idx && platform.customInstructions && platform.customInstructions.trim() && (
                        <div className="absolute z-50 left-1/2 -translate-x-1/2 top-10 bg-white border border-yellow-300 rounded shadow-lg p-4 text-yellow-900 text-sm max-w-xs w-max animate-fadein" style={{ minWidth: 220 }}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold">Instructions</span>
                            <button
                              type="button"
                              className="text-gray-400 hover:text-gray-700 ml-2"
                              onClick={() => setOpenInstructionsIdx(null)}
                              aria-label="Close instructions"
                            >
                              ×
                            </button>
                          </div>
                          <div>{platform.customInstructions}</div>
                        </div>
                      )}
                      <textarea
                        className="w-full mt-2 mb-4 p-4 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Write your review here..."
                        value={isUniversal ? (platformReviewTexts[idx] || '') : (platformReviewTexts[idx] || '')}
                        onChange={e => handleReviewTextChange(idx, e.target.value)}
                        rows={5}
                      />
                      <div className="flex justify-between w-full">
                        <button
                          onClick={() => handleRewriteWithAI(idx)}
                          disabled={aiLoading === idx}
                          className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
                        >
                          {aiLoading === idx ? 'Generating...' : 'Generate with AI'}
                        </button>
                        <button
                          onClick={() => handleCopyAndSubmit(idx, platform.url)}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          Copy & Submit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Website and Social Media Card */}
          <div className="mt-16 bg-white rounded-2xl shadow p-8 animate-slideup">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Website Column */}
              <div className="flex flex-col justify-start mb-8 md:mb-0 text-center md:text-left h-full">
                {businessProfile?.business_website && (
                  <>
                    <h2 
                      className={`text-2xl font-bold mt-0 mb-6 ${businessProfile?.primary_font || 'font-inter'}`}
                      style={{ color: businessProfile?.header_color || '#000000' }}
                    >
                      Visit Our Website
                    </h2>
                    <a
                      href={businessProfile.business_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-blue-700 hover:text-blue-900 hover:underline text-xl font-medium transition-colors duration-200"
                      onClick={async () => {
                        if (!promptPage?.id) return;
                        await fetch('/api/track-event', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            promptPageId: promptPage.id,
                            eventType: 'website_click',
                            platform: 'website',
                          }),
                        });
                      }}
                    >
                      {businessProfile.business_website.replace(/^https?:\/\//, '')}
                    </a>
                  </>
                )}
              </div>
              {/* Social Media Column */}
              <div className="flex flex-col justify-start text-center md:text-left h-full">
                <h2 
                  className={`text-2xl font-bold mt-0 mb-6 ${businessProfile?.primary_font || 'font-inter'}`}
                  style={{ color: businessProfile?.header_color || '#000000' }}
                >
                  Stay Connected
                </h2>
                <p 
                  className={`mb-8 ${businessProfile?.secondary_font || 'font-inter'}`}
                  style={{ color: businessProfile?.text_color || '#000000' }}
                >
                  Follow us on social for the latest!
                </p>
                <div className="flex justify-center md:justify-start gap-6">
                  <SocialMediaIcons
                    facebook_url={businessProfile.facebook_url || undefined}
                    instagram_url={businessProfile.instagram_url || undefined}
                    bluesky_url={businessProfile.bluesky_url || undefined}
                    tiktok_url={businessProfile.tiktok_url || undefined}
                    youtube_url={businessProfile.youtube_url || undefined}
                    linkedin_url={businessProfile.linkedin_url || undefined}
                    pinterest_url={businessProfile.pinterest_url || undefined}
                    color={businessProfile.header_color || '#3b82f6'}
                    onIconClick={async (platform) => {
                      if (!promptPage?.id) return;
                      await fetch('/api/track-event', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          promptPageId: promptPage.id,
                          eventType: 'social_click',
                          platform,
                        }),
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
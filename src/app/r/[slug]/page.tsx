"use client";

import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import SocialMediaIcons from '@/app/components/SocialMediaIcons';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Card } from '@/app/components/ui/card';
import { FaStar, FaGoogle, FaFacebook, FaYelp, FaTripadvisor, FaRegStar } from 'react-icons/fa';
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
}

interface BusinessProfile {
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
  background_type: 'solid' | 'gradient';
  gradient_start: string;
  gradient_middle: string;
  gradient_end: string;
  business_name: string;
  review_platforms: ReviewPlatform[];
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

        if (promptError) throw promptError;
        setPromptPage(promptData);

        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('name, logo_url, primary_font, secondary_font, primary_color, secondary_color, background_color, text_color, facebook_url, instagram_url, bluesky_url, tiktok_url, youtube_url, linkedin_url, pinterest_url, background_type, gradient_start, gradient_middle, gradient_end')
          .eq('account_id', promptData.account_id)
          .single();

        if (businessError) throw businessError;
        setBusinessProfile({
          ...businessData,
          business_name: businessData.name,
          review_platforms: []
        });
      } catch (err) {
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
  };

  const handleRewriteWithAI = async (idx: number) => {
    if (!promptPage || !businessProfile) return;
    setAiLoading(idx);
    try {
      const platform = promptPage.review_platforms[idx];
      const prompt = `Generate a positive review for ${businessProfile.name} on ${platform.platform || platform.name}. The review should be authentic, specific, and highlight the business's strengths.`;
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: businessProfile?.primary_color || '#4F46E5' }}></div>
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

  return (
    <div 
      className={`min-h-screen ${businessProfile?.primary_font || 'font-inter'}`}
      style={{
        background: businessProfile?.background_type === 'gradient'
          ? `linear-gradient(to bottom right, ${businessProfile.gradient_start}, ${businessProfile.gradient_middle}, ${businessProfile.gradient_end})`
          : businessProfile?.background_color || '#FFFFFF',
        color: businessProfile?.text_color || '#1F2937'
      }}
    >
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
            style={{ color: businessProfile?.primary_color || '#4F46E5' }}
          >
            {businessProfile?.business_name ? `Give ${businessProfile.business_name} a Review` : 'Give Us a Review'}
          </h1>
          {/* Estimated time note */}
          <div className="text-center text-sm text-gray-500 mb-2">Estimated time to complete: 3-5 minutes</div>
        </div>
        {/* Personalized Note */}
        {promptPage?.personal_note && !promptPage?.is_universal && (
          <div className="mb-8 mx-auto max-w-2xl bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-indigo-900 text-base shadow animate-slideup" style={{ animationDelay: '100ms' }}>
            {promptPage.personal_note}
          </div>
        )}

        {/* Review Rewards (Promotion) */}
        {promptPage?.custom_incentive && (
          <div
            className="rounded-lg p-4 mb-8 flex items-center gap-3 border bg-white animate-slideup"
            style={{
              borderColor: businessProfile?.primary_color || '#4F46E5',
              animationDelay: '200ms',
            }}
          >
            <FaStar
              className="w-6 h-6 flex-shrink-0"
              style={{ color: businessProfile?.primary_color || '#4F46E5' }}
            />
            <span
              className="text-lg font-semibold"
              style={{ color: businessProfile?.text_color || '#1F2937' }}
            >
              {promptPage.custom_incentive}
            </span>
          </div>
        )}

        {/* Review Platforms Section */}
        {Array.isArray(promptPage?.review_platforms) && promptPage.review_platforms.length > 0 && (
          <div className="mt-10 mb-12">
            <h2 className="text-xl font-bold mb-4 text-indigo-800">Review Platforms</h2>
            <div className="flex flex-col gap-8">
              {promptPage.review_platforms.map((platform: any, idx: number) => {
                const { icon: Icon, label } = getPlatformIcon(platform.url, platform.platform || platform.name);
                const isUniversal = !!promptPage.is_universal;
                return (
                  <div
                    key={idx}
                    className="relative bg-white rounded-xl shadow p-6 flex flex-col items-start border border-gray-100 animate-slideup"
                    style={{ animationDelay: `${300 + idx * 100}ms` }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-white rounded-full shadow p-2 flex items-center justify-center" title={label}>
                        <Icon className="w-7 h-7 text-indigo-500" />
                      </div>
                      <div className="text-lg font-semibold text-gray-900">{platform.platform || platform.name}</div>
                    </div>
                    <textarea
                      className="w-full mt-2 mb-4 p-4 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Write your review here..."
                      value={platformReviewTexts[idx] || ''}
                      onChange={e => handleReviewTextChange(idx, e.target.value)}
                      rows={5}
                    />
                    <div className="flex justify-between items-center w-full mb-2">
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow"
                        onClick={() => handleCopyAndSubmit(idx, platform.url)}
                      >
                        Copy & Submit
                      </button>
                      {!isUniversal && (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="inline-flex items-center px-3 py-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 text-xs font-medium shadow disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleRewriteWithAI(idx)}
                            disabled={aiRewriteCounts[idx] >= 3 || aiLoading === idx}
                          >
                            {aiLoading === idx ? (
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              'Rewrite with AI'
                            )}
                          </button>
                          <span className="text-xs text-gray-500">{aiRewriteCounts[idx]}/3</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Social Media Section */}
        <div className="mt-16 text-center">
          <h2 
            className={`text-2xl font-bold mb-6 ${businessProfile?.primary_font || 'font-inter'}`}
            style={{ color: businessProfile?.primary_color || '#000000' }}
          >
            Stay Connected
          </h2>
          <p 
            className={`mb-8 ${businessProfile?.secondary_font || 'font-inter'}`}
            style={{ color: businessProfile?.text_color || '#000000' }}
          >
            Follow us on social media for the latest updates and news!
          </p>
          <div className="flex justify-center gap-6">
            <SocialMediaIcons
              facebook_url={businessProfile?.facebook_url || undefined}
              instagram_url={businessProfile?.instagram_url || undefined}
              bluesky_url={businessProfile?.bluesky_url || undefined}
              tiktok_url={businessProfile?.tiktok_url || undefined}
              youtube_url={businessProfile?.youtube_url || undefined}
              linkedin_url={businessProfile?.linkedin_url || undefined}
              pinterest_url={businessProfile?.pinterest_url || undefined}
              color={businessProfile?.primary_color || '#000000'}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 
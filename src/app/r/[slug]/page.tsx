"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import SocialMediaIcons from '@/app/components/SocialMediaIcons';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Card } from '@/app/components/ui/card';

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

export default function PromptPage() {
  const router = useRouter();
  const params = useParams();
  const [promptPage, setPromptPage] = useState<any>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [reviewText, setReviewText] = useState('');

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

  const handleEditReviewText = async (platformIndex: number, newText: string) => {
    if (!promptPage) return;

    const updatedPlatforms = [...promptPage.review_platforms];
    updatedPlatforms[platformIndex] = {
      ...updatedPlatforms[platformIndex],
      reviewText: newText
    };

    const { error } = await supabase
      .from('prompt_pages')
      .update({ review_platforms: updatedPlatforms })
      .eq('id', promptPage.id);

    if (!error) {
      setPromptPage({ ...promptPage, review_platforms: updatedPlatforms });
    }
  };

  const generateReviewText = async (platformIndex: number) => {
    if (!promptPage || !businessProfile) return;

    const platform = promptPage.review_platforms[platformIndex];
    const prompt = `Generate a positive review for ${businessProfile.name} on ${platform.platform}. The review should be authentic, specific, and highlight the business's strengths.`;

    try {
      const response = await fetch('/api/generate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) throw new Error('Failed to generate review');
      
      const { text } = await response.json();
      await handleEditReviewText(platformIndex, text);
    } catch (err) {
      console.error('Error generating review:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
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
        {/* Business Logo */}
        <div className="flex justify-center mb-8">
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
          className={`text-3xl font-bold text-center mb-8 ${businessProfile?.primary_font || 'font-inter'}`}
          style={{ color: businessProfile?.primary_color || '#4F46E5' }}
        >
          {businessProfile?.business_name || 'Business Name'}
        </h1>

        {/* Review Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 
            className={`text-2xl font-bold mb-4 ${businessProfile?.primary_font || 'font-inter'}`}
            style={{ color: businessProfile?.primary_color || '#4F46E5' }}
          >
            {promptPage?.heading || 'Leave a Review'}
          </h2>
          <p 
            className={`mb-6 ${businessProfile?.secondary_font || 'font-inter'}`}
            style={{ color: businessProfile?.text_color || '#1F2937' }}
          >
            {promptPage?.description || 'Share your experience with us.'}
          </p>
          <textarea
            className="w-full h-32 p-4 border rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Write your review here..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
          />
          <div className="flex gap-4">
            <button
              type="button"
              className="inline-flex items-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow"
              onClick={() => generateReviewText(0)}
            >
              Generate with AI
            </button>
            <button
              onClick={handleSubmit}
              className="inline-flex items-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow"
              style={{ backgroundColor: businessProfile?.primary_color || '#4F46E5' }}
            >
              Submit Review
            </button>
          </div>
        </div>

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
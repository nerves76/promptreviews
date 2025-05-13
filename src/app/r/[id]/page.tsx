"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import SocialMediaIcons from '@/app/components/SocialMediaIcons';

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
}

export default function PromptPage() {
  const router = useRouter();
  const params = useParams();
  const [promptPage, setPromptPage] = useState<any>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const id = params.id as string;
      
      try {
        // Fetch prompt page
        const { data: promptData, error: promptError } = await supabase
          .from('prompt_pages')
          .select('*')
          .eq('id', id)
          .single();

        if (promptError) throw promptError;
        setPromptPage(promptData);

        // Fetch business profile
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('name, logo_url, primary_font, secondary_font, primary_color, secondary_color, background_color, text_color, facebook_url, instagram_url, bluesky_url, tiktok_url, youtube_url, linkedin_url, pinterest_url')
          .eq('account_id', promptData.account_id)
          .single();

        if (businessError) throw businessError;
        setBusinessProfile(businessData);
      } catch (err) {
        setError('Failed to load page data.');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchData();
  }, [params.id, supabase]);

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
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8"
      style={{ 
        backgroundColor: businessProfile.background_color,
        color: businessProfile.text_color,
        fontFamily: businessProfile.secondary_font
      }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Business Logo and Name */}
        <div className="text-center mb-12">
          {businessProfile.logo_url && (
            <div className="mb-4">
              <img
                src={businessProfile.logo_url}
                alt={`${businessProfile.name} logo`}
                className="w-24 h-24 rounded-full mx-auto object-cover border-4"
                style={{ borderColor: businessProfile.primary_color }}
              />
            </div>
          )}
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ 
              fontFamily: businessProfile.primary_font,
              color: businessProfile.primary_color
            }}
          >
            {businessProfile.name}
          </h1>
          <p className="text-lg text-gray-600 mb-8">Help us grow by sharing your experience!</p>
        </div>

        {/* Review Platforms */}
        <div className="space-y-8">
          {(promptPage.review_platforms || []).map((platform: any, index: number) => (
            <div 
              key={index}
              className="bg-white rounded-lg shadow-lg p-6"
              style={{ backgroundColor: businessProfile.background_color }}
            >
              <h2 
                className="text-xl font-semibold mb-4"
                style={{ 
                  fontFamily: businessProfile.primary_font,
                  color: businessProfile.primary_color
                }}
              >
                {platform.platform}
              </h2>
              
              {platform.reviewText && (
                <div className="mb-4 p-4 rounded bg-gray-50">
                  <p className="text-sm" style={{ fontFamily: businessProfile.secondary_font }}>
                    {platform.reviewText}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => window.open(platform.url, '_blank')}
                  className="px-6 py-2 rounded-md text-white font-medium shadow-sm hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: businessProfile.secondary_color }}
                >
                  Write a Review
                </button>
                <button
                  onClick={() => {
                    if (platform.reviewText) {
                      navigator.clipboard.writeText(platform.reviewText);
                    }
                  }}
                  className="px-6 py-2 rounded-md border font-medium shadow-sm hover:bg-gray-50 transition-colors"
                  style={{ 
                    borderColor: businessProfile.secondary_color,
                    color: businessProfile.secondary_color
                  }}
                >
                  Copy Review Text
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Social Media Section */}
        <div className="mt-16 text-center">
          <h2 
            className="text-2xl font-bold mb-6"
            style={{ 
              fontFamily: businessProfile.primary_font,
              color: businessProfile.primary_color
            }}
          >
            Connect With Us
          </h2>
          <p className="text-gray-600 mb-8">Follow us on social media for updates and more!</p>
          <div className="flex justify-center gap-6">
            <SocialMediaIcons
              facebook_url={businessProfile.facebook_url || undefined}
              instagram_url={businessProfile.instagram_url || undefined}
              bluesky_url={businessProfile.bluesky_url || undefined}
              tiktok_url={businessProfile.tiktok_url || undefined}
              youtube_url={businessProfile.youtube_url || undefined}
              linkedin_url={businessProfile.linkedin_url || undefined}
              pinterest_url={businessProfile.pinterest_url || undefined}
              color={businessProfile.primary_color || '#000000'}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 
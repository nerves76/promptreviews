/**
 * Server-Side Prompt Page Component
 * 
 * This is an alternative server-rendered version for optimal performance
 * when accessed via QR codes or direct links
 */

import { notFound } from 'next/navigation';
import { createServiceRoleClient } from '@/utils/supabaseClient';
import { Metadata } from 'next';

// Server component for initial page load
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from('prompt_pages')
      .select('client_name, review_type')
      .eq('slug', slug)
      .maybeSingle();

    if (!data) {
      return {
        title: 'Page Not Found',
      };
    }

    return {
      title: `Leave a Review - ${data.client_name || 'PromptReviews'}`,
      description: `Share your experience and leave a ${data.review_type || 'review'}`,
    };
  } catch {
    return {
      title: 'PromptReviews',
    };
  }
}

interface PromptPageData {
  promptPage: any;
  businessProfile: any;
}

async function getPromptPageData(slug: string): Promise<PromptPageData | null> {
  try {
    const supabase = createServiceRoleClient();
    
    const { data: result, error } = await supabase
      .from('prompt_pages')
      .select(`
        *,
        businesses!prompt_pages_account_id_fkey (
          id,
          name,
          logo_url,
          logo_print_url,
          primary_font,
          secondary_font,
          primary_color,
          secondary_color,
          background_color,
          text_color,
          facebook_url,
          instagram_url,
          bluesky_url,
          tiktok_url,
          youtube_url,
          linkedin_url,
          pinterest_url,
          background_type,
          gradient_start,
          gradient_middle,
          gradient_end,
          business_website,
          default_offer_url,
          card_bg,
          card_text,
          card_inner_shadow,
          card_shadow_color,
          card_shadow_intensity
        )
      `)
      .eq('slug', slug)
      .maybeSingle();

    if (error || !result) {
      return null;
    }

    return {
      promptPage: result,
      businessProfile: result.businesses
    };
  } catch (error) {
    console.error('Error fetching prompt page data:', error);
    return null;
  }
}

export default async function ServerPromptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPromptPageData(slug);

  if (!data) {
    notFound();
  }

  const { promptPage, businessProfile } = data;

  // Basic server-rendered shell - hydrate with client component for interactivity
  return (
    <html lang="en">
      <head>
        {/* Preload critical fonts */}
        <link
          rel="preload"
          href={`https://fonts.googleapis.com/css2?family=${businessProfile?.primary_font || 'Inter'}:wght@400;500;600;700&display=swap`}
          as="style"
        />
        <link
          rel="preload"
          href={`https://fonts.googleapis.com/css2?family=${businessProfile?.secondary_font || 'Inter'}:wght@400;500;600;700&display=swap`}
          as="style"
        />
        {/* Critical CSS for above-the-fold content */}
        <style dangerouslySetInnerHTML={{
          __html: `
            body { 
              margin: 0; 
              font-family: ${businessProfile?.primary_font || 'Inter'}, sans-serif;
              background-color: ${businessProfile?.background_color || '#ffffff'};
              color: ${businessProfile?.text_color || '#1f2937'};
            }
            .loading-shell {
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 1rem;
            }
            .logo-container {
              width: 200px;
              height: 200px;
              margin-bottom: 2rem;
              border-radius: 50%;
              overflow: hidden;
              background: ${businessProfile?.primary_color || '#4f46e5'};
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .logo-img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .business-name {
              font-size: 2rem;
              font-weight: 700;
              text-align: center;
              margin-bottom: 1rem;
              color: ${businessProfile?.primary_color || '#4f46e5'};
            }
            .loading-text {
              text-align: center;
              color: #6b7280;
              margin-bottom: 2rem;
            }
          `
        }} />
      </head>
      <body>
        <div className="loading-shell">
          <div className="logo-container">
            {businessProfile?.logo_url ? (
              <img 
                src={businessProfile.logo_url} 
                alt={businessProfile.name}
                className="logo-img"
              />
            ) : (
              <div style={{ color: 'white', fontSize: '3rem' }}>
                {businessProfile?.name?.[0] || 'P'}
              </div>
            )}
          </div>
          
          <h1 className="business-name">
            {businessProfile?.name || 'PromptReviews'}
          </h1>
          
          <p className="loading-text">
            Loading your review page...
          </p>
          
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: `3px solid ${businessProfile?.primary_color || '#4f46e5'}`,
            borderTop: '3px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
        
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `
        }} />
        
        {/* Hydrate with client component */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__PROMPT_PAGE_DATA__ = ${JSON.stringify({ promptPage, businessProfile })};
              // Trigger client component hydration
              window.addEventListener('DOMContentLoaded', function() {
                // Client component will take over from here
              });
            `
          }}
        />
      </body>
    </html>
  );
} 
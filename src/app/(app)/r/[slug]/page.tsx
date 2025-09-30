/**
 * Server-Side Prompt Page Component
 * 
 * This is an alternative server-rendered version for optimal performance
 * when accessed via QR codes or direct links
 */

import { notFound } from 'next/navigation';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { Metadata } from 'next';
import { GLASSY_DEFAULTS } from '@/app/(app)/config/styleDefaults';

// Force dynamic rendering to prevent caching issues with account isolation
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Server component for initial page load
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const supabase = createServiceRoleClient();
    
    // Fetch prompt page data
    const { data: promptPage, error: pageError } = await supabase
      .from('prompt_pages')
      .select('*')
      .eq('slug', slug)
      .single();

    if (pageError || !promptPage) {
      return {
        title: 'Page Not Found - Prompt Reviews',
        description: 'The requested prompt page could not be found.',
      };
    }

    // Fetch business profile
    let business = null;
    if (promptPage.account_id) {
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('account_id', promptPage.account_id)
        .maybeSingle();
      
      if (!businessError) {
        business = businessData;
      }
    }

    // Create fallback business data if no business record exists
    if (!business) {
      // Try to get business name from multiple sources
      let businessName = 'Business';
      if (promptPage.client_name && promptPage.client_name.trim()) {
        businessName = promptPage.client_name.trim();
      } else if (promptPage.account_id) {
        // Try to get business name from accounts table
        const { data: accountData } = await supabase
          .from('accounts')
          .select('business_name')
          .eq('id', promptPage.account_id)
          .single();
        
        if (accountData?.business_name) {
          businessName = accountData.business_name;
        }
      }
      
      business = {
        id: promptPage.account_id,
        account_id: promptPage.account_id,
        name: businessName,
        logo_url: null,
        website_url: null,
        business_email: null,
        phone: null,
        address: promptPage.location || null,
        category: promptPage.category || null,
        description: null,
        ...GLASSY_DEFAULTS,
        text_color: '#1F2937',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    // Import metadata generation utilities
    const { generatePromptPageMetadata, createVariableContext } = await import('@/utils/metadataTemplates');
    
    // Determine page type
    const getPageType = (promptPage: any): string => {
      if (promptPage.is_universal) return 'universal';
      if (promptPage.review_type === 'product') return 'product';
      if (promptPage.review_type === 'service') return 'service';
      if (promptPage.review_type === 'photo') return 'photo';
      if (promptPage.review_type === 'video') return 'video';
      if (promptPage.review_type === 'event') return 'event';
      if (promptPage.review_type === 'employee') return 'employee';
      return 'universal';
    };

    const pageType = getPageType(promptPage);
    const variableContext = createVariableContext(business, promptPage);
    
    
    // Generate metadata using templates with variable substitution
    const templateMetadata = await generatePromptPageMetadata(pageType, variableContext);
    
    return {
      title: templateMetadata.title,
      description: templateMetadata.description,
      keywords: templateMetadata.keywords,
      robots: templateMetadata.robots, // Add noindex directive
      openGraph: {
        title: templateMetadata.openGraph.title,
        description: templateMetadata.openGraph.description,
        images: templateMetadata.openGraph.images,
        type: 'website',
      },
      twitter: {
        title: templateMetadata.twitter.title,
        description: templateMetadata.twitter.description,
        images: templateMetadata.twitter.images,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Prompt Reviews',
      description: 'Share your experience and help others discover great businesses.',
      robots: 'noindex, nofollow', // Prevent search engine indexing
    };
  }
}

interface PromptPageData {
  promptPage: any;
  businessProfile: any;
}

async function getPromptPageData(slug: string): Promise<PromptPageData | null> {
  try {
    // DEVELOPMENT MODE BYPASS - Return mock Universal prompt page data
    if (process.env.NODE_ENV === 'development' && slug === 'universal-mdwd0peh') {
      
      // Default mock data for server-side rendering
      const mockPromptPage = {
        id: '0f1ba885-07d6-4698-9e94-a63d990c65e0',
        account_id: '12345678-1234-5678-9abc-123456789012',
        slug: 'universal-mdwd0peh',
        is_universal: true,
        campaign_type: 'public',
        type: 'service',
        status: 'complete',
        offer_enabled: false,
        offer_title: 'Review Rewards',
        offer_body: '',
        offer_url: '',
        emoji_sentiment_enabled: false,
        emoji_sentiment_question: '',
        emoji_feedback_message: '',
        emoji_thank_you_message: '',
        emoji_feedback_popup_header: '',
        emoji_feedback_page_header: '',
        review_platforms: [],
        falling_icon: 'star',
        falling_icon_color: '#fbbf24',
        falling_enabled: false, // Don't auto-fall when emoji sentiment is enabled
        ai_button_enabled: true,
        fix_grammar_enabled: true,
        note_popup_enabled: false,
        show_friendly_note: false,
        friendly_note: '',
        kickstarters_enabled: false,
        selected_kickstarters: [],
        recent_reviews_enabled: true,
        recent_reviews_scope: 'current_page',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return {
        promptPage: mockPromptPage,
        businessProfile: {
          id: '6762c76a-8677-4c7f-9a0f-f444024961a2',
          account_id: '12345678-1234-5678-9abc-123456789012',
          name: 'Chris Bolton',
          business_name: 'Chris Bolton',
          business_email: 'chris@diviner.agency',
          address_street: '2652 SE 89th Ave',
          address_city: 'Portland',
          address_state: 'Oregon',
          address_zip: '97266',
          address_country: 'United States',
          phone: '',
          business_website: '',
          review_platforms: [],
          default_offer_enabled: false,
          default_offer_title: 'Review Rewards',
          default_offer_body: '',
          default_offer_url: '',
          ...GLASSY_DEFAULTS,
          text_color: '#1F2937',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
    }

    const supabase = createServiceRoleClient();
    
    // First, get the prompt page data
    const { data: promptPage, error: pageError } = await supabase
      .from('prompt_pages')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (pageError || !promptPage) {
      return null;
    }

    // Then, get the business profile using account_id
    let businessProfile = null;
    if (promptPage.account_id) {
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('account_id', promptPage.account_id)
        .maybeSingle();

      businessProfile = business;
    }

    return {
      promptPage,
      businessProfile
    };
  } catch (error) {
    console.error('Error fetching prompt page data:', error);
    return null;
  }
}

import ClientPromptPage from './page-client';

export default async function ServerPromptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPromptPageData(slug);

  if (!data) {
    notFound();
  }

  const { promptPage, businessProfile } = data;

  // Pass the data to the client component
  return <ClientPromptPage initialData={{ promptPage, businessProfile }} />;
} 
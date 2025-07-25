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
        primary_font: 'Inter',
        secondary_font: 'Inter', 
        primary_color: '#4F46E5',
        secondary_color: '#818CF8',
        background_color: '#FFFFFF',
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
    
    console.log(`[PAGE] Generating metadata for page type: ${pageType}`);
    console.log(`[PAGE] Variable context:`, variableContext);
    console.log(`[PAGE] Business name: ${business.name}`);
    
    // Generate metadata using templates with variable substitution
    const templateMetadata = await generatePromptPageMetadata(pageType, variableContext);
    
    return {
      title: templateMetadata.title,
      description: templateMetadata.description,
      keywords: templateMetadata.keywords,
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
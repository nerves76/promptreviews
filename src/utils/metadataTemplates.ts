/**
 * Metadata Template Utilities
 * 
 * Functions for processing metadata templates with variable substitution
 * for different prompt page types
 */

import { createServiceRoleClient } from '@/utils/supabaseClient';

interface MetadataTemplate {
  id: string;
  page_type: string;
  title_template: string;
  description_template: string;
  og_title_template: string;
  og_description_template: string;
  og_image_template: string;
  twitter_title_template: string;
  twitter_description_template: string;
  twitter_image_template: string;
  keywords_template: string;
  canonical_url_template: string;
  is_active: boolean;
}

interface VariableContext {
  business_name?: string;
  logo?: string;
  service_name?: string;
  product_name?: string;
  event_name?: string;
  employee_name?: string;
  location_name?: string;
  [key: string]: string | undefined;
}

/**
 * Substitute variables in a template string
 */
export function substituteVariables(template: string, context: VariableContext): string {
  if (!template) return '';
  
  console.log(`[METADATA] Substituting variables in template: "${template}"`);
  console.log(`[METADATA] Context variables:`, context);
  
  let result = template;
  
  // Replace all variables in the format [variable_name]
  Object.keys(context).forEach(key => {
    const value = context[key];
    if (value) {
      const pattern = new RegExp(`\\[${key}\\]`, 'g');
      const before = result;
      result = result.replace(pattern, value);
      if (before !== result) {
        console.log(`[METADATA] Replaced [${key}] with "${value}"`);
      }
    }
  });
  
  // Clean up any remaining unreplaced variables
  const beforeCleanup = result;
  result = result.replace(/\[[\w_]+\]/g, '');
  if (beforeCleanup !== result) {
    console.log(`[METADATA] Cleaned up unreplaced variables: "${beforeCleanup}" -> "${result}"`);
  }
  
  console.log(`[METADATA] Final result: "${result}"`);
  return result.trim();
}

/**
 * Get the active metadata template for a specific page type
 */
export async function getActiveMetadataTemplate(pageType: string): Promise<MetadataTemplate | null> {
  try {
    const supabaseAdmin = createServiceRoleClient();
    
    console.log(`[METADATA] Looking for template for page type: ${pageType}`);
    
    const { data, error } = await supabaseAdmin
      .from('metadata_templates')
      .select('*')
      .eq('page_type', pageType)
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.error('[METADATA] Error fetching metadata template:', error);
      return null;
    }
    
    console.log(`[METADATA] Found template:`, data);
    return data;
  } catch (error) {
    console.error('[METADATA] Error getting active metadata template:', error);
    return null;
  }
}

/**
 * Generate metadata for a prompt page using templates
 */
export async function generatePromptPageMetadata(
  pageType: string,
  context: VariableContext
): Promise<{
  title: string;
  description: string;
  openGraph: {
    title: string;
    description: string;
    images?: string[];
  };
  twitter: {
    title: string;
    description: string;
    images?: string[];
  };
  keywords: string;
  canonical?: string;
}> {
  console.log(`[METADATA] Generating metadata for page type: ${pageType}`);
  console.log(`[METADATA] Context:`, context);
  
  const template = await getActiveMetadataTemplate(pageType);
  
  if (!template) {
    console.log(`[METADATA] ⚠️  No template found for ${pageType}, using fallback`);
    console.log(`[METADATA] This means the database query failed or no templates exist`);
    // Helper function to format page type
    const formatPageType = (type: string): string => {
      switch (type.toLowerCase()) {
        case 'universal':
          return 'Universal';
        case 'product':
          return 'Product';
        case 'service':
          return 'Service';
        case 'photo':
          return 'Photo';
        case 'video':
          return 'Video';
        case 'event':
          return 'Event';
        case 'employee':
          return 'Employee';
        default:
          return 'Service';
      }
    };

    const businessName = context.business_name || 'Business';
    const formattedPageType = formatPageType(pageType);
    
    // Updated fallback metadata using new format: "Give [Business Name] a review - Prompt Reviews - [Page Type]"
    const title = `Give ${businessName} a review - Prompt Reviews - ${formattedPageType}`;
    const description = `Share your experience with ${businessName}. Your feedback helps them improve their services.`;
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: context.logo ? [context.logo] : undefined,
      },
      twitter: {
        title,
        description,
        images: context.logo ? [context.logo] : undefined,
      },
      keywords: `${businessName}, reviews, feedback, ${formattedPageType.toLowerCase()}`,
    };
  }
  
  console.log(`[METADATA] Using template:`, template);
  
  const title = substituteVariables(template.title_template, context);
  const description = substituteVariables(template.description_template, context);
  const ogTitle = substituteVariables(template.og_title_template, context);
  const ogDescription = substituteVariables(template.og_description_template, context);
  const twitterTitle = substituteVariables(template.twitter_title_template, context);
  const twitterDescription = substituteVariables(template.twitter_description_template, context);
  const keywords = substituteVariables(template.keywords_template, context);
  
  console.log(`[METADATA] Generated metadata:`, {
    title,
    description,
    ogTitle,
    ogDescription,
    twitterTitle,
    twitterDescription,
    keywords
  });
  
  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images: context.logo ? [context.logo] : undefined,
    },
    twitter: {
      title: twitterTitle,
      description: twitterDescription,
      images: context.logo ? [context.logo] : undefined,
    },
    keywords,
    canonical: template.canonical_url_template 
      ? substituteVariables(template.canonical_url_template, context)
      : undefined,
  };
}

/**
 * Create variable context from business profile and prompt page data
 */
export function createVariableContext(
  businessProfile: any,
  promptPage: any
): VariableContext {
  const context: VariableContext = {
    business_name: businessProfile?.name || businessProfile?.business_name,
    logo: businessProfile?.logo_url,
  };
  
  // Add page-specific variables based on prompt page type
  if (promptPage) {
    switch (promptPage.review_type) {
      case 'service':
        context.service_name = promptPage.service_name;
        break;
      case 'product':
        context.product_name = promptPage.product_name;
        break;
      case 'event':
        context.event_name = promptPage.event_name;
        break;
      case 'employee':
        context.employee_name = promptPage.employee_name;
        break;
    }
  }
  
  // Add location name if available
  if (businessProfile?.location_name) {
    context.location_name = businessProfile.location_name;
  }
  
  return context;
} 
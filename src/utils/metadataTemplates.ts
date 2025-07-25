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
    
    // First, let's check if any templates exist for this page type
    const { data: allTemplates, error: listError } = await supabaseAdmin
      .from('metadata_templates')
      .select('*')
      .eq('page_type', pageType);
    
    if (listError) {
      console.error('[METADATA] Error listing templates:', listError);
      return null;
    }
    
    console.log(`[METADATA] Found ${allTemplates?.length || 0} templates for ${pageType}:`, allTemplates);
    
    // Now get the active one
    const { data, error } = await supabaseAdmin
      .from('metadata_templates')
      .select('*')
      .eq('page_type', pageType)
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.error('[METADATA] Error fetching active metadata template:', error);
      
      // If no active template found, try to create one from the default templates
      if (error.code === 'PGRST116') { // No rows returned
        console.log('[METADATA] No active template found, creating default template...');
        return await createDefaultTemplate(pageType, supabaseAdmin);
      }
      
      return null;
    }
    
    console.log(`[METADATA] Found active template:`, data);
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
 * Create default metadata template for a page type
 */
async function createDefaultTemplate(pageType: string, supabaseAdmin: any): Promise<MetadataTemplate | null> {
  const defaultTemplates = {
    universal: {
      title_template: 'Leave a Review for [business_name]',
      description_template: 'Share your experience with [business_name]. Leave a review to help others discover great services.',
      og_title_template: 'Review [business_name]',
      og_description_template: 'Share your experience with [business_name]. Your feedback helps others make informed decisions.',
      keywords_template: '[business_name], reviews, customer feedback, testimonials'
    },
    service: {
      title_template: 'Review [service_name] - [business_name]',
      description_template: 'Share your experience with [service_name] from [business_name]. Help others by leaving your honest review.',
      og_title_template: 'Review [service_name] at [business_name]',
      og_description_template: 'Tell others about your experience with [service_name] from [business_name]. Your review matters.',
      keywords_template: '[business_name], [service_name], service review, customer experience'
    },
    product: {
      title_template: 'Review [product_name] - [business_name]',
      description_template: 'Share your thoughts on [product_name] from [business_name]. Help others with your honest product review.',
      og_title_template: 'Review [product_name] from [business_name]',
      og_description_template: 'What did you think of [product_name]? Share your experience to help other customers.',
      keywords_template: '[business_name], [product_name], product review, customer feedback'
    },
    photo: {
      title_template: 'Share Your Experience with [business_name]',
      description_template: 'Upload a photo and share your experience with [business_name]. Visual reviews help others see what to expect.',
      og_title_template: 'Share Your Photo Review of [business_name]',
      og_description_template: 'Show others your experience with [business_name] through photos and feedback.',
      keywords_template: '[business_name], photo review, visual testimonial, customer experience'
    }
  };

  const template = defaultTemplates[pageType as keyof typeof defaultTemplates];
  if (!template) {
    console.error(`[METADATA] No default template found for page type: ${pageType}`);
    return null;
  }

  try {
    console.log(`[METADATA] Creating default template for ${pageType}:`, template);
    
    const { data, error } = await supabaseAdmin
      .from('metadata_templates')
      .insert({
        page_type: pageType,
        ...template,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('[METADATA] Error creating default template:', error);
      return null;
    }

    console.log(`[METADATA] Successfully created default template:`, data);
    return data;
  } catch (error) {
    console.error('[METADATA] Error creating default template:', error);
    return null;
  }
}

/**
 * Create variable context from business profile and prompt page data
 */
export function createVariableContext(
  businessProfile: any,
  promptPage: any
): VariableContext {
  // Try to get business name from multiple sources
  let businessName = businessProfile?.name || businessProfile?.business_name;
  
  // If still no business name, try to get it from the prompt page or account
  if (!businessName || businessName === 'Business') {
    if (promptPage?.client_name && promptPage.client_name.trim()) {
      businessName = promptPage.client_name.trim();
    } else if (promptPage?.account_id) {
      // This would require a database call, but we'll handle it in the layout
      businessName = 'Business'; // Fallback
    }
  }
  
  const context: VariableContext = {
    business_name: businessName,
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
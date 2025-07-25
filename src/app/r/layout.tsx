import "../globals.css";
import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { generatePromptPageMetadata, createVariableContext } from '@/utils/metadataTemplates';

// Helper function to get formatted page type
function getPageType(promptPage: any): string {
  if (promptPage.is_universal) return 'universal';
  if (promptPage.review_type === 'product') return 'product';
  if (promptPage.review_type === 'service') return 'service';
  if (promptPage.review_type === 'photo') return 'photo';
  if (promptPage.review_type === 'video') return 'video';
  if (promptPage.review_type === 'event') return 'event';
  if (promptPage.review_type === 'employee') return 'employee';
  return 'universal';
}

// Dynamic metadata generation with og:image support
export async function generateMetadata({ params }: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  console.log('[LAYOUT] generateMetadata called');
  
  const fallbackMetadata: Metadata = {
    title: "Give Business a review - Prompt Reviews",
    description: "Share your experience and help others discover great businesses.",
    keywords: ["review", "testimonial", "business", "customer feedback"],
    openGraph: {
      title: "Give Business a review - Prompt Reviews",
      description: "Share your experience and help others discover great businesses.",
      type: "website",
    },
  };

  try {
    // Await the params in Next.js 15
    const paramsObj = await params;
    const slug = paramsObj?.slug;
    console.log('[LAYOUT] Params object:', paramsObj);
    console.log('[LAYOUT] Slug from params:', slug);
    
    // Check if required environment variables are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log(`[LAYOUT] Environment check:`, {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      supabaseUrl: supabaseUrl ? 'SET' : 'MISSING',
      serviceKeyLength: supabaseServiceKey ? supabaseServiceKey.length : 0
    });
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[LAYOUT] Missing environment variables for metadata generation');
      return fallbackMetadata;
    }
    
    // Use service role client for server-side metadata generation
    // This bypasses RLS policies and allows access to all data
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Fetch prompt page data directly from database
    console.log(`[LAYOUT] Looking for prompt page with slug: ${slug}`);
    const { data: promptPage, error: pageError } = await supabase
      .from('prompt_pages')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (pageError || !promptPage) {
      console.warn('[LAYOUT] Prompt page not found for slug:', slug, pageError?.message);
      console.warn('[LAYOUT] Error details:', pageError);
      return {
        ...fallbackMetadata,
        title: "Page Not Found - Prompt Reviews",
        description: "The requested prompt page could not be found.",
      };
    }
    
    console.log(`[LAYOUT] Found prompt page:`, {
      id: promptPage.id,
      slug: promptPage.slug,
      account_id: promptPage.account_id,
      is_universal: promptPage.is_universal,
      client_name: promptPage.client_name
    });
    
    // Try to fetch business profile data, but don't fail if it doesn't exist
    let business = null;
    if (promptPage.account_id) {
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('account_id', promptPage.account_id)
        .maybeSingle();
      
      if (businessError) {
        console.warn('Error fetching business for account:', promptPage.account_id, businessError.message);
      } else {
        business = businessData;
      }
    }
    
    // Create fallback business data if no business record exists
    if (!business) {
      console.log('No business record found, creating fallback business data');
      business = {
        id: promptPage.account_id,
        account_id: promptPage.account_id,
        name: promptPage.client_name || 'Business',
        // Provide sensible defaults for missing business data
        logo_url: null,
        website_url: null,
        business_email: null,
        phone: null,
        address: promptPage.location || null,
        category: promptPage.category || null,
        description: null,
        // Style defaults
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
    
    // Determine the best image to use for og:image
    let ogImage = null;
    
    // Priority order: product photo > business logo > default
    if (promptPage.product_photo) {
      ogImage = promptPage.product_photo;
    } else if (business.logo_url) {
      ogImage = business.logo_url;
    }
    
    // Get the page type and create variable context
    const pageType = getPageType(promptPage);
    const variableContext = createVariableContext(business, promptPage);
    
    console.log(`[LAYOUT] Page type: ${pageType}`);
    console.log(`[LAYOUT] Variable context:`, variableContext);
    console.log(`[LAYOUT] Business name: ${business.name}`);
    
    // Generate metadata using templates with variable substitution
    const templateMetadata = await generatePromptPageMetadata(pageType, variableContext);
    
    const metadata: Metadata = {
      ...fallbackMetadata,
      title: templateMetadata.title,
      description: templateMetadata.description,
      keywords: templateMetadata.keywords,
    };
    
    // Add OpenGraph metadata
    if (metadata.openGraph) {
      metadata.openGraph.title = templateMetadata.title;
      metadata.openGraph.description = templateMetadata.description;
      if (ogImage) {
        metadata.openGraph.images = [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: `${business.name} - Leave a Review`,
          },
        ];
      }
    }
    
    return metadata;
  } catch (error) {
    console.error('Error generating metadata:', error);
    return fallbackMetadata;
  }
}

export default function PublicPromptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}

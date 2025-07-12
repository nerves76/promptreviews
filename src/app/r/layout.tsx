import "../globals.css";
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

// Helper function to get formatted page type
function getPageType(promptPage: any): string {
  if (promptPage.is_universal) {
    return "Universal";
  }
  
  const type = promptPage.type || promptPage.review_type || "service";
  
  // Capitalize first letter and return proper format
  switch (type.toLowerCase()) {
    case "product":
      return "Product";
    case "service":
      return "Service";
    case "photo":
      return "Photo";
    case "video":
      return "Video";
    case "event":
      return "Event";
    case "employee":
      return "Employee";
    default:
      return "Service";
  }
}

// Dynamic metadata generation with og:image support
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  // Default fallback metadata
  const fallbackMetadata: Metadata = {
    title: "Give Business a review - Prompt Reviews - Service",
    description: "Share your experience and help businesses improve.",
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
        'max-video-preview': -1,
        'max-image-preview': 'none',
        'max-snippet': -1,
      },
    },
  };

  try {
    // Await the params in Next.js 15
    const { slug } = await params;
    
    // Check if required environment variables are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables for metadata generation');
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
    const { data: promptPage, error: pageError } = await supabase
      .from('prompt_pages')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'in_queue')
      .single();
    
    if (pageError || !promptPage) {
      console.warn('Prompt page not found for slug:', slug, pageError?.message);
      return {
        ...fallbackMetadata,
        title: "Give Business a review - Prompt Reviews - Page Not Found",
        description: "The requested prompt page could not be found.",
      };
    }
    
    // Fetch business profile data directly from database
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('account_id', promptPage.account_id)
      .single();
    
    if (businessError || !business) {
      console.warn('Business not found for account:', promptPage.account_id, businessError?.message);
      return {
        ...fallbackMetadata,
        title: "Give Business a review - Prompt Reviews - Business Not Found",
        description: "The business profile could not be found.",
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
    
    // Build dynamic title and description using new format
    const businessName = business.name || "Business";
    const pageType = getPageType(promptPage);
    const productName = promptPage.product_name;
    
    // New title format: "Give [Business Name] a review - Prompt Reviews - [Page Type]"
    let title = `Give ${businessName} a review - Prompt Reviews - ${pageType}`;
    let description = `Share your experience with ${businessName}. Your feedback helps them improve their services.`;
    
    if (pageType === "Product" && productName) {
      description = `Share your experience with ${productName} from ${businessName}. Your feedback matters.`;
    }
    
    const metadata: Metadata = {
      ...fallbackMetadata,
      title,
      description,
    };
    
    // Add og:image if available
    if (ogImage) {
      metadata.openGraph = {
        title,
        description,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: productName ? `${productName} from ${businessName}` : `${businessName} Logo`,
          },
        ],
      };
      
      metadata.twitter = {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
      };
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

import "../globals.css";
import type { Metadata } from "next";
import { createClient } from "@/utils/supabaseClient";

// Dynamic metadata generation with og:image support
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    // Await the params in Next.js 15
    const { slug } = await params;
    
    // Use direct database queries instead of HTTP calls to avoid build-time issues
    const supabase = createClient();
    
    // Fetch prompt page data directly from database
    const { data: promptPage, error: pageError } = await supabase
      .from('prompt_pages')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'in_queue')
      .single();
    
    if (pageError || !promptPage) {
      return {
        title: "PromptReviews - Page Not Found",
        description: "The requested prompt page could not be found.",
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
    }
    
    // Fetch business profile data directly from database
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('account_id', promptPage.account_id)
      .single();
    
    if (businessError || !business) {
      return {
        title: "PromptReviews - Business Not Found",
        description: "The business profile could not be found.",
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
    }
    
    // Determine the best image to use for og:image
    let ogImage = null;
    
    // Priority order: product photo > business logo > default
    if (promptPage.product_photo) {
      ogImage = promptPage.product_photo;
    } else if (business.logo_url) {
      ogImage = business.logo_url;
    }
    
    // Build dynamic title and description
    const businessName = business.name || "Business";
    const pageType = promptPage.review_type || "service";
    const productName = promptPage.product_name;
    
    let title = `Review ${businessName}`;
    let description = `Share your experience with ${businessName}. Your feedback helps them improve their services.`;
    
    if (pageType === "product" && productName) {
      title = `Review ${productName} - ${businessName}`;
      description = `Share your experience with ${productName} from ${businessName}. Your feedback matters.`;
    }
    
    const metadata: Metadata = {
      title,
      description,
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
    return {
      title: "PromptReviews - Review Page",
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

import "../globals.css";
import type { Metadata } from "next";

// Dynamic metadata generation with og:image support
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    // Await the params in Next.js 15
    const { slug } = await params;
    
    // Fetch prompt page data
    const promptResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://promptreviews.app'}/api/prompt-pages/${slug}`, {
      cache: 'no-store'
    });
    
    if (!promptResponse.ok) {
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

    const promptPage = await promptResponse.json();
    
    // Fetch business profile data
    const businessResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://promptreviews.app'}/api/businesses/${promptPage.account_id}`, {
      cache: 'no-store'
    });
    
    if (!businessResponse.ok) {
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

    const business = await businessResponse.json();
    
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

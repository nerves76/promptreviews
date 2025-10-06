import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import StandardOverviewLayout from '../../components/StandardOverviewLayout'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import { getArticleBySlug } from '@/lib/docs/articles'
import { Building, Upload, Image, Info, Users, Star, Share, FileText, Brain, ArrowRight } from 'lucide-react'

// Revalidate every 60 seconds - allows CMS updates to show without redeployment
export const revalidate = 60


const fallbackDescription = 'Complete guide to setting up and optimizing your business profile in Prompt Reviews for better AI-generated reviews and customer engagement.'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const article = await getArticleBySlug('business-profile')
    if (!article) {
      return {
        title: 'Business Profile Setup Guide | Prompt Reviews',
        description: fallbackDescription,
        keywords: ['business profile', 'company information', 'branding', 'logo upload', 'AI optimization', 'prompt reviews'],
        alternates: {
          canonical: 'https://docs.promptreviews.app/business-profile',
        },
      }
    }

    const seoTitle = article.metadata?.seo_title || article.title
    const seoDescription = article.metadata?.seo_description || article.metadata?.description || fallbackDescription

    return {
      title: `${seoTitle} | Prompt Reviews`,
      description: seoDescription,
      keywords: article.metadata?.keywords ?? ['business profile', 'company information', 'branding', 'logo upload', 'AI optimization', 'prompt reviews'],
      alternates: {
        canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/business-profile',
      },
    }
  } catch (error) {
    console.error('generateMetadata business-profile error:', error)
    return {
      title: 'Business Profile Setup Guide | Prompt Reviews',
      description: fallbackDescription,
      alternates: {
        canonical: 'https://docs.promptreviews.app/business-profile',
      },
    }
  }
}

export default async function BusinessProfilePage() {
  let article = null

  try {
    article = await getArticleBySlug('business-profile')
  } catch (error) {
    console.error('Error fetching business-profile article:', error)
  }

  if (!article) {
    notFound()
  }
  // Key features data
  const keyFeatures = [
    {
      icon: Image,
      title: 'Logo & Branding',
      description: 'Upload your logo for consistent branding across prompt pages, review widgets, and QR code templates. Automatic optimization for web and print.'
    },
    {
      icon: Info,
      title: 'Business Information',
      description: 'Complete business details including name, address, contact info, and industry. Powers AI content generation and builds customer trust.'
    },
    {
      icon: Users,
      title: 'Services & Offerings',
      description: 'List your products or services to help AI generate relevant, specific review content that resonates with customers.'
    },
    {
      icon: Brain,
      title: 'AI Optimization',
      description: 'Fine-tune how AI generates review content with keywords, dos and don\'ts, and personalization preferences.'
    }
  ];

  // How it works steps
  const howItWorks = [
    {
      number: 1,
      title: 'Complete Basic Information',
      description: 'Add your business name, address, phone number, email, and website. This core information appears on all prompt pages and helps customers trust your business.',
      icon: Info
    },
    {
      number: 2,
      title: 'Upload Your Logo & Assets',
      description: 'Upload your logo (PNG, JPG, or WebP up to 10MB). We automatically create web and print versions, and you can adjust positioning with our built-in cropper.',
      icon: Upload
    },
    {
      number: 3,
      title: 'Define Services & Uniqueness',
      description: 'List your services, describe what makes you unique, and add your years in business. This information helps AI create authentic, personalized review content.',
      icon: Users
    },
    {
      number: 4,
      title: 'Optimize AI Settings',
      description: 'Add keywords you want in reviews, specify what AI should emphasize or avoid, and set up review platform preferences.',
      icon: Brain
    }
  ];

  // Best practices section
  const bestPractices = [
    {
      icon: Star,
      title: 'Complete All Sections',
      description: 'The more information you provide, the better AI can generate authentic, relevant reviews that resonate with potential customers.'
    },
    {
      icon: Info,
      title: 'Use Specific Keywords',
      description: 'Include location-based and service-specific keywords for better SEO impact and more targeted review content.'
    },
    {
      icon: Upload,
      title: 'Update Regularly',
      description: 'Keep information current, especially services, taglines, and AI preferences as your business evolves.'
    },
    {
      icon: Brain,
      title: 'Test AI Output',
      description: 'Review generated content regularly and refine your AI dos and don\'ts based on results.'
    }
  ];

  // FAQ data - using generic business/profile questions since there's no specific business-profile section
  const faqs = [
    {
      question: 'How does my business profile affect AI-generated reviews?',
      answer: 'The AI uses your business information to create contextually relevant, authentic-sounding reviews. Your keywords, services, and unique value propositions are woven into the content naturally.',
    },
    {
      question: 'Can I have different profiles for multiple locations?',
      answer: 'Currently, each account has one business profile. For multiple locations, you can create separate prompt pages with location-specific information.',
    },
    {
      question: 'What happens if I don\'t complete all sections?',
      answer: 'The system will still work, but AI-generated content may be less specific and personalized. We recommend completing at least the basic info and services sections.',
    },
    {
      question: 'How do I optimize for local SEO?',
      answer: 'Include location-specific keywords (city, neighborhood, landmarks), complete your address information, and mention local differentiators in your unique value section.',
    }
  ];

  return (
    <StandardOverviewLayout
      title="Business profile setup"
      description="Create a comprehensive business profile that powers AI-generated content and provides essential information across all your prompt pages."
      categoryLabel="Configuration"
      categoryIcon={Building}
      categoryColor="blue"
      currentPage="Business Profile"
      availablePlans={['grower', 'builder', 'maven']}
      keyFeatures={keyFeatures}
      howItWorks={howItWorks}
      bestPractices={bestPractices}
      faqs={faqs}
      callToAction={{
        primary: {
          text: 'Learn About Prompt Pages',
          href: '/prompt-pages'
        }
      }}
      overview={{
        title: 'What Is a Business Profile?',
        content: (
          <>
            <MarkdownRenderer content={article.content} />

            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <Brain className="w-8 h-8 text-purple-300 mb-2" />
                <h4 className="text-sm font-semibold text-white mb-1">AI Optimization</h4>
                <p className="text-xs text-white/70">Powers personalized content</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <Star className="w-8 h-8 text-yellow-300 mb-2" />
                <h4 className="text-sm font-semibold text-white mb-1">Better Reviews</h4>
                <p className="text-xs text-white/70">More authentic feedback</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <Building className="w-8 h-8 text-yellow-300 mb-2" />
                <h4 className="text-sm font-semibold text-white mb-1">Brand Consistency</h4>
                <p className="text-xs text-white/70">Unified presence</p>
              </div>
            </div>
          </>
        )
      }}
    />
  );
}
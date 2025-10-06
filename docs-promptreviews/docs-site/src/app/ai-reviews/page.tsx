import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import StandardOverviewLayout from '../../components/StandardOverviewLayout'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import { pageFAQs } from '../utils/faqData'
import { getArticleBySlug } from '@/lib/docs/articles'

// Revalidate every 60 seconds - allows CMS updates to show without redeployment
export const revalidate = 60

const {
  Sparkles,
  Star,
  MessageSquare,
  Zap,
  Brain,
  Target,
  Users,
  CheckCircle,
  Lightbulb,
  TrendingUp,
  Shield,
  Clock,
  Heart,
  Wand2,
  Edit3,
} = Icons

const fallbackDescription =
  'Our AI-powered system helps you create personalized, human-sounding review requests that actually work—without losing the personal touch that makes your business special.'

const defaultKeyFeatures = [
  {
    icon: Brain,
    title: 'Smart Personalization',
    description: 'AI analyzes your business, customers, and context to create review requests that feel genuinely personal and human.'
  },
  {
    icon: Target,
    title: 'Context-Aware Content',
    description: 'Creates different messages for different situations - service completion, product purchase, or event attendance.'
  },
  {
    icon: Wand2,
    title: 'Review Writing Assistance',
    description: 'Helps customers express their thoughts better with AI-powered suggestions while keeping reviews authentic.'
  },
  {
    icon: TrendingUp,
    title: 'Performance Optimization',
    description: 'Learns from your results and continuously improves your review request strategies over time.'
  },
  {
    icon: Shield,
    title: 'Ethical AI Approach',
    description: 'Designed to enhance human connection, not replace it. Helps you be more personal while staying authentic.'
  },
  {
    icon: Edit3,
    title: 'Grammar & Style Enhancement',
    description: "AI can polish grammar and improve clarity while preserving the customer's authentic voice and message."
  }
]

const defaultHowItWorks = [
  {
    number: 1,
    title: 'Understand Your Business',
    description: 'AI learns about your business type, services, customer base, and review goals to provide relevant suggestions.',
    icon: Users
  },
  {
    number: 2,
    title: 'Analyze Customer Context',
    description: "Considers the customer's experience, relationship with your business, and what they're most likely to review.",
    icon: Target
  },
  {
    number: 3,
    title: 'Generate Personalized Content',
    description: 'Creates review requests that feel personal, relevant, and authentic to each customer situation.',
    icon: MessageSquare
  },
  {
    number: 4,
    title: 'Learn and Improve',
    description: 'Tracks performance and adjusts strategies to continuously improve your review collection success rates.',
    icon: TrendingUp
  }
]

const defaultBestPractices = [
  {
    icon: Heart,
    title: 'Keep It Personal',
    description: 'Use AI to enhance your personal touch, not replace it. Always review and customize AI suggestions to match your voice.'
  },
  {
    icon: Clock,
    title: 'Perfect Your Timing',
    description: 'Send review requests when the experience is fresh but not overwhelming. AI helps identify optimal timing windows.'
  },
  {
    icon: Star,
    title: 'Focus on Quality',
    description: 'Target customers who had positive experiences. AI works best with satisfied customers who are likely to leave good reviews.'
  },
  {
    icon: Zap,
    title: 'Test and Learn',
    description: 'Experiment with different AI-generated approaches and let the system learn what works best for your specific business.'
  }
]

const overviewContent = (
  <>
    <p className="text-white/90 text-lg mb-6 text-center">
      Unlike generic AI tools, our system is specifically designed for review collection. It understands that
      the best reviews come from genuine customer relationships, not robotic automation.
    </p>

    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-6">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-red-500/10 border border-red-400/20 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-3">Before AI</h4>
          <blockquote className="text-white/70 italic mb-2">
            "Hi! Please leave us a review on Google. Thanks!"
          </blockquote>
          <p className="text-sm text-red-300">Generic, impersonal, low response rate</p>
        </div>

        <div className="bg-green-500/10 border border-green-400/20 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-3">With AI</h4>
          <blockquote className="text-white/70 italic mb-2">
            "Hi Sarah! We loved helping you transform your kitchen last month. Would you mind sharing your experience on Google?"
          </blockquote>
          <p className="text-sm text-green-300">Personal, specific, higher response rate</p>
        </div>
      </div>
    </div>
  </>
)

function resolveIcon(iconName: string | undefined, fallback: LucideIcon): LucideIcon {
  if (!iconName) return fallback
  const normalized = iconName.trim()
  const lookup = Icons as Record<string, unknown>
  const candidates = [
    normalized,
    normalized.toLowerCase(),
    normalized.toUpperCase(),
    normalized.charAt(0).toUpperCase() + normalized.slice(1),
    normalized.replace(/[-_\s]+/g, ''),
  ]

  for (const key of candidates) {
    const maybeIcon = lookup[key]
    if (typeof maybeIcon === 'function') {
      return maybeIcon as LucideIcon
    }
  }

  return fallback
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const article = await getArticleBySlug('ai-reviews')
    if (!article) {
      return {
        title: 'AI-Powered Review Collection | Prompt Reviews',
        description: fallbackDescription,
        alternates: {
          canonical: 'https://docs.promptreviews.app/docs/ai-reviews',
        },
      }
    }

    // Use SEO-specific fields if available, otherwise fallback to regular title/description
    const seoTitle = article.metadata?.seo_title || article.title
    const seoDescription = article.metadata?.seo_description || article.metadata?.description || fallbackDescription

    return {
      title: `${seoTitle} | Prompt Reviews`,
      description: seoDescription,
      keywords: article.metadata?.keywords ?? [],
      alternates: {
        canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/docs/ai-reviews',
      },
    }
  } catch (error) {
    console.error('generateMetadata ai-reviews error:', error)
    return {
      title: 'AI-Powered Review Collection | Prompt Reviews',
      description: fallbackDescription,
      alternates: {
        canonical: 'https://docs.promptreviews.app/docs/ai-reviews',
      },
    }
  }
}

interface MetadataFeature {
  icon?: string
  title: string
  description: string
  href?: string
}

interface MetadataStep {
  number?: number
  icon?: string
  title: string
  description: string
}

interface MetadataBestPractice {
  icon?: string
  title: string
  description: string
}

export default async function AIReviewsPage() {
  let article = null

  try {
    article = await getArticleBySlug('ai-reviews')
  } catch (error) {
    console.error('Error fetching ai-reviews article:', error)
  }

  if (!article) {
    notFound()
  }

  const metadata = article.metadata ?? {}

  const getString = (value: unknown): string | undefined => {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }
    return undefined
  }

  const availablePlans: ('grower' | 'builder' | 'maven' | 'enterprise')[] =
    Array.isArray(metadata.available_plans) && metadata.available_plans.length
      ? (metadata.available_plans as ('grower' | 'builder' | 'maven' | 'enterprise')[])
      : ['grower', 'builder', 'maven']

  const mappedKeyFeatures = Array.isArray(metadata.key_features) && metadata.key_features.length
    ? (metadata.key_features as MetadataFeature[]).map((feature) => ({
        icon: resolveIcon(feature.icon, Sparkles),
        title: feature.title,
        description: feature.description,
        href: feature.href,
      }))
    : defaultKeyFeatures

  const mappedHowItWorks = Array.isArray(metadata.how_it_works) && metadata.how_it_works.length
    ? (metadata.how_it_works as MetadataStep[]).map((step, index) => ({
        number: step.number ?? index + 1,
        title: step.title,
        description: step.description,
        icon: resolveIcon(step.icon, Users),
      }))
    : defaultHowItWorks

  const mappedBestPractices = Array.isArray(metadata.best_practices) && metadata.best_practices.length
    ? (metadata.best_practices as MetadataBestPractice[]).map((practice) => ({
        icon: resolveIcon(practice.icon, Heart),
        title: practice.title,
        description: practice.description,
      }))
    : defaultBestPractices

  const CategoryIcon = resolveIcon(
    typeof metadata.category_icon === 'string' && metadata.category_icon.trim().length
      ? metadata.category_icon
      : 'Sparkles',
    Sparkles,
  )

  // Use article.content for main editable content from CMS
  const overviewMarkdown = article.content || ''
  const overviewTitle = getString((metadata as Record<string, unknown>).overview_title) || 'What Makes Our AI Different?'

  const overviewNode = overviewMarkdown
    ? <MarkdownRenderer content={overviewMarkdown} />
    : overviewContent

  const callToActionMeta = (metadata as Record<string, unknown>).call_to_action
  const parseCTAButton = (value: any) => {
    const text = getString(value?.text)
    const href = getString(value?.href)
    if (!text || !href) return undefined
    return {
      text,
      href,
      external: Boolean(value?.external),
    }
  }

  const fallbackCTA = {
    primary: {
      text: 'Learn About Prompt Pages',
      href: '/prompt-pages',
    },
  } as const

  const callToAction = (callToActionMeta && typeof callToActionMeta === 'object')
    ? {
        primary: parseCTAButton((callToActionMeta as any).primary) || fallbackCTA.primary,
        secondary: parseCTAButton((callToActionMeta as any).secondary),
      }
    : fallbackCTA

  const faqMetadata = Array.isArray((metadata as Record<string, unknown>).faqs)
    ? ((metadata as Record<string, unknown>).faqs as { question: string; answer: string }[])
    : null

  const faqsTitle = getString((metadata as Record<string, unknown>).faqs_title)

  const keyFeaturesTitle = getString((metadata as Record<string, unknown>).key_features_title)
  const howItWorksTitle = getString((metadata as Record<string, unknown>).how_it_works_title)
  const bestPracticesTitle = getString((metadata as Record<string, unknown>).best_practices_title)

  return (
    <StandardOverviewLayout
      title={article.title || 'AI-powered review collection'}
      description={metadata.description ?? fallbackDescription}
      categoryLabel={metadata.category_label || 'AI Features'}
      categoryIcon={CategoryIcon}
      categoryColor={metadata.category_color || 'purple'}
      currentPage="AI Reviews"
      availablePlans={availablePlans}
      keyFeatures={mappedKeyFeatures}
      keyFeaturesTitle={keyFeaturesTitle}
      howItWorks={mappedHowItWorks}
      howItWorksTitle={howItWorksTitle}
      bestPractices={mappedBestPractices}
      bestPracticesTitle={bestPracticesTitle}
      faqs={faqMetadata && faqMetadata.length ? faqMetadata : pageFAQs['ai-reviews']}
      faqsTitle={faqsTitle}
      callToAction={callToAction}
      overview={{
        title: overviewTitle,
        content: overviewNode,
      }}
    />
  )
}

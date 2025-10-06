import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import StandardOverviewLayout from '../../components/StandardOverviewLayout'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import { pageFAQs } from '../utils/faqData'
import { getArticleBySlug } from '@/lib/docs/articles'
const {
  Target,
  Lightbulb,
  Users,
  Heart,
  Zap,
  Star,
  MessageCircle,
  TrendingUp,
  Sparkles,
  Clock,
  CheckCircle,
  Brain
} = Icons

const fallbackDescription = 'Increase your customer reviews by 300% with these 6 proven strategies. Learn the psychology, timing, and techniques that actually work for review collection.'

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
    const article = await getArticleBySlug('strategies')
    if (!article) {
      return {
        title: 'How to Get More Customer Reviews: 6 Proven Strategies That Work',
        description: fallbackDescription,
        alternates: {
          canonical: 'https://docs.promptreviews.app/strategies',
        },
      }
    }

    const seoTitle = article.metadata?.seo_title || article.title
    const seoDescription = article.metadata?.seo_description || article.metadata?.description || fallbackDescription

    return {
      title: `${seoTitle} | Prompt Reviews`,
      description: seoDescription,
      keywords: article.metadata?.keywords ?? [],
      alternates: {
        canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/strategies',
      },
    }
  } catch (error) {
    console.error('generateMetadata strategies error:', error)
    return {
      title: 'How to Get More Customer Reviews: 6 Proven Strategies That Work',
      description: fallbackDescription,
      alternates: {
        canonical: 'https://docs.promptreviews.app/strategies',
      },
    }
  }
}


const defaultKeyFeatures = [
  {
    icon: Target,
    title: 'The Double-Dip Strategy',
    description: 'Import existing Google reviews and turn them into prompt pages to collect reviews on other platforms - increasing reviews by 300%.',
    href: '/strategies/double-dip'
  },
  {
    icon: Heart,
    title: 'Psychology of Reciprocity',
    description: 'Use proven psychological principles to increase review response rates after providing exceptional value to customers.',
    href: '/strategies/reciprocity'
  },
  {
    icon: Users,
    title: 'Personal Outreach Mastery',
    description: 'Why one-on-one connections are more effective than mass requests for building lasting customer relationships.',
    href: '/strategies/personal-outreach'
  },
  {
    icon: Lightbulb,
    title: 'Smart Non-AI Techniques',
    description: 'Use kickstarters, recent reviews, and personalized templates to help customers write detailed, authentic reviews.',
    href: '/strategies/non-ai-strategies'
  },
  {
    icon: Sparkles,
    title: 'AI Novelty Factor',
    description: 'Leverage the unique experience of AI-powered review writing to create delightful customer interactions.',
    href: '/strategies/novelty'
  },
  {
    icon: Zap,
    title: 'Reviews on the Fly',
    description: 'Collect reviews in-person by highlighting the speed and ease of your review process with QR codes and mobile optimization.',
    href: '/strategies/reviews-on-fly'
  }
]

const defaultHowItWorks = [
  {
    number: 1,
    title: 'Choose Your Strategy',
    description: 'Select the approach that best fits your business model, customer relationships, and review collection goals.',
    icon: Target
  },
  {
    number: 2,
    title: 'Understand the Psychology',
    description: 'Learn why each strategy works by understanding customer psychology, timing, and motivation factors.',
    icon: Brain
  },
  {
    number: 3,
    title: 'Implement the Technique',
    description: 'Follow our step-by-step guides to implement your chosen strategies with proven templates and best practices.',
    icon: CheckCircle
  },
  {
    number: 4,
    title: 'Track and Optimize',
    description: 'Monitor your results and combine multiple strategies to maximize your review collection effectiveness.',
    icon: TrendingUp
  }
]

const defaultBestPractices = [
  {
    icon: Clock,
    title: 'Perfect Your Timing',
    description: 'Ask for reviews when customers are most satisfied—right after a great experience or successful service completion. The "peak-end rule" suggests people remember peaks and endings most vividly.'
  },
  {
    icon: MessageCircle,
    title: 'Make It Personal',
    description: 'Use customer names, reference specific interactions, and show you remember their experience. Personalization can increase response rates by up to 50%.'
  },
  {
    icon: Star,
    title: 'Lower the Barrier',
    description: 'Make the review process as easy as possible. Provide templates, bullet points, or AI assistance. Even simple bullet points can be incredibly valuable.'
  },
  {
    icon: TrendingUp,
    title: 'Follow Up Strategically',
    description: 'Don\'t just ask once. Follow up with different approaches, but always be respectful of their time. Multiple touchpoints can increase response rates by 2-3x.'
  }
]

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

const defaultOverviewContent = (
  <>
    <p className="text-white/90 text-lg mb-6 text-center">
      Collecting reviews isn't just about asking—it's about understanding human psychology,
      building genuine connections, and creating experiences that make people want to share their thoughts.
    </p>

    <div className="grid md:grid-cols-3 gap-6">
      <div className="text-center">
        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-semibold text-white mb-2">Increase Reviews by 300%</h3>
        <p className="text-white/80 text-sm">
          Proven techniques that increase review collection by 3-5x
        </p>
      </div>

      <div className="text-center">
        <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Heart className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-semibold text-white mb-2">Better Relationships</h3>
        <p className="text-white/80 text-sm">
          Build trust and loyalty while collecting authentic feedback
        </p>
      </div>

      <div className="text-center">
        <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Star className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-semibold text-white mb-2">Quality Reviews</h3>
        <p className="text-white/80 text-sm">
          Get detailed, helpful reviews that actually benefit your business
        </p>
      </div>
    </div>
  </>
)

export default async function StrategiesPage() {
  let article = null

  try {
    article = await getArticleBySlug('strategies')
  } catch (error) {
    console.error('Error fetching strategies article:', error)
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
        icon: resolveIcon(feature.icon, Target),
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
        icon: resolveIcon(step.icon, Target),
      }))
    : defaultHowItWorks

  const mappedBestPractices = Array.isArray(metadata.best_practices) && metadata.best_practices.length
    ? (metadata.best_practices as MetadataBestPractice[]).map((practice) => ({
        icon: resolveIcon(practice.icon, Clock),
        title: practice.title,
        description: practice.description,
      }))
    : defaultBestPractices

  const CategoryIcon = resolveIcon(
    typeof metadata.category_icon === 'string' && metadata.category_icon.trim().length
      ? metadata.category_icon
      : 'Target',
    Target,
  )

  const overviewMarkdown = article.content || ''
  const overviewTitle = getString((metadata as Record<string, unknown>).overview_title) || 'Why Strategies Matter'

  const overviewNode = overviewMarkdown
    ? <MarkdownRenderer content={overviewMarkdown} />
    : defaultOverviewContent

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
      text: 'Learn Double-Dip Strategy',
      href: '/strategies/double-dip',
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
      title={article.title || 'How to get more customer reviews'}
      description={metadata.description ?? fallbackDescription}
      categoryLabel={metadata.category_label || 'Review Collection'}
      categoryIcon={CategoryIcon}
      categoryColor={metadata.category_color || 'blue'}
      currentPage="Strategies"
      availablePlans={availablePlans}
      keyFeatures={mappedKeyFeatures}
      keyFeaturesTitle={keyFeaturesTitle}
      howItWorks={mappedHowItWorks}
      howItWorksTitle={howItWorksTitle}
      bestPractices={mappedBestPractices}
      bestPracticesTitle={bestPracticesTitle}
      faqs={faqMetadata && faqMetadata.length ? faqMetadata : pageFAQs['strategies']}
      faqsTitle={faqsTitle}
      callToAction={callToAction}
      overview={{
        title: overviewTitle,
        content: overviewNode,
      }}
    />
  )
}

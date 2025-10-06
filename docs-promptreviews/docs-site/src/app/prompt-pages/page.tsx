import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import StandardOverviewLayout from '../../components/StandardOverviewLayout'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import { pageFAQs } from '../utils/faqData'
import { getArticleBySlug } from '@/lib/docs/articles'

const {
  MessageCircle,
  Star,
  Camera,
  Video,
  Heart,
  Brain,
  QrCode,
  Palette,
  Calendar,
  User,
  Globe,
  Bot,
  Download,
  BarChart3,
  Share2,
  Shield,
  Smartphone,
  Target,
  Zap,
  Lightbulb,
  Sparkles,
  Edit
} = Icons

const fallbackDescription = 'Create personalized review request pages that make it easy for customers to leave detailed, authentic reviews. Choose from multiple types, customize everything, and watch your reviews grow.'


const defaultKeyFeatures = [
  {
    icon: Heart,
    title: 'Emoji Sentiment Flow',
    description: 'Interactive emoji-based review collection that makes leaving reviews fun and engaging for customers.',
    href: '/prompt-pages/features#emoji-sentiment-flow'
  },
  {
    icon: Bot,
    title: 'AI-Powered Content',
    description: 'AI-powered review generation and optimization to help customers write better reviews.',
    href: '/prompt-pages/features#prompty-ai'
  },
  {
    icon: QrCode,
    title: 'QR Code Generation',
    description: 'Generate QR codes for easy access to your prompt pages from anywhere.',
    href: '/prompt-pages/features#qr-codes'
  },
  {
    icon: Palette,
    title: 'Customization Options',
    description: 'Brand your prompt pages with your business colors, logos, and messaging.',
    href: '/prompt-pages/features#customization'
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description: 'Track performance and gain insights into your review collection efforts.',
    href: '/prompt-pages/features#analytics'
  },
  {
    icon: Share2,
    title: 'Multi-Platform Sharing',
    description: 'Distribute your prompt pages across all your marketing channels.',
    href: '/prompt-pages/features#multi-platform-sharing'
  }
]

const defaultHowItWorks = [
  {
    number: 1,
    title: 'Create Your Page',
    description: 'Choose your page type and add details. Include customer names, service info, or any context that makes the review personal.',
    icon: Edit
  },
  {
    number: 2,
    title: 'Share Your Link',
    description: 'Get your unique link, QR code, or NFC tag. Share it however works best—email, text, in-person, or on social media.',
    icon: Share2
  },
  {
    number: 3,
    title: 'Customer Leaves Review',
    description: 'Your customer lands on a beautiful, personalized page. They can write their own review or use AI assistance to help express their thoughts.',
    icon: Star
  },
  {
    number: 4,
    title: 'Track Your Success',
    description: 'Monitor which prompt pages generate the most reviews. See conversion rates, track performance, and optimize your approach.',
    icon: BarChart3
  }
]

const defaultBestPractices = [
  {
    icon: Target,
    title: 'Be Specific and Personal',
    description: 'The more specific your prompt page, the more detailed and helpful the reviews you\'ll receive. Include customer names, specific services, and relevant context.'
  },
  {
    icon: Zap,
    title: 'Make It Easy to Share',
    description: 'Use multiple sharing methods - direct links, QR codes, NFC tags, or email. Meet customers where they are and make leaving reviews effortless.'
  },
  {
    icon: Lightbulb,
    title: 'Test Different Page Types',
    description: 'Experiment with different page types (service, product, photo, video) to see what works best for your business and customer base.'
  },
  {
    icon: BarChart3,
    title: 'Track and Optimize Performance',
    description: 'Monitor which prompt pages perform best and use those insights to optimize your approach. Focus on what drives the most authentic reviews.'
  }
]

const overviewContent = (
  <>
    <p className="text-white/90 text-lg mb-6 text-center">
      Prompt pages are personalized review request pages you create for different situations.
      Each page is designed to make leaving a review as easy as possible while collecting the
      specific feedback you need.
    </p>

    <div className="grid md:grid-cols-3 gap-6">
      <div className="text-center">
        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Target className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-semibold text-white mb-2">Personalized</h3>
        <p className="text-white/80 text-sm">
          Each page is customized for specific customers, services, or situations
        </p>
      </div>

      <div className="text-center">
        <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Smartphone className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-semibold text-white mb-2">Mobile Optimized</h3>
        <p className="text-white/80 text-sm">
          Simple, mobile-friendly design that works perfectly on any device
        </p>
      </div>

      <div className="text-center">
        <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-semibold text-white mb-2">AI-Enhanced</h3>
        <p className="text-white/80 text-sm">
          AI-powered content helps customers write better, more detailed reviews
        </p>
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
    const article = await getArticleBySlug('prompt-pages')
    if (!article) {
      return {
        title: 'Prompt Pages - Create Personalized Review Request Pages | Prompt Reviews Help',
        description: fallbackDescription,
        alternates: {
          canonical: 'https://docs.promptreviews.app/docs/prompt-pages',
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
        canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/docs/prompt-pages',
      },
    }
  } catch (error) {
    console.error('generateMetadata prompt-pages error:', error)
    return {
      title: 'Prompt Pages - Create Personalized Review Request Pages | Prompt Reviews Help',
      description: fallbackDescription,
      alternates: {
        canonical: 'https://docs.promptreviews.app/docs/prompt-pages',
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

export default async function PromptPagesPage() {
  let article = null

  try {
    article = await getArticleBySlug('prompt-pages')
  } catch (error) {
    console.error('Error fetching prompt-pages article:', error)
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
        icon: resolveIcon(feature.icon, Heart),
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
        icon: resolveIcon(step.icon, Edit),
      }))
    : defaultHowItWorks

  const mappedBestPractices = Array.isArray(metadata.best_practices) && metadata.best_practices.length
    ? (metadata.best_practices as MetadataBestPractice[]).map((practice) => ({
        icon: resolveIcon(practice.icon, Target),
        title: practice.title,
        description: practice.description,
      }))
    : defaultBestPractices

  const CategoryIcon = resolveIcon(
    typeof metadata.category_icon === 'string' && metadata.category_icon.trim().length
      ? metadata.category_icon
      : 'MessageCircle',
    MessageCircle,
  )

  const overviewMarkdown = article.content || ''
  const overviewTitle = getString((metadata as Record<string, unknown>).overview_title) || 'What Are Prompt Pages?'

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
      text: 'Explore Page Types',
      href: '/prompt-pages/types',
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
      title={article.title || 'Prompt pages: Your review collection superpower'}
      description={metadata.description ?? fallbackDescription}
      categoryLabel={metadata.category_label || 'Prompt Pages'}
      categoryIcon={CategoryIcon}
      categoryColor={metadata.category_color || 'purple'}
      currentPage="Prompt Pages"
      availablePlans={availablePlans}
      keyFeatures={mappedKeyFeatures}
      keyFeaturesTitle={keyFeaturesTitle}
      howItWorks={mappedHowItWorks}
      howItWorksTitle={howItWorksTitle}
      bestPractices={mappedBestPractices}
      bestPracticesTitle={bestPracticesTitle}
      faqs={faqMetadata && faqMetadata.length ? faqMetadata : pageFAQs['prompt-pages']}
      faqsTitle={faqsTitle}
      callToAction={callToAction}
      overview={{
        title: overviewTitle,
        content: overviewNode,
      }}
    />
  )
}
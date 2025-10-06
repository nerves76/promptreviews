import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import StandardOverviewLayout from '../../../components/StandardOverviewLayout'
import MarkdownRenderer from '../../../components/MarkdownRenderer'
import { getArticleBySlug } from '@/lib/docs/articles'

const {
  Image,
  Star,
  Camera,
  Upload,
} = Icons

const fallbackDescription = 'Add professional photos to your Google Business Profile to attract more customers and build trust.'

const defaultKeyFeatures = [
  {
    icon: Star,
    title: 'Logo',
    description: 'Your business logo appears in search results and on Maps. Should be a square image, minimum 250x250 pixels. Recommended: 1024x1024 pixels, PNG or JPG format, with transparent background.',
  },
  {
    icon: Image,
    title: 'Cover photo',
    description: 'The main banner image that appears at the top of your profile. Showcases your business atmosphere. Recommended: 1024x576 pixels (16:9 aspect ratio), horizontal orientation.',
  },
  {
    icon: Camera,
    title: 'Additional photos',
    description: 'Showcase your products, services, team, and location. Categories include: Interior, Exterior, At Work, Team, Products, Services. Recommended: Minimum 720x720 pixels, JPG or PNG, well-lit and high quality.',
  }
]

const defaultHowItWorks = [
  {
    number: 1,
    icon: Upload,
    title: 'Upload logo and cover',
    description: 'Start by adding your logo and cover photo to establish your brand',
  },
  {
    number: 2,
    icon: Camera,
    title: 'Add category photos',
    description: 'Upload images for Interior, Exterior, At Work, Team, Products, and Services',
  },
  {
    number: 3,
    icon: Image,
    title: 'Organize and caption',
    description: 'Arrange photos by category and add descriptive captions',
  },
  {
    number: 4,
    icon: Star,
    title: 'Review and publish',
    description: 'Check all images meet quality guidelines and publish to your profile',
  }
]

const defaultBestPractices = [
  {
    icon: Upload,
    title: 'Use professional quality',
    description: 'High-resolution, well-lit photos perform better',
  },
  {
    icon: Camera,
    title: 'Show variety',
    description: 'Upload photos of your location, products, team, and customers (with permission)',
  },
  {
    icon: Image,
    title: 'Update regularly',
    description: 'Add new photos at least monthly to keep your profile fresh',
  },
  {
    icon: Star,
    title: 'Follow guidelines',
    description: 'Avoid text overlays, logos, or promotional content in regular photos',
  }
]

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
    const article = await getArticleBySlug('google-business/image-upload')
    if (!article) {
      return {
        title: 'Image Upload - Google Business Profile | Prompt Reviews Help',
        description: fallbackDescription,
        alternates: {
          canonical: 'https://docs.promptreviews.app/google-business/image-upload',
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
        canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/google-business/image-upload',
      },
    }
  } catch (error) {
    console.error('generateMetadata google-business/image-upload error:', error)
    return {
      title: 'Image Upload | Prompt Reviews',
      description: fallbackDescription,
      alternates: {
        canonical: 'https://docs.promptreviews.app/google-business/image-upload',
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

export default async function ImageUploadPage() {
  let article = null

  try {
    article = await getArticleBySlug('google-business/image-upload')
  } catch (error) {
    console.error('Error fetching google-business/image-upload article:', error)
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
      : ['builder', 'maven']

  const mappedKeyFeatures = Array.isArray(metadata.key_features) && metadata.key_features.length
    ? (metadata.key_features as MetadataFeature[]).map((feature) => ({
        icon: resolveIcon(feature.icon, Image),
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
        icon: resolveIcon(step.icon, Upload),
      }))
    : defaultHowItWorks

  const mappedBestPractices = Array.isArray(metadata.best_practices) && metadata.best_practices.length
    ? (metadata.best_practices as MetadataBestPractice[]).map((practice) => ({
        icon: resolveIcon(practice.icon, Upload),
        title: practice.title,
        description: practice.description,
      }))
    : defaultBestPractices

  const CategoryIcon = resolveIcon(
    typeof metadata.category_icon === 'string' && metadata.category_icon.trim().length
      ? metadata.category_icon
      : 'Image',
    Image,
  )

  const overviewMarkdown = getString((metadata as Record<string, unknown>).overview_markdown)
  const overviewTitle = getString((metadata as Record<string, unknown>).overview_title) || 'Overview'

  const overviewNode = overviewMarkdown ? <MarkdownRenderer content={overviewMarkdown} /> : undefined

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
      text: 'Business Info',
      href: '/google-business/business-info',
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
      title={article.title || 'Image upload'}
      description={metadata.description ?? fallbackDescription}
      categoryLabel={metadata.category_label || 'Google Business Profile'}
      categoryIcon={CategoryIcon}
      categoryColor={metadata.category_color || 'pink'}
      currentPage="Image Upload"
      availablePlans={availablePlans}
      keyFeatures={mappedKeyFeatures}
      keyFeaturesTitle={keyFeaturesTitle}
      howItWorks={mappedHowItWorks}
      howItWorksTitle={howItWorksTitle}
      bestPractices={mappedBestPractices}
      bestPracticesTitle={bestPracticesTitle}
      faqs={faqMetadata && faqMetadata.length ? faqMetadata : []}
      faqsTitle={faqsTitle}
      callToAction={callToAction}
      overview={overviewNode ? {
        title: overviewTitle,
        content: overviewNode,
      } : undefined}
    />
  )
}

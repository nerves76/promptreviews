import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import StandardOverviewLayout from '../../components/StandardOverviewLayout'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import { pageFAQs } from '../utils/faqData'
import { getArticleBySlug } from '@/lib/docs/articles'
import {
  Star,
  BarChart3,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  TrendingUp,
  Shield,
  Eye,
  ArrowRight,
  Filter,
  Download,
  Bell,
  Clock,
  Users,
  Target,
  Search
} from 'lucide-react'
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Revalidate every 60 seconds - allows CMS updates to show without redeployment
export const revalidate = 60


const fallbackDescription = 'Learn how to manage customer reviews in Prompt Reviews. Track submissions, verify publication, respond to feedback, and analyze review performance.'

function resolveIcon(iconName: string | undefined, fallback: LucideIcon): LucideIcon {
  if (!iconName) return fallback
  const lookup = Icons as Record<string, unknown>
  const maybeIcon = lookup[iconName]
  if (typeof maybeIcon === 'function') return maybeIcon as LucideIcon
  return fallback
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const article = await getArticleBySlug('reviews')
    if (!article) {
      return {
        title: 'Review Management - Track, Verify & Respond | Prompt Reviews Help',
        description: fallbackDescription,
        keywords: [
          'review management',
          'review tracking',
          'review verification',
          'review responses',
          'review analytics',
          'feedback management'
        ],
        alternates: {
          canonical: 'https://docs.promptreviews.app/reviews',
        },
      }
    }

    const seoTitle = article.metadata?.seo_title || article.title
    const seoDescription = article.metadata?.seo_description || article.metadata?.description || fallbackDescription

    return {
      title: `${seoTitle} | Prompt Reviews`,
      description: seoDescription,
      keywords: article.metadata?.keywords ?? [
        'review management',
        'review tracking',
        'review verification',
        'review responses',
        'review analytics',
        'feedback management'
      ],
      alternates: {
        canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/reviews',
      },
    }
  } catch (error) {
    console.error('generateMetadata reviews error:', error)
    return {
      title: 'Review Management - Track, Verify & Respond | Prompt Reviews Help',
      description: fallbackDescription,
      alternates: {
        canonical: 'https://docs.promptreviews.app/reviews',
      },
    }
  }
}

export default async function ReviewsPage() {
  const article = await getArticleBySlug('reviews')
  if (!article) {
    notFound()
  }

  const metadata = article.metadata ?? {}

  const mappedKeyFeatures = Array.isArray(metadata.key_features) && metadata.key_features.length
    ? (metadata.key_features as any[]).map((feature: any) => ({
        icon: resolveIcon(feature.icon, Star),
        title: feature.title,
        description: feature.description,
        href: feature.href,
      }))
    : []

  const mappedHowItWorks = Array.isArray(metadata.how_it_works) && metadata.how_it_works.length
    ? (metadata.how_it_works as any[]).map((step: any, index: number) => ({
        number: step.number ?? index + 1,
        title: step.title,
        description: step.description,
        icon: resolveIcon(step.icon, Star),
      }))
    : []

  const mappedBestPractices = Array.isArray(metadata.best_practices) && metadata.best_practices.length
    ? (metadata.best_practices as any[]).map((practice: any) => ({
        icon: resolveIcon(practice.icon, Star),
        title: practice.title,
        description: practice.description,
      }))
    : []

  return (
    <StandardOverviewLayout
      title={article.title || "Review Management"}
      description={article.metadata?.description || fallbackDescription}
      categoryLabel={article.metadata?.category_label || "Review Management"}
      categoryIcon={Star}
      categoryColor={(article.metadata?.category_color as any) || "yellow"}
      currentPage="Review Management"
      availablePlans={(article.metadata?.available_plans as any) || ['grower', 'builder', 'maven']}
      keyFeatures={mappedKeyFeatures}
      howItWorks={mappedHowItWorks}
      bestPractices={mappedBestPractices}
      faqs={pageFAQs['reviews']}
      callToAction={{
        primary: {
          text: 'Google Business Integration',
          href: '/google-business'
        }
      }}
      overview={{
        title: 'Your Review Command Center',
        content: <MarkdownRenderer content={article.content} />
      }}
    />
  )
}
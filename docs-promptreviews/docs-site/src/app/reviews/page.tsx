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

const fallbackDescription = 'Learn how to manage customer reviews in Prompt Reviews. Track submissions, verify publication, respond to feedback, and analyze review performance.'

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

  return (
    <StandardOverviewLayout
      title={article.title || "Review Management"}
      description={article.metadata?.description || fallbackDescription}
      categoryLabel={article.metadata?.category_label || "Review Management"}
      categoryIcon={Star}
      categoryColor={(article.metadata?.category_color as any) || "yellow"}
      currentPage="Review Management"
      availablePlans={(article.metadata?.available_plans as any) || ['grower', 'builder', 'maven']}
      keyFeatures={article.metadata?.key_features || []}
      howItWorks={article.metadata?.how_it_works || []}
      bestPractices={article.metadata?.best_practices || []}
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
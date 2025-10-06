import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import DocsLayout from '../docs-layout'
import PageHeader from '../components/PageHeader'
import MarkdownRenderer from '../components/MarkdownRenderer'
import { getArticleBySlug } from '@/lib/docs/articles'
import {
  TrendingUp,
  Star,
  Search,
  MessageSquare,
  Image,
  Users,
  Phone,
  Globe,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Lightbulb
} from 'lucide-react'
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Revalidate every 60 seconds - allows CMS updates to show without redeployment
export const revalidate = 60


const fallbackDescription = 'Master Google Business Profile optimization with industry benchmarks, actionable strategies, and ROI-focused insights.'

function resolveIcon(iconName: string | undefined, fallback: LucideIcon): LucideIcon {
  if (!iconName) return fallback
  const lookup = Icons as Record<string, unknown>
  const maybeIcon = lookup[iconName]
  if (typeof maybeIcon === 'function') return maybeIcon as LucideIcon
  return fallback
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const article = await getArticleBySlug('google-biz-optimizer')
    if (!article) {
      return {
        title: 'Google Biz Optimizer™ - Comprehensive Guide | Prompt Reviews Help',
        description: fallbackDescription,
        alternates: { canonical: 'https://docs.promptreviews.app/google-biz-optimizer' },
      }
    }

    const seoTitle = article.metadata?.seo_title || article.title
    const seoDescription = article.metadata?.seo_description || article.metadata?.description || fallbackDescription

    return {
      title: `${seoTitle} | Prompt Reviews`,
      description: seoDescription,
      keywords: article.metadata?.keywords ?? ['Google Business Profile optimization', 'GBP metrics', 'local SEO', 'review management', 'business visibility', 'customer engagement'],
      alternates: { canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/google-biz-optimizer' },
    }
  } catch (error) {
    console.error('generateMetadata google-biz-optimizer error:', error)
    return {
      title: 'Google Biz Optimizer™ - Comprehensive Guide | Prompt Reviews Help',
      description: fallbackDescription,
      alternates: { canonical: 'https://docs.promptreviews.app/google-biz-optimizer' },
    }
  }
}

export default async function GoogleBizOptimizerPage() {
  const article = await getArticleBySlug('google-biz-optimizer')
  if (!article) {
    notFound()
  }

  const CategoryIcon = resolveIcon(article.metadata?.category_icon, TrendingUp)
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' }
          ]}
          currentPage="Google Biz Optimizer™"
          categoryLabel={article.metadata?.category_label || "Google Biz Optimizer™"}
          categoryIcon={CategoryIcon}
          categoryColor={(article.metadata?.category_color as any) || "purple"}
          title={article.title || "Google Biz Optimizer™"}
          description={article.metadata?.description || "Master your Google Business Profile with data-driven strategies and industry insights"}
        />

        {/* Plan Availability */}
        {article.metadata?.available_plans && article.metadata.available_plans.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-white/60">Available on:</span>
              {article.metadata.available_plans.map((plan: string) => (
                <span key={plan} className={`text-xs px-2 py-1 rounded-full font-medium ${
                  plan === 'grower' ? 'bg-green-500/20 text-green-300' :
                  plan === 'builder' ? 'bg-purple-500/20 text-purple-300' :
                  'bg-yellow-500/20 text-yellow-300'
                }`}>
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Introduction */}
        {article.content && (
          <div className="mb-12">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <MarkdownRenderer content={article.content} />
            </div>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Metrics Section */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-colors">
            <div className="flex items-center mb-4">
              <BarChart3 className="w-6 h-6 text-yellow-300 mr-3" />
              <h2 className="text-xl font-semibold text-white">Key Metrics</h2>
            </div>
            <p className="text-white/70 mb-4">
              Understand the metrics that matter most for your Google Business Profile success.
            </p>
            <div className="space-y-3">
              <Link href="/google-biz-optimizer/metrics/total-reviews" className="flex items-center text-yellow-300 hover:text-yellow-200">
                <Star className="w-4 h-4 mr-2" />
                <span>Total Reviews Impact</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Link>
              <Link href="/google-biz-optimizer/metrics/average-rating" className="flex items-center text-yellow-300 hover:text-yellow-200">
                <Star className="w-4 h-4 mr-2" />
                <span>Average Rating Psychology</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Link>
              <Link href="/google-biz-optimizer/metrics/review-trends" className="flex items-center text-yellow-300 hover:text-yellow-200">
                <TrendingUp className="w-4 h-4 mr-2" />
                <span>Review Growth Trends</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Link>
              <Link href="/google-biz-optimizer/metrics/monthly-patterns" className="flex items-center text-yellow-300 hover:text-yellow-200">
                <BarChart3 className="w-4 h-4 mr-2" />
                <span>Monthly Review Patterns</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Link>
            </div>
          </div>

          {/* Optimization Section */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-colors">
            <div className="flex items-center mb-4">
              <Search className="w-6 h-6 text-green-300 mr-3" />
              <h2 className="text-xl font-semibold text-white">Optimization Strategies</h2>
            </div>
            <p className="text-white/70 mb-4">
              Proven techniques to improve your visibility and ranking in local search results.
            </p>
            <div className="space-y-3">
              <Link href="/google-biz-optimizer/optimization/seo-score" className="flex items-center text-yellow-300 hover:text-yellow-200">
                <Search className="w-4 h-4 mr-2" />
                <span>SEO Score Factors</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Link>
              <Link href="/google-biz-optimizer/optimization/categories" className="flex items-center text-yellow-300 hover:text-yellow-200">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Business Categories</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Link>
              <Link href="/google-biz-optimizer/optimization/services" className="flex items-center text-yellow-300 hover:text-yellow-200">
                <Lightbulb className="w-4 h-4 mr-2" />
                <span>Services & Descriptions</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Link>
              <Link href="/google-biz-optimizer/optimization/photos" className="flex items-center text-yellow-300 hover:text-yellow-200">
                <Image className="w-4 h-4 mr-2" />
                <span>Photo Strategy</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Link>
              <Link href="/google-biz-optimizer/optimization/quick-wins" className="flex items-center text-yellow-300 hover:text-yellow-200">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Quick Wins</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Link>
            </div>
          </div>

          {/* Engagement Section */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-colors">
            <div className="flex items-center mb-4">
              <MessageSquare className="w-6 h-6 text-purple-300 mr-3" />
              <h2 className="text-xl font-semibold text-white">Customer Engagement</h2>
            </div>
            <p className="text-white/70 mb-4">
              Build trust and loyalty through strategic customer interaction and response management.
            </p>
            <div className="space-y-3">
              <Link href="/google-biz-optimizer/engagement/review-responses" className="flex items-center text-yellow-300 hover:text-yellow-200">
                <MessageSquare className="w-4 h-4 mr-2" />
                <span>Review Response Templates</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Link>
              <Link href="/google-biz-optimizer/engagement/questions-answers" className="flex items-center text-yellow-300 hover:text-yellow-200">
                <Users className="w-4 h-4 mr-2" />
                <span>Q&A Management</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Link>
              <Link href="/google-biz-optimizer/engagement/posts" className="flex items-center text-yellow-300 hover:text-yellow-200">
                <Globe className="w-4 h-4 mr-2" />
                <span>Google Posts Strategy</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Link>
            </div>
          </div>

          {/* Performance Section */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-colors">
            <div className="flex items-center mb-4">
              <Phone className="w-6 h-6 text-orange-300 mr-3" />
              <h2 className="text-xl font-semibold text-white">Performance & Conversion</h2>
            </div>
            <p className="text-white/70 mb-4">
              Track and optimize customer actions to maximize ROI from your Google Business Profile.
            </p>
            <div className="space-y-3">
              <Link href="/google-biz-optimizer/performance/customer-actions" className="flex items-center text-yellow-300 hover:text-yellow-200">
                <Phone className="w-4 h-4 mr-2" />
                <span>Customer Actions Analysis</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Link>
            </div>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Why Google Biz Optimizer™?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-300 mr-3 mt-1" />
              <div>
                <h3 className="font-semibold text-white mb-1">Industry Benchmarks</h3>
                <p className="text-white/70">Compare your performance against industry standards and competitors.</p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-300 mr-3 mt-1" />
              <div>
                <h3 className="font-semibold text-white mb-1">Actionable Strategies</h3>
                <p className="text-white/70">Get specific, implementable tactics for immediate improvement.</p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-300 mr-3 mt-1" />
              <div>
                <h3 className="font-semibold text-white mb-1">ROI Calculations</h3>
                <p className="text-white/70">Understand the financial impact of each optimization effort.</p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-300 mr-3 mt-1" />
              <div>
                <h3 className="font-semibold text-white mb-1">Psychology Insights</h3>
                <p className="text-white/70">Leverage consumer psychology for better engagement and conversions.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Getting Started</h2>
          <ol className="space-y-4">
            <li className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold mr-3">1</span>
              <div>
                <h3 className="font-semibold text-white mb-1">Review Your Current Metrics</h3>
                <p className="text-white/70">Start by understanding where you stand with our metrics guides.</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold mr-3">2</span>
              <div>
                <h3 className="font-semibold text-white mb-1">Identify Quick Wins</h3>
                <p className="text-white/70">Check our Quick Wins guide for immediate improvements.</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold mr-3">3</span>
              <div>
                <h3 className="font-semibold text-white mb-1">Implement Systematically</h3>
                <p className="text-white/70">Follow our guides to optimize each aspect of your profile.</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold mr-3">4</span>
              <div>
                <h3 className="font-semibold text-white mb-1">Track Progress</h3>
                <p className="text-white/70">Monitor improvements and adjust strategies based on results.</p>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </DocsLayout>
  )
}
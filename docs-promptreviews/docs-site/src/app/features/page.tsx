import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import DocsLayout from '../docs-layout'
import PageHeader from '../components/PageHeader'
import MarkdownRenderer from '../components/MarkdownRenderer'
import Link from 'next/link'
import { getArticleBySlug } from '@/lib/docs/articles'
import { Star, Layout, MessageCircle, Bot, ArrowRight, Sparkles, Target, Share2 } from 'lucide-react'

// Revalidate every 60 seconds - allows CMS updates to show without redeployment
export const revalidate = 60


const fallbackDescription = 'Explore all the powerful features of Prompt Reviews including prompt pages, review widgets, AI-powered content, and more.'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const article = await getArticleBySlug('features')
    if (!article) {
      return {
        title: 'Features Overview | Prompt Reviews',
        description: fallbackDescription,
        keywords: ['features', 'review collection', 'widgets', 'AI reviews', 'prompt pages', 'prompt reviews'],
        alternates: {
          canonical: 'https://docs.promptreviews.app/features',
        },
      }
    }

    const seoTitle = article.metadata?.seo_title || article.title
    const seoDescription = article.metadata?.seo_description || article.metadata?.description || fallbackDescription

    return {
      title: `${seoTitle} | Prompt Reviews`,
      description: seoDescription,
      keywords: article.metadata?.keywords ?? ['features', 'review collection', 'widgets', 'AI reviews', 'prompt pages', 'prompt reviews'],
      alternates: {
        canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/features',
      },
    }
  } catch (error) {
    console.error('generateMetadata features error:', error)
    return {
      title: 'Features Overview | Prompt Reviews',
      description: fallbackDescription,
      alternates: {
        canonical: 'https://docs.promptreviews.app/features',
      },
    }
  }
}

export default async function FeaturesOverviewPage() {
  let article = null

  try {
    article = await getArticleBySlug('features')
  } catch (error) {
    console.error('Error fetching features article:', error)
  }

  if (!article) {
    notFound()
  }
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' }
          ]}
          currentPage="Features"
          categoryLabel="Features Overview"
          categoryIcon={Star}
          categoryColor="blue"
          title="Features overview"
          description="Everything you need to collect, manage, and showcase customer reviews"
        />

        {/* Article Content */}
        <div className="mb-12">
          <MarkdownRenderer content={article.content} />
        </div>

        {/* Introduction */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <p className="text-white/90 text-lg mb-4">
              Prompt Reviews provides a comprehensive suite of tools designed to help you collect authentic customer reviews,
              showcase them effectively, and grow your online reputation.
            </p>
            <p className="text-white/80">
              From personalized review request pages to AI-powered content generation, our features work together
              to make review collection effortless and effective.
            </p>
          </div>
        </div>

        {/* Core Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Prompt Pages */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-colors">
            <div className="flex items-center mb-4">
              <MessageCircle className="w-8 h-8 text-purple-300 mr-3" />
              <h2 className="text-xl font-semibold text-white">Prompt Pages</h2>
            </div>
            <p className="text-white/80 mb-4">
              Create personalized review request pages that make it easy for customers to leave detailed, authentic reviews.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>7 different page types for every situation</span>
              </li>
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>AI-powered review assistance</span>
              </li>
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>QR codes and NFC support</span>
              </li>
            </ul>
            <Link href="/prompt-pages" className="inline-flex items-center text-purple-300 hover:text-purple-200">
              <span>Explore Prompt Pages</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>

          {/* Review Widgets */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-colors">
            <div className="flex items-center mb-4">
              <Layout className="w-8 h-8 text-green-300 mr-3" />
              <h2 className="text-xl font-semibold text-white">Review Widgets</h2>
            </div>
            <p className="text-white/80 mb-4">
              Display your best reviews on your website with customizable, responsive widgets that build trust instantly.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>3 widget styles to match your site</span>
              </li>
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>Real-time review updates</span>
              </li>
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>Simple embed code installation</span>
              </li>
            </ul>
            <Link href="/widgets" className="inline-flex items-center text-green-300 hover:text-green-200">
              <span>Learn About Widgets</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>

          {/* AI-Powered Reviews */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-colors">
            <div className="flex items-center mb-4">
              <Bot className="w-8 h-8 text-yellow-300 mr-3" />
              <h2 className="text-xl font-semibold text-white">AI-Powered Reviews</h2>
            </div>
            <p className="text-white/80 mb-4">
              Help customers express their thoughts with AI assistance that maintains authenticity while improving quality.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>Smart review generation</span>
              </li>
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>Grammar and spell checking</span>
              </li>
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>Sentiment preservation</span>
              </li>
            </ul>
            <Link href="/ai-reviews" className="inline-flex items-center text-yellow-300 hover:text-yellow-200">
              <span>Discover AI Features</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>

          {/* Review Management */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-colors">
            <div className="flex items-center mb-4">
              <Target className="w-8 h-8 text-orange-300 mr-3" />
              <h2 className="text-xl font-semibold text-white">Review Management</h2>
            </div>
            <p className="text-white/80 mb-4">
              Organize, moderate, and optimize your review collection with powerful management tools and insights.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>Centralized review dashboard</span>
              </li>
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>Multi-platform distribution</span>
              </li>
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>Review response templates</span>
              </li>
            </ul>
            <Link href="/reviews" className="inline-flex items-center text-orange-300 hover:text-orange-200">
              <span>Manage Reviews</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Feature Availability by Plan</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 text-white">Feature</th>
                  <th className="text-center py-3 px-4 text-green-300">Grower</th>
                  <th className="text-center py-3 px-4 text-purple-300">Builder</th>
                  <th className="text-center py-3 px-4 text-yellow-300">Maven</th>
                </tr>
              </thead>
              <tbody className="text-white/80">
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4">Prompt Pages</td>
                  <td className="text-center py-3 px-4">10</td>
                  <td className="text-center py-3 px-4">100</td>
                  <td className="text-center py-3 px-4">Unlimited</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4">Review Widgets</td>
                  <td className="text-center py-3 px-4">1</td>
                  <td className="text-center py-3 px-4">3</td>
                  <td className="text-center py-3 px-4">Unlimited</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4">AI Review Generation</td>
                  <td className="text-center py-3 px-4">✓</td>
                  <td className="text-center py-3 px-4">✓</td>
                  <td className="text-center py-3 px-4">✓</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4">Contact Management</td>
                  <td className="text-center py-3 px-4">-</td>
                  <td className="text-center py-3 px-4">500</td>
                  <td className="text-center py-3 px-4">5,000</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4">Team Members</td>
                  <td className="text-center py-3 px-4">-</td>
                  <td className="text-center py-3 px-4">3</td>
                  <td className="text-center py-3 px-4">10</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}
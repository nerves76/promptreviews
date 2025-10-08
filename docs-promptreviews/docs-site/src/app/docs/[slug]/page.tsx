import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Calendar } from 'lucide-react'
import {
  getArticleBySlug,
  getAllArticles,
  ARTICLE_REVALIDATE_TIME
} from '@/lib/docs/articles'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import DocsLayout from '../../docs-layout'

interface PageProps {
  params: Promise<{ slug: string }>
}

// ============================================================================
// METADATA GENERATION
// ============================================================================

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticleBySlug(slug)

  if (!article) {
    return {
      title: 'Article Not Found',
      description: 'The requested article could not be found.',
    }
  }

  const { title, metadata, updated_at } = article

  // Use SEO-specific fields if available, otherwise fallback to regular title/description
  const seoTitle = metadata.seo_title || title
  const seoDescription = metadata.seo_description || metadata.description || `Learn about ${title} in the Prompt Reviews documentation.`
  const canonicalUrl = metadata.canonical_url || `https://promptreviews.app/docs/${slug}`

  return {
    title: `${seoTitle} | Prompt Reviews Documentation`,
    description: seoDescription,
    keywords: metadata.keywords || [],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${seoTitle} | Prompt Reviews Documentation`,
      description: seoDescription,
      url: canonicalUrl,
      type: 'article',
      publishedTime: article.published_at || article.created_at,
      modifiedTime: updated_at,
      tags: metadata.tags || [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${seoTitle} | Prompt Reviews`,
      description: seoDescription,
    },
  }
}

// ============================================================================
// STATIC GENERATION
// ============================================================================

export async function generateStaticParams() {
  try {
    const articles = await getAllArticles()
    if (articles && articles.length > 0) {
      return articles.map((article) => ({
        slug: article.slug,
      }))
    }
    // Fallback: return some sample slugs for testing/development
    return [
      { slug: 'getting-started' },
      { slug: 'prompt-pages' },
      { slug: 'widgets' },
    ]
  } catch (error) {
    console.error('Error generating static params:', error)
    // Return sample slugs as fallback
    return [
      { slug: 'getting-started' },
      { slug: 'prompt-pages' },
      { slug: 'widgets' },
    ]
  }
}

// ISR: Revalidate every 5 minutes (only works in non-static export mode)
export const revalidate = ARTICLE_REVALIDATE_TIME

// Force dynamic rendering if needed
export const dynamic = 'auto'
export const dynamicParams = true

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  const { title, content, metadata, published_at, updated_at } = article

  // Format dates
  const publishDate = published_at
    ? new Date(published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null

  const updateDate = new Date(updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Calculate reading time (rough estimate: 200 words per minute)
  const wordCount = content.split(/\s+/).length
  const readingTime = Math.ceil(wordCount / 200)

  return (
    <DocsLayout>
      <article className="max-w-4xl mx-auto">
        {/* Back navigation */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Documentation</span>
          </Link>
        </div>

        {/* Category label */}
        {metadata.category_label && (
          <div className="mb-4">
            <span className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-full text-sm font-medium text-white">
              {metadata.category_icon && (
                <span className="text-lg">{metadata.category_icon}</span>
              )}
              <span>{metadata.category_label}</span>
            </span>
          </div>
        )}

        {/* Article header */}
        <header className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-relaxed">
            {title}
          </h1>

          {metadata.description && (
            <p className="text-xl text-white/80 mb-6">
              {metadata.description}
            </p>
          )}

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
            {publishDate && (
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Published {publishDate}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>{readingTime} min read</span>
            </div>
            {updated_at && (
              <div className="flex items-center space-x-2">
                <span>Updated {updateDate}</span>
              </div>
            )}
          </div>

          {/* Plan availability */}
          {metadata.available_plans && metadata.available_plans.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-white/60">Available on:</span>
              {metadata.available_plans.map((plan) => (
                <span
                  key={plan}
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    plan === 'grower' ? 'bg-green-500/20 text-green-300' :
                    plan === 'builder' ? 'bg-purple-500/20 text-purple-300' :
                    'bg-yellow-500/20 text-yellow-300'
                  }`}
                >
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Key Features */}
        {metadata.key_features && metadata.key_features.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6">Key Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {metadata.key_features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6"
                >
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-white/80">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* How It Works */}
        {metadata.how_it_works && metadata.how_it_works.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6">How It Works</h2>
            <div className="space-y-6">
              {metadata.how_it_works.map((step, index) => (
                <div
                  key={index}
                  className="flex gap-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-yellow-300 font-bold text-lg">
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{step.icon}</span>
                      <h3 className="text-xl font-semibold text-white">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-white/80">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Main article content */}
        <section className="mb-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
          <MarkdownRenderer content={content} />
        </section>

        {/* Best Practices */}
        {metadata.best_practices && metadata.best_practices.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6">Best Practices</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {metadata.best_practices.map((practice, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6"
                >
                  <div className="text-3xl mb-3">{practice.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {practice.title}
                  </h3>
                  <p className="text-white/80">{practice.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related articles or next steps could go here */}
        <footer className="mt-12 pt-8 border-t border-white/20">
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 text-center">
            <h3 className="text-xl font-semibold text-white mb-2">
              Need Additional Help?
            </h3>
            <p className="text-white/80 mb-4">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center space-x-2 bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 border border-white/30 transition-colors font-medium backdrop-blur-sm"
              >
                <span>Browse All Docs</span>
              </Link>
              <a
                href="https://promptreviews.app/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <span>Contact Support</span>
              </a>
            </div>
          </div>
        </footer>
      </article>
    </DocsLayout>
  )
}

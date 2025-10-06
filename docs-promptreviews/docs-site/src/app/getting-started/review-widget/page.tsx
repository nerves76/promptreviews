import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import DocsLayout from '../../docs-layout'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import { getArticleBySlug } from '@/lib/docs/articles'

const fallbackDescription = 'Learn how to create and embed customizable review widgets on your website to showcase customer testimonials.'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const article = await getArticleBySlug('getting-started/review-widget')
    if (!article) {
      return {
        title: 'Set Up Your Review Widget | Prompt Reviews',
        description: fallbackDescription,
        keywords: ['review widget', 'embed reviews', 'website integration', 'review display', 'prompt reviews'],
        alternates: {
          canonical: 'https://docs.promptreviews.app/getting-started/review-widget',
        },
      }
    }

    const seoTitle = article.metadata?.seo_title || article.title
    const seoDescription = article.metadata?.seo_description || article.metadata?.description || fallbackDescription

    return {
      title: `${seoTitle} | Prompt Reviews`,
      description: seoDescription,
      keywords: article.metadata?.keywords ?? ['review widget', 'embed reviews', 'website integration', 'review display', 'prompt reviews'],
      alternates: {
        canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/getting-started/review-widget',
      },
    }
  } catch (error) {
    console.error('generateMetadata review-widget error:', error)
    return {
      title: 'Set Up Your Review Widget | Prompt Reviews',
      description: fallbackDescription,
      alternates: {
        canonical: 'https://docs.promptreviews.app/getting-started/review-widget',
      },
    }
  }
}

export default async function ReviewWidgetPage() {
  let article = null

  try {
    article = await getArticleBySlug('getting-started/review-widget')
  } catch (error) {
    console.error('Error fetching review-widget article:', error)
  }

  if (!article) {
    notFound()
  }

  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <MarkdownRenderer content={article.content} />
      </div>
    </DocsLayout>
  )
}

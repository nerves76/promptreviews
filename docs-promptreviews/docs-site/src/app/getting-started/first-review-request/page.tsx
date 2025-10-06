import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import DocsLayout from '../../docs-layout'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import { getArticleBySlug } from '@/lib/docs/articles'

// Revalidate every 60 seconds - allows CMS updates to show without redeployment
export const revalidate = 60


const fallbackDescription = 'Learn how to send personalized review requests via email, SMS, QR codes, and direct links using Prompt Reviews.'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const article = await getArticleBySlug('getting-started/first-review-request')
    if (!article) {
      return {
        title: 'Send Your First Review Request | Prompt Reviews',
        description: fallbackDescription,
        keywords: ['send review request', 'email reviews', 'SMS reviews', 'QR code reviews', 'prompt reviews'],
        alternates: {
          canonical: 'https://docs.promptreviews.app/getting-started/first-review-request',
        },
      }
    }

    const seoTitle = article.metadata?.seo_title || article.title
    const seoDescription = article.metadata?.seo_description || article.metadata?.description || fallbackDescription

    return {
      title: `${seoTitle} | Prompt Reviews`,
      description: seoDescription,
      keywords: article.metadata?.keywords ?? ['send review request', 'email reviews', 'SMS reviews', 'QR code reviews', 'prompt reviews'],
      alternates: {
        canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/getting-started/first-review-request',
      },
    }
  } catch (error) {
    console.error('generateMetadata first-review-request error:', error)
    return {
      title: 'Send Your First Review Request | Prompt Reviews',
      description: fallbackDescription,
      alternates: {
        canonical: 'https://docs.promptreviews.app/getting-started/first-review-request',
      },
    }
  }
}

export default async function FirstReviewRequestPage() {
  let article = null

  try {
    article = await getArticleBySlug('getting-started/first-review-request')
  } catch (error) {
    console.error('Error fetching first-review-request article:', error)
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

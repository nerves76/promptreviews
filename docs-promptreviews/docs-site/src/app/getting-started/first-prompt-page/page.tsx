import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import DocsLayout from '../../docs-layout'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import { getArticleBySlug } from '@/lib/docs/articles'
const fallbackDescription = 'Learn how to create your first personalized review request page with AI-powered content generation in Prompt Reviews.'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const article = await getArticleBySlug('getting-started/first-prompt-page')
    if (!article) {
      return {
        title: 'Create Your First Prompt Page | Prompt Reviews',
        description: fallbackDescription,
        keywords: ['create prompt page', 'review request page', 'AI content generation', 'prompt reviews tutorial'],
        alternates: {
          canonical: 'https://docs.promptreviews.app/getting-started/first-prompt-page',
        },
      }
    }

    const seoTitle = article.metadata?.seo_title || article.title
    const seoDescription = article.metadata?.seo_description || article.metadata?.description || fallbackDescription

    return {
      title: `${seoTitle} | Prompt Reviews`,
      description: seoDescription,
      keywords: article.metadata?.keywords ?? ['create prompt page', 'review request page', 'AI content generation', 'prompt reviews tutorial'],
      alternates: {
        canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/getting-started/first-prompt-page',
      },
    }
  } catch (error) {
    console.error('generateMetadata first-prompt-page error:', error)
    return {
      title: 'Create Your First Prompt Page | Prompt Reviews',
      description: fallbackDescription,
      alternates: {
        canonical: 'https://docs.promptreviews.app/getting-started/first-prompt-page',
      },
    }
  }
}

export default async function FirstPromptPagePage() {
  let article = null

  try {
    article = await getArticleBySlug('getting-started/first-prompt-page')
  } catch (error) {
    console.error('Error fetching first-prompt-page article:', error)
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

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import DocsLayout from '../../docs-layout'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import { getArticleBySlug } from '@/lib/docs/articles'
const fallbackDescription = 'Learn how to import your customer database or manually add contacts to start sending personalized review requests.'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const article = await getArticleBySlug('getting-started/adding-contacts')
    if (!article) {
      return {
        title: 'Add Your First Contacts | Prompt Reviews',
        description: fallbackDescription,
        keywords: ['add contacts', 'import customers', 'CSV upload', 'contact management', 'prompt reviews'],
        alternates: {
          canonical: 'https://docs.promptreviews.app/getting-started/adding-contacts',
        },
      }
    }

    const seoTitle = article.metadata?.seo_title || article.title
    const seoDescription = article.metadata?.seo_description || article.metadata?.description || fallbackDescription

    return {
      title: `${seoTitle} | Prompt Reviews`,
      description: seoDescription,
      keywords: article.metadata?.keywords ?? ['add contacts', 'import customers', 'CSV upload', 'contact management', 'prompt reviews'],
      alternates: {
        canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/getting-started/adding-contacts',
      },
    }
  } catch (error) {
    console.error('generateMetadata adding-contacts error:', error)
    return {
      title: 'Add Your First Contacts | Prompt Reviews',
      description: fallbackDescription,
      alternates: {
        canonical: 'https://docs.promptreviews.app/getting-started/adding-contacts',
      },
    }
  }
}

export default async function AddingContactsPage() {
  let article = null

  try {
    article = await getArticleBySlug('getting-started/adding-contacts')
  } catch (error) {
    console.error('Error fetching adding-contacts article:', error)
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

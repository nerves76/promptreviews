import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import DocsLayout from '../../docs-layout'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import { getArticleBySlug } from '@/lib/docs/articles'

// Revalidate every 60 seconds - allows CMS updates to show without redeployment
export const revalidate = 60


const fallbackDescription = 'Select the perfect Prompt Reviews plan for your business. Compare features and pricing to find what works best for you.'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const article = await getArticleBySlug('getting-started/choosing-plan')
    if (!article) {
      return {
        title: 'Choose Your Plan | Prompt Reviews',
        description: fallbackDescription,
        keywords: ['prompt reviews pricing', 'plans', 'subscription', 'free trial', 'pricing comparison'],
        alternates: {
          canonical: 'https://docs.promptreviews.app/getting-started/choosing-plan',
        },
      }
    }

    const seoTitle = article.metadata?.seo_title || article.title
    const seoDescription = article.metadata?.seo_description || article.metadata?.description || fallbackDescription

    return {
      title: `${seoTitle} | Prompt Reviews`,
      description: seoDescription,
      keywords: article.metadata?.keywords ?? ['prompt reviews pricing', 'plans', 'subscription', 'free trial', 'pricing comparison'],
      alternates: {
        canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/getting-started/choosing-plan',
      },
    }
  } catch (error) {
    console.error('generateMetadata choosing-plan error:', error)
    return {
      title: 'Choose Your Plan | Prompt Reviews',
      description: fallbackDescription,
      alternates: {
        canonical: 'https://docs.promptreviews.app/getting-started/choosing-plan',
      },
    }
  }
}

export default async function ChoosingPlanPage() {
  let article = null

  try {
    article = await getArticleBySlug('getting-started/choosing-plan')
  } catch (error) {
    console.error('Error fetching choosing-plan article:', error)
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

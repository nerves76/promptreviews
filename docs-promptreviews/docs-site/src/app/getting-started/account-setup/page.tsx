import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import DocsLayout from '../../docs-layout'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import { getArticleBySlug } from '@/lib/docs/articles'
const fallbackDescription = 'Create your Prompt Reviews account and set up your business profile to start collecting customer reviews.'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const article = await getArticleBySlug('getting-started/account-setup')
    if (!article) {
      return {
        title: 'Account Setup & Business Profile | Prompt Reviews',
        description: fallbackDescription,
        keywords: ['account setup', 'business profile', 'prompt reviews registration', 'sign up'],
        alternates: {
          canonical: 'https://docs.promptreviews.app/getting-started/account-setup',
        },
      }
    }

    const seoTitle = article.metadata?.seo_title || article.title
    const seoDescription = article.metadata?.seo_description || article.metadata?.description || fallbackDescription

    return {
      title: `${seoTitle} | Prompt Reviews`,
      description: seoDescription,
      keywords: article.metadata?.keywords ?? ['account setup', 'business profile', 'prompt reviews registration', 'sign up'],
      alternates: {
        canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/getting-started/account-setup',
      },
    }
  } catch (error) {
    console.error('generateMetadata account-setup error:', error)
    return {
      title: 'Account Setup & Business Profile | Prompt Reviews',
      description: fallbackDescription,
      alternates: {
        canonical: 'https://docs.promptreviews.app/getting-started/account-setup',
      },
    }
  }
}

export default async function AccountSetupPage() {
  let article = null

  try {
    article = await getArticleBySlug('getting-started/account-setup')
  } catch (error) {
    console.error('Error fetching account-setup article:', error)
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

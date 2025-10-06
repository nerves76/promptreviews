import { Metadata } from 'next'
import { getArticleBySlug } from '@/lib/docs/articles'

const fallbackDescription = 'Find answers to all your questions about Prompt Reviews. This comprehensive FAQ covers everything from getting started to advanced features, pricing, integrations, and technical support.'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const article = await getArticleBySlug('faq-comprehensive')
    if (!article) {
      return {
        title: 'Complete FAQ: Everything You Need to Know | Prompt Reviews',
        description: fallbackDescription,
        alternates: { canonical: 'https://docs.promptreviews.app/faq-comprehensive' },
      }
    }

    const seoTitle = article.metadata?.seo_title || article.title
    const seoDescription = article.metadata?.seo_description || article.metadata?.description || fallbackDescription

    return {
      title: `${seoTitle} | Prompt Reviews`,
      description: seoDescription,
      keywords: article.metadata?.keywords ?? ['faq', 'help', 'questions', 'answers', 'support', 'prompt reviews'],
      alternates: { canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/faq-comprehensive' },
    }
  } catch (error) {
    console.error('generateMetadata faq-comprehensive error:', error)
    return {
      title: 'Complete FAQ: Everything You Need to Know | Prompt Reviews',
      description: fallbackDescription,
      alternates: { canonical: 'https://docs.promptreviews.app/faq-comprehensive' },
    }
  }
}

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

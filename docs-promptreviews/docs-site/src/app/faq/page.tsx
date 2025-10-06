import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import DocsLayout from '../docs-layout'
import PageHeader from '../components/PageHeader'
import MarkdownRenderer from '../components/MarkdownRenderer'
import FAQClient from './faq-client'
import { getArticleBySlug } from '@/lib/docs/articles'
const fallbackDescription = 'Complete FAQ covering all Prompt Reviews features - setup, prompt pages, AI reviews, Google Business integration, pricing, and technical support.'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const article = await getArticleBySlug('faq')
    if (!article) {
      return {
        title: 'Master FAQ - Complete Frequently Asked Questions | Prompt Reviews Help',
        description: fallbackDescription,
        keywords: [
          'FAQ',
          'frequently asked questions',
          'Prompt Reviews help',
          'complete FAQ',
          'review collection questions',
          'pricing questions',
          'technical support',
          'prompt pages FAQ',
          'AI reviews FAQ',
          'Google Business FAQ'
        ],
        alternates: {
          canonical: 'https://docs.promptreviews.app/faq',
        },
      }
    }

    const seoTitle = article.metadata?.seo_title || article.title
    const seoDescription = article.metadata?.seo_description || article.metadata?.description || fallbackDescription

    return {
      title: `${seoTitle} | Prompt Reviews`,
      description: seoDescription,
      keywords: article.metadata?.keywords ?? [
        'FAQ',
        'frequently asked questions',
        'Prompt Reviews help',
        'complete FAQ',
        'review collection questions',
        'pricing questions',
        'technical support',
        'prompt pages FAQ',
        'AI reviews FAQ',
        'Google Business FAQ'
      ],
      alternates: {
        canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/faq',
      },
    }
  } catch (error) {
    console.error('generateMetadata faq error:', error)
    return {
      title: 'Master FAQ - Complete Frequently Asked Questions | Prompt Reviews Help',
      description: fallbackDescription,
      alternates: {
        canonical: 'https://docs.promptreviews.app/faq',
      },
    }
  }
}

export default async function FAQPage() {
  let article = null

  try {
    article = await getArticleBySlug('faq')
  } catch (error) {
    console.error('Error fetching faq article:', error)
  }

  if (!article) {
    notFound()
  }
  return (
    <DocsLayout>
      <div className="prose-docs">
        <div className="mb-8">
          <MarkdownRenderer content={article.content} />
        </div>
        <FAQClient />
      </div>
    </DocsLayout>
  )
}
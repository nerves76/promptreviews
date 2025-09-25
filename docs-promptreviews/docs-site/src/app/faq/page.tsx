import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import DocsLayout from '../docs-layout'
import PageHeader from '../components/PageHeader'
import FAQClient from './faq-client'

export const metadata: Metadata = {
  title: 'Master FAQ - Complete Frequently Asked Questions | Prompt Reviews Help',
  description: 'Complete FAQ covering all Prompt Reviews features - setup, prompt pages, AI reviews, Google Business integration, pricing, and technical support.',
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

export default function FAQPage() {
  return (
    <DocsLayout>
      <div className="prose-docs">
        <FAQClient />
      </div>
    </DocsLayout>
  )
}
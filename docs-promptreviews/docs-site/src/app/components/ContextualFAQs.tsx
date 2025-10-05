'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, HelpCircle, ArrowRight } from 'lucide-react'
import { pageFAQs } from '../utils/faqData'

interface FAQ {
  question: string
  answer: string
  plans?: ('grower' | 'builder' | 'maven')[]
}

interface ContextualFAQsProps {
  /** The page key to fetch FAQs for (e.g., 'prompt-pages', 'google-business') */
  pageKey: string
  /** Custom title for the FAQ section */
  title?: string
  /** Maximum number of FAQs to display (default: 5) */
  limit?: number
  /** Whether to show the "View All FAQs" link */
  showViewAll?: boolean
  /** Whether to show plan indicators on FAQs */
  showPlans?: boolean
  /** Custom FAQs to display instead of page-specific ones */
  customFAQs?: FAQ[]
  /** Additional CSS classes */
  className?: string
}

export default function ContextualFAQs({
  pageKey,
  title = 'Frequently Asked Questions',
  limit = 5,
  showViewAll = true,
  showPlans = false,
  customFAQs,
  className = ''
}: ContextualFAQsProps) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null)

  // Get FAQs from pageFAQs or use custom FAQs
  const faqs = (customFAQs || pageFAQs[pageKey as keyof typeof pageFAQs] || []) as FAQ[]
  const displayFAQs = faqs.slice(0, limit)

  // If no FAQs found, don't render anything
  if (displayFAQs.length === 0) {
    return null
  }

  // Generate JSON-LD schema for FAQs
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: displayFAQs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className={`mt-12 mb-8 ${className}`}>
        {/* FAQ Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <HelpCircle className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">{title}</h2>
          </div>
          {showViewAll && (
            <Link
              href="/faq"
              className="inline-flex items-center space-x-2 text-yellow-300 hover:text-yellow-200 text-sm transition-colors group"
            >
              <span>View All FAQs</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {displayFAQs.map((faq, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg overflow-hidden"
            >
              {/* Question Header */}
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors group"
              >
                <div className="flex-1 pr-4">
                  <h3 className="font-semibold text-white group-hover:text-yellow-300 transition-colors">
                    {faq.question}
                  </h3>
                  {showPlans && faq.plans && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {faq.plans.map((plan) => (
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
                </div>
                <div className="flex-shrink-0">
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-white/60" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/60" />
                  )}
                </div>
              </button>

              {/* Answer */}
              {openIndex === index && (
                <div className="px-6 pb-4 border-t border-white/10">
                  <div className="pt-4">
                    <p className="text-white/80 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Show More Link */}
        {faqs.length > limit && showViewAll && (
          <div className="mt-6 text-center">
            <Link
              href="/faq"
              className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors backdrop-blur-sm border border-white/20"
            >
              <HelpCircle className="w-4 h-4" />
              <span>View {faqs.length - limit} more questions</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </>
  )
}

// Export a helper hook for getting FAQ counts
export function useFAQCount(pageKey: string): number {
  const faqs = pageFAQs[pageKey as keyof typeof pageFAQs] || []
  return faqs.length
}

// Export common FAQ categories for easy reference
export const FAQCategories = {
  GETTING_STARTED: 'getting-started',
  PROMPT_PAGES: 'prompt-pages',
  CONTACTS: 'contacts',
  GOOGLE_BUSINESS: 'google-business',
  REVIEWS: 'reviews',
  BILLING: 'billing',
  WIDGETS: 'widgets',
  AI_REVIEWS: 'ai-reviews',
  TEAM: 'team',
  ANALYTICS: 'analytics',
  TROUBLESHOOTING: 'troubleshooting',
  STRATEGIES: 'strategies',
  API: 'api'
} as const

// Quick FAQ component for embedding single FAQ
interface QuickFAQProps {
  question: string
  answer: string
  className?: string
}

export function QuickFAQ({ question, answer, className = '' }: QuickFAQProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className={`bg-blue-500/10 border border-blue-400/30 rounded-lg overflow-hidden ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-blue-500/20 transition-colors"
      >
        <h4 className="font-medium text-white text-sm">{question}</h4>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-yellow-300 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-yellow-300 flex-shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="px-4 pb-3 border-t border-blue-400/20">
          <p className="text-white/80 text-sm mt-3">{answer}</p>
        </div>
      )}
    </div>
  )
}
'use client'

import Link from 'next/link'
import DocsLayout from '../docs-layout'
import PageHeader from '../components/PageHeader'
import { consolidatedFAQs } from '../utils/faqData'
import { 
  HelpCircle, 
  Search, 
  ChevronDown,
  ChevronUp,
  ArrowRight,
  MessageSquare,
  Mail
} from 'lucide-react'
import React from 'react'

// Generate comprehensive JSON-LD schema for all FAQs
const generateFAQSchema = () => {
  const allQuestions = consolidatedFAQs.flatMap(category => 
    category.faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  )

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: allQuestions
  }
}

export default function ComprehensiveFAQPage() {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [openCategories, setOpenCategories] = React.useState<Set<number>>(new Set([0, 1, 2]))
  const [openQuestions, setOpenQuestions] = React.useState<Set<string>>(new Set())

  const toggleCategory = (index: number) => {
    const newOpen = new Set(openCategories)
    if (newOpen.has(index)) {
      newOpen.delete(index)
    } else {
      newOpen.add(index)
    }
    setOpenCategories(newOpen)
  }

  const toggleQuestion = (key: string) => {
    const newOpen = new Set(openQuestions)
    if (newOpen.has(key)) {
      newOpen.delete(key)
    } else {
      newOpen.add(key)
    }
    setOpenQuestions(newOpen)
  }

  // Filter FAQs based on search term
  const filteredFAQs = consolidatedFAQs.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq => 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0)

  const faqSchema = generateFAQSchema()

  return (
    <DocsLayout>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="prose-docs">
        {/* Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' }
          ]}
          currentPage="Complete FAQ"
          categoryLabel="All Questions Answered"
          categoryIcon={HelpCircle}
          categoryColor="blue"
          title="Complete FAQ: Everything You Need to Know"
          description="Find answers to all your questions about Prompt Reviews. This comprehensive FAQ covers everything from getting started to advanced features, pricing, integrations, and technical support."
        />

        {/* Search Bar */}
        <div className="mb-12">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
            <input
              type="text"
              placeholder="Search all FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-white placeholder:text-white/50 backdrop-blur-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="text-center text-white/60 mt-3">
              Found {filteredFAQs.reduce((acc, cat) => acc + cat.faqs.length, 0)} results for "{searchTerm}"
            </p>
          )}
        </div>

        {/* Quick Links */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Navigation</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
            {consolidatedFAQs.map((category, index) => (
              <button
                key={index}
                onClick={() => {
                  const element = document.getElementById(`category-${index}`)
                  element?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="text-left p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:border-primary-300 hover:bg-white/15 transition-all"
              >
                <p className="font-medium text-white text-sm">{category.category}</p>
                <p className="text-xs text-white/60 mt-1">{category.faqs.length} questions</p>
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {filteredFAQs.map((category, categoryIndex) => (
            <div key={categoryIndex} id={`category-${categoryIndex}`} className="scroll-mt-24">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(categoryIndex)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-primary-500/10 to-primary-600/10 backdrop-blur-md border border-primary-400/30 rounded-lg hover:border-primary-400/50 transition-all mb-4"
              >
                <h2 className="text-xl font-bold text-white mb-0">{category.category}</h2>
                {openCategories.has(categoryIndex) ? (
                  <ChevronUp className="w-5 h-5 text-white/60" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white/60" />
                )}
              </button>

              {/* Questions in Category */}
              {openCategories.has(categoryIndex) && (
                <div className="space-y-3 pl-4">
                  {category.faqs.map((faq, faqIndex) => {
                    const questionKey = `${categoryIndex}-${faqIndex}`
                    return (
                      <div 
                        key={questionKey}
                        className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => toggleQuestion(questionKey)}
                          className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                        >
                          <h3 className="font-semibold text-white pr-4">{faq.question}</h3>
                          {openQuestions.has(questionKey) ? (
                            <ChevronUp className="w-5 h-5 text-white/60 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-white/60 flex-shrink-0" />
                          )}
                        </button>
                        
                        {openQuestions.has(questionKey) && (
                          <div className="px-6 pb-4">
                            <p className="text-white/80">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Statistics */}
        <div className="mt-16 p-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-md border border-white/20 rounded-xl">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">FAQ Statistics</h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-primary-300">
                {consolidatedFAQs.length}
              </p>
              <p className="text-white/70 mt-1">Categories</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-300">
                {consolidatedFAQs.reduce((acc, cat) => acc + cat.faqs.length, 0)}
              </p>
              <p className="text-white/70 mt-1">Total Questions</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-300">
                100%
              </p>
              <p className="text-white/70 mt-1">Coverage</p>
            </div>
          </div>
        </div>

        {/* Still Need Help */}
        <div className="mt-12 callout success">
          <h3 className="text-lg font-semibold mb-3">Can't Find Your Answer?</h3>
          <p className="mb-4">
            If you couldn't find the answer you're looking for in this comprehensive FAQ, 
            our support team is ready to help with any specific questions or issues.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://promptreviews.app/contact"
              className="inline-flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium no-underline"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Support</span>
            </a>
            <Link
              href="/troubleshooting"
              className="inline-flex items-center space-x-2 border border-primary-400 text-primary-300 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium no-underline"
            >
              <span>Troubleshooting Guide</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Related Resources */}
        <h2>Related Resources</h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/getting-started" className="block p-4 border border-white/20 rounded-lg hover:border-primary-400 transition-colors no-underline">
            <h4 className="font-semibold text-white mb-2">Getting Started Guide</h4>
            <p className="text-sm text-white/70 mb-0">Complete setup guide to get you up and running with Prompt Reviews.</p>
          </Link>
          
          <Link href="/prompt-pages" className="block p-4 border border-white/20 rounded-lg hover:border-primary-400 transition-colors no-underline">
            <h4 className="font-semibold text-white mb-2">Prompt Pages</h4>
            <p className="text-sm text-white/70 mb-0">Learn about creating personalized review request pages.</p>
          </Link>
          
          <Link href="/strategies" className="block p-4 border border-white/20 rounded-lg hover:border-primary-400 transition-colors no-underline">
            <h4 className="font-semibold text-white mb-2">Review Strategies</h4>
            <p className="text-sm text-white/70 mb-0">Best practices and strategies for collecting more reviews.</p>
          </Link>
        </div>
      </div>
    </DocsLayout>
  )
}
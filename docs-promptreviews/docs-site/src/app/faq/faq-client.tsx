'use client'

import React from 'react'
import Link from 'next/link'
import PageHeader from '../components/PageHeader'
import { consolidatedFAQs } from '../utils/faqData'
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Star,
  Users,
  Mail,
  MessageSquare,
  Shield,
  ArrowRight,
  CheckCircle,
  DollarSign,
  Database,
  Sparkles,
  Filter,
  Tag,
  Building2,
  Code,
  BarChart3,
  Target,
  Globe
} from 'lucide-react'

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

// Category icons mapping
const categoryIcons: { [key: string]: any } = {
  'Getting Started & Setup': Star,
  'Pricing & Plans': DollarSign,
  'Prompt Pages': MessageSquare,
  'Contact Management': Users,
  'Google Business & Integrations': Building2,
  'AI Features': Sparkles,
  'API & Integration': Code,
  'Widgets & Display': Globe,
  'Analytics & Insights': BarChart3,
  'Review Strategies': Target,
  'Technical & Support': Shield
}

// Category colors mapping
const categoryColors: { [key: string]: string } = {
  'Getting Started & Setup': 'bg-blue-500',
  'Pricing & Plans': 'bg-green-500',
  'Prompt Pages': 'bg-purple-500',
  'Contact Management': 'bg-orange-500',
  'Google Business & Integrations': 'bg-red-500',
  'AI Features': 'bg-yellow-500',
  'API & Integration': 'bg-indigo-500',
  'Widgets & Display': 'bg-teal-500',
  'Analytics & Insights': 'bg-emerald-500',
  'Review Strategies': 'bg-pink-500',
  'Technical & Support': 'bg-cyan-500'
}

const quickLinks = [
  {
    icon: Star,
    title: 'Getting Started',
    description: 'New to Prompt Reviews? Start here.',
    href: '/getting-started',
    color: 'bg-blue-500/20 text-blue-300'
  },
  {
    icon: MessageSquare,
    title: 'Prompt Pages',
    description: 'Learn about creating review pages.',
    href: '/prompt-pages',
    color: 'bg-purple-500/20 text-purple-300'
  },
  {
    icon: Sparkles,
    title: 'AI Features',
    description: 'Discover AI-powered review collection.',
    href: '/ai-reviews',
    color: 'bg-yellow-500/20 text-yellow-300'
  },
  {
    icon: Building2,
    title: 'Google Business',
    description: 'Connect your Google Business Profile.',
    href: '/google-business',
    color: 'bg-red-500/20 text-red-300'
  },
  {
    icon: Users,
    title: 'Contact Management',
    description: 'Import and organize your contacts.',
    href: '/contacts',
    color: 'bg-orange-500/20 text-orange-300'
  },
  {
    icon: Shield,
    title: 'Troubleshooting',
    description: 'Find solutions to common issues.',
    href: '/troubleshooting',
    color: 'bg-cyan-500/20 text-cyan-300'
  }
]

export default function FAQClient() {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)
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

  // Filter FAQs based on search term and selected category
  const filteredFAQs = consolidatedFAQs
    .filter(category =>
      !selectedCategory || category.category === selectedCategory
    )
    .map(category => ({
      ...category,
      faqs: category.faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }))
    .filter(category => category.faqs.length > 0)

  const faqSchema = generateFAQSchema()

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Help', href: '/' }
        ]}
        currentPage="Master FAQ"
        categoryLabel="Complete FAQ Collection"
        categoryIcon={HelpCircle}
        categoryColor="blue"
        title="Master FAQ: Everything You Need to Know"
        description="Complete answers to all your questions about Prompt Reviews - from setup and features to pricing, integrations, and technical support."
      />

      {/* Plan Indicator */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 justify-center">
          <span className="text-sm text-white/60">Available on:</span>
          <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full font-medium">Grower</span>
          <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full font-medium">Builder</span>
          <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded-full font-medium">Maven</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center space-x-6 text-sm text-white/70">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>{consolidatedFAQs.reduce((acc, cat) => acc + cat.faqs.length, 0)} total questions</span>
          </div>
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4" />
            <span>{consolidatedFAQs.length} categories</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Expert guidance</span>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-12">
        <div className="flex flex-col lg:flex-row gap-4 max-w-4xl mx-auto">
          {/* Search Input */}
          <div className="relative flex-1">
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

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="pl-12 pr-8 py-4 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-white backdrop-blur-sm appearance-none cursor-pointer min-w-[200px]"
            >
              <option value="">All Categories</option>
              {consolidatedFAQs.map((category) => (
                <option key={category.category} value={category.category}>
                  {category.category}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4 pointer-events-none" />
          </div>
        </div>
        {(searchTerm || selectedCategory) && (
          <div className="text-center text-white/60 mt-3">
            {selectedCategory && <span>Category: {selectedCategory}</span>}
            {searchTerm && selectedCategory && <span> • </span>}
            {searchTerm && <span>Search: "{searchTerm}"</span>}
            <span> • Found {filteredFAQs.reduce((acc, cat) => acc + cat.faqs.length, 0)} results</span>
          </div>
        )}
      </div>

      {/* Quick Navigation */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Quick Navigation</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className="p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:border-primary-400 hover:bg-white/15 transition-all no-underline group"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className={`p-2 rounded-lg ${link.color}`}>
                  <link.icon className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-white mb-0 group-hover:text-primary-300 transition-colors">
                  {link.title}
                </h3>
              </div>
              <p className="text-sm text-white/70 mb-0">{link.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Category Quick Links */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Browse by Category</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {consolidatedFAQs.map((category, index) => {
            const CategoryIcon = categoryIcons[category.category] || HelpCircle
            return (
              <button
                key={index}
                onClick={() => {
                  setSelectedCategory(category.category)
                  const element = document.getElementById(`category-${index}`)
                  element?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="text-left p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:border-primary-300 hover:bg-white/15 transition-all"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`p-2 rounded-lg ${categoryColors[category.category] || 'bg-gray-500'}`}>
                    <CategoryIcon className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-medium text-white text-sm">{category.category}</p>
                </div>
                <p className="text-xs text-white/60">{category.faqs.length} questions</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* FAQ Categories */}
      <div className="space-y-8">
        {filteredFAQs.map((category, categoryIndex) => {
          const CategoryIcon = categoryIcons[category.category] || HelpCircle
          return (
            <div key={categoryIndex} id={`category-${categoryIndex}`} className="scroll-mt-24">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(categoryIndex)}
                className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-primary-500/10 to-primary-600/10 backdrop-blur-md border border-primary-400/30 rounded-lg hover:border-primary-400/50 transition-all mb-4"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${categoryColors[category.category] || 'bg-gray-500'}`}>
                    <CategoryIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-2xl font-bold text-white mb-0">{category.category}</h2>
                    <p className="text-white/60 text-sm">{category.faqs.length} questions</p>
                  </div>
                </div>
                {openCategories.has(categoryIndex) ? (
                  <ChevronUp className="w-6 h-6 text-white/60" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-white/60" />
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
                            <p className="text-white/80 mb-4">{faq.answer}</p>
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <span className="text-white/60">Related:</span>
                              <Link href="/getting-started" className="text-primary-300 hover:text-primary-200 underline">
                                Getting Started
                              </Link>
                              <Link href="/troubleshooting" className="text-primary-300 hover:text-primary-200 underline">
                                Troubleshooting
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* No Results Message */}
      {filteredFAQs.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No FAQs Found</h3>
          <p className="text-white/60 mb-4">
            We couldn't find any FAQs matching your search. Try different keywords or browse all categories.
          </p>
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedCategory(null)
            }}
            className="text-primary-300 hover:text-primary-200 underline"
          >
            Clear filters and show all FAQs
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="mt-16 p-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-md border border-white/20 rounded-xl">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">FAQ Coverage</h2>
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
            <p className="text-white/70 mt-1">Feature Coverage</p>
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
            href="/faq-comprehensive"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium no-underline"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Alternative FAQ View</span>
          </Link>
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

        <Link href="/troubleshooting" className="block p-4 border border-white/20 rounded-lg hover:border-primary-400 transition-colors no-underline">
          <h4 className="font-semibold text-white mb-2">Troubleshooting Guide</h4>
          <p className="text-sm text-white/70 mb-0">Find solutions to common issues and technical problems.</p>
        </Link>
      </div>
    </>
  )
}
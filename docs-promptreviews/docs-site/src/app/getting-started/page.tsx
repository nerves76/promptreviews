import type { Metadata } from 'next'
import Link from 'next/link'
import { 
  CheckCircle, 
  Star, 
  Users, 
  Zap, 
  ArrowRight, 
  Clock,
  AlertCircle 
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Getting Started with Prompt Reviews - Complete Setup Guide',
  description: 'Learn how to set up your Prompt Reviews account, create your first prompt page, and start collecting customer reviews with Prompty AI assistant in under 30 minutes.',
  keywords: [
    'Prompt Reviews setup',
    'getting started guide',
    'review collection tutorial',
    'Prompty AI assistant',
    'customer review automation',
    'business profile setup'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/getting-started',
  },
}

// JSON-LD structured data
const pageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Getting Started with Prompt Reviews',
  description: 'Complete guide to setting up Prompt Reviews and collecting your first customer reviews',
  image: 'https://docs.promptreviews.com/images/getting-started-hero.jpg',
  estimatedCost: {
    '@type': 'MonetaryAmount',
    currency: 'USD',
    value: '15.00',
  },
  supply: [
    {
      '@type': 'HowToSupply',
      name: 'Prompt Reviews Account',
    },
    {
      '@type': 'HowToSupply',
      name: 'Business Information',
    },
    {
      '@type': 'HowToSupply',
      name: 'Customer Contact List',
    },
  ],
  tool: [
    {
      '@type': 'HowToTool',
      name: 'Prompty AI Assistant',
    },
  ],
  step: [
    {
      '@type': 'HowToStep',
      name: 'Account Setup & Business Profile',
      text: 'Create your Prompt Reviews account and complete your business profile information',
      url: 'https://docs.promptreviews.com/getting-started/account-setup',
    },
    {
      '@type': 'HowToStep',
      name: 'Choose Your Plan',
      text: 'Select the right subscription plan for your business needs',
      url: 'https://docs.promptreviews.com/getting-started/choosing-plan',
    },
    {
      '@type': 'HowToStep',
      name: 'Create First Prompt Page',
      text: 'Build your first personalized review request page with Prompty AI assistance',
      url: 'https://docs.promptreviews.com/getting-started/first-prompt-page',
    },
  ],
}

const steps = [
  {
    title: 'Account Setup & Business Profile',
    description: 'Create your account and complete your business information to get started with Prompt Reviews.',
    href: '/getting-started/account-setup',
    time: '5 minutes',
    difficulty: 'Easy',
    completed: false,
  },
  {
    title: 'Choose Your Plan',
    description: 'Select the subscription plan that best fits your business size and review collection needs.',
    href: '/getting-started/choosing-plan',
    time: '3 minutes',
    difficulty: 'Easy',
    completed: false,
  },
  {
    title: 'Create Your First Prompt Page',
    description: 'Build a personalized review request page using Prompty AI to generate optimized content.',
    href: '/getting-started/first-prompt-page',
    time: '10 minutes',
    difficulty: 'Easy',
    completed: false,
  },
  {
    title: 'Add Your First Contacts',
    description: 'Import your customer database or manually add contacts to start sending review requests.',
    href: '/getting-started/adding-contacts',
    time: '8 minutes',
    difficulty: 'Easy',
    completed: false,
  },
  {
    title: 'Send Your First Review Request',
    description: 'Learn how to send personalized review requests via email, SMS, or QR code.',
    href: '/getting-started/first-review-request',
    time: '5 minutes',
    difficulty: 'Easy',
    completed: false,
  },
  {
    title: 'Set Up Your Review Widget',
    description: 'Display your best reviews on your website with customizable review widgets.',
    href: '/getting-started/review-widget',
    time: '7 minutes',
    difficulty: 'Medium',
    completed: false,
  },
]

const tips = [
  {
    icon: Star,
    title: 'Meet Prompty',
    description: 'Your AI assistant helps generate personalized review requests and optimize your prompt pages for better response rates.',
  },
  {
    icon: Zap,
    title: 'Quick Setup',
    description: 'Most businesses are collecting their first reviews within 30 minutes of signing up.',
  },
  {
    icon: Users,
    title: 'Import Existing Contacts',
    description: 'Upload your customer list via CSV to quickly start requesting reviews from existing customers.',
  },
]

export default function GettingStartedPage() {
  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }}
      />

      <div className="prose-docs">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-gray-700">Documentation</Link>
          <span>/</span>
          <span className="text-gray-900">Getting Started</span>
        </nav>

        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
            <CheckCircle className="w-4 h-4" />
            <span>Quick Start Guide</span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Getting Started with Prompt Reviews
          </h1>

          <p className="text-xl text-gray-600 mb-6">
            Welcome to Prompt Reviews! This guide will help you set up your account and start collecting 
            customer reviews with <strong>Prompty</strong>, your AI-powered review assistant, in under 30 minutes.
          </p>

          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>~30 minutes total</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>All plan levels</span>
            </div>
          </div>
        </div>

        {/* What You'll Learn */}
        <div className="callout info">
          <h3 className="text-lg font-semibold mb-3">What You'll Learn</h3>
          <ul className="space-y-2 mb-0">
            <li>How to set up your business profile and choose the right plan</li>
            <li>Creating personalized prompt pages with Prompty AI assistance</li>
            <li>Importing and managing your customer contacts</li>
            <li>Sending your first review requests via multiple channels</li>
            <li>Embedding review widgets on your website</li>
          </ul>
        </div>

        {/* Prerequisites */}
        <div className="callout warning">
          <h3 className="text-lg font-semibold mb-3">Before You Begin</h3>
          <ul className="space-y-1 mb-0">
            <li>Have your business information ready (name, address, phone, website)</li>
            <li>Prepare a customer contact list (optional, but recommended)</li>
            <li>Consider which review platforms you want to focus on (Google, Yelp, Facebook, etc.)</li>
          </ul>
        </div>

        {/* Step-by-Step Guide */}
        <h2>Step-by-Step Setup Process</h2>
        
        <div className="grid gap-6 mb-12">
          {steps.map((step, index) => (
            <Link
              key={step.title}
              href={step.href}
              className="group block p-6 bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all no-underline"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-0">
                      {step.title}
                    </h3>
                    <ArrowRight className="w-5 h-5 text-primary-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                  
                  <p className="text-gray-600 mb-3">
                    {step.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1 text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{step.time}</span>
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      step.difficulty === 'Easy' 
                        ? 'bg-green-100 text-green-700'
                        : step.difficulty === 'Medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {step.difficulty}
                    </div>
                    {step.completed && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Tips & Best Practices */}
        <h2>Tips for Success</h2>
        
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {tips.map((tip) => (
            <div key={tip.title} className="p-6 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <tip.icon className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-0">{tip.title}</h3>
              </div>
              <p className="text-gray-600 text-sm mb-0">{tip.description}</p>
            </div>
          ))}
        </div>

        {/* Screenshot Placeholder */}
        <h2>Prompt Reviews Dashboard Overview</h2>
        
        <div className="screenshot-placeholder mb-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-600 mb-2">Screenshot Coming Soon</p>
            <p className="text-sm text-gray-500">
              Dashboard overview showing main navigation, prompt pages, and review statistics
            </p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="callout success">
          <h3 className="text-lg font-semibold mb-3">Ready to Get Started?</h3>
          <p className="mb-4">
            Follow the step-by-step guide above, or jump straight into account setup if you're ready to begin.
          </p>
          <Link
            href="/getting-started/account-setup"
            className="inline-flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium no-underline"
          >
            <span>Start Account Setup</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Related Articles */}
        <h2>Related Articles</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/prompt-pages/types" className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors no-underline">
            <h4 className="font-semibold text-gray-900 mb-2">Understanding Prompt Page Types</h4>
            <p className="text-sm text-gray-600 mb-0">Learn about the different types of review request pages you can create.</p>
          </Link>
          
          <Link href="/troubleshooting/common-issues" className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors no-underline">
            <h4 className="font-semibold text-gray-900 mb-2">Common Setup Issues</h4>
            <p className="text-sm text-gray-600 mb-0">Troubleshoot common problems during the initial setup process.</p>
          </Link>
        </div>
      </div>
    </>
  )
}
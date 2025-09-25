import type { Metadata } from 'next'
import StandardOverviewLayout from '../../components/StandardOverviewLayout'
import { pageFAQs } from '../utils/faqData'
import {
  CheckCircle,
  Star,
  Users,
  Zap,
  Clock,
  Settings,
  MessageCircle,
  Globe,
  Target,
  Sparkles
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Getting Started with Prompt Reviews - Complete Setup Guide',
  description: 'Learn how to set up your Prompt Reviews account, create your first prompt page, and start collecting customer reviews in under 30 minutes.',
  keywords: [
    'Prompt Reviews setup',
    'getting started guide',
    'review collection tutorial',
    'Prompt Reviews mascot',
    'customer review automation',
    'business profile setup'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.app/getting-started',
  },
}


const keyFeatures = [
  {
    icon: CheckCircle,
    title: 'Quick Setup Process',
    description: 'Get your account set up and collecting reviews in under 30 minutes with our streamlined onboarding process.'
  },
  {
    icon: Settings,
    title: 'Business Profile Configuration',
    description: 'Complete your business information to unlock all features and personalize your review requests.'
  },
  {
    icon: MessageCircle,
    title: 'First Prompt Page Creation',
    description: 'Create your first personalized review request page with AI-powered content generation.'
  },
  {
    icon: Users,
    title: 'Contact Management Setup',
    description: 'Import your existing customer database or manually add contacts to start requesting reviews.'
  },
  {
    icon: Star,
    title: 'Review Collection Launch',
    description: 'Send your first review requests and start collecting authentic customer feedback immediately.'
  },
  {
    icon: Globe,
    title: 'Website Integration',
    description: 'Embed review widgets on your website to showcase positive reviews and build trust.'
  }
]

const howItWorks = [
  {
    number: 1,
    title: 'Create Your Account',
    description: 'Sign up for Prompt Reviews and complete your business profile information including name, address, and contact details.',
    icon: Settings
  },
  {
    number: 2,
    title: 'Choose Your Plan',
    description: 'Select the subscription plan that best fits your business needs and review collection goals.',
    icon: Target
  },
  {
    number: 3,
    title: 'Build Your First Prompt Page',
    description: 'Create a personalized review request page using our AI-powered content generation tools.',
    icon: MessageCircle
  },
  {
    number: 4,
    title: 'Add Contacts & Start Collecting',
    description: 'Import your customers and send your first review requests via email, SMS, or QR codes.',
    icon: Users
  }
]

const bestPractices = [
  {
    icon: Clock,
    title: 'Start with Recent Customers',
    description: 'Focus on customers who recently had positive experiences. They\'re more likely to leave glowing reviews and remember details clearly.'
  },
  {
    icon: Sparkles,
    title: 'Use AI Content Generation',
    description: 'Take advantage of AI-powered content creation to personalize your review requests and improve response rates.'
  },
  {
    icon: Target,
    title: 'Test Different Approaches',
    description: 'Try various prompt page types and messaging strategies to see what works best for your business and customers.'
  },
  {
    icon: Zap,
    title: 'Keep It Simple',
    description: 'Make the review process as easy as possible. The fewer clicks and steps required, the more reviews you\'ll collect.'
  }
]


export default function GettingStartedPage() {
  return (
    <StandardOverviewLayout
      title="Getting started with Prompt Reviews"
      description="Welcome to Prompt Reviews! This comprehensive guide will help you set up your account and start collecting customer reviews in under 30 minutes."
      categoryLabel="Quick Start Guide"
      categoryIcon={CheckCircle}
      categoryColor="green"
      currentPage="Getting Started"
      availablePlans={['grower', 'builder', 'maven']}
      keyFeatures={keyFeatures}
      howItWorks={howItWorks}
      bestPractices={bestPractices}
      faqs={pageFAQs['getting-started']}
      callToAction={{
        secondary: {
          text: 'View Setup Guides',
          href: '/getting-started/account-setup'
        },
        primary: {
          text: 'Start Free Trial',
          href: 'https://promptreviews.app/signup',
          external: true
        }
      }}
      overview={{
        title: 'Everything You Need to Get Started',
        content: (
          <>
            <p className="text-white/90 text-lg mb-6 text-center">
              Most businesses are fully set up and collecting their first reviews within 30 minutes.
              Our streamlined onboarding process makes it easy to get started, even if you've never
              used a review collection platform before.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">30 Minutes Total</h3>
                <p className="text-white/80 text-sm">
                  Complete setup from account creation to first review request
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">AI-Powered</h3>
                <p className="text-white/80 text-sm">
                  Let AI help you create personalized content and optimize requests
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">All Skill Levels</h3>
                <p className="text-white/80 text-sm">
                  No technical skills required - intuitive interface for everyone
                </p>
              </div>
            </div>
          </>
        )
      }}
    />
  )
}
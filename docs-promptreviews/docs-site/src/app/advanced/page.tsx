import type { Metadata } from 'next'
import StandardOverviewLayout from '../../components/StandardOverviewLayout'
import { pageFAQs } from '../utils/faqData'
import {
  BarChart3,
  Zap,
  Settings,
  Globe,
  Clock,
  CheckCircle,
  TrendingUp,
  Target,
  Brain,
  Code,
  Webhook,
  Database
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Advanced Features - Analytics, Automation & API | Prompt Reviews Help',
  description: 'Explore advanced features in Prompt Reviews including analytics, automation, API access, and custom integrations.',
  keywords: [
    'advanced features',
    'analytics',
    'automation',
    'API access',
    'custom integrations',
    'webhooks'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.app/advanced',
  },
}

const keyFeatures = [
  {
    icon: BarChart3,
    title: 'Advanced Analytics Dashboard',
    description: 'Deep insights into review performance, customer sentiment, response rates, and platform distribution with exportable reports.'
  },
  {
    icon: Clock,
    title: 'Automated Campaigns',
    description: 'Set up scheduled review request campaigns based on triggers like service completion or time intervals.'
  },
  {
    icon: Code,
    title: 'REST API Access',
    description: 'Full API access for custom integrations with your existing tools and workflows, including prompt page management.'
  },
  {
    icon: Webhook,
    title: 'Real-Time Webhooks',
    description: 'Get instant notifications when important events occur - new reviews, responses, contacts added, and campaigns completed.'
  },
  {
    icon: Brain,
    title: 'AI-Powered Optimization',
    description: 'Let AI analyze your data to optimize request timing, messaging, and customer targeting for maximum response rates.'
  },
  {
    icon: Globe,
    title: 'White Label & Custom Domains',
    description: 'Use your own domain for prompt pages and widgets, plus remove Prompt Reviews branding on premium plans.'
  }
]

const howItWorks = [
  {
    number: 1,
    title: 'Access Advanced Tools',
    description: 'Upgrade to Builder or Maven plans to unlock analytics, automation, and API access.',
    icon: Settings
  },
  {
    number: 2,
    title: 'Set Up Automation',
    description: 'Create automated workflows and campaigns based on customer behavior and business triggers.',
    icon: Zap
  },
  {
    number: 3,
    title: 'Integrate Your Systems',
    description: 'Use our REST API and webhooks to connect Prompt Reviews with your existing business tools.',
    icon: Database
  },
  {
    number: 4,
    title: 'Analyze and Optimize',
    description: 'Use advanced analytics to understand performance and let AI optimize your review collection strategy.',
    icon: TrendingUp
  }
]

const bestPractices = [
  {
    icon: Target,
    title: 'Start with Analytics',
    description: 'Before automating, understand your current performance. Use analytics to identify which prompt pages and strategies work best for your business.'
  },
  {
    icon: Zap,
    title: 'Automate Gradually',
    description: 'Begin with simple automation like scheduled follow-ups, then expand to complex workflows as you learn what works for your customers.'
  },
  {
    icon: CheckCircle,
    title: 'Monitor API Usage',
    description: 'Keep track of your API rate limits and webhook reliability. Set up proper error handling and monitoring for production integrations.'
  },
  {
    icon: Globe,
    title: 'Leverage White Labeling',
    description: 'For agencies and enterprise users, white labeling creates a seamless brand experience that builds trust with your customers.'
  }
]

// Note: Advanced features FAQs are not specifically defined in faqData.ts
// Using general FAQs for now, but we should add specific advanced features FAQs
const advancedFAQs = [
  {
    question: 'What analytics can I track in Prompt Reviews?',
    answer: 'Track review volume, average ratings, response rates, prompt page conversion rates, platform distribution, sentiment trends, and more. Analytics help you understand what\'s working and optimize your strategy.'
  },
  {
    question: 'How do I get started with the API?',
    answer: 'Generate API keys in your dashboard under Settings > API Keys. Make a test request to /api/auth/me to verify authentication, then explore our full API documentation.'
  },
  {
    question: 'Can I customize the branding on my prompt pages?',
    answer: 'Yes! Premium plans include white labeling options where you can remove Prompt Reviews branding and use your own custom domain for a seamless brand experience.'
  },
  {
    question: 'How do webhooks work?',
    answer: 'Webhooks send HTTP POST requests to your specified URL when events occur (new review, review response, etc.). Your endpoint should return a 200 status code to acknowledge receipt.'
  },
  {
    question: 'What automation features are available?',
    answer: 'Set up scheduled campaigns, smart follow-ups for non-responders, AI-powered optimization for timing and messaging, and conditional logic workflows based on customer behavior.'
  }
]

export default function AdvancedPage() {
  return (
    <StandardOverviewLayout
      title="Advanced features & analytics"
      description="Take your review management to the next level with analytics, automation, API access, and custom integrations."
      categoryLabel="Advanced Features"
      categoryIcon={BarChart3}
      categoryColor="pink"
      currentPage="Advanced Features"
      availablePlans={['builder', 'maven']}
      keyFeatures={keyFeatures}
      howItWorks={howItWorks}
      bestPractices={bestPractices}
      faqs={advancedFAQs}
      callToAction={{
        primary: {
          text: 'View Troubleshooting',
          href: '/troubleshooting'
        }
      }}
      overview={{
        title: 'Power User Features',
        content: (
          <>
            <p className="text-white/90 text-lg mb-6 text-center">
              Unlock the full potential of review management with advanced analytics,
              automation, API access, and enterprise-grade customization options.
              Perfect for growing businesses and agencies.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">Deep Analytics</h3>
                <p className="text-white/80 text-sm">
                  Comprehensive insights into performance and customer behavior
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">Smart Automation</h3>
                <p className="text-white/80 text-sm">
                  AI-powered workflows that optimize timing and messaging
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Code className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">API Integration</h3>
                <p className="text-white/80 text-sm">
                  Connect with your existing tools and build custom workflows
                </p>
              </div>
            </div>
          </>
        )
      }}
    />
  )
}
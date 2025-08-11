import type { Metadata } from 'next'
import Link from 'next/link'
import DocsLayout from '../docs-layout'
import PageHeader from '../components/PageHeader'
import { 
  Sparkles, 
  Star, 
  MessageSquare, 
  Zap, 
  ArrowRight, 
  Brain,
  Target,
  Users,
  CheckCircle,
  Lightbulb,
  TrendingUp,
  Shield,
  Clock,
  Heart
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI-Powered Review Collection | Prompt Reviews',
  description: 'Discover how AI-powered content generation helps create personalized review requests, optimizes your prompt pages, and makes review collection feel human and authentic.',
  keywords: [
    'AI review generation',
    'AI-powered content',
    'personalized review requests',
    'review automation',
    'customer review AI',
    'review collection automation'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/ai-reviews',
  },
}

// JSON-LD structured data
const pageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AI-Powered Review System',
  description: 'AI-powered system that helps create personalized review requests and optimize review collection',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web Browser',
  url: 'https://promptreviews.com',
  author: {
    '@type': 'Organization',
    name: 'Prompt Reviews',
  },
  featureList: [
    'Personalized review request generation',
    'Prompt page optimization',
    'Customer sentiment analysis',
    'Review response rate optimization'
  ],
}

const features = [
  {
    icon: Brain,
    title: 'Smart Personalization',
    description: 'Our AI analyzes your business, customers, and context to create review requests that feel genuinely personal.',
    benefit: 'Higher response rates from authentic, human-sounding requests'
  },
  {
    icon: Target,
    title: 'Context-Aware Content',
    description: 'Creates different messages for different situations - whether it\'s a service completion, product purchase, or event attendance.',
    benefit: 'Relevant messaging that resonates with each customer\'s experience'
  },
  {
    icon: TrendingUp,
    title: 'Performance Optimization',
    description: 'Learns from your results and continuously improves your review request strategies.',
    benefit: 'Better results over time as the AI adapts to your business'
  },
  {
    icon: Shield,
    title: 'Human-First Approach',
    description: 'Designed to enhance human connection, not replace it. Our AI helps you be more personal, not less.',
    benefit: 'Authentic relationships while scaling your review collection'
  }
]

const howItWorks = [
  {
    step: 1,
    title: 'Understand Your Business',
    description: 'Prompty learns about your business type, services, customer base, and review goals.',
    icon: Users
  },
  {
    step: 2,
    title: 'Analyze Customer Context',
    description: 'Considers the customer\'s experience, relationship with your business, and what they\'re most likely to review.',
    icon: Target
  },
  {
    step: 3,
    title: 'Generate Personalized Content',
    description: 'Creates review requests that feel personal, relevant, and authentic to each customer.',
    icon: MessageSquare
  },
  {
    step: 4,
    title: 'Optimize for Results',
    description: 'Tracks performance and adjusts strategies to improve your review collection success.',
    icon: TrendingUp
  }
]

const bestPractices = [
  {
    icon: Heart,
    title: 'Keep It Personal',
    description: 'Use Prompty to enhance your personal touch, not replace it. Add your own voice and specific details.',
    tip: 'Review and customize Prompty\'s suggestions before sending'
  },
  {
    icon: Clock,
    title: 'Timing Matters',
    description: 'Send review requests when the experience is fresh but not overwhelming. Prompty helps you find the sweet spot.',
    tip: 'Consider your customer\'s journey and when they\'re most likely to respond'
  },
  {
    icon: Star,
    title: 'Focus on Happy Customers',
    description: 'Prompty works best when targeting customers who had positive experiences. Quality over quantity.',
    tip: 'Use your CRM data to identify satisfied customers first'
  },
  {
    icon: Zap,
    title: 'Test and Iterate',
    description: 'Try different approaches and let Prompty learn what works best for your specific business and customers.',
    tip: 'Start with a small group and expand based on results'
  }
]

export default function AIReviewsPage() {
  return (
    <DocsLayout>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }}
      />

      <div className="prose-docs">
        {/* Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' }
          ]}
          currentPage="AI Reviews"
          categoryLabel="AI Features"
          categoryIcon={Sparkles}
          categoryColor="purple"
          title="AI-Powered Review Collection"
          description="Our AI-powered system helps you create personalized, human-sounding review requests that actually work—without losing the personal touch that makes your business special."
        />

        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center space-x-6 text-sm text-white/70">
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span>AI-powered personalization</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Human-first approach</span>
            </div>
          </div>
        </div>

        {/* What is AI-Powered Review Collection */}
        <div className="callout info">
          <h3 className="text-lg font-semibold mb-3">What Makes Our AI Different?</h3>
          <p className="mb-3">
            Unlike generic AI tools, our system is specifically designed for review collection. It understands that 
            the best reviews come from genuine customer relationships, not robotic automation.
          </p>
          <p className="mb-0">
            <strong>Our AI helps you be more human, not less.</strong> It takes the guesswork out of creating 
            personalized review requests while preserving the authentic voice that makes your business unique.
          </p>
        </div>

        {/* Features Grid */}
        <h2>How AI-Powered Review Collection Works</h2>
        
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {features.map((feature) => (
            <div key={feature.title} className="p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <feature.icon className="w-5 h-5 text-purple-300" />
                </div>
                <h3 className="font-semibold text-white mb-0">{feature.title}</h3>
              </div>
              <p className="text-white/70 mb-3">{feature.description}</p>
              <div className="text-sm text-purple-300 font-medium">
                💡 {feature.benefit}
              </div>
            </div>
          ))}
        </div>

        {/* How It Works Process */}
        <h2>The AI-Powered Process</h2>
        
        <div className="grid gap-6 mb-12">
          {howItWorks.map((step) => (
            <div key={step.step} className="flex items-start space-x-4 p-6 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 text-purple-300 rounded-full flex items-center justify-center font-bold text-sm">
                {step.step}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <step.icon className="w-5 h-5 text-purple-300" />
                  <h3 className="text-lg font-semibold text-white mb-0">{step.title}</h3>
                </div>
                <p className="text-white/70 mb-0">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Example Section */}
        <h2>See AI-Powered Reviews in Action</h2>
        
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 bg-yellow-500/20 border border-yellow-400/30 rounded-lg">
            <h4 className="font-semibold text-white mb-3">Before Prompty</h4>
            <blockquote className="text-white/70 italic mb-4">
              "Hi! Please leave us a review on Google. Thanks!"
            </blockquote>
            <p className="text-sm text-white/60 mb-0">
              Generic, impersonal, low response rate
            </p>
          </div>
          
          <div className="p-6 bg-green-500/20 border border-green-400/30 rounded-lg">
            <h4 className="font-semibold text-white mb-3">With Prompty</h4>
            <blockquote className="text-white/70 italic mb-4">
              "Hi Sarah! We loved helping you transform your kitchen last month. The before-and-after photos 
              you shared with us were incredible. Would you mind sharing your experience on Google? Your 
              review would help other homeowners discover what's possible with a kitchen renovation."
            </blockquote>
            <p className="text-sm text-white/60 mb-0">
              Personal, specific, much higher response rate
            </p>
          </div>
        </div>

        {/* Best Practices */}
        <h2>Getting the Most from Prompty</h2>
        
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {bestPractices.map((practice) => (
            <div key={practice.title} className="p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <practice.icon className="w-5 h-5 text-blue-300" />
                </div>
                <h3 className="font-semibold text-white mb-0">{practice.title}</h3>
              </div>
              <p className="text-white/70 mb-3">{practice.description}</p>
              <div className="text-sm text-blue-300 font-medium">
                💡 {practice.tip}
              </div>
            </div>
          ))}
        </div>

        {/* Privacy & Ethics */}
        <h2>Privacy & Ethics</h2>
        
        <div className="callout success">
          <h3 className="text-lg font-semibold mb-3">Your Data Stays Yours</h3>
          <p className="mb-3">
            Prompty is designed with privacy and ethics in mind. We believe AI should enhance human relationships, 
            not exploit them.
          </p>
          <ul className="space-y-1 mb-0">
            <li>• Prompty never stores or shares your customer data</li>
            <li>• All AI processing happens securely on our servers</li>
            <li>• You always review and approve content before sending</li>
            <li>• Prompty follows ethical AI guidelines and best practices</li>
          </ul>
        </div>

        {/* Getting Started */}
        <div className="callout info">
          <h3 className="text-lg font-semibold mb-3">Ready to Meet Prompty?</h3>
          <p className="mb-4">
            Prompty is included with every Prompt Reviews plan. Start creating personalized review requests 
            that actually work.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/getting-started"
              className="inline-flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium no-underline"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/prompt-pages"
              className="inline-flex items-center space-x-2 border border-purple-400 text-purple-300 px-4 py-2 rounded-lg hover:bg-white/10/20 transition-colors font-medium no-underline"
            >
              <span>Learn About Prompt Pages</span>
            </Link>
          </div>
        </div>

        {/* Related Articles */}
        <h2>Related Articles</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/prompt-pages" className="block p-4 border border-white/20 rounded-lg hover:border-purple-400 transition-colors no-underline">
            <h4 className="font-semibold text-white mb-2">Creating Prompt Pages</h4>
            <p className="text-sm text-white/70 mb-0">Learn how to create personalized review request pages with Prompty's help.</p>
          </Link>
          
          <Link href="/getting-started" className="block p-4 border border-white/20 rounded-lg hover:border-purple-400 transition-colors no-underline">
            <h4 className="font-semibold text-white mb-2">Getting Started Guide</h4>
            <p className="text-sm text-white/70 mb-0">Set up your account and start using Prompty in under 30 minutes.</p>
          </Link>
        </div>
      </div>
    </DocsLayout>
  )
}
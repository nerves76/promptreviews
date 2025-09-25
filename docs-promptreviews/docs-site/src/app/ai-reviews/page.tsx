import type { Metadata } from 'next'
import StandardOverviewLayout from '../../components/StandardOverviewLayout'
import { pageFAQs } from '../utils/faqData'
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
  Heart,
  Wand2,
  Edit3
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
    canonical: 'https://docs.promptreviews.app/ai-reviews',
  },
}


const keyFeatures = [
  {
    icon: Brain,
    title: 'Smart Personalization',
    description: 'AI analyzes your business, customers, and context to create review requests that feel genuinely personal and human.'
  },
  {
    icon: Target,
    title: 'Context-Aware Content',
    description: 'Creates different messages for different situations - service completion, product purchase, or event attendance.'
  },
  {
    icon: Wand2,
    title: 'Review Writing Assistance',
    description: 'Helps customers express their thoughts better with AI-powered suggestions while keeping reviews authentic.'
  },
  {
    icon: TrendingUp,
    title: 'Performance Optimization',
    description: 'Learns from your results and continuously improves your review request strategies over time.'
  },
  {
    icon: Shield,
    title: 'Ethical AI Approach',
    description: 'Designed to enhance human connection, not replace it. Helps you be more personal while staying authentic.'
  },
  {
    icon: Edit3,
    title: 'Grammar & Style Enhancement',
    description: 'AI can polish grammar and improve clarity while preserving the customer\'s authentic voice and message.'
  }
]

const howItWorks = [
  {
    number: 1,
    title: 'Understand Your Business',
    description: 'AI learns about your business type, services, customer base, and review goals to provide relevant suggestions.',
    icon: Users
  },
  {
    number: 2,
    title: 'Analyze Customer Context',
    description: 'Considers the customer\'s experience, relationship with your business, and what they\'re most likely to review.',
    icon: Target
  },
  {
    number: 3,
    title: 'Generate Personalized Content',
    description: 'Creates review requests that feel personal, relevant, and authentic to each customer situation.',
    icon: MessageSquare
  },
  {
    number: 4,
    title: 'Learn and Improve',
    description: 'Tracks performance and adjusts strategies to continuously improve your review collection success rates.',
    icon: TrendingUp
  }
]

const bestPractices = [
  {
    icon: Heart,
    title: 'Keep It Personal',
    description: 'Use AI to enhance your personal touch, not replace it. Always review and customize AI suggestions to match your voice.'
  },
  {
    icon: Clock,
    title: 'Perfect Your Timing',
    description: 'Send review requests when the experience is fresh but not overwhelming. AI helps identify optimal timing windows.'
  },
  {
    icon: Star,
    title: 'Focus on Quality',
    description: 'Target customers who had positive experiences. AI works best with satisfied customers who are likely to leave good reviews.'
  },
  {
    icon: Zap,
    title: 'Test and Learn',
    description: 'Experiment with different AI-generated approaches and let the system learn what works best for your specific business.'
  }
]

const overviewContent = (
  <>
    <p className="text-white/90 text-lg mb-6 text-center">
      Unlike generic AI tools, our system is specifically designed for review collection. It understands that
      the best reviews come from genuine customer relationships, not robotic automation.
    </p>

    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-6">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-red-500/10 border border-red-400/20 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-3">Before AI</h4>
          <blockquote className="text-white/70 italic mb-2">
            "Hi! Please leave us a review on Google. Thanks!"
          </blockquote>
          <p className="text-sm text-red-300">Generic, impersonal, low response rate</p>
        </div>

        <div className="bg-green-500/10 border border-green-400/20 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-3">With AI</h4>
          <blockquote className="text-white/70 italic mb-2">
            "Hi Sarah! We loved helping you transform your kitchen last month. Would you mind sharing your experience on Google?"
          </blockquote>
          <p className="text-sm text-green-300">Personal, specific, higher response rate</p>
        </div>
      </div>
    </div>
  </>
);

export default function AIReviewsPage() {
  return (
    <StandardOverviewLayout
      title="AI-powered review collection"
      description="Our AI-powered system helps you create personalized, human-sounding review requests that actually work—without losing the personal touch that makes your business special."
      categoryLabel="AI Features"
      categoryIcon={Sparkles}
      categoryColor="purple"
      currentPage="AI Reviews"
      availablePlans={['grower', 'builder', 'maven']}
      keyFeatures={keyFeatures}
      howItWorks={howItWorks}
      bestPractices={bestPractices}
      faqs={pageFAQs['ai-reviews']}
      callToAction={{
        secondary: {
          text: 'Learn About Prompt Pages',
          href: '/prompt-pages'
        },
        primary: {
          text: 'Try AI Features',
          href: 'https://promptreviews.app/dashboard',
          external: true
        }
      }}
      overview={{
        title: 'What Makes Our AI Different?',
        content: overviewContent
      }}
    />
  )
}
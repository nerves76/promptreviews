import type { Metadata } from 'next'
import StandardOverviewLayout from '../../components/StandardOverviewLayout'
import { pageFAQs } from '../utils/faqData'
import {
  Target,
  Lightbulb,
  Users,
  Heart,
  Zap,
  Star,
  MessageCircle,
  TrendingUp,
  Sparkles,
  Clock,
  CheckCircle,
  Brain
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'How to Get More Customer Reviews: 6 Proven Strategies That Work',
  description: 'Increase your customer reviews by 300% with these 6 proven strategies. Learn the psychology, timing, and techniques that actually work for review collection.',
  keywords: [
    'how to get more customer reviews',
    'increase customer reviews',
    'customer review strategies',
    'review collection techniques',
    'get more reviews',
    'customer review psychology',
    'review marketing strategies',
    '300% increase reviews'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.app/strategies',
  },
}


const keyFeatures = [
  {
    icon: Target,
    title: 'The Double-Dip Strategy',
    description: 'Import existing Google reviews and turn them into prompt pages to collect reviews on other platforms - increasing reviews by 300%.',
    href: '/strategies/double-dip'
  },
  {
    icon: Heart,
    title: 'Psychology of Reciprocity',
    description: 'Use proven psychological principles to increase review response rates after providing exceptional value to customers.',
    href: '/strategies/reciprocity'
  },
  {
    icon: Users,
    title: 'Personal Outreach Mastery',
    description: 'Why one-on-one connections are more effective than mass requests for building lasting customer relationships.',
    href: '/strategies/personal-outreach'
  },
  {
    icon: Lightbulb,
    title: 'Smart Non-AI Techniques',
    description: 'Use kickstarters, recent reviews, and personalized templates to help customers write detailed, authentic reviews.',
    href: '/strategies/non-ai-strategies'
  },
  {
    icon: Sparkles,
    title: 'AI Novelty Factor',
    description: 'Leverage the unique experience of AI-powered review writing to create delightful customer interactions.',
    href: '/strategies/novelty'
  },
  {
    icon: Zap,
    title: 'Reviews on the Fly',
    description: 'Collect reviews in-person by highlighting the speed and ease of your review process with QR codes and mobile optimization.',
    href: '/strategies/reviews-on-fly'
  }
]

const howItWorks = [
  {
    number: 1,
    title: 'Choose Your Strategy',
    description: 'Select the approach that best fits your business model, customer relationships, and review collection goals.',
    icon: Target
  },
  {
    number: 2,
    title: 'Understand the Psychology',
    description: 'Learn why each strategy works by understanding customer psychology, timing, and motivation factors.',
    icon: Brain
  },
  {
    number: 3,
    title: 'Implement the Technique',
    description: 'Follow our step-by-step guides to implement your chosen strategies with proven templates and best practices.',
    icon: CheckCircle
  },
  {
    number: 4,
    title: 'Track and Optimize',
    description: 'Monitor your results and combine multiple strategies to maximize your review collection effectiveness.',
    icon: TrendingUp
  }
]

const bestPractices = [
  {
    icon: Clock,
    title: 'Perfect Your Timing',
    description: 'Ask for reviews when customers are most satisfied—right after a great experience or successful service completion. The "peak-end rule" suggests people remember peaks and endings most vividly.'
  },
  {
    icon: MessageCircle,
    title: 'Make It Personal',
    description: 'Use customer names, reference specific interactions, and show you remember their experience. Personalization can increase response rates by up to 50%.'
  },
  {
    icon: Star,
    title: 'Lower the Barrier',
    description: 'Make the review process as easy as possible. Provide templates, bullet points, or AI assistance. Even simple bullet points can be incredibly valuable.'
  },
  {
    icon: TrendingUp,
    title: 'Follow Up Strategically',
    description: 'Don\'t just ask once. Follow up with different approaches, but always be respectful of their time. Multiple touchpoints can increase response rates by 2-3x.'
  }
]


export default function StrategiesPage() {
  return (
    <StandardOverviewLayout
      title="How to get more customer reviews"
      description="Increase your customer reviews by 300% with these 6 proven strategies. Learn the psychology, timing, and techniques that actually work for review collection."
      categoryLabel="Review Collection"
      categoryIcon={Target}
      categoryColor="blue"
      currentPage="Strategies"
      availablePlans={['grower', 'builder', 'maven']}
      keyFeatures={keyFeatures}
      howItWorks={howItWorks}
      bestPractices={bestPractices}
      faqs={pageFAQs['strategies']}
      callToAction={{
        secondary: {
          text: 'Learn Double-Dip Strategy',
          href: '/strategies/double-dip'
        },
        primary: {
          text: 'Start Collecting Reviews',
          href: 'https://promptreviews.app/dashboard/prompt-pages',
          external: true
        }
      }}
      overview={{
        title: 'Why Strategies Matter',
        content: (
          <>
            <p className="text-white/90 text-lg mb-6 text-center">
              Collecting reviews isn't just about asking—it's about understanding human psychology,
              building genuine connections, and creating experiences that make people want to share their thoughts.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">Increase Reviews by 300%</h3>
                <p className="text-white/80 text-sm">
                  Proven techniques that increase review collection by 3-5x
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">Better Relationships</h3>
                <p className="text-white/80 text-sm">
                  Build trust and loyalty while collecting authentic feedback
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">Quality Reviews</h3>
                <p className="text-white/80 text-sm">
                  Get detailed, helpful reviews that actually benefit your business
                </p>
              </div>
            </div>
          </>
        )
      }}
    />
  )
}

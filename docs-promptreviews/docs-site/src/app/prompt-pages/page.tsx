import { Metadata } from 'next';
import StandardOverviewLayout from '../../components/StandardOverviewLayout'
import { pageFAQs } from '../utils/faqData'
import {
  MessageCircle,
  Star,
  Camera,
  Video,
  Heart,
  Brain,
  QrCode,
  Palette,
  Calendar,
  User,
  Globe,
  Bot,
  Download,
  BarChart3,
  Share2,
  Shield,
  Smartphone,
  Target,
  Zap,
  Lightbulb,
  Sparkles,
  Edit
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Prompt Pages - Create Personalized Review Request Pages | Prompt Reviews Help',
  description: 'Learn how to create and customize prompt pages for collecting customer reviews. From universal pages to service-specific templates.',
  keywords: [
    'prompt pages',
    'review request pages',
    'review collection',
    'customer feedback pages',
    'QR code reviews',
    'personalized review pages'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.app/prompt-pages',
  },
}


const keyFeatures = [
  {
    icon: Heart,
    title: 'Emoji Sentiment Flow',
    description: 'Interactive emoji-based review collection that makes leaving reviews fun and engaging for customers.',
    href: '/prompt-pages/features#emoji-sentiment-flow'
  },
  {
    icon: Bot,
    title: 'AI-Powered Content',
    description: 'AI-powered review generation and optimization to help customers write better reviews.',
    href: '/prompt-pages/features#prompty-ai'
  },
  {
    icon: QrCode,
    title: 'QR Code Generation',
    description: 'Generate QR codes for easy access to your prompt pages from anywhere.',
    href: '/prompt-pages/features#qr-codes'
  },
  {
    icon: Palette,
    title: 'Customization Options',
    description: 'Brand your prompt pages with your business colors, logos, and messaging.',
    href: '/prompt-pages/features#customization'
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description: 'Track performance and gain insights into your review collection efforts.',
    href: '/prompt-pages/features#analytics'
  },
  {
    icon: Share2,
    title: 'Multi-Platform Sharing',
    description: 'Distribute your prompt pages across all your marketing channels.',
    href: '/prompt-pages/features#multi-platform-sharing'
  }
];

const howItWorks = [
  {
    number: 1,
    title: 'Create Your Page',
    description: 'Choose your page type and add details. Include customer names, service info, or any context that makes the review personal.',
    icon: Edit
  },
  {
    number: 2,
    title: 'Share Your Link',
    description: 'Get your unique link, QR code, or NFC tag. Share it however works best—email, text, in-person, or on social media.',
    icon: Share2
  },
  {
    number: 3,
    title: 'Customer Leaves Review',
    description: 'Your customer lands on a beautiful, personalized page. They can write their own review or use AI assistance to help express their thoughts.',
    icon: Star
  },
  {
    number: 4,
    title: 'Track Your Success',
    description: 'Monitor which prompt pages generate the most reviews. See conversion rates, track performance, and optimize your approach.',
    icon: BarChart3
  }
];

const bestPractices = [
  {
    icon: Target,
    title: 'Be Specific and Personal',
    description: 'The more specific your prompt page, the more detailed and helpful the reviews you\'ll receive. Include customer names, specific services, and relevant context.'
  },
  {
    icon: Zap,
    title: 'Make It Easy to Share',
    description: 'Use multiple sharing methods - direct links, QR codes, NFC tags, or email. Meet customers where they are and make leaving reviews effortless.'
  },
  {
    icon: Lightbulb,
    title: 'Test Different Page Types',
    description: 'Experiment with different page types (service, product, photo, video) to see what works best for your business and customer base.'
  },
  {
    icon: BarChart3,
    title: 'Track and Optimize Performance',
    description: 'Monitor which prompt pages perform best and use those insights to optimize your approach. Focus on what drives the most authentic reviews.'
  }
];

const overviewContent = (
  <>
    <p className="text-white/90 text-lg mb-6 text-center">
      Prompt pages are personalized review request pages you create for different situations.
      Each page is designed to make leaving a review as easy as possible while collecting the
      specific feedback you need.
    </p>

    <div className="grid md:grid-cols-3 gap-6">
      <div className="text-center">
        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Target className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-semibold text-white mb-2">Personalized</h3>
        <p className="text-white/80 text-sm">
          Each page is customized for specific customers, services, or situations
        </p>
      </div>

      <div className="text-center">
        <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Smartphone className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-semibold text-white mb-2">Mobile Optimized</h3>
        <p className="text-white/80 text-sm">
          Simple, mobile-friendly design that works perfectly on any device
        </p>
      </div>

      <div className="text-center">
        <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-semibold text-white mb-2">AI-Enhanced</h3>
        <p className="text-white/80 text-sm">
          AI-powered content helps customers write better, more detailed reviews
        </p>
      </div>
    </div>
  </>
);

export default function PromptPagesPage() {
  return (
    <StandardOverviewLayout
      title="Prompt pages: Your review collection superpower"
      description="Create personalized review request pages that make it easy for customers to leave detailed, authentic reviews. Choose from multiple types, customize everything, and watch your reviews grow."
      categoryLabel="Prompt Pages"
      categoryIcon={MessageCircle}
      categoryColor="purple"
      currentPage="Prompt Pages"
      breadcrumbs={[{ label: 'Help', href: '/' }]}
      availablePlans={['grower', 'builder', 'maven']}
      keyFeatures={keyFeatures}
      howItWorks={howItWorks}
      bestPractices={bestPractices}
      faqs={pageFAQs['prompt-pages']}
      callToAction={{
        primary: {
          text: 'Explore Page Types',
          href: '/prompt-pages/types'
        }
      }}
      overview={{
        title: 'What Are Prompt Pages?',
        content: overviewContent
      }}
    />
  )
}
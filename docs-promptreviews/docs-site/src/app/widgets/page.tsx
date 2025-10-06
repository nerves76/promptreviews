import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import StandardOverviewLayout from '../../components/StandardOverviewLayout'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import { pageFAQs } from '../utils/faqData'
import { getArticleBySlug } from '@/lib/docs/articles'
import {
  Code,
  Smartphone,
  Monitor,
  Palette,
  Copy,
  CheckCircle,
  ArrowRight,
  Settings,
  Zap,
  Star,
  Globe,
  Layout,
  Eye,
  Paintbrush,
  Target,
  BarChart3
} from 'lucide-react'
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const fallbackDescription = 'Learn how to create and customize review widgets. Display customer reviews on your website with customizable widgets that match your brand.'

function resolveIcon(iconName: string | undefined, fallback: LucideIcon): LucideIcon {
  if (!iconName) return fallback
  const lookup = Icons as Record<string, unknown>
  const maybeIcon = lookup[iconName]
  if (typeof maybeIcon === 'function') return maybeIcon as LucideIcon
  return fallback
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const article = await getArticleBySlug('widgets')
    if (!article) {
      return {
        title: 'Widgets - Display Reviews on Your Website | Prompt Reviews Help',
        description: fallbackDescription,
        alternates: { canonical: 'https://docs.promptreviews.app/widgets' },
      }
    }

    const seoTitle = article.metadata?.seo_title || article.title
    const seoDescription = article.metadata?.seo_description || article.metadata?.description || fallbackDescription

    return {
      title: `${seoTitle} | Prompt Reviews`,
      description: seoDescription,
      keywords: article.metadata?.keywords ?? ['review widget', 'website integration', 'embed reviews'],
      alternates: { canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/widgets' },
    }
  } catch (error) {
    console.error('generateMetadata widgets error:', error)
    return {
      title: 'Widgets - Display Reviews on Your Website | Prompt Reviews Help',
      description: fallbackDescription,
      alternates: { canonical: 'https://docs.promptreviews.app/widgets' },
    }
  }
}

const keyFeatures = [
  {
    icon: Layout,
    title: 'Multiple Layout Options',
    description: 'Choose from list view, card layout, compact sidebar view, or full-width testimonial style to match your website design.'
  },
  {
    icon: Paintbrush,
    title: 'Complete Customization',
    description: 'Customize colors, fonts, borders, shadows, and star rating colors to perfectly match your brand identity.'
  },
  {
    icon: Settings,
    title: 'Advanced Filtering',
    description: 'Filter reviews by rating, date, or keywords. Set minimum star ratings and control review text length.'
  },
  {
    icon: Zap,
    title: 'Real-Time Updates',
    description: 'Widgets automatically update when new reviews come in. Changes to your widget settings appear instantly.'
  },
  {
    icon: Smartphone,
    title: 'Mobile Responsive',
    description: 'All widgets are fully responsive and look perfect on phones, tablets, and desktops automatically.'
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    description: 'Track widget views, engagement, and performance metrics to optimize your social proof strategy.'
  }
];

const howItWorks = [
  {
    number: 1,
    title: 'Create Your Widget',
    description: 'Go to the Widgets section in your dashboard and click "Create New Widget". Choose which reviews to display and configure your basic settings.',
    icon: Code
  },
  {
    number: 2,
    title: 'Customize Appearance',
    description: 'Customize colors, fonts, layout, and display options. Filter reviews by rating or date and preview your widget in real-time.',
    icon: Palette
  },
  {
    number: 3,
    title: 'Get Embed Code',
    description: 'Copy the generated embed code. It\'s just a simple HTML snippet that works like embedding a YouTube video.',
    icon: Copy
  },
  {
    number: 4,
    title: 'Add to Your Website',
    description: 'Paste the embed code into your website\'s HTML. The widget will automatically load and display your reviews beautifully.',
    icon: Globe
  }
];

const bestPractices = [
  {
    icon: Target,
    title: 'Strategic Placement',
    description: 'Place widgets where they have maximum impact - homepage testimonial sections, product pages, or checkout pages to build trust at crucial moments.'
  },
  {
    icon: Eye,
    title: 'Show Your Best Reviews',
    description: 'Use filtering to showcase 4-5 star reviews. Focus on reviews that mention specific benefits or outcomes that matter to your prospects.'
  },
  {
    icon: Monitor,
    title: 'Match Your Brand',
    description: 'Customize colors, fonts, and styling to seamlessly integrate with your website. Widgets should feel like a natural part of your site.'
  },
  {
    icon: Zap,
    title: 'Keep It Fresh',
    description: 'Regularly update which reviews you display. Fresh, recent reviews are more compelling than outdated ones, even if they\'re positive.'
  }
];

const overviewContent = (
  <>
    <p className="text-white/90 text-lg mb-6 text-center">
      Review widgets allow you to display your customer reviews directly on your website. Create custom widgets that match your brand,
      choose which reviews to show, and embed them anywhere on your site.
    </p>

    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white/5 rounded-lg p-6">
        <Star className="w-8 h-8 text-yellow-400 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Showcase Social Proof</h3>
        <p className="text-white/80 mb-4">
          Display star ratings, reviewer names, dates, review text, and verified badges to build trust with website visitors.
        </p>
      </div>

      <div className="bg-white/5 rounded-lg p-6">
        <Monitor className="w-8 h-8 text-yellow-400 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Perfect Integration</h3>
        <p className="text-white/80 mb-4">
          Widgets seamlessly integrate with any website using simple HTML code. No technical skills required.
        </p>
      </div>
    </div>
  </>
);

export default function WidgetsPage() {
  return (
    <StandardOverviewLayout
      title="Review widgets for your website"
      description="Create customizable widgets to display your reviews on any website. Choose from different layouts, customize colors and styling, and embed with simple HTML code."
      categoryLabel="Review Widgets"
      categoryIcon={Code}
      categoryColor="blue"
      currentPage="Review Widgets"
      availablePlans={['grower', 'builder', 'maven']}
      keyFeatures={keyFeatures}
      howItWorks={howItWorks}
      bestPractices={bestPractices}
      faqs={pageFAQs['widgets']}
      callToAction={{
        primary: {
          text: 'Troubleshooting Guide',
          href: '/troubleshooting'
        }
      }}
      overview={{
        title: 'What Are Review Widgets?',
        content: overviewContent
      }}
    />
  )
}
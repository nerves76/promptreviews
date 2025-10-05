import type { Metadata } from 'next'
import StandardOverviewLayout from '../../components/StandardOverviewLayout'
import { pageFAQs } from '../utils/faqData'
import {
  Building2,
  Link2,
  MapPin,
  Star,
  MessageSquare,
  Upload,
  Clock,
  Shield,
  CheckCircle,
  ArrowRight,
  Users
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Google Business Profile Integration - Connect & Manage | Prompt Reviews Help',
  description: 'Learn how to connect your Google Business Profile with Prompt Reviews. Manage reviews, posts, and multiple locations from one dashboard.',
  keywords: [
    'Google Business Profile',
    'GBP integration',
    'Google reviews',
    'business listing',
    'local SEO',
    'review management'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.app/google-business',
  },
}

export default function GoogleBusinessPage() {
  // Key features data
  const keyFeatures = [
    {
      icon: Star,
      title: 'Review Management',
      description: 'View and respond to Google reviews directly from Prompt Reviews. Track review trends and maintain your reputation with quick response capabilities.',
    },
    {
      icon: MessageSquare,
      title: 'Posts & Updates',
      description: 'Create and schedule Google Business Profile posts about updates, offers, and events. Keep your profile active and engaging.',
    },
    {
      icon: MapPin,
      title: 'Multiple Locations',
      description: 'Manage multiple business profiles from one dashboard. Perfect for franchises and multi-location businesses with centralized control.',
    },
    {
      icon: Upload,
      title: 'Review Import',
      description: 'Import existing Google reviews to feature on your website, launch double-dip campaigns, or track customer engagement.',
      href: '/double-dip-strategy'
    }
  ];


  // How it works steps
  const howItWorks = [
    {
      number: 1,
      title: 'Sign In with Google',
      description: 'Click "Connect Google Business" and sign in with the Google account that manages your business profile. You must be an owner or manager of the Google Business Profile to connect it.',
      icon: Link2
    },
    {
      number: 2,
      title: 'Grant Permissions',
      description: 'Authorize Prompt Reviews to access your business information, reviews, and posting capabilities. We only request the minimum permissions needed.',
      icon: Shield
    },
    {
      number: 3,
      title: 'Select Your Business',
      description: 'Choose which business location(s) to connect. You can add more locations later if needed. Perfect for multi-location businesses.',
      icon: MapPin
    }
  ];

  // Best practices
  const bestPractices = [
    {
      icon: Clock,
      title: 'Respond Quickly to Reviews',
      description: 'Google rewards businesses that respond within 24 hours with increased visibility. Quick responses improve your local search ranking and show customers you care.'
    },
    {
      icon: MessageSquare,
      title: 'Keep Responses Personal',
      description: 'Avoid generic copy-paste responses. Thank customers by name, address specific concerns, and include your business name naturally in responses.'
    },
    {
      icon: Upload,
      title: 'Post Regularly',
      description: 'Keep your Google Business Profile active with weekly posts about updates, offers, and events. Posts appear for 7 days, so maintain a consistent schedule.'
    },
    {
      icon: Shield,
      title: 'Handle Negative Reviews Professionally',
      description: 'Address concerns professionally without arguing. Offer to resolve issues offline and show potential customers how you handle problems.'
    }
  ];


  return (
    <StandardOverviewLayout
      title="Google Business profile integration"
      description="Connect your Google Business Profile to manage reviews, respond to customers, create posts, and handle multiple locations—all from your Prompt Reviews dashboard."
      categoryLabel="Google Business Profile"
      categoryIcon={Building2}
      categoryColor="red"
      currentPage="Google Business Profile"
      availablePlans={['grower', 'builder', 'maven']}
      keyFeatures={keyFeatures}
      howItWorks={howItWorks}
      bestPractices={bestPractices}
      faqs={pageFAQs['google-business']}
      callToAction={{
        primary: {
          text: 'Website Widgets',
          href: '/widgets'
        }
      }}
    />
  )
}
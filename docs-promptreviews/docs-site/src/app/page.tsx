import type { Metadata } from 'next'
import Link from 'next/link'
import { 
  BookOpen, 
  Users, 
  Building2, 
  Code, 
  Zap, 
  Star, 
  ArrowRight,
  Search,
  MessageSquare,
  BarChart3
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Prompt Reviews Documentation - Complete Help Center & Guides',
  description: 'Welcome to Prompt Reviews documentation! Learn how to collect, manage, and leverage customer reviews with our comprehensive guides, tutorials, and troubleshooting resources. Get started with Prompty, your AI-powered review assistant.',
  keywords: [
    'Prompt Reviews help',
    'review management tutorial',
    'customer review software',
    'Google Business Profile help',
    'Prompty AI assistant',
    'review automation guide',
    'business reputation management'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com',
  },
  openGraph: {
    title: 'Prompt Reviews Documentation - Complete Help Center & Guides',
    description: 'Master your online reputation with Prompt Reviews. Step-by-step guides for prompt pages, contact management, Google Business integration, and more.',
    url: 'https://docs.promptreviews.com',
  },
}

// JSON-LD for the homepage
const homepageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Prompt Reviews Documentation Home',
  description: 'Complete documentation and help center for Prompt Reviews review management platform',
  url: 'https://docs.promptreviews.com',
  mainEntity: {
    '@type': 'SoftwareApplication',
    name: 'Prompt Reviews',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    description: 'AI-powered customer review collection and management platform with Google Business Profile integration',
    url: 'https://promptreviews.com',
    author: {
      '@type': 'Organization',
      name: 'Prompt Reviews',
    },
    offers: {
      '@type': 'Offer',
      price: '15.00',
      priceCurrency: 'USD',
      priceValidUntil: '2024-12-31',
    },
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://docs.promptreviews.com',
      },
    ],
  },
}

const features = [
  {
    name: 'Getting Started',
    description: 'Set up your account, create your first prompt page, and start collecting reviews with Prompty\'s AI assistance.',
    href: '/getting-started',
    icon: BookOpen,
    color: 'bg-green-500',
    popular: true,
  },
  {
    name: 'Prompt Pages',
    description: 'Create personalized review request pages for services, products, events, and employee spotlights.',
    href: '/prompt-pages',
    icon: Zap,
    color: 'bg-blue-500',
    popular: true,
  },
  {
    name: 'Contact Management',
    description: 'Import, organize, and manage your customer database with bulk operations and duplicate detection.',
    href: '/contacts',
    icon: Users,
    color: 'bg-purple-500',
  },
  {
    name: 'Review Management',
    description: 'Track, verify, and respond to reviews across all platforms with comprehensive analytics.',
    href: '/reviews',
    icon: Star,
    color: 'bg-yellow-500',
  },
  {
    name: 'Google Business Profile',
    description: 'Connect your Google Business Profile, manage multiple locations, and sync reviews automatically.',
    href: '/google-business',
    icon: Building2,
    color: 'bg-red-500',
    popular: true,
  },
  {
    name: 'Website Integration',
    description: 'Embed review widgets on your website with customizable designs and mobile optimization.',
    href: '/widgets',
    icon: Code,
    color: 'bg-indigo-500',
  },
]

const quickActions = [
  {
    title: 'Create Your First Prompt Page',
    description: 'Learn how to set up a personalized review request page in under 5 minutes',
    href: '/getting-started/first-prompt-page',
    time: '5 min read',
  },
  {
    title: 'Import Your Contacts',
    description: 'Upload your customer list via CSV and start sending review requests',
    href: '/getting-started/adding-contacts',
    time: '3 min read',
  },
  {
    title: 'Connect Google Business Profile',
    description: 'Integrate with Google to manage reviews and posts directly from Prompt Reviews',
    href: '/google-business/connecting',
    time: '10 min read',
  },
  {
    title: 'Set Up Review Widget',
    description: 'Display your best reviews on your website with our embeddable widgets',
    href: '/getting-started/review-widget',
    time: '7 min read',
  },
]

export default function HomePage() {
  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageJsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Star className="w-4 h-4 fill-current" />
            <span>Welcome to Prompt Reviews Documentation</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 text-balance">
            Master Your Online 
            <span className="text-yellow-300"> Reputation</span>
          </h1>
          
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto text-balance">
            Learn how to collect, manage, and leverage customer reviews with Prompt Reviews. 
            From setup to advanced automation with <strong>Prompty</strong>, your AI-powered review assistant.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/getting-started"
              className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <BookOpen className="w-5 h-5" />
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            
            <Link
              href="/troubleshooting/faq"
              className="inline-flex items-center space-x-2 border border-white/30 text-white px-6 py-3 rounded-lg hover:bg-white/10 transition-colors font-medium backdrop-blur-sm"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Browse FAQ</span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
              <input
                type="text"
                placeholder="Search documentation..."
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/50 outline-none text-white placeholder:text-white/70 backdrop-blur-sm"
              />
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs font-mono text-white/70 border border-white/30 rounded">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Explore Documentation
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Link
                key={feature.name}
                href={feature.href}
                className="group relative bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20 hover:border-white/30 hover:bg-white/15 transition-all duration-200"
              >
                {feature.popular && (
                  <div className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                    Popular
                  </div>
                )}
                
                <div className={`inline-flex p-3 rounded-lg ${feature.color} mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-yellow-300 transition-colors">
                  {feature.name}
                </h3>
                
                <p className="text-white/80 mb-4">
                  {feature.description}
                </p>
                
                <div className="flex items-center text-yellow-300 text-sm font-medium">
                  <span>Learn more</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Start Guide */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Quick Start Guide
            </h2>
            <p className="text-white/80 text-lg">
              Get up and running with Prompt Reviews in under 30 minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={action.title}
                href={action.href}
                className="group p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:border-white/30 hover:bg-white/15 transition-all"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-300/20 text-yellow-300 rounded-full flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-2 group-hover:text-yellow-300 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-white/80 text-sm mb-3">
                      {action.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/60">{action.time}</span>
                      <ArrowRight className="w-4 h-4 text-yellow-300 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Help Section */}
        <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Need Additional Help?
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team and community are here to help you succeed with Prompt Reviews.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/troubleshooting"
              className="inline-flex items-center space-x-2 bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 border border-white/30 transition-colors font-medium backdrop-blur-sm"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Troubleshooting</span>
            </Link>
            
            <a
              href="mailto:support@promptreviews.com"
              className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <span>Contact Support</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
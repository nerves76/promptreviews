import { Metadata } from 'next';
import Link from 'next/link'
import DocsLayout from '../docs-layout'
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
  ArrowRight,
  CheckCircle,
  Copy,
  Send,
  MessageSquare
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
    canonical: 'https://docs.promptreviews.com/prompt-pages',
  },
}

const promptPageTypes = [
  {
    id: 'service',
    title: 'Service Prompt Pages',
    icon: MessageCircle,
    description: 'Perfect for restaurants, salons, and service-based businesses',
    url: '/prompt-pages/types/service',
    features: ['Service-specific questions', 'Business information', 'Local SEO optimized']
  },
  {
    id: 'product',
    title: 'Product Prompt Pages',
    icon: Star,
    description: 'Ideal for product-based businesses and e-commerce stores',
    url: '/prompt-pages/types/product',
    features: ['Product-focused reviews', 'Purchase verification', 'E-commerce integration']
  },
  {
    id: 'photo',
    title: 'Photo Prompt Pages',
    icon: Camera,
    description: 'Collect reviews with customer photos for visual social proof',
    url: '/prompt-pages/types/photo',
    features: ['Photo upload capability', 'Visual reviews', 'Social media sharing']
  },
  {
    id: 'video',
    title: 'Video Prompt Pages',
    icon: Video,
    description: 'Collect video reviews for maximum engagement and authenticity',
    url: '/prompt-pages/types/video',
    features: ['Video recording', 'High engagement', 'Authentic testimonials']
  },
  {
    id: 'event',
    title: 'Event Prompt Pages',
    icon: Calendar,
    description: 'Perfect for events, workshops, and special occasions',
    url: '/prompt-pages/types/event',
    features: ['Event-specific context', 'Date tracking', 'Attendee feedback']
  },
  {
    id: 'employee',
    title: 'Employee Prompt Pages',
    icon: User,
    description: 'Spotlight individual team members with dedicated review pages',
    url: '/prompt-pages/types/employee',
    features: ['Employee recognition', 'Personal touch', 'Team building']
  },
  {
    id: 'universal',
    title: 'Universal Prompt Pages',
    icon: Globe,
    description: 'One-page solution for any type of review collection',
    url: '/prompt-pages/types/universal',
    features: ['Works for any business', 'QR code generation', 'Universal compatibility']
  }
];

const keyFeatures = [
  {
    id: 'emoji-sentiment-flow',
    title: 'Emoji Sentiment Flow',
    icon: Heart,
    description: 'Interactive emoji-based review collection that makes leaving reviews fun and engaging',
    url: '/prompt-pages/features#emoji-sentiment-flow'
  },
  {
    id: 'prompty-ai',
    title: 'Prompty AI',
    icon: Bot,
    description: 'AI-powered review generation and optimization to help customers write better reviews',
    url: '/prompt-pages/features#prompty-ai'
  },
  {
    id: 'qr-codes',
    title: 'QR Code Generation',
    icon: Download,
    description: 'Generate QR codes for easy access to your prompt pages from anywhere',
    url: '/prompt-pages/features#qr-codes'
  },
  {
    id: 'customization',
    title: 'Customization Options',
    icon: Palette,
    description: 'Brand your prompt pages with your business colors, logos, and messaging',
    url: '/prompt-pages/features#customization'
  },
  {
    id: 'analytics',
    title: 'Analytics & Insights',
    icon: BarChart3,
    description: 'Track performance and gain insights into your review collection efforts',
    url: '/prompt-pages/features#analytics'
  },
  {
    id: 'multi-platform-sharing',
    title: 'Multi-Platform Sharing',
    icon: Share2,
    description: 'Distribute your prompt pages across all your marketing channels',
    url: '/prompt-pages/features#multi-platform-sharing'
  },
  {
    id: 'mobile-optimization',
    title: 'Mobile Optimization',
    icon: Smartphone,
    description: 'Perfect experience on all devices with responsive design',
    url: '/prompt-pages/features#mobile-optimization'
  },
  {
    id: 'security-privacy',
    title: 'Security & Privacy',
    icon: Shield,
    description: 'Enterprise-grade security and privacy protection for your data',
    url: '/prompt-pages/features#security-privacy'
  },
  {
    id: 'platform-integration',
    title: 'Platform Integration',
    icon: Globe,
    description: 'Connect with major review platforms and business directories',
    url: '/prompt-pages/features#platform-integration'
  }
];

// JSON-LD structured data
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": "Prompt Pages: Custom Review Collection",
  "description": "Learn how to create custom prompt pages to collect customer reviews",
  "author": {
    "@type": "Organization",
    "name": "Prompt Reviews"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Prompt Reviews"
  }
};

export default function PromptPagesPage() {
  return (
    <DocsLayout>
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-fuchsia-900">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <span className="text-6xl font-bold text-slate-blue" style={{ fontFamily: 'Inter, sans-serif' }}>[P]</span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">
                Prompt Pages
              </h1>
              <p className="text-xl text-white/80 max-w-3xl mx-auto">
                Create custom pages to collect customer reviews effectively. Choose from different types and features to match your business needs.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Quick Navigation */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Quick Navigation</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <a
                href="/prompt-pages/types"
                className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6 hover:border-slate-blue hover:shadow-md transition-all"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-slate-blue/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-slate-blue" style={{ fontFamily: 'Inter, sans-serif' }}>[P]</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Prompt Page Types</h3>
                </div>
                <p className="text-white/80 mb-3">Learn about Service, Product, Photo, Video, and Universal prompt page types</p>
                <span className="text-slate-blue font-medium">Explore Types →</span>
              </a>

              <a
                href="/prompt-pages/features"
                className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6 hover:border-slate-blue hover:shadow-md transition-all"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-slate-blue/20 rounded-lg flex items-center justify-center">
                    <Brain className="w-5 h-5 text-slate-blue" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Prompt Page Features</h3>
                </div>
                <p className="text-white/80 mb-3">Discover Emoji Sentiment Flow, Prompty AI, QR codes, and more features</p>
                <span className="text-slate-blue font-medium">Explore Features →</span>
              </a>
            </div>
          </div>

          {/* Prompt Page Types Overview */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Prompt Page Types</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promptPageTypes.map((type) => (
                <div key={type.id} className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-slate-blue/20 rounded-lg flex items-center justify-center">
                        <type.icon className="w-5 h-5 text-slate-blue" />
                      </div>
                      <h3 className="font-semibold text-white">{type.title}</h3>
                    </div>
                    <p className="text-white/80 text-sm mb-4">{type.description}</p>
                    <ul className="space-y-1 mb-4">
                      {type.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <div className="w-1 h-1 bg-slate-blue rounded-full"></div>
                          <span className="text-white/70 text-xs">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <a
                      href={type.url}
                      className="inline-flex items-center text-slate-blue hover:text-slate-blue/80 font-medium text-sm"
                    >
                      Learn more
                      <ArrowRight className="ml-1 w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Features Overview */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Key Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {keyFeatures.map((feature) => (
                <div key={feature.id} className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-slate-blue/20 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-slate-blue" />
                    </div>
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                  </div>
                  <p className="text-white/80 text-sm mb-3">{feature.description}</p>
                  <a
                    href={feature.url}
                    className="inline-flex items-center text-slate-blue hover:text-slate-blue/80 font-medium text-sm"
                  >
                    Learn more
                    <ArrowRight className="ml-1 w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Getting Started */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-8 mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Getting Started</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-white mb-4">Quick Start Guide</h3>
                <ol className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-slate-blue text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">1</div>
                    <div>
                      <p className="font-medium text-white">Choose Your Type</p>
                      <p className="text-white/80 text-sm">Select the prompt page type that best fits your business</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-slate-blue text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">2</div>
                    <div>
                      <p className="font-medium text-white">Customize Your Page</p>
                      <p className="text-white/80 text-sm">Add your branding, questions, and business information</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-slate-blue text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">3</div>
                    <div>
                      <p className="font-medium text-white">Share With Customers</p>
                      <p className="text-white/80 text-sm">Use QR codes, links, or embed on your website</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-slate-blue text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">4</div>
                    <div>
                      <p className="font-medium text-white">Collect Reviews</p>
                      <p className="text-white/80 text-sm">Start receiving customer reviews and feedback</p>
                    </div>
                  </li>
                </ol>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">What You'll Get</h3>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-white/80">Custom review collection pages</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-white/80">Multiple prompt page types</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-white/80">Advanced features like AI and emoji flow</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-white/80">QR code generation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-white/80">Analytics and insights</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-slate-blue to-indigo-600 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to Create Your First Prompt Page?
            </h2>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Start collecting better reviews from your customers today. Choose your type and get started in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://app.promptreviews.app/dashboard/create-prompt-page"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-white/20 text-white backdrop-blur-sm font-medium rounded-lg hover:bg-white/30 transition-colors"
              >
                Create Your First Prompt Page
              </a>
              <a
                href="/prompt-pages/types"
                className="inline-flex items-center px-6 py-3 border border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
              >
                Explore Types
              </a>
            </div>
          </div>
        </div>

        {/* JSON-LD Script */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </div>
    </DocsLayout>
  );
}
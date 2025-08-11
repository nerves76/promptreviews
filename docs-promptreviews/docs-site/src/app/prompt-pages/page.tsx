import { Metadata } from 'next';
import Link from 'next/link'
import DocsLayout from '../docs-layout'
import PageHeader from '../components/PageHeader'
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
    title: 'AI-Powered Content',
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

export default function PromptPagesPage() {
  return (
    <DocsLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' }
          ]}
          currentPage="Prompt Pages"
          categoryLabel="Prompt Pages Overview"
          categoryIcon={MessageCircle}
          categoryColor="purple"
          title="Prompt Pages: Your Review Collection Superpower"
          description="Create personalized review request pages that make it easy for customers to leave detailed, authentic reviews. Choose from multiple types, customize everything, and watch your reviews grow."
        />
          
          <div className="flex flex-wrap gap-4 justify-center mb-16">
            <Link
              href="/prompt-pages/types"
              className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <span>Explore Page Types</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            
            <Link
              href="/prompt-pages/features"
              className="inline-flex items-center space-x-2 border border-white/30 text-white px-6 py-3 rounded-lg hover:bg-white/10 transition-colors font-medium backdrop-blur-sm"
            >
              <span>View Features</span>
            </Link>
          </div>

        {/* What Are Prompt Pages */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">What Are Prompt Pages?</h2>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 mb-8">
            <p className="text-white/90 text-lg mb-6 text-center">
              Prompt pages are personalized review request pages you create for different situations. 
              Each page is designed to make leaving a review as easy as possible while collecting the 
              specific feedback you need.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Inter, sans-serif' }}>[P]</span>
                </div>
                <h3 className="font-semibold text-white mb-2">Personalized</h3>
                <p className="text-white/80 text-sm">
                  Each page is customized for specific customers, services, or situations
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">Easy to Use</h3>
                <p className="text-white/80 text-sm">
                  Simple, mobile-friendly design that works on any device
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">AI-Powered</h3>
                <p className="text-white/80 text-sm">
                  AI-powered content helps customers write better reviews
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Page Types */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Choose Your Page Type</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {promptPageTypes.map((type) => (
              <div key={type.id} className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:border-white/30 hover:bg-white/15 transition-all duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <type.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-yellow-300 transition-colors">{type.title}</h3>
                </div>
                
                <p className="text-white/80 mb-4">{type.description}</p>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-white mb-2">Features:</h4>
                  <ul className="text-sm text-white/70 space-y-1">
                    {type.features.map((feature, idx) => (
                      <li key={idx}>• {feature}</li>
                    ))}
                  </ul>
                </div>
                
                <Link href={type.url} className="inline-flex items-center text-yellow-300 hover:text-yellow-200 font-medium text-sm">
                  Learn more
                  <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <Link
              href="/prompt-pages/types"
              className="inline-flex items-center space-x-2 text-yellow-300 hover:text-yellow-200 font-medium"
            >
              <span>Learn more about each type</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Key Features</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {keyFeatures.map((feature) => (
              <div key={feature.id} className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:border-white/30 hover:bg-white/15 transition-all duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-yellow-300 transition-colors">{feature.title}</h3>
                </div>
                
                <p className="text-white/80 mb-4">{feature.description}</p>
                
                <Link href={feature.url} className="inline-flex items-center text-yellow-300 hover:text-yellow-200 font-medium text-sm">
                  Learn more
                  <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">How Prompt Pages Work</h2>
          
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">1</div>
                <h3 className="text-xl font-semibold text-white">Create Your Page</h3>
              </div>
              <p className="text-white/90 mb-4">
                Choose your page type and add details. Include customer names, service info, or any context that makes the review personal.
              </p>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-white/80">
                  <strong>Pro tip:</strong> The more specific your prompt page, the more detailed and helpful the reviews you'll receive.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold">2</div>
                <h3 className="text-xl font-semibold text-white">Share Your Link</h3>
              </div>
              <p className="text-white/90 mb-4">
                Get your unique link, QR code, or NFC tag. Share it however works best—email, text, in-person, or on social media.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg">
                  <Copy className="w-4 h-4 text-white" />
                  <span className="text-sm text-white/90">Copy link</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg">
                  <QrCode className="w-4 h-4 text-white" />
                  <span className="text-sm text-white/90">QR code</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg">
                  <Send className="w-4 h-4 text-white" />
                  <span className="text-sm text-white/90">Send email</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold">3</div>
                <h3 className="text-xl font-semibold text-white">Customer Leaves Review</h3>
              </div>
              <p className="text-white/90 mb-4">
                Your customer lands on a beautiful, personalized page. They can write their own review or use AI assistance to help express their thoughts.
              </p>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white/5 rounded-lg p-3">
                  <Star className="w-5 h-5 text-white mb-2" />
                  <p className="text-white/90">Rate experience</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <MessageSquare className="w-5 h-5 text-white mb-2" />
                  <p className="text-white/90">Write review</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <CheckCircle className="w-5 h-5 text-white mb-2" />
                  <p className="text-white/90">Submit to platform</p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-semibold">4</div>
                <h3 className="text-xl font-semibold text-white">Track Your Success</h3>
              </div>
              <p className="text-white/90">
                Monitor which prompt pages generate the most reviews. See conversion rates, track performance, and optimize your approach.
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="text-center">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to Create Your First Prompt Page?</h2>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Join thousands of businesses collecting better reviews with personalized prompt pages.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/getting-started"
                className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              <Link
                href="/prompt-pages/types"
                className="inline-flex items-center space-x-2 border border-white/30 text-white px-6 py-3 rounded-lg hover:bg-white/10 transition-colors font-medium backdrop-blur-sm"
              >
                <span>Explore Page Types</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* JSON-LD Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </DocsLayout>
  )
}
/**
 * Prompt Page Features Documentation
 * Comprehensive guide to all prompt page features and capabilities
 */

import { Metadata } from 'next';
import { 
  Heart, 
  Brain, 
  QrCode, 
  Palette, 
  Share2, 
  Shield, 
  BarChart3, 
  Smartphone,
  Globe,
  Zap,
  Users,
  Target
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Prompt Page Features - Emoji Sentiment Flow, Prompty AI & More | Prompt Reviews',
  description: 'Explore all prompt page features: Emoji Sentiment Flow, Prompty AI, QR codes, customization, analytics, and more.',
  keywords: 'prompt page features, emoji sentiment flow, prompty ai, qr codes, review analytics, customization',
  openGraph: {
    title: 'Prompt Page Features - Complete Guide',
    description: 'Discover all the powerful features that make prompt pages effective for review collection.',
  },
};

// JSON-LD structured data
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": "Prompt Page Features: Complete Guide",
  "description": "Explore all features available in prompt pages for effective review collection",
  "author": {
    "@type": "Organization",
    "name": "Prompt Reviews"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Prompt Reviews"
  },
  "mainEntity": {
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Emoji Sentiment Flow"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Prompty AI"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "QR Code Generation"
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": "Customization Options"
      },
      {
        "@type": "ListItem",
        "position": 5,
        "name": "Analytics & Insights"
      },
      {
        "@type": "ListItem",
        "position": 6,
        "name": "Multi-Platform Sharing"
      }
    ]
  }
};

const features = [
  {
    id: 'emoji-sentiment-flow',
    title: 'Emoji Sentiment Flow',
    icon: Heart,
    description: 'Interactive emoji-based review collection that makes leaving reviews fun and engaging',
    category: 'engagement',
    priority: 'high',
    details: {
      overview: 'The Emoji Sentiment Flow transforms the review process into an interactive, emotion-driven experience that encourages customers to share their feelings about your business.',
      howItWorks: [
        'Customers see a series of emoji options representing different emotions',
        'They select emojis that best represent their experience',
        'The system guides them through a natural conversation flow',
        'Reviews are collected with authentic emotional context'
      ],
      benefits: [
        'Higher completion rates due to engaging interface',
        'Authentic emotional feedback from customers',
        'Reduced friction in review process',
        'Visual and interactive experience'
      ],
      useCases: [
        'Restaurants collecting food and service feedback',
        'Salons gathering style satisfaction',
        'Service businesses understanding customer emotions',
        'Any business wanting authentic emotional feedback'
      ],
      examples: [
        '😊 "I loved the service!" → Detailed positive review',
        '😐 "It was okay" → Constructive feedback opportunity',
        '😍 "Amazing experience!" → Enthusiastic testimonial'
      ]
    }
  },
  {
    id: 'prompty-ai',
    title: 'Prompty AI',
    icon: Brain,
    description: 'AI-powered review generation and optimization to help customers write better reviews',
    category: 'ai',
    priority: 'high',
    details: {
      overview: 'Prompty AI is your intelligent assistant that helps customers write detailed, authentic reviews by understanding their business and generating personalized review suggestions.',
      howItWorks: [
        'AI analyzes your business information and customer feedback',
        'Generates personalized review templates based on context',
        'Customers can use AI suggestions or write their own',
        'Continuously learns and improves from feedback patterns'
      ],
      benefits: [
        'Higher quality, more detailed reviews',
        'Reduced writer\'s block for customers',
        'Consistent review quality across all submissions',
        'Time-saving for both businesses and customers'
      ],
      useCases: [
        'Businesses wanting more detailed customer feedback',
        'Customers who struggle to write reviews',
        'Consistent review quality across platforms',
        'Multi-language review generation'
      ],
      examples: [
        'AI suggests specific details about service quality',
        'Generates reviews mentioning unique business features',
        'Creates authentic-sounding testimonials'
      ]
    }
  },
  {
    id: 'qr-codes',
    title: 'QR Code Generation',
    icon: QrCode,
    description: 'Generate QR codes for easy access to your prompt pages from anywhere',
    category: 'accessibility',
    priority: 'high',
    details: {
      overview: 'QR codes provide instant access to your prompt pages, making it easy for customers to leave reviews from their mobile devices with just a scan.',
      howItWorks: [
        'Automatically generate QR codes for each prompt page',
        'QR codes link directly to the review collection page',
        'Works with any smartphone camera app',
        'No app download required for customers'
      ],
      benefits: [
        'Instant access from mobile devices',
        'No typing URLs or searching',
        'Professional appearance on marketing materials',
        'Trackable usage and engagement'
      ],
      useCases: [
        'Business cards and marketing materials',
        'Table tents and counter displays',
        'Receipts and invoices',
        'Physical store locations'
      ],
      examples: [
        'QR code on restaurant table tents',
        'Business card with review QR code',
        'Receipt footer with review invitation'
      ]
    }
  },
  {
    id: 'customization',
    title: 'Customization Options',
    icon: Palette,
    description: 'Brand your prompt pages with your business colors, logos, and messaging',
    category: 'branding',
    priority: 'medium',
    details: {
      overview: 'Make your prompt pages look and feel like your brand with comprehensive customization options including colors, fonts, logos, and messaging.',
      howItWorks: [
        'Upload your business logo and brand assets',
        'Choose from preset color schemes or create custom ones',
        'Customize fonts, spacing, and layout options',
        'Add personalized messaging and call-to-actions'
      ],
      benefits: [
        'Professional, branded appearance',
        'Consistent with your business identity',
        'Increased customer trust and recognition',
        'Better conversion rates from branded pages'
      ],
      useCases: [
        'Businesses with strong brand identity',
        'Franchises maintaining consistent branding',
        'Professional services requiring credibility',
        'Any business wanting polished appearance'
      ],
      examples: [
        'Restaurant with branded colors and logo',
        'Professional service with corporate styling',
        'Retail store with product imagery'
      ]
    }
  },
  {
    id: 'analytics',
    title: 'Analytics & Insights',
    icon: BarChart3,
    description: 'Track performance, engagement, and review collection metrics',
    category: 'insights',
    priority: 'medium',
    details: {
      overview: 'Get detailed insights into how your prompt pages are performing, including view counts, completion rates, and review quality metrics.',
      howItWorks: [
        'Track page views, interactions, and completions',
        'Monitor review submission rates and quality',
        'Analyze customer engagement patterns',
        'Generate performance reports and trends'
      ],
      benefits: [
        'Data-driven optimization decisions',
        'Understanding of customer behavior',
        'Identification of improvement opportunities',
        'ROI measurement for review campaigns'
      ],
      useCases: [
        'Businesses wanting to optimize review collection',
        'Marketing teams measuring campaign success',
        'Understanding customer engagement patterns',
        'A/B testing different approaches'
      ],
      examples: [
        'Tracking which QR code locations get most scans',
        'Measuring completion rates by page type',
        'Analyzing peak review submission times'
      ]
    }
  },
  {
    id: 'multi-platform',
    title: 'Multi-Platform Sharing',
    icon: Share2,
    description: 'Share your prompt pages across multiple platforms and channels',
    category: 'distribution',
    priority: 'medium',
    details: {
      overview: 'Distribute your prompt pages across multiple channels including social media, email, SMS, and direct links for maximum reach.',
      howItWorks: [
        'Generate shareable links for each prompt page',
        'Integrate with social media platforms',
        'Send via email marketing campaigns',
        'Use in SMS and messaging apps'
      ],
      benefits: [
        'Maximum reach across all customer touchpoints',
        'Flexible distribution options',
        'Consistent experience across platforms',
        'Easy integration with existing marketing'
      ],
      useCases: [
        'Social media marketing campaigns',
        'Email newsletter integration',
        'SMS marketing and reminders',
        'Multi-channel customer communication'
      ],
      examples: [
        'Facebook post with review link',
        'Email signature with review invitation',
        'SMS follow-up after service completion'
      ]
    }
  },
  {
    id: 'mobile-optimized',
    title: 'Mobile Optimization',
    icon: Smartphone,
    description: 'Perfect experience on all mobile devices and screen sizes',
    category: 'accessibility',
    priority: 'high',
    details: {
      overview: 'All prompt pages are fully optimized for mobile devices, ensuring a seamless experience regardless of screen size or device type.',
      howItWorks: [
        'Responsive design adapts to any screen size',
        'Touch-friendly interface elements',
        'Fast loading on mobile networks',
        'Optimized for mobile browsers'
      ],
      benefits: [
        'Great experience on all devices',
        'Higher completion rates on mobile',
        'No app download required',
        'Works with any mobile browser'
      ],
      useCases: [
        'Customers using smartphones to leave reviews',
        'QR code scanning from mobile devices',
        'Social media sharing from mobile',
        'On-the-go review collection'
      ],
      examples: [
        'Perfect display on iPhone and Android',
        'Touch-friendly emoji selection',
        'Easy photo upload from mobile camera'
      ]
    }
  },
  {
    id: 'security',
    title: 'Security & Privacy',
    icon: Shield,
    description: 'Enterprise-grade security and privacy protection for all data',
    category: 'security',
    priority: 'high',
    details: {
      overview: 'Your data and customer information are protected with enterprise-grade security measures and privacy controls.',
      howItWorks: [
        'SSL encryption for all data transmission',
        'Secure data storage and processing',
        'Privacy controls and data protection',
        'Compliance with privacy regulations'
      ],
      benefits: [
        'Customer data protection',
        'Compliance with privacy laws',
        'Secure review collection process',
        'Trust and credibility with customers'
      ],
      useCases: [
        'Businesses handling sensitive customer data',
        'Compliance with GDPR and privacy regulations',
        'Building customer trust and confidence',
        'Professional service requirements'
      ],
      examples: [
        'Encrypted data transmission',
        'Privacy policy compliance',
        'Secure customer information handling'
      ]
    }
  },
  {
    id: 'integration',
    title: 'Platform Integration',
    icon: Globe,
    description: 'Seamless integration with Google, Facebook, Yelp, and other review platforms',
    category: 'integration',
    priority: 'medium',
    details: {
      overview: 'Connect your prompt pages with major review platforms to automatically distribute reviews where they matter most.',
      howItWorks: [
        'Connect your business profiles on major platforms',
        'Automatically submit reviews to connected platforms',
        'Manage review distribution preferences',
        'Track reviews across all platforms'
      ],
      benefits: [
        'Reviews appear on multiple platforms automatically',
        'Centralized review management',
        'Increased online visibility',
        'Time-saving automation'
      ],
      useCases: [
        'Businesses wanting presence on multiple platforms',
        'Automated review distribution',
        'Centralized review management',
        'Maximizing online visibility'
      ],
      examples: [
        'Review automatically posted to Google and Facebook',
        'Centralized dashboard for all reviews',
        'Consistent review presence across platforms'
      ]
    }
  }
];

export default function PromptPageFeatures() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-fuchsia-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              Prompt Page Features
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Discover all the powerful features that make prompt pages the most effective way to collect customer reviews. From AI-powered assistance to mobile optimization, we've got everything you need.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Feature Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Feature Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['engagement', 'ai', 'accessibility', 'branding', 'insights', 'distribution', 'security', 'integration'].map((category) => (
              <a
                key={category}
                href={`#${category}`}
                className="flex flex-col items-center p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 hover:border-slate-blue hover:shadow-md transition-all"
              >
                <span className="text-sm font-medium text-white text-center capitalize">
                  {category.replace('-', ' ')}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Featured Features */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Featured Features</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {features.filter(f => f.priority === 'high').map((feature) => (
              <div key={feature.id} className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-slate-blue/10 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-slate-blue" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                      <p className="text-sm text-white/80">{feature.description}</p>
                    </div>
                  </div>
                  <a
                    href={`#${feature.id}`}
                    className="inline-flex items-center text-slate-blue hover:text-slate-blue/80 font-medium"
                  >
                    Learn more
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Features */}
        <div className="space-y-16">
          {features.map((feature) => (
            <section key={feature.id} id={feature.id} className="scroll-mt-20">
              <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-blue to-indigo-600 px-6 py-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white">{feature.title}</h2>
                      <p className="text-white/90 mt-1">{feature.description}</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Overview</h3>
                        <p className="text-white/80">{feature.details.overview}</p>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">How It Works</h3>
                        <ul className="space-y-2">
                          {feature.details.howItWorks.map((step, idx) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <div className="w-1.5 h-1.5 bg-slate-blue rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-white/80">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Benefits</h3>
                        <ul className="space-y-2">
                          {feature.details.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-white/80">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Perfect For</h3>
                        <ul className="space-y-2">
                          {feature.details.useCases.map((useCase, idx) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-white/80">{useCase}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-300 mb-2">Examples</h4>
                        <ul className="space-y-1">
                          {feature.details.examples.map((example, idx) => (
                            <li key={idx} className="text-white/80 text-sm">• {example}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white mb-6">Feature Comparison</h2>
          <div className="bg-white rounded-lg shadow-sm border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-br from-indigo-900 via-purple-900 to-fuchsia-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Feature
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Basic
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Pro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/5 divide-y divide-white/10">
                  {features.map((feature) => (
                    <tr key={feature.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {feature.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                        {feature.priority === 'high' ? '✅' : '❌'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                        ✅
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                        ✅
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-r from-slate-blue to-indigo-600 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Experience These Features?
          </h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Start using these powerful features to collect better reviews and grow your business.
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
              Choose Your Type
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
  );
}

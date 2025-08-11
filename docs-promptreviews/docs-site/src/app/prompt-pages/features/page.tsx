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
  Target,
  Smile,
  Bot,
  Download,
  Settings,
  Star,
  Camera,
  Video,
  Calendar,
  User
} from 'lucide-react';
import DocsLayout from '../../docs-layout';
import PageHeader from '../../components/PageHeader';

export const metadata: Metadata = {
  title: 'Prompt Page Features - Emoji Sentiment Flow, AI-Powered Content & More | Prompt Reviews',
  description: 'Explore all prompt page features: Emoji Sentiment Flow, AI-powered content generation, QR codes, customization, analytics, and more.',
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
        "name": "AI-Powered Content"
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
    icon: Smile,
    description: 'Interactive emoji-based review collection that makes leaving reviews fun and engaging',
    category: 'engagement',
    priority: 'high',
    details: {
      overview: 'The Emoji Sentiment Flow feature allows customers to express their satisfaction through emoji reactions before leaving a detailed review. This creates a quick, engaging way for customers to provide feedback.',
      howItWorks: [
        'Customers see a question with emoji options (Excellent, Satisfied, Neutral, Unsatisfied, Frustrated)',
        'They select an emoji that best represents their experience',
        'Based on their selection, they\'re guided to appropriate review platforms',
        'Positive sentiments (Excellent/Satisfied) lead to public review platforms',
        'Negative sentiments (Neutral/Unsatisfied/Frustrated) lead to private feedback options'
      ],
      benefits: [
        'Increases customer engagement and participation',
        'Provides quick emotional feedback',
        'Guides customers to appropriate review channels',
        'Makes review collection more fun and interactive',
        'Helps identify customer satisfaction levels quickly'
      ],
      useCases: [
        'Restaurants wanting to gauge customer satisfaction',
        'Service businesses collecting quick feedback',
        'Any business wanting to make review collection more engaging',
        'Businesses wanting to filter positive vs negative feedback'
      ],
      examples: [
        'A restaurant asks "How was your dining experience?" with emoji options',
        'A salon uses emoji sentiment to guide customers to appropriate review platforms',
        'A service business uses emoji reactions to quickly assess customer satisfaction'
      ]
    }
  },
  {
    id: 'prompty-ai',
    title: 'AI-Powered Content',
    icon: Bot,
    description: 'AI-powered review generation and optimization to help customers write better reviews',
    category: 'ai',
    priority: 'high',
    details: {
      overview: 'Our AI-powered system helps customers write better, more detailed reviews by providing suggestions, improving grammar, and optimizing content for better visibility.',
      howItWorks: [
        'AI analyzes the business context and customer experience',
        'Generates personalized review suggestions based on the service/product',
        'Offers grammar and spelling improvements',
        'Provides SEO-optimized content suggestions',
        'Allows customers to customize and edit AI suggestions'
      ],
      benefits: [
        'Helps customers write more detailed and helpful reviews',
        'Improves review quality and consistency',
        'Increases review completion rates',
        'Provides SEO-optimized content',
        'Reduces the barrier to writing reviews'
      ],
      useCases: [
        'Businesses wanting higher quality reviews',
        'Customers who struggle to write detailed reviews',
        'Businesses looking for SEO-optimized review content',
        'Any business wanting to improve review completion rates'
      ],
      examples: [
        'AI suggests specific details about food quality and service for restaurant reviews',
        'Provides professional language for service business reviews',
        'Offers grammar corrections and improvements for all reviews'
      ]
    }
  },
  {
    id: 'qr-codes',
    title: 'QR Code Generation',
    icon: Download,
    description: 'Generate QR codes for easy access to your prompt pages from anywhere',
    category: 'accessibility',
    priority: 'high',
    details: {
      overview: 'QR Code Generation allows businesses to create scannable codes that customers can use to quickly access prompt pages from their mobile devices, making review collection more convenient.',
      howItWorks: [
        'Generate unique QR codes for each prompt page',
        'QR codes link directly to the prompt page URL',
        'Customers scan codes with their phone camera',
        'Automatically opens the prompt page in their browser',
        'Works with any smartphone camera app'
      ],
      benefits: [
        'Makes review collection extremely convenient',
        'Reduces friction in the review process',
        'Perfect for physical locations and printed materials',
        'Works offline and doesn\'t require typing URLs',
        'Increases review collection rates'
      ],
      useCases: [
        'Business cards and marketing materials',
        'Table tents and in-store displays',
        'Receipts and invoices',
        'Physical marketing materials',
        'Any situation where typing a URL is inconvenient'
      ],
      examples: [
        'Restaurant includes QR code on receipts for easy review access',
        'Business cards feature QR codes for quick review collection',
        'Table tents in waiting rooms with QR codes for customer feedback'
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
      overview: 'Customization Options allow businesses to personalize their prompt pages with their brand colors, logos, custom messaging, and business-specific styling to create a cohesive brand experience.',
      howItWorks: [
        'Upload your business logo and brand assets',
        'Choose from brand color palettes or create custom colors',
        'Customize page headers, questions, and messaging',
        'Add business-specific information and contact details',
        'Preview changes in real-time before publishing'
      ],
      benefits: [
        'Creates a professional, branded experience',
        'Builds customer trust and recognition',
        'Maintains brand consistency across all touchpoints',
        'Differentiates your business from competitors',
        'Improves customer engagement through familiarity'
      ],
      useCases: [
        'Businesses wanting to maintain brand consistency',
        'Companies with strong brand identities',
        'Businesses wanting to appear more professional',
        'Any business wanting to customize their review experience'
      ],
      examples: [
        'A restaurant uses their brand colors and logo on prompt pages',
        'A salon customizes questions to match their service offerings',
        'A professional service firm adds their branding and contact information'
      ]
    }
  },
  {
    id: 'analytics',
    title: 'Analytics & Insights',
    icon: BarChart3,
    description: 'Track performance and gain insights into your review collection efforts',
    category: 'insights',
    priority: 'medium',
    details: {
      overview: 'Analytics & Insights provide detailed data about your review collection performance, including completion rates, platform distribution, customer engagement, and actionable insights to improve your review strategy.',
      howItWorks: [
        'Tracks review completion rates and conversion metrics',
        'Monitors which review platforms perform best',
        'Analyzes customer engagement patterns',
        'Provides insights on optimal timing and messaging',
        'Offers recommendations for improvement'
      ],
      benefits: [
        'Understand what drives review completion',
        'Optimize review collection strategy',
        'Identify best-performing platforms and content',
        'Make data-driven decisions about review collection',
        'Track ROI of review collection efforts'
      ],
      useCases: [
        'Businesses wanting to optimize review collection',
        'Companies tracking marketing ROI',
        'Businesses wanting to understand customer behavior',
        'Any business wanting to improve review performance'
      ],
      examples: [
        'A restaurant discovers that Google reviews perform better than Facebook',
        'A service business learns that shorter questions get higher completion rates',
        'A retail store identifies the best time to ask for reviews'
      ]
    }
  },
  {
    id: 'multi-platform-sharing',
    title: 'Multi-Platform Sharing',
    icon: Share2,
    description: 'Distribute your prompt pages across all your marketing channels',
    category: 'distribution',
    priority: 'medium',
    details: {
      overview: 'Multi-Platform Sharing allows businesses to easily distribute their prompt pages across all marketing channels, including social media, email, websites, and physical materials.',
      howItWorks: [
        'Generate shareable links for each prompt page',
        'Create embed codes for website integration',
        'Share directly to social media platforms',
        'Include in email campaigns and newsletters',
        'Print QR codes for physical materials'
      ],
      benefits: [
        'Reach customers across all touchpoints',
        'Increase review collection opportunities',
        'Maintain consistent messaging across channels',
        'Track performance across different platforms',
        'Maximize review collection potential'
      ],
      useCases: [
        'Businesses with multiple marketing channels',
        'Companies wanting to maximize review collection',
        'Businesses with active social media presence',
        'Any business wanting to reach more customers'
      ],
      examples: [
        'A restaurant shares prompt pages on Instagram, Facebook, and email',
        'A service business embeds prompt pages on their website',
        'A retail store includes QR codes in their physical marketing materials'
      ]
    }
  },
  {
    id: 'mobile-optimization',
    title: 'Mobile Optimization',
    icon: Smartphone,
    description: 'Perfect experience on all devices with responsive design',
    category: 'accessibility',
    priority: 'high',
    details: {
      overview: 'Mobile Optimization ensures that prompt pages work perfectly on all devices, from smartphones to tablets to desktop computers, providing a seamless experience regardless of how customers access your pages.',
      howItWorks: [
        'Responsive design adapts to any screen size',
        'Touch-friendly interface for mobile devices',
        'Optimized loading speeds for mobile networks',
        'Mobile-specific features like camera integration',
        'Cross-platform compatibility testing'
      ],
      benefits: [
        'Works perfectly on all devices and screen sizes',
        'Provides excellent user experience on mobile',
        'Increases completion rates on mobile devices',
        'Reduces bounce rates and improves engagement',
        'Future-proofs your review collection strategy'
      ],
      useCases: [
        'Businesses with mobile-first customers',
        'Companies wanting to reach customers on any device',
        'Businesses with diverse customer demographics',
        'Any business wanting maximum accessibility'
      ],
      examples: [
        'A restaurant\'s prompt page works perfectly on customer phones',
        'A service business\'s page adapts to tablet screens',
        'A retail store\'s page loads quickly on mobile networks'
      ]
    }
  },
  {
    id: 'security-privacy',
    title: 'Security & Privacy',
    icon: Shield,
    description: 'Enterprise-grade security and privacy protection for your data',
    category: 'security',
    priority: 'high',
    details: {
      overview: 'Security & Privacy features ensure that all customer data and review information is protected with enterprise-grade security measures, maintaining customer trust and compliance with privacy regulations.',
      howItWorks: [
        'End-to-end encryption for all data transmission',
        'Secure hosting with industry-standard security',
        'Privacy controls for customer information',
        'GDPR and CCPA compliance features',
        'Regular security audits and updates'
      ],
      benefits: [
        'Protects customer data and privacy',
        'Builds customer trust and confidence',
        'Ensures compliance with privacy regulations',
        'Reduces security risks and liability',
        'Maintains professional reputation'
      ],
      useCases: [
        'Businesses handling sensitive customer information',
        'Companies needing GDPR/CCPA compliance',
        'Businesses wanting to build customer trust',
        'Any business prioritizing data security'
      ],
      examples: [
        'A healthcare provider ensures patient privacy in reviews',
        'A financial services firm maintains data security',
        'A retail business builds customer trust through secure review collection'
      ]
    }
  },
  {
    id: 'platform-integration',
    title: 'Platform Integration',
    icon: Globe,
    description: 'Connect with major review platforms and business directories',
    category: 'integration',
    priority: 'medium',
    details: {
      overview: 'Platform Integration allows businesses to seamlessly connect their prompt pages with major review platforms like Google, Facebook, Yelp, and other business directories for maximum visibility and impact.',
      howItWorks: [
        'Direct integration with major review platforms',
        'Automatic review submission to connected platforms',
        'Platform-specific optimization and formatting',
        'Real-time status updates and notifications',
        'Analytics across all connected platforms'
      ],
      benefits: [
        'Maximizes review visibility across platforms',
        'Reduces manual review management',
        'Ensures consistent review distribution',
        'Improves local search rankings',
        'Streamlines review collection workflow'
      ],
      useCases: [
        'Businesses wanting maximum review visibility',
        'Companies managing multiple review platforms',
        'Businesses focusing on local search optimization',
        'Any business wanting to streamline review management'
      ],
      examples: [
        'A restaurant automatically submits reviews to Google, Facebook, and Yelp',
        'A service business optimizes reviews for local search platforms',
        'A retail store manages all reviews from a single dashboard'
      ]
    }
  }
];

export default function PromptPageFeatures() {
  return (
    <DocsLayout>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' },
            { label: 'Prompt Pages', href: '/prompt-pages' }
          ]}
          currentPage="Features"
          categoryLabel="Features"
          categoryIcon={Zap}
          categoryColor="purple"
          title="Prompt Page Features"
          description="Discover all the powerful features that make prompt pages the most effective way to collect customer reviews. From AI-powered assistance to mobile optimization, we've got everything you need."
        />
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
          <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/20">
                <thead className="bg-white/5">
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
    </DocsLayout>
  );
}

import type { Metadata } from 'next'
import Link from 'next/link'
import DocsLayout from '../docs-layout'
import PageHeader from '../components/PageHeader'
import { 
  HelpCircle, 
  Search, 
  Star, 
  Users, 
  Zap, 
  Mail, 
  MessageSquare, 
  QrCode,
  CreditCard,
  Shield,
  Clock,
  Globe,
  Settings,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Smartphone,
  FileText,
  Database,
  Lock,
  Sparkles
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'FAQ - Frequently Asked Questions | Prompt Reviews Help',
  description: 'Find answers to the most common questions about Prompt Reviews. From pricing and features to technical support and best practices.',
  keywords: [
    'FAQ',
    'frequently asked questions',
    'Prompt Reviews help',
    'review collection questions',
    'pricing questions',
    'technical support'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/faq',
  },
}

// JSON-LD structured data
const pageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How much does Prompt Reviews cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Prompt Reviews starts at $15/month for the Grower plan, with Builder ($35/month) and Maven ($100/month) plans available for growing businesses.'
      }
    },
    {
      '@type': 'Question',
      name: 'What is AI-powered review collection?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our AI-powered system helps create personalized review requests and optimize your review collection strategy.'
      }
    },
    {
      '@type': 'Question',
      name: 'How do I get started with Prompt Reviews?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sign up for an account, complete your business profile, create your first prompt page, and start collecting reviews in under 30 minutes.'
      }
    }
  ]
}

const faqCategories = [
  {
    name: 'Getting Started',
    icon: Star,
    color: 'bg-blue-500',
    questions: [
      {
        question: 'How do I get started with Prompt Reviews?',
        answer: 'Getting started is easy! Sign up for an account, complete your business profile, create your first prompt page, and start collecting reviews. Most businesses are up and running in under 30 minutes.',
        related: ['/getting-started', 'Account Setup']
      },
      {
        question: 'What information do I need to set up my account?',
        answer: 'You\'ll need your business name, address, phone number, website, and a brief description of your services. Having a customer contact list ready (optional) will help you start collecting reviews faster.',
        related: ['/getting-started/account-setup', 'Business Profile']
      },
      {
        question: 'Can I import my existing customer list?',
        answer: 'Yes! You can import your customer contacts via CSV file. We support most common formats and automatically detect and merge duplicates. You can also add contacts manually or let customers add themselves via QR codes.',
        related: ['/contacts', 'Contact Management']
      },
      {
        question: 'How long does it take to see results?',
        answer: 'Most businesses start seeing reviews within the first week. The key is focusing on recent, satisfied customers and sending personalized requests. Quality over quantity always wins!',
        related: ['/ai-reviews', 'Best Practices']
      }
    ]
  },
  {
    name: 'Features & Functionality',
    icon: Zap,
    color: 'bg-purple-500',
    questions: [
      {
        question: 'What is AI-powered review collection and how does it work?',
        answer: 'Our AI-powered system analyzes your business, customers, and context to create personalized review requests that feel genuinely human. The AI helps you be more personal, not less.',
        related: ['/ai-reviews', 'AI Features']
      },
      {
        question: 'What are prompt pages?',
        answer: 'Prompt pages are personalized review request pages you create for different situations. You can have universal pages for general reviews, or specific pages for services, products, employees, or events.',
        related: ['/prompt-pages', 'Prompt Pages']
      },
      {
        question: 'How do QR codes work for review collection?',
        answer: 'Each prompt page generates a unique QR code. When customers scan the code with their phone, they\'re taken directly to your review request page. Perfect for business cards, receipts, or in-person interactions.',
        related: ['/prompt-pages', 'QR Codes']
      },
      {
        question: 'Can I customize the review request messages?',
        answer: 'Absolutely! While our AI generates personalized suggestions, you can edit, customize, or completely rewrite any content before sending. You always have full control over your messaging.',
        related: ['/ai-reviews', 'Personalization']
      }
    ]
  },
  {
    name: 'Pricing & Plans',
    icon: DollarSign,
    color: 'bg-green-500',
    questions: [
      {
        question: 'How much does Prompt Reviews cost?',
        answer: 'Prompt Reviews starts at $15/month for the Grower plan. We offer Builder ($35/month) and Maven ($100/month) plans to fit businesses of all sizes, with features that scale with your needs.',
        related: ['/pricing', 'Pricing Plans']
      },
      {
        question: 'What\'s included in each plan?',
        answer: 'All plans include prompt pages, contact management (except Grower), AI-powered content generation, and basic analytics. Higher plans add features like advanced reporting, team collaboration, and Google Business Profile integration.',
        related: ['/pricing', 'Plan Comparison']
      },
      {
        question: 'Can I change my plan later?',
        answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any billing adjustments.',
        related: ['/account/billing', 'Billing']
      },
      {
        question: 'Is there a free trial?',
        answer: 'Yes! We offer a free trial so you can see how Prompt Reviews works for your business before committing.',
        related: ['/getting-started', 'Free Trial']
      }
    ]
  },
  {
    name: 'Technical Support',
    icon: Shield,
    color: 'bg-orange-500',
    questions: [
      {
        question: 'What if I need technical support?',
        answer: 'We\'re here to help! Check our troubleshooting guide first, then contact our support team. We typically respond within 24 hours.',
        related: ['/troubleshooting', 'Support']
      },
      {
        question: 'Is my data secure?',
        answer: 'Absolutely. We take security seriously and follow industry best practices. Your customer data is encrypted and never shared with third parties.',
        related: ['/privacy', 'Security']
      },
      {
        question: 'Can I export my data?',
        answer: 'Yes, you can export your contacts, review data, and analytics at any time. Your data belongs to you.',
        related: ['/contacts', 'Data Export']
      },
      {
        question: 'What browsers are supported?',
        answer: 'Prompt Reviews works on all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version for the best experience.',
        related: ['/troubleshooting', 'Browser Support']
      }
    ]
  },
  {
    name: 'Best Practices',
    icon: CheckCircle,
    color: 'bg-pink-500',
    questions: [
      {
        question: 'How do I get more responses to my review requests?',
        answer: 'Focus on recent, satisfied customers first. Personalize your requests with specific details about their experience. Timing matters—send requests 1-3 days after service completion.',
        related: ['/contacts', 'Response Rates']
      },
      {
        question: 'Which review platforms should I focus on?',
        answer: 'Google Business Profile is usually the most important for local businesses. Consider your industry—restaurants might focus on Yelp, while service businesses might prioritize Google and Facebook.',
        related: ['/prompt-pages', 'Review Platforms']
      },
      {
        question: 'How often should I send review requests?',
        answer: 'Quality over quantity! Focus on customers who had positive experiences rather than sending to everyone. Most businesses send 10-50 requests per month, depending on their volume.',
        related: ['/contacts', 'Timing']
      },
      {
        question: 'What should I do with negative reviews?',
        answer: 'Respond professionally and promptly to all reviews, including negative ones. Address concerns constructively and show you care about customer feedback.',
        related: ['/reviews', 'Review Management']
      }
    ]
  }
]

const quickLinks = [
  {
    icon: Star,
    title: 'Getting Started',
    description: 'New to Prompt Reviews? Start here.',
    href: '/getting-started',
    color: 'bg-blue-500/20 text-blue-300'
  },
  {
    icon: Zap,
    title: 'AI Features',
    description: 'Learn about your AI assistant.',
    href: '/ai-reviews',
    color: 'bg-purple-500/20 text-purple-300'
  },
  {
    icon: Users,
    title: 'Contact Management',
    description: 'Import and organize your contacts.',
    href: '/contacts',
    color: 'bg-green-500/20 text-green-300'
  },
  {
    icon: AlertCircle,
    title: 'Troubleshooting',
    description: 'Find solutions to common issues.',
    href: '/troubleshooting',
    color: 'bg-orange-500/20 text-orange-300'
  }
]

export default function FAQPage() {
  return (
    <DocsLayout>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }}
      />

      <div className="prose-docs">
        {/* Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' }
          ]}
          currentPage="FAQ"
          categoryLabel="Frequently Asked Questions"
          categoryIcon={HelpCircle}
          categoryColor="blue"
          title="Frequently asked questions"
          description="Find answers to the most common questions about Prompt Reviews. Can't find what you're looking for? Our support team is here to help."
        />

        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center space-x-6 text-sm text-white/70">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span>Quick answers</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Expert guidance</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-12">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
            <input
              type="text"
              placeholder="Search FAQ..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Quick Links */}
        <h2>Quick Navigation</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {quickLinks.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className="p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:border-blue-400 transition-colors no-underline group"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className={`p-2 rounded-lg ${link.color}`}>
                  <link.icon className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-white mb-0 group-hover:underline transition-colors">
                  {link.title}
                </h3>
              </div>
              <p className="text-sm text-white/70 mb-0">{link.description}</p>
            </Link>
          ))}
        </div>

        {/* FAQ Categories */}
        {faqCategories.map((category) => (
          <div key={category.name} className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <div className={`p-2 rounded-lg ${category.color}`}>
                <category.icon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-0">{category.name}</h2>
            </div>
            
            <div className="space-y-4">
              {category.questions.map((faq, index) => (
                <div key={index} className="p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-white/70 mb-4">
                    {faq.answer}
                  </p>
                  {faq.related && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-white/60">Related:</span>
                      {faq.related.map((related, idx) => (
                        <Link
                          key={idx}
                          href={typeof related === 'string' ? related : '#'}
                          className="text-blue-300 hover:underline font-medium"
                        >
                          {typeof related === 'string' ? related.split('/').pop()?.replace('-', ' ') : related}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Still Need Help */}
        <div className="callout success">
          <h3 className="text-lg font-semibold mb-3">Still Need Help?</h3>
          <p className="mb-4">
            Can't find the answer you're looking for? Check our comprehensive FAQ or contact our support team.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/faq-comprehensive"
              className="inline-flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium no-underline"
            >
              <HelpCircle className="w-4 h-4" />
              <span>View Complete FAQ</span>
            </Link>
            <a
              href="https://promptreviews.app/contact"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium no-underline"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Support</span>
            </a>
            <Link
              href="/troubleshooting"
              className="inline-flex items-center space-x-2 border border-blue-400 text-blue-300 px-4 py-2 rounded-lg hover:bg-white/10/20 transition-colors font-medium no-underline"
            >
              <span>Troubleshooting Guide</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Related Articles */}
        <h2>Related Articles</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/getting-started" className="block p-4 border border-white/20 rounded-lg hover:border-blue-400 transition-colors no-underline">
            <h4 className="font-semibold text-white mb-2">Getting Started Guide</h4>
            <p className="text-sm text-white/70 mb-0">Complete setup guide to get you up and running with Prompt Reviews.</p>
          </Link>
          
          <Link href="/troubleshooting" className="block p-4 border border-white/20 rounded-lg hover:border-blue-400 transition-colors no-underline">
            <h4 className="font-semibold text-white mb-2">Troubleshooting Guide</h4>
            <p className="text-sm text-white/70 mb-0">Find solutions to common issues and technical problems.</p>
          </Link>
        </div>
      </div>
    </DocsLayout>
  )
}

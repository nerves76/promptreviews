import type { Metadata } from 'next'
import Link from 'next/link'
import DocsLayout from '../docs-layout'
import PageHeader from '../components/PageHeader'
import { 
  AlertTriangle, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail, 
  MessageSquare, 
  QrCode,
  Users,
  Star,
  Zap,
  ArrowRight,
  HelpCircle,
  Settings,
  RefreshCw,
  Shield,
  Smartphone,
  Globe,
  FileText,
  Database,
  Wifi,
  Lock
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Troubleshooting - Common Issues & Solutions | Prompt Reviews Help',
  description: 'Find solutions to common Prompt Reviews issues. From setup problems to review collection challenges, get quick answers and step-by-step fixes.',
  keywords: [
    'troubleshooting',
    'common issues',
    'review collection problems',
    'setup help',
    'technical support',
    'FAQ'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/troubleshooting',
  },
}

// JSON-LD structured data
const pageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Why aren\'t my review requests getting responses?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Focus on recent, satisfied customers and personalize your requests. Timing matters - send requests 1-3 days after service completion.'
      }
    },
    {
      '@type': 'Question',
      name: 'How do I fix duplicate contacts?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our system automatically detects and merges duplicates based on email addresses and phone numbers.'
      }
    }
  ]
}

const commonIssues = [
  {
    category: 'Review Collection',
    issues: [
      {
        title: 'Low Response Rates',
        description: 'Not getting many responses to your review requests?',
        solutions: [
          'Focus on recent, satisfied customers first',
          'Personalize your requests with specific details',
          'Send requests 1-3 days after service completion',
          'Use AI-powered content generation to create more engaging messages'
        ],
        icon: Star,
        severity: 'medium'
      },
      {
        title: 'Reviews Not Appearing',
        description: 'Customers say they left reviews but you don\'t see them?',
        solutions: [
          'Check if reviews are pending approval on the platform',
          'Verify the customer used the correct business listing',
          'Some platforms have 24-48 hour delays',
          'Ask customers to check their email for confirmation'
        ],
        icon: Clock,
        severity: 'low'
      },
      {
        title: 'Wrong Review Platform',
        description: 'Customers are leaving reviews on the wrong platform?',
        solutions: [
          'Make your review request links more prominent',
          'Use platform-specific QR codes',
          'Include clear instructions in your messages',
          'Consider using our review widgets'
        ],
        icon: Globe,
        severity: 'medium'
      }
    ]
  },
  {
    category: 'Technical Issues',
    issues: [
      {
        title: 'Email Delivery Problems',
        description: 'Review request emails not reaching customers?',
        solutions: [
          'Check your sender reputation and authentication',
          'Ask customers to add your email to contacts',
          'Avoid spam trigger words in subject lines',
          'Use our email templates as a starting point'
        ],
        icon: Mail,
        severity: 'high'
      },
      {
        title: 'QR Code Not Working',
        description: 'QR codes not scanning or leading to wrong pages?',
        solutions: [
          'Ensure QR codes are generated for the correct prompt page',
          'Test QR codes before printing or sharing',
          'Make sure the URL is accessible on mobile devices',
          'Check that the prompt page is published and active'
        ],
        icon: QrCode,
        severity: 'medium'
      },
      {
        title: 'Contact Import Issues',
        description: 'Having trouble importing your customer list?',
        solutions: [
          'Check your CSV file format and required fields',
          'Ensure email addresses are valid and properly formatted',
          'Remove any special characters from field names',
          'Try importing a smaller test file first'
        ],
        icon: Database,
        severity: 'medium'
      }
    ]
  },
  {
    category: 'Account & Setup',
    issues: [
      {
        title: 'Can\'t Access Dashboard',
        description: 'Having trouble logging in or accessing your account?',
        solutions: [
          'Clear your browser cache and cookies',
          'Try using an incognito/private browser window',
          'Check if your subscription is active',
          'Contact support if the issue persists'
        ],
        icon: Lock,
        severity: 'high'
      },
      {
        title: 'Business Profile Not Updating',
        description: 'Changes to your business information not saving?',
        solutions: [
          'Make sure you\'re saving changes properly',
          'Check if you have the correct permissions',
          'Try refreshing the page after making changes',
          'Clear browser cache if changes still don\'t appear'
        ],
        icon: Settings,
        severity: 'low'
      },
      {
        title: 'AI Features Not Working',
        description: 'AI assistant not generating content or suggestions?',
        solutions: [
          'Ensure your business profile is complete',
          'Check your internet connection',
          'Try refreshing the page and trying again',
          'Contact support if the issue continues'
        ],
        icon: Zap,
        severity: 'medium'
      }
    ]
  }
]

const quickFixes = [
  {
    icon: RefreshCw,
    title: 'Refresh & Retry',
    description: 'Most technical issues can be resolved by refreshing your browser and trying again.',
    whenToUse: 'Page not loading, buttons not responding, data not updating'
  },
  {
    icon: Settings,
    title: 'Check Your Settings',
    description: 'Verify your account settings, business profile, and notification preferences.',
    whenToUse: 'Emails not sending, notifications not working, profile issues'
  },
  {
    icon: Search,
    title: 'Search This Guide',
    description: 'Use the search function to find specific solutions to your problem.',
    whenToUse: 'Looking for a specific error message or issue'
  },
  {
    icon: HelpCircle,
    title: 'Contact Support',
    description: 'Our support team is here to help with issues not covered in this guide.',
    whenToUse: 'Complex technical issues, account problems, billing questions'
  }
]

const preventionTips = [
  {
    icon: Users,
    title: 'Start with Happy Customers',
    description: 'Focus on customers who had positive experiences. They\'re more likely to leave glowing reviews.',
    tip: 'Use your CRM or sales data to identify satisfied customers first'
  },
  {
    icon: Clock,
    title: 'Timing is Everything',
    description: 'Send review requests when the experience is fresh but not overwhelming.',
    tip: 'Wait 1-3 days after service completion, but before the next interaction'
  },
  {
    icon: MessageSquare,
    title: 'Personalize Your Approach',
    description: 'Use specific details about each customer\'s experience in your review requests.',
    tip: 'Reference the service provided, date, or specific outcomes achieved'
  },
  {
    icon: Shield,
    title: 'Keep Your Data Clean',
    description: 'Regularly update contact information and remove invalid email addresses.',
    tip: 'Set up a monthly review of your contact database'
  }
]

export default function TroubleshootingPage() {
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
          currentPage="Troubleshooting"
          categoryLabel="Need Help?"
          categoryIcon={AlertTriangle}
          categoryColor="orange"
          title="Troubleshooting guide"
          description="Running into issues? Don't worry—most problems have simple solutions. Find quick fixes for common issues and get back to collecting great reviews."
        />

        {/* Plan Indicator */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-white/60">Available on:</span>
            <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full font-medium">Grower</span>
            <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full font-medium">Builder</span>
            <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded-full font-medium">Maven</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center space-x-6 text-sm text-white/70">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span>Quick solutions</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Step-by-step fixes</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-12">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for your issue..."
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/50 outline-none text-white placeholder:text-white/60 backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Quick Fixes */}
        <h2>Quick Fixes</h2>
        
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {quickFixes.map((fix) => (
            <div key={fix.title} className="p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <fix.icon className="w-5 h-5 text-blue-300" />
                </div>
                <h3 className="font-semibold text-white mb-0">{fix.title}</h3>
              </div>
              <p className="text-white/80 mb-3">{fix.description}</p>
              <div className="text-sm text-blue-300 font-medium">
                💡 When to use: {fix.whenToUse}
              </div>
            </div>
          ))}
        </div>

        {/* Common Issues by Category */}
        {commonIssues.map((category) => (
          <div key={category.category} className="mb-12">
            <h2>{category.category} Issues</h2>
            
            <div className="grid gap-6">
              {category.issues.map((issue) => (
                <div key={issue.title} className="p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg">
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      issue.severity === 'high' ? 'bg-red-500/20' :
                      issue.severity === 'medium' ? 'bg-yellow-500/20' : 'bg-green-500/20'
                    }`}>
                      <issue.icon className={`w-5 h-5 ${
                        issue.severity === 'high' ? 'text-red-600' :
                        issue.severity === 'medium' ? 'text-yellow-600' : 'text-green-300'
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white mb-0">{issue.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          issue.severity === 'high' ? 'bg-red-500/20 text-red-300' :
                          issue.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'
                        }`}>
                          {issue.severity === 'high' ? 'High Priority' :
                           issue.severity === 'medium' ? 'Medium Priority' : 'Low Priority'}
                        </span>
                      </div>
                      
                      <p className="text-white/80 mb-4">{issue.description}</p>
                      
                      <div>
                        <h4 className="font-medium text-white mb-2">Solutions:</h4>
                        <ul className="space-y-2">
                          {issue.solutions.map((solution, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-white/80">{solution}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Prevention Tips */}
        <h2>Prevention Tips</h2>
        
        <div className="callout info">
          <h3 className="text-lg font-semibold mb-3">Avoid Common Issues</h3>
          <p className="mb-4">
            Most problems can be prevented with good practices. Here are some tips to keep your 
            review collection running smoothly:
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {preventionTips.map((tip) => (
            <div key={tip.title} className="p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <tip.icon className="w-5 h-5 text-green-300" />
                </div>
                <h3 className="font-semibold text-white mb-0">{tip.title}</h3>
              </div>
              <p className="text-white/80 mb-3">{tip.description}</p>
              <div className="text-sm text-green-300 font-medium">
                💡 {tip.tip}
              </div>
            </div>
          ))}
        </div>

        {/* When to Contact Support */}
        <h2>When to Contact Support</h2>
        
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 bg-green-500/20 backdrop-blur-md border border-green-400/50 rounded-lg">
            <h3 className="font-semibold text-white mb-3 flex items-center">
              <CheckCircle className="w-5 h-5 text-green-300 mr-2" />
              Try These First
            </h3>
            <ul className="space-y-2 text-white/80">
              <li>• Check this troubleshooting guide</li>
              <li>• Refresh your browser and try again</li>
              <li>• Clear browser cache and cookies</li>
              <li>• Check your internet connection</li>
              <li>• Verify your account settings</li>
            </ul>
          </div>
          
          <div className="p-6 bg-red-500/20 backdrop-blur-md border border-red-400/50 rounded-lg">
            <h3 className="font-semibold text-white mb-3 flex items-center">
              <XCircle className="w-5 h-5 text-red-600 mr-2" />
              Contact Support For
            </h3>
            <ul className="space-y-2 text-white/80">
              <li>• Account access issues</li>
              <li>• Billing and subscription problems</li>
              <li>• Technical errors not covered here</li>
              <li>• Data import/export issues</li>
              <li>• Platform integration problems</li>
            </ul>
          </div>
        </div>

        {/* Getting Help */}
        <div className="callout success">
          <h3 className="text-lg font-semibold mb-3">Need More Help?</h3>
          <p className="mb-4">
            Our support team is here to help with issues not covered in this guide. We typically 
            respond within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://promptreviews.app/contact"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium no-underline"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Support</span>
            </a>
            <Link
              href="/getting-started"
              className="inline-flex items-center space-x-2 border border-blue-400 text-blue-300 px-4 py-2 rounded-lg hover:bg-white/10/20 transition-colors font-medium no-underline"
            >
              <span>Getting Started Guide</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Related Articles */}
        <h2>Related Articles</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/getting-started" className="block p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:border-white/40 transition-colors no-underline">
            <h4 className="font-semibold text-white mb-2">Getting Started Guide</h4>
            <p className="text-sm text-white/70 mb-0">Complete setup guide to get you up and running quickly.</p>
          </Link>
          
          <Link href="/contacts" className="block p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:border-white/40 transition-colors no-underline">
            <h4 className="font-semibold text-white mb-2">Contact Management</h4>
            <p className="text-sm text-white/70 mb-0">Learn how to properly manage your customer contacts.</p>
          </Link>
        </div>
      </div>
    </DocsLayout>
  )
}

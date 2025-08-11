import type { Metadata } from 'next'
import Link from 'next/link'
import DocsLayout from '../docs-layout'
import PageHeader from '../components/PageHeader'
import PageFAQs from '../components/PageFAQs'
import { pageFAQs } from '../utils/faqData'
import { 
  Users, 
  Upload, 
  Search, 
  Filter, 
  Mail, 
  MessageSquare, 
  QrCode, 
  Copy,
  Edit,
  Trash2,
  Plus,
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  Target,
  Zap,
  ArrowRight,
  FileText,
  Smartphone,
  Globe,
  Tag,
  Tags
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact Management - Import, Organize & Manage Customer Database | Prompt Reviews',
  description: 'Learn how to import, organize, and manage your customer contacts in Prompt Reviews. From CSV uploads to manual entry, discover best practices for building your review request database.',
  keywords: [
    'contact management',
    'customer database',
    'CSV import',
    'contact organization',
    'review request contacts',
    'customer list management'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/contacts',
  },
}

// JSON-LD structured data
const pageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Managing Customer Contacts in Prompt Reviews',
  description: 'Complete guide to importing, organizing, and managing customer contacts for review requests',
  image: 'https://docs.promptreviews.com/images/contact-management-hero.jpg',
  step: [
    {
      '@type': 'HowToStep',
      name: 'Import Your Contacts',
      text: 'Upload your existing customer list via CSV or manually add contacts',
      url: 'https://docs.promptreviews.com/contacts/importing',
    },
    {
      '@type': 'HowToStep',
      name: 'Organize Your Database',
      text: 'Use tags, groups, and custom fields to organize your contacts',
      url: 'https://docs.promptreviews.com/contacts/organizing',
    },
    {
      '@type': 'HowToStep',
      name: 'Send Review Requests',
      text: 'Target specific contacts or groups with personalized review requests',
      url: 'https://docs.promptreviews.com/contacts/sending-requests',
    },
  ],
}

const importMethods = [
  {
    icon: Upload,
    title: 'CSV Import',
    description: 'Upload your existing customer list in seconds. We support most common formats.',
    features: ['Bulk import', 'Duplicate detection', 'Auto-formatting', 'Error checking'],
    bestFor: 'Existing customer databases, CRM exports, email lists',
    time: '2-5 minutes'
  },
  {
    icon: Plus,
    title: 'Manual Entry',
    description: 'Add contacts one by one with detailed information and custom fields.',
    features: ['Detailed profiles', 'Custom fields', 'Notes & tags', 'Relationship tracking'],
    bestFor: 'Small lists, VIP customers, detailed tracking',
    time: '1-2 minutes per contact'
  },
  {
    icon: Globe,
    title: 'QR Code Collection',
    description: 'Let customers add themselves to your database through QR codes.',
    features: ['Self-service', 'Real-time updates', 'Mobile-friendly', 'No manual work'],
    bestFor: 'In-person interactions, events, retail locations',
    time: 'Instant'
  }
]

const organizationFeatures = [
  {
    icon: Tags,
    title: 'Smart Tagging',
    description: 'Organize contacts with custom tags like "VIP", "Recent Customer", or "Event Attendee".',
    benefit: 'Target specific groups with relevant review requests'
  },
  {
    icon: Filter,
    title: 'Advanced Filtering',
    description: 'Find exactly who you need with filters by date, service, location, or custom criteria.',
    benefit: 'Send the right message to the right people at the right time'
  },
  {
    icon: Target,
    title: 'Segmentation',
    description: 'Create groups based on customer behavior, purchase history, or relationship status.',
    benefit: 'Personalized review strategies for different customer types'
  },
  {
    icon: Clock,
    title: 'Timing Optimization',
    description: 'Track when customers are most likely to respond and schedule accordingly.',
    benefit: 'Higher response rates through strategic timing'
  }
]

const bestPractices = [
  {
    icon: CheckCircle,
    title: 'Start with Happy Customers',
    description: 'Focus on customers who had positive experiences first. They\'re more likely to leave glowing reviews.',
    tip: 'Use your CRM or sales data to identify satisfied customers'
  },
  {
    icon: Star,
    title: 'Quality Over Quantity',
    description: 'A smaller list of engaged customers beats a large list of cold contacts every time.',
    tip: 'Aim for 100 quality contacts rather than 1000 random ones'
  },
  {
    icon: MessageSquare,
    title: 'Personalize Your Approach',
    description: 'Use the information you have about each customer to make your review requests feel personal.',
    tip: 'Reference specific services, dates, or interactions in your requests'
  },
  {
    icon: Zap,
    title: 'Timing is Everything',
    description: 'Send review requests when the experience is fresh but not overwhelming.',
    tip: 'Wait 1-3 days after service completion, but before the next interaction'
  }
]

const commonIssues = [
  {
    issue: 'Duplicate Contacts',
    solution: 'Our system automatically detects and merges duplicates based on email addresses and phone numbers.',
    prevention: 'Use consistent formatting when importing your CSV files'
  },
  {
    issue: 'Low Response Rates',
    solution: 'Focus on recent, satisfied customers and personalize your review requests with specific details.',
    prevention: 'Segment your list and send targeted, relevant messages'
  },
  {
    issue: 'Bounced Emails',
    solution: 'We automatically clean your list by removing invalid email addresses and updating contact information.',
    prevention: 'Regularly update your contact information and verify email addresses'
  },
  {
    issue: 'Spam Filters',
    solution: 'Our emails are sent from verified domains and include proper authentication to avoid spam folders.',
    prevention: 'Ask customers to add your email address to their contacts'
  }
]

export default function ContactsPage() {
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
          currentPage="Contact Management"
          categoryLabel="Contact Management"
          categoryIcon={Users}
          categoryColor="blue"
          title="Managing your customer contacts"
          description="Your customer database is the foundation of successful review collection. Learn how to import, organize, and manage your contacts to get the most from your review requests."
        />

        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center space-x-6 text-sm text-white/70">
            <div className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Multiple import methods</span>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Smart organization</span>
            </div>
          </div>
        </div>

        {/* Why Contacts Matter */}
        <div className="callout info">
          <h3 className="text-lg font-semibold mb-3">Why Your Contact List Matters</h3>
          <p className="mb-3">
            The quality of your customer database directly impacts your review collection success. 
            A well-organized list of engaged customers will generate more and better reviews than 
            a large list of cold contacts.
          </p>
          <p className="mb-0">
            <strong>Think of it this way:</strong> You wouldn't send a wedding invitation to everyone 
            in your phone book. You'd send it to people who care about you and would want to celebrate. 
            The same principle applies to review requests.
          </p>
        </div>

        {/* Import Methods */}
        <h2>Getting Your Contacts Into Prompt Reviews</h2>
        
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {importMethods.map((method) => (
            <div key={method.title} className="p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <method.icon className="w-5 h-5 text-blue-300" />
                </div>
                <h3 className="font-semibold text-white mb-0">{method.title}</h3>
              </div>
              
              <p className="text-white/70 mb-4">{method.description}</p>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-white mb-2">Features:</h4>
                <ul className="text-sm text-white/70 space-y-1">
                  {method.features.map((feature) => (
                    <li key={feature} className="flex items-center space-x-2">
                      <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="text-sm text-white/60">
                <strong>Best for:</strong> {method.bestFor}
              </div>
              
              <div className="text-sm text-blue-300 font-medium mt-2">
                ⏱️ {method.time}
              </div>
            </div>
          ))}
        </div>

        {/* CSV Import Guide */}
        <h2>CSV Import Guide</h2>
        
        <div className="callout success">
          <h3 className="text-lg font-semibold mb-3">Preparing Your CSV File</h3>
          <p className="mb-3">
            Most customer databases can export to CSV format. Here's what you need to know:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-white mb-2">Required Fields:</h4>
              <ul className="text-sm space-y-1">
                <li>• Email address (primary identifier)</li>
                <li>• First name (for personalization)</li>
                <li>• Last name (for personalization)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Optional Fields:</h4>
              <ul className="text-sm space-y-1">
                <li>• Phone number</li>
                <li>• Company name</li>
                <li>• Custom tags</li>
                <li>• Notes</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Organization Features */}
        <h2>Organizing Your Contacts</h2>
        
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {organizationFeatures.map((feature) => (
            <div key={feature.title} className="p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <feature.icon className="w-5 h-5 text-green-300" />
                </div>
                <h3 className="font-semibold text-white mb-0">{feature.title}</h3>
              </div>
              <p className="text-white/70 mb-3">{feature.description}</p>
              <div className="text-sm text-green-300 font-medium">
                💡 {feature.benefit}
              </div>
            </div>
          ))}
        </div>

        {/* Best Practices */}
        <h2>Best Practices for Contact Management</h2>
        
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {bestPractices.map((practice) => (
            <div key={practice.title} className="p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <practice.icon className="w-5 h-5 text-purple-300" />
                </div>
                <h3 className="font-semibold text-white mb-0">{practice.title}</h3>
              </div>
              <p className="text-white/70 mb-3">{practice.description}</p>
              <div className="text-sm text-purple-300 font-medium">
                💡 {practice.tip}
              </div>
            </div>
          ))}
        </div>

        {/* Sending Review Requests */}
        <h2>Sending Review Requests to Your Contacts</h2>
        
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Mail className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-semibold text-white mb-0">Email Requests</h3>
            </div>
            <p className="text-white/70 mb-3">
              Send personalized review requests via email with AI-powered content generation.
            </p>
            <ul className="text-sm text-white/70 space-y-1">
              <li>• Personalized subject lines</li>
              <li>• Custom message content</li>
              <li>• Direct links to review platforms</li>
              <li>• Automated follow-ups</li>
            </ul>
          </div>
          
          <div className="p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <MessageSquare className="w-5 h-5 text-green-300" />
              </div>
              <h3 className="font-semibold text-white mb-0">SMS Requests</h3>
            </div>
            <p className="text-white/70 mb-3">
              Reach customers on their phones with quick, friendly text messages.
            </p>
            <ul className="text-sm text-white/70 space-y-1">
              <li>• Short, personal messages</li>
              <li>• Mobile-optimized links</li>
              <li>• Quick response rates</li>
              <li>• Easy opt-out options</li>
            </ul>
          </div>
          
          <div className="p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <QrCode className="w-5 h-5 text-blue-300" />
              </div>
              <h3 className="font-semibold text-white mb-0">QR Code Sharing</h3>
            </div>
            <p className="text-white/70 mb-3">
              Generate QR codes for in-person interactions and events.
            </p>
            <ul className="text-sm text-white/70 space-y-1">
              <li>• Unique codes per contact</li>
              <li>• Easy mobile access</li>
              <li>• Perfect for events</li>
              <li>• Track scan analytics</li>
            </ul>
          </div>
        </div>

        {/* Common Issues */}
        <h2>Common Issues & Solutions</h2>
        
        <div className="grid gap-4 mb-12">
          {commonIssues.map((item) => (
            <div key={item.issue} className="p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-red-500/20 rounded-lg flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-2">{item.issue}</h3>
                  <p className="text-white/70 mb-2">{item.solution}</p>
                  <div className="text-sm text-blue-300 font-medium">
                    💡 Prevention: {item.prevention}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Getting Started */}
        <div className="callout info">
          <h3 className="text-lg font-semibold mb-3">Ready to Build Your Contact Database?</h3>
          <p className="mb-4">
            Start with your best customers and build from there. Remember, quality beats quantity 
            when it comes to review requests.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/getting-started/adding-contacts"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium no-underline"
            >
              <span>Add Your First Contacts</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/prompt-pages"
              className="inline-flex items-center space-x-2 border border-blue-400 text-blue-300 px-4 py-2 rounded-lg hover:bg-white/10/20 transition-colors font-medium no-underline"
            >
              <span>Create Prompt Pages</span>
            </Link>
          </div>
        </div>

        {/* FAQs Section */}
        <PageFAQs 
          faqs={pageFAQs['contacts']}
          pageTitle="Contact Management"
          pageUrl="https://docs.promptreviews.com/contacts"
        />

        {/* Related Articles */}
        <h2>Related Articles</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/getting-started/adding-contacts" className="block p-4 border border-white/20 rounded-lg hover:border-blue-400 transition-colors no-underline">
            <h4 className="font-semibold text-white mb-2">Adding Your First Contacts</h4>
            <p className="text-sm text-white/70 mb-0">Step-by-step guide to importing and adding contacts to your database.</p>
          </Link>
          
          <Link href="/prompt-pages" className="block p-4 border border-white/20 rounded-lg hover:border-blue-400 transition-colors no-underline">
            <h4 className="font-semibold text-white mb-2">Creating Prompt Pages</h4>
            <p className="text-sm text-white/70 mb-0">Learn how to create personalized review request pages for your contacts.</p>
          </Link>
        </div>
      </div>
    </DocsLayout>
  )
}
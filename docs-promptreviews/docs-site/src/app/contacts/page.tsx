import type { Metadata } from 'next'
import Link from 'next/link'
import DocsLayout from '../docs-layout'
import PageHeader from '../components/PageHeader'
import StandardOverviewLayout from '../components/StandardOverviewLayout'
import { pageFAQs } from '../utils/faqData'
import {
  Users,
  Upload,
  Plus,
  Globe,
  Tags,
  Filter,
  Target,
  Clock,
  Mail,
  MessageSquare,
  QrCode,
  CheckCircle,
  ArrowRight,
  AlertTriangle
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

export default function ContactsPage() {
  // Key features data
  const keyFeatures = [
    {
      icon: Upload,
      title: 'CSV Import',
      description: 'Upload your existing customer list in seconds with automatic duplicate detection and error checking.',
    },
    {
      icon: Tags,
      title: 'Smart Organization',
      description: 'Organize contacts with custom tags, groups, and filters for targeted review campaigns.',
    },
    {
      icon: Target,
      title: 'Segmentation',
      description: 'Create groups based on customer behavior, purchase history, or relationship status.',
    },
    {
      icon: MessageSquare,
      title: 'Multi-Channel Outreach',
      description: 'Send review requests via email, SMS, or generate personalized QR codes for in-person interactions.',
    }
  ];

  // Key points for the overview
  const keyPoints = [
    {
      title: 'Quality Over Quantity',
      description: 'Focus on engaged customers who had positive experiences for higher review rates'
    },
    {
      title: 'Automatic Duplicate Management',
      description: 'System automatically detects and merges duplicate contacts based on email and phone'
    },
    {
      title: 'Multi-Channel Outreach',
      description: 'Reach customers through their preferred communication channel'
    },
    {
      title: 'Self-Service Collection',
      description: 'Let customers add themselves through QR codes and sign-up forms'
    }
  ];

  // How it works steps
  const howItWorks = (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">1</div>
          <h3 className="text-xl font-semibold text-white">Import Your Contacts</h3>
        </div>
        <p className="text-white/90 mb-4">
          Upload your existing customer list via CSV or manually add contacts one by one. Our system supports most common formats and includes automatic duplicate detection.
        </p>
        <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-2">CSV Requirements:</h4>
          <ul className="space-y-1 text-white/80 text-sm">
            <li>• Email address (required)</li>
            <li>• First and last name (recommended)</li>
            <li>• Phone number (optional, enables SMS)</li>
            <li>• Custom tags (optional)</li>
          </ul>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold">2</div>
          <h3 className="text-xl font-semibold text-white">Organize & Segment</h3>
        </div>
        <p className="text-white/90 mb-4">
          Use tags, groups, and custom fields to organize your contacts. Create segments like "VIP customers," "recent purchases," or "event attendees" for targeted campaigns.
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold">3</div>
          <h3 className="text-xl font-semibold text-white">Send Targeted Requests</h3>
        </div>
        <p className="text-white/90 mb-4">
          Launch personalized review request campaigns via email, SMS, or QR codes. Target specific groups with relevant messaging and optimal timing.
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-semibold">4</div>
          <h3 className="text-xl font-semibold text-white">Track & Optimize</h3>
        </div>
        <p className="text-white/90 mb-4">
          Monitor response rates, identify top-performing segments, and continuously refine your approach for better results.
        </p>
      </div>
    </div>
  );

  // Best practices section
  const bestPractices = (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <CheckCircle className="w-8 h-8 text-green-300 mb-3" />
        <h3 className="text-lg font-semibold text-white mb-3">Start with Happy Customers</h3>
        <p className="text-white/80 text-sm mb-3">
          Focus on customers who had positive experiences first. They're more likely to leave glowing reviews.
        </p>
        <p className="text-purple-300 text-sm font-medium">
          💡 Use your CRM or sales data to identify satisfied customers
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <Target className="w-8 h-8 text-blue-300 mb-3" />
        <h3 className="text-lg font-semibold text-white mb-3">Quality Over Quantity</h3>
        <p className="text-white/80 text-sm mb-3">
          A smaller list of engaged customers beats a large list of cold contacts every time.
        </p>
        <p className="text-purple-300 text-sm font-medium">
          💡 Aim for 100 quality contacts rather than 1000 random ones
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <MessageSquare className="w-8 h-8 text-purple-300 mb-3" />
        <h3 className="text-lg font-semibold text-white mb-3">Personalize Your Approach</h3>
        <p className="text-white/80 text-sm mb-3">
          Use the information you have about each customer to make your review requests feel personal.
        </p>
        <p className="text-purple-300 text-sm font-medium">
          💡 Reference specific services, dates, or interactions in your requests
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <Clock className="w-8 h-8 text-orange-300 mb-3" />
        <h3 className="text-lg font-semibold text-white mb-3">Timing is Everything</h3>
        <p className="text-white/80 text-sm mb-3">
          Send review requests when the experience is fresh but not overwhelming.
        </p>
        <p className="text-purple-300 text-sm font-medium">
          💡 Wait 1-3 days after service completion, before the next interaction
        </p>
      </div>
    </div>
  );

  // Custom sections for import methods and organization features
  const customSections = (
    <div className="max-w-4xl mx-auto">
      {/* Import Methods */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-8">Import Methods</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Upload className="w-5 h-5 text-blue-300" />
              </div>
              <h3 className="font-semibold text-white">CSV Import</h3>
            </div>

            <p className="text-white/70 mb-4">Upload your existing customer list in seconds. We support most common formats.</p>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-white mb-2">Features:</h4>
              <ul className="text-sm text-white/70 space-y-1">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                  <span>Bulk import</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                  <span>Duplicate detection</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                  <span>Auto-formatting</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                  <span>Error checking</span>
                </li>
              </ul>
            </div>

            <div className="text-sm text-white/60 mb-2">
              <strong>Best for:</strong> Existing customer databases, CRM exports
            </div>

            <div className="text-sm text-blue-300 font-medium">
              ⏱️ 2-5 minutes
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Plus className="w-5 h-5 text-green-300" />
              </div>
              <h3 className="font-semibold text-white">Manual Entry</h3>
            </div>

            <p className="text-white/70 mb-4">Add contacts one by one with detailed information and custom fields.</p>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-white mb-2">Features:</h4>
              <ul className="text-sm text-white/70 space-y-1">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                  <span>Detailed profiles</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                  <span>Custom fields</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                  <span>Notes & tags</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                  <span>Relationship tracking</span>
                </li>
              </ul>
            </div>

            <div className="text-sm text-white/60 mb-2">
              <strong>Best for:</strong> Small lists, VIP customers
            </div>

            <div className="text-sm text-green-300 font-medium">
              ⏱️ 1-2 minutes per contact
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Globe className="w-5 h-5 text-purple-300" />
              </div>
              <h3 className="font-semibold text-white">QR Collection</h3>
            </div>

            <p className="text-white/70 mb-4">Let customers add themselves to your database through QR codes.</p>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-white mb-2">Features:</h4>
              <ul className="text-sm text-white/70 space-y-1">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                  <span>Self-service</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                  <span>Real-time updates</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                  <span>Mobile-friendly</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                  <span>No manual work</span>
                </li>
              </ul>
            </div>

            <div className="text-sm text-white/60 mb-2">
              <strong>Best for:</strong> In-person interactions, events
            </div>

            <div className="text-sm text-purple-300 font-medium">
              ⏱️ Instant
            </div>
          </div>
        </div>
      </div>

      {/* Communication Channels */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-8">Communication Channels</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Mail className="w-5 h-5 text-blue-300" />
              </div>
              <h3 className="font-semibold text-white">Email Requests</h3>
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

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <MessageSquare className="w-5 h-5 text-green-300" />
              </div>
              <h3 className="font-semibold text-white">SMS Requests</h3>
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

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <QrCode className="w-5 h-5 text-purple-300" />
              </div>
              <h3 className="font-semibold text-white">QR Code Sharing</h3>
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
      </div>

      {/* Plan Limitations */}
      <div className="mb-12">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-300 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Plan Requirements</h3>
              <p className="text-white/80 mb-3">
                Contact management is not available on the Grower plan. Upgrade to Builder or Maven to access these features.
              </p>
              <Link href="/getting-started/choosing-plan" className="text-yellow-200 hover:text-yellow-100 underline">
                Learn about plan differences →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
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

        <StandardOverviewLayout
          title="Customer Contact Management"
          description="Build and organize your customer database for targeted review requests and better engagement."
          icon={Users}
          iconColor="blue"
          availablePlans={['builder', 'maven']}

          introduction={
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Why Your Contact List Matters</h3>
              <p className="text-white/90 mb-3">
                The quality of your customer database directly impacts your review collection success.
                A well-organized list of engaged customers will generate more and better reviews than
                a large list of cold contacts.
              </p>
              <p className="text-white/80">
                <strong>Think of it this way:</strong> You wouldn't send a wedding invitation to everyone
                in your phone book. You'd send it to people who care about you and would want to celebrate.
                The same principle applies to review requests.
              </p>
            </div>
          }

          keyFeatures={keyFeatures}
          keyPoints={keyPoints}
          howItWorks={howItWorks}
          bestPractices={bestPractices}
          customSections={customSections}

          faqs={pageFAQs['contacts']}

          ctaTitle="Ready to Build Your Contact Database?"
          ctaDescription="Start with your best customers and build from there. Remember, quality beats quantity when it comes to review requests."
          ctaButtons={[
            {
              text: 'Create Prompt Pages',
              href: '/prompt-pages',
              variant: 'secondary'
            },
            {
              text: 'Add Your First Contacts',
              href: '/getting-started/adding-contacts',
              variant: 'primary',
              icon: ArrowRight
            }
          ]}
        />
      </div>
    </DocsLayout>
  );
}
import type { Metadata } from 'next'
import Link from 'next/link'
import StandardOverviewLayout from '../../components/StandardOverviewLayout'
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
    canonical: 'https://docs.promptreviews.app/contacts',
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

  // How it works steps
  const howItWorks = [
    {
      number: 1,
      title: 'Import Your Contacts',
      description: 'Upload your existing customer list via CSV or manually add contacts one by one. Our system supports most common formats and includes automatic duplicate detection.',
      icon: Upload
    },
    {
      number: 2,
      title: 'Organize & Segment',
      description: 'Use tags, groups, and custom fields to organize your contacts. Create segments like "VIP customers," "recent purchases," or "event attendees" for targeted campaigns.',
      icon: Tags
    },
    {
      number: 3,
      title: 'Send Targeted Requests',
      description: 'Launch personalized review request campaigns via email, SMS, or QR codes. Target specific groups with relevant messaging and optimal timing.',
      icon: MessageSquare
    },
    {
      number: 4,
      title: 'Track & Optimize',
      description: 'Monitor response rates, identify top-performing segments, and continuously refine your approach for better results.',
      icon: Target
    }
  ];

  // Best practices section
  const bestPractices = [
    {
      icon: CheckCircle,
      title: 'Start with Happy Customers',
      description: 'Focus on customers who had positive experiences first. They\'re more likely to leave glowing reviews. Use your CRM or sales data to identify satisfied customers.'
    },
    {
      icon: Target,
      title: 'Quality Over Quantity',
      description: 'A smaller list of engaged customers beats a large list of cold contacts every time. Aim for 100 quality contacts rather than 1000 random ones.'
    },
    {
      icon: MessageSquare,
      title: 'Personalize Your Approach',
      description: 'Use the information you have about each customer to make your review requests feel personal. Reference specific services, dates, or interactions in your requests.'
    },
    {
      icon: Clock,
      title: 'Timing is Everything',
      description: 'Send review requests when the experience is fresh but not overwhelming. Wait 1-3 days after service completion, before the next interaction.'
    }
  ];


  return (
    <StandardOverviewLayout
      title="Managing your customer contacts"
      description="Your customer database is the foundation of successful review collection. Learn how to import, organize, and manage your contacts to get the most from your review requests."
      categoryLabel="Contact Management"
      categoryIcon={Users}
      categoryColor="blue"
      currentPage="Contact Management"
      availablePlans={['builder', 'maven']}
      keyFeatures={keyFeatures}
      howItWorks={howItWorks}
      bestPractices={bestPractices}
      faqs={pageFAQs['contacts']}
      callToAction={{
        secondary: {
          text: 'Create Prompt Pages',
          href: '/prompt-pages'
        },
        primary: {
          text: 'Add Your First Contacts',
          href: '/getting-started/adding-contacts'
        }
      }}
      overview={{
        title: 'Why Your Contact List Matters',
        content: (
          <>
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
          </>
        )
      }}
    />
  );
}
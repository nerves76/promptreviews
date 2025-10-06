import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import StandardOverviewLayout from '../../components/StandardOverviewLayout'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import { pageFAQs } from '../utils/faqData'
import { getArticleBySlug } from '@/lib/docs/articles'
import {
  Code2,
  Globe,
  Shield,
  Zap,
  Database,
  Key,
  Webhook,
  FileText,
  Settings,
  Monitor,
  Clock,
  CheckCircle,
  AlertTriangle,
  Book,
  Terminal,
  Sparkles,
  Link2
} from 'lucide-react'

const fallbackDescription = 'Complete API documentation for PromptReviews. Learn how to integrate review collection, manage widgets, handle webhooks, and automate your review process.'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const article = await getArticleBySlug('api')
    if (!article) {
      return {
        title: 'API Documentation - Integrate with PromptReviews | Developer Guide',
        description: fallbackDescription,
        keywords: [
          'PromptReviews API',
          'review collection API',
          'widget API',
          'webhook integration',
          'developer documentation',
          'REST API',
          'review management API'
        ],
        alternates: {
          canonical: 'https://docs.promptreviews.app/api',
        },
      }
    }

    const seoTitle = article.metadata?.seo_title || article.title
    const seoDescription = article.metadata?.seo_description || article.metadata?.description || fallbackDescription

    return {
      title: `${seoTitle} | Prompt Reviews`,
      description: seoDescription,
      keywords: article.metadata?.keywords ?? [
        'PromptReviews API',
        'review collection API',
        'widget API',
        'webhook integration',
        'developer documentation',
        'REST API',
        'review management API'
      ],
      alternates: {
        canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/api',
      },
    }
  } catch (error) {
    console.error('generateMetadata api error:', error)
    return {
      title: 'API Documentation - Integrate with PromptReviews | Developer Guide',
      description: fallbackDescription,
      alternates: {
        canonical: 'https://docs.promptreviews.app/api',
      },
    }
  }
}

const keyFeatures = [
  {
    icon: Code2,
    title: 'RESTful API Design',
    description: 'Clean, intuitive REST endpoints with JSON responses. Follow standard HTTP methods and status codes for predictable integration.',
    href: '#rest-endpoints'
  },
  {
    icon: Shield,
    title: 'Secure Authentication',
    description: 'OAuth 2.0 and API key authentication with fine-grained permissions. Your data stays secure with industry-standard practices.',
    href: '#authentication'
  },
  {
    icon: Webhook,
    title: 'Real-time Webhooks',
    description: 'Get instant notifications when reviews are submitted, updated, or responded to. Perfect for automated workflows.',
    href: '#webhooks'
  },
  {
    icon: Globe,
    title: 'Public Review APIs',
    description: 'Display reviews on your website with public APIs. No authentication required for reading approved reviews.',
    href: '#public-apis'
  },
  {
    icon: Database,
    title: 'Bulk Operations',
    description: 'Import contacts, export review data, and manage multiple resources efficiently with batch endpoints.',
    href: '#bulk-operations'
  },
  {
    icon: Zap,
    title: 'Rate Limiting',
    description: 'Fair usage policies with generous limits. Scale your integration without hitting unexpected barriers.',
    href: '#rate-limiting'
  }
];

const howItWorks = [
  {
    number: 1,
    title: 'Get Your API Keys',
    description: 'Generate API keys in your PromptReviews dashboard. Choose between read-only or full access permissions based on your needs.',
    icon: Key
  },
  {
    number: 2,
    title: 'Make Your First Request',
    description: 'Start with a simple GET request to fetch your business profile or reviews. All endpoints return JSON with consistent structure.',
    icon: Terminal
  },
  {
    number: 3,
    title: 'Handle Responses',
    description: 'Process JSON responses with standardized error handling. All endpoints follow the same response format for easy parsing.',
    icon: FileText
  },
  {
    number: 4,
    title: 'Set Up Webhooks',
    description: 'Configure webhooks to receive real-time updates. Perfect for triggering automated workflows or updating your systems.',
    icon: Settings
  }
];

const bestPractices = [
  {
    icon: Shield,
    title: 'Secure Your API Keys',
    description: 'Never expose API keys in client-side code. Use environment variables and rotate keys regularly. Consider using read-only keys when possible.'
  },
  {
    icon: Clock,
    title: 'Implement Proper Error Handling',
    description: 'Handle rate limits, network errors, and API failures gracefully. Implement exponential backoff for retries and log errors appropriately.'
  },
  {
    icon: Monitor,
    title: 'Cache Strategically',
    description: 'Cache public data like reviews and business profiles to reduce API calls. Respect cache-control headers and implement reasonable TTLs.'
  },
  {
    icon: Zap,
    title: 'Use Webhooks for Real-time Updates',
    description: 'Instead of polling for changes, use webhooks to get instant notifications. This reduces API usage and improves user experience.'
  }
];


export default async function APIDocumentationPage() {
  let article = null

  try {
    article = await getArticleBySlug('api')
  } catch (error) {
    console.error('Error fetching api article:', error)
  }

  if (!article) {
    notFound()
  }

  const overviewContent = (
  <>
    <MarkdownRenderer content={article.content} />

    <div className="mt-8 grid md:grid-cols-3 gap-6">
      <div className="text-center">
        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Code2 className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-semibold text-white mb-2">Developer-Friendly</h3>
        <p className="text-white/80 text-sm">
          RESTful design with comprehensive documentation and code examples
        </p>
      </div>

      <div className="text-center">
        <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Globe className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-semibold text-white mb-2">Public & Private APIs</h3>
        <p className="text-white/80 text-sm">
          Public endpoints for displaying reviews, private APIs for management
        </p>
      </div>

      <div className="text-center">
        <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Webhook className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-semibold text-white mb-2">Real-time Events</h3>
        <p className="text-white/80 text-sm">
          Webhook notifications for instant updates and automated workflows
        </p>
      </div>
    </div>

    {/* API Endpoints Overview */}
    <div className="mt-8 space-y-6">
      <h3 className="text-xl font-semibold text-white text-center mb-4">Available Endpoints</h3>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="font-medium text-white mb-2 flex items-center">
            <Shield className="w-4 h-4 mr-2 text-green-400" />
            Authentication & Account
          </h4>
          <div className="space-y-1 text-sm text-white/70">
            <div><code className="text-yellow-300">GET /api/auth/me</code> - Get current user</div>
            <div><code className="text-yellow-300">GET /api/businesses</code> - List businesses</div>
            <div><code className="text-yellow-300">PUT /api/businesses/:id</code> - Update business</div>
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="font-medium text-white mb-2 flex items-center">
            <FileText className="w-4 h-4 mr-2 text-yellow-400" />
            Prompt Pages
          </h4>
          <div className="space-y-1 text-sm text-white/70">
            <div><code className="text-yellow-300">GET /api/prompt-pages</code> - List pages</div>
            <div><code className="text-yellow-300">POST /api/prompt-pages</code> - Create page</div>
            <div><code className="text-yellow-300">PUT /api/prompt-pages/:id</code> - Update page</div>
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="font-medium text-white mb-2 flex items-center">
            <Globe className="w-4 h-4 mr-2 text-purple-400" />
            Reviews
          </h4>
          <div className="space-y-1 text-sm text-white/70">
            <div><code className="text-yellow-300">GET /api/reviews</code> - List reviews</div>
            <div><code className="text-yellow-300">POST /api/reviews</code> - Submit review</div>
            <div><code className="text-yellow-300">PUT /api/reviews/:id/respond</code> - Respond to review</div>
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="font-medium text-white mb-2 flex items-center">
            <Settings className="w-4 h-4 mr-2 text-orange-400" />
            Widgets
          </h4>
          <div className="space-y-1 text-sm text-white/70">
            <div><code className="text-yellow-300">GET /api/widgets</code> - List widgets</div>
            <div><code className="text-yellow-300">POST /api/widgets</code> - Create widget</div>
            <div><code className="text-yellow-300">GET /api/widgets/:id/embed</code> - Get embed code</div>
          </div>
        </div>
      </div>
    </div>

    {/* Quick Start Example */}
    <div className="mt-8">
      <h3 className="text-xl font-semibold text-white mb-4">Quick Start Example</h3>
      <div className="bg-gray-900/50 rounded-lg p-4 border border-white/10">
        <pre className="text-green-400 text-sm overflow-x-auto">
{`# Get your business profile
curl -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     https://api.promptreviews.app/api/businesses/me

# List your reviews
curl -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     https://api.promptreviews.app/api/reviews?limit=10`}
        </pre>
      </div>
    </div>
  </>
);
  return (
    <StandardOverviewLayout
      title="PromptReviews API: Build powerful review integrations"
      description="Complete REST API for integrating review collection, management, and display into your applications. Webhooks, bulk operations, and real-time updates included."
      categoryLabel="Developer API"
      categoryIcon={Code2}
      categoryColor="blue"
      currentPage="API Documentation"
      availablePlans={['grower', 'builder', 'maven']}
      keyFeatures={keyFeatures}
      howItWorks={howItWorks}
      bestPractices={bestPractices}
      faqs={pageFAQs['api']}
      callToAction={{
        primary: {
          text: 'View API Reference',
          href: '/api/reference'
        }
      }}
      overview={{
        title: 'What is the PromptReviews API?',
        content: overviewContent
      }}
    />
  )
}
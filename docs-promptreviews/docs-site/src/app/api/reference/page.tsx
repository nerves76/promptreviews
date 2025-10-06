import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import DocsLayout from '../../docs-layout'
import PageHeader from '../../components/PageHeader'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import { getArticleBySlug } from '@/lib/docs/articles'
import { Code2, Shield, Database, Webhook, Globe, Key } from 'lucide-react'
const fallbackDescription = 'Complete API reference for PromptReviews. Detailed endpoint documentation, request/response examples, and integration guides.'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const article = await getArticleBySlug('api/reference')
    if (!article) {
      return {
        title: 'API Reference - PromptReviews Developer Documentation',
        description: fallbackDescription,
        keywords: [
          'PromptReviews API reference',
          'API endpoints',
          'REST API documentation',
          'developer guide',
          'API examples'
        ],
        alternates: {
          canonical: 'https://docs.promptreviews.app/api/reference',
        },
      }
    }

    const seoTitle = article.metadata?.seo_title || article.title
    const seoDescription = article.metadata?.seo_description || article.metadata?.description || fallbackDescription

    return {
      title: `${seoTitle} | Prompt Reviews`,
      description: seoDescription,
      keywords: article.metadata?.keywords ?? [
        'PromptReviews API reference',
        'API endpoints',
        'REST API documentation',
        'developer guide',
        'API examples'
      ],
      alternates: {
        canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/api/reference',
      },
    }
  } catch (error) {
    console.error('generateMetadata api/reference error:', error)
    return {
      title: 'API Reference - PromptReviews Developer Documentation',
      description: fallbackDescription,
      alternates: {
        canonical: 'https://docs.promptreviews.app/api/reference',
      },
    }
  }
}

export default async function APIReferencePage() {
  let article = null

  try {
    article = await getArticleBySlug('api/reference')
  } catch (error) {
    console.error('Error fetching api/reference article:', error)
  }

  if (!article) {
    notFound()
  }
  return (
    <DocsLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' },
            { label: 'API Documentation', href: '/api' }
          ]}
          currentPage="API Reference"
          categoryLabel="Developer API"
          categoryIcon={Code2}
          categoryColor="blue"
          title="API Reference & Integration Guide"
          description="Complete endpoint documentation with examples, authentication guides, and best practices for integrating with PromptReviews."
        />

        {/* Article Content */}
        <div className="mb-12">
          <MarkdownRenderer content={article.content} />
        </div>

        {/* Base URL and Authentication */}
        <div className="mb-12">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Getting Started</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Base URL
                </h3>
                <div className="bg-gray-900/50 rounded-lg p-4 border border-white/10">
                  <code className="text-green-400">https://api.promptreviews.app</code>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Key className="w-5 h-5 mr-2" />
                  Authentication
                </h3>
                <p className="text-white/80 mb-4">
                  All API requests require authentication using an API key in the Authorization header:
                </p>
                <div className="bg-gray-900/50 rounded-lg p-4 border border-white/10">
                  <pre className="text-green-400 text-sm">
{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     https://api.promptreviews.app/api/businesses/me`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Authentication Endpoints */}
        <div className="mb-12">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Shield className="w-6 h-6 mr-3 text-green-400" />
              Authentication & Account
            </h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  <span className="bg-blue-500/20 text-yellow-300 px-2 py-1 rounded text-sm mr-3">GET</span>
                  /api/auth/me
                </h3>
                <p className="text-white/80 mb-4">Get current authenticated user information.</p>

                <div className="mb-4">
                  <h4 className="font-medium text-white mb-2">Example Response</h4>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-white/10">
                    <pre className="text-sm text-white/90 overflow-x-auto">
{`{
  "id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "accounts": [
    {
      "id": "account_456",
      "name": "My Business",
      "plan": "builder"
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  <span className="bg-blue-500/20 text-yellow-300 px-2 py-1 rounded text-sm mr-3">GET</span>
                  /api/businesses
                </h3>
                <p className="text-white/80 mb-4">List all businesses for the authenticated account.</p>

                <div className="mb-4">
                  <h4 className="font-medium text-white mb-2">Query Parameters</h4>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-white/10">
                    <div className="space-y-2 text-sm">
                      <div><code className="text-yellow-300">limit</code> <span className="text-white/60">- Number of businesses to return (default: 50)</span></div>
                      <div><code className="text-yellow-300">offset</code> <span className="text-white/60">- Number of businesses to skip (default: 0)</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Endpoints */}
        <div className="mb-12">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Globe className="w-6 h-6 mr-3 text-purple-400" />
              Reviews Management
            </h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  <span className="bg-blue-500/20 text-yellow-300 px-2 py-1 rounded text-sm mr-3">GET</span>
                  /api/reviews
                </h3>
                <p className="text-white/80 mb-4">Fetch reviews for your business with filtering options.</p>

                <div className="mb-4">
                  <h4 className="font-medium text-white mb-2">Query Parameters</h4>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-white/10">
                    <div className="space-y-2 text-sm">
                      <div><code className="text-yellow-300">business_id</code> <span className="text-white/60">- Filter by business ID</span></div>
                      <div><code className="text-yellow-300">rating</code> <span className="text-white/60">- Filter by rating (1-5)</span></div>
                      <div><code className="text-yellow-300">limit</code> <span className="text-white/60">- Number of reviews to return (default: 20)</span></div>
                      <div><code className="text-yellow-300">sort</code> <span className="text-white/60">- Sort order: 'newest', 'oldest', 'rating_high', 'rating_low'</span></div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-white mb-2">Example Request</h4>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-white/10">
                    <pre className="text-green-400 text-sm">
{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
     "https://api.promptreviews.app/api/reviews?rating=5&limit=10"`}
                    </pre>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-white mb-2">Example Response</h4>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-white/10">
                    <pre className="text-sm text-white/90 overflow-x-auto">
{`{
  "reviews": [
    {
      "id": "review_789",
      "rating": 5,
      "content": "Excellent service! Highly recommended.",
      "author": {
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "created_at": "2024-01-15T10:30:00Z",
      "business_id": "business_456",
      "prompt_page_id": "page_123"
    }
  ],
  "total": 45,
  "has_more": true
}`}
                    </pre>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-sm mr-3">POST</span>
                  /api/reviews
                </h3>
                <p className="text-white/80 mb-4">Submit a new review (typically used by prompt pages).</p>

                <div className="mb-4">
                  <h4 className="font-medium text-white mb-2">Request Body</h4>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-white/10">
                    <pre className="text-sm text-white/90 overflow-x-auto">
{`{
  "business_id": "business_456",
  "prompt_page_id": "page_123",
  "rating": 5,
  "content": "Great experience!",
  "author": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "platforms": ["google", "facebook"]
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prompt Pages Endpoints */}
        <div className="mb-12">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Database className="w-6 h-6 mr-3 text-yellow-400" />
              Prompt Pages
            </h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  <span className="bg-blue-500/20 text-yellow-300 px-2 py-1 rounded text-sm mr-3">GET</span>
                  /api/prompt-pages
                </h3>
                <p className="text-white/80 mb-4">List all prompt pages for your account.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-sm mr-3">POST</span>
                  /api/prompt-pages
                </h3>
                <p className="text-white/80 mb-4">Create a new prompt page.</p>

                <div className="mb-4">
                  <h4 className="font-medium text-white mb-2">Request Body Example</h4>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-white/10">
                    <pre className="text-sm text-white/90 overflow-x-auto">
{`{
  "type": "service",
  "title": "Hair Styling Service Review",
  "description": "Tell us about your experience",
  "business_id": "business_456",
  "customization": {
    "primary_color": "#3B82F6",
    "show_logo": true,
    "background_type": "gradient"
  },
  "settings": {
    "require_email": true,
    "allow_anonymous": false,
    "platforms": ["google", "facebook"]
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Webhooks */}
        <div className="mb-12">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Webhook className="w-6 h-6 mr-3 text-orange-400" />
              Webhooks
            </h2>

            <p className="text-white/80 mb-6">
              Webhooks allow you to receive real-time notifications when events occur in your PromptReviews account.
              Available on Builder and Maven plans.
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Supported Events</h3>
                <div className="bg-gray-900/50 rounded-lg p-4 border border-white/10">
                  <div className="space-y-2 text-sm">
                    <div><code className="text-yellow-300">review.created</code> <span className="text-white/60">- New review submitted</span></div>
                    <div><code className="text-yellow-300">review.responded</code> <span className="text-white/60">- Review response added</span></div>
                    <div><code className="text-yellow-300">prompt_page.visited</code> <span className="text-white/60">- Prompt page viewed</span></div>
                    <div><code className="text-yellow-300">business.updated</code> <span className="text-white/60">- Business profile updated</span></div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Webhook Payload Example</h3>
                <div className="bg-gray-900/50 rounded-lg p-4 border border-white/10">
                  <pre className="text-sm text-white/90 overflow-x-auto">
{`{
  "event": "review.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "review": {
      "id": "review_789",
      "rating": 5,
      "content": "Great service!",
      "author": {
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "business_id": "business_456",
      "prompt_page_id": "page_123"
    }
  },
  "signature": "sha256=abc123..."
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Verifying Webhook Signatures</h3>
                <p className="text-white/80 mb-4">
                  All webhooks include a signature in the <code className="text-yellow-300">X-PromptReviews-Signature</code> header.
                  Verify this to ensure the request came from PromptReviews.
                </p>
                <div className="bg-gray-900/50 rounded-lg p-4 border border-white/10">
                  <pre className="text-green-400 text-sm">
{`const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from('sha256=' + expectedSignature)
  );
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rate Limits & Error Handling */}
        <div className="mb-12">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Rate Limits & Error Handling</h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Rate Limits</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/80">Authenticated requests:</span>
                    <span className="text-green-400">1,000/hour</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Public APIs:</span>
                    <span className="text-green-400">100/hour</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Premium plans:</span>
                    <span className="text-green-400">5,000/hour</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">HTTP Status Codes</h3>
                <div className="space-y-3 text-sm">
                  <div><span className="text-green-400">200</span> <span className="text-white/80">- Success</span></div>
                  <div><span className="text-yellow-400">400</span> <span className="text-white/80">- Bad Request</span></div>
                  <div><span className="text-red-400">401</span> <span className="text-white/80">- Unauthorized</span></div>
                  <div><span className="text-orange-400">429</span> <span className="text-white/80">- Rate Limited</span></div>
                  <div><span className="text-red-400">500</span> <span className="text-white/80">- Server Error</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DocsLayout>
  )
}
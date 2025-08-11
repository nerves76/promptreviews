import type { Metadata } from 'next'
import Link from 'next/link'
import DocsLayout from '../docs-layout'
import PageHeader from '../components/PageHeader'
import { 
  BarChart3, 
  Zap, 
  Settings, 
  Globe,
  Clock,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Target,
  Brain
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Advanced Features - Analytics, Automation & API | Prompt Reviews Help',
  description: 'Explore advanced features in Prompt Reviews including analytics, automation, API access, and custom integrations.',
  keywords: [
    'advanced features',
    'analytics',
    'automation',
    'API access',
    'custom integrations',
    'webhooks'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/advanced',
  },
}

export default function AdvancedPage() {
  return (
    <DocsLayout>
      {/* Hero Section */}
      <PageHeader
        breadcrumbs={[
          { label: 'Help', href: '/' }
        ]}
        currentPage="Advanced Features"
        categoryLabel="Advanced Features"
        categoryIcon={BarChart3}
        categoryColor="pink"
        title="Advanced features & analytics"
        description="Take your review management to the next level with analytics, automation, API access, and custom integrations."
      />

      {/* Analytics Dashboard */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Analytics Dashboard</h2>
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
          <p className="text-white/90 mb-6">
            Deep insights into your review performance and customer sentiment.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Performance Metrics</h3>
              <ul className="space-y-2 text-white/80 text-sm">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Review velocity trends</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Average rating over time</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Response rate analytics</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Platform distribution</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Customer Insights</h3>
              <ul className="space-y-2 text-white/80 text-sm">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Sentiment analysis</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Keyword frequency</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Customer segmentation</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Review quality scores</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Automation Features */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Automation & Workflows</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <Clock className="w-8 h-8 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Scheduled Campaigns</h3>
            <p className="text-white/80">
              Set up automated review request campaigns based on triggers like service completion or time intervals.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <Zap className="w-8 h-8 text-yellow-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Smart Follow-ups</h3>
            <p className="text-white/80">
              Automatically send follow-up messages to customers who haven't responded to initial requests.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <Brain className="w-8 h-8 text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">AI Optimization</h3>
            <p className="text-white/80">
              Let AI-powered optimization improve your request timing and messaging for maximum response rates.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <Target className="w-8 h-8 text-green-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Conditional Logic</h3>
            <p className="text-white/80">
              Create workflows with if-then rules based on customer behavior and review responses.
            </p>
          </div>
        </div>
      </div>

      {/* API & Integrations */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">API & Custom Integrations</h2>
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">REST API</h3>
              <p className="text-white/80 mb-4">
                Full API access for custom integrations with your existing tools and workflows.
              </p>
              <ul className="text-sm text-white/70 space-y-1">
                <li>• Create and manage prompt pages</li>
                <li>• Send review requests</li>
                <li>• Retrieve review data</li>
                <li>• Manage contacts</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Webhooks</h3>
              <p className="text-white/80 mb-4">
                Real-time notifications when important events occur in your account.
              </p>
              <ul className="text-sm text-white/70 space-y-1">
                <li>• New review submitted</li>
                <li>• Review published</li>
                <li>• Contact added</li>
                <li>• Campaign completed</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 bg-blue-400/10 border border-blue-400/20 rounded-lg p-4">
            <p className="text-white/90 text-sm">
              <strong className="text-blue-300">Developer Resources:</strong> Full API documentation, SDKs, and code examples available in your dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Advanced Settings</h2>
        
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Settings className="w-6 h-6 text-indigo-300 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium mb-1">Custom Domain</p>
                <p className="text-white/70 text-sm">Use your own domain for prompt pages and widgets</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Globe className="w-6 h-6 text-blue-300 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium mb-1">White Label Options</p>
                <p className="text-white/70 text-sm">Remove Prompt Reviews branding on premium plans</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-6 h-6 text-green-300 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium mb-1">Advanced Analytics</p>
                <p className="text-white/70 text-sm">Export raw data for custom analysis and reporting</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Level Up?</h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Unlock advanced features to maximize your review management capabilities.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/troubleshooting"
              className="inline-flex items-center space-x-2 bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 border border-white/30 transition-colors font-medium backdrop-blur-sm"
            >
              <span>Troubleshooting</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            
            <a
              href="https://promptreviews.com/dashboard/analytics"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <span>View Analytics</span>
              <BarChart3 className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </DocsLayout>
  )
}
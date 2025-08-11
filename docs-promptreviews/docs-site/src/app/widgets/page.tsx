import type { Metadata } from 'next'
import Link from 'next/link'
import DocsLayout from '../docs-layout'
import { 
  Code, 
  Smartphone, 
  Monitor, 
  Palette, 
  Copy,
  CheckCircle,
  ArrowRight,
  Settings,
  Zap,
  Star,
  Globe
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Widgets - Display Reviews on Your Website | Prompt Reviews Help',
  description: 'Learn how to create and customize review widgets. Display customer reviews on your website with customizable widgets that match your brand.',
  keywords: [
    'review widget',
    'website integration',
    'embed reviews',
    'review display',
    'widget customization',
    'website reviews'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/widgets',
  },
}

export default function WidgetsPage() {
  return (
    <DocsLayout>
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto mb-16">
        <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Code className="w-4 h-4" />
          <span>Review Widgets</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 text-balance">
          Review Widgets for Your Website
        </h1>
        
        <p className="text-xl text-white/90 mb-8 text-balance">
          Create customizable widgets to display your reviews on any website. Choose from different 
          layouts, customize colors and styling, and embed with simple HTML code.
        </p>
      </div>

      {/* Widget Overview */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">What Are Review Widgets?</h2>
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 mb-8">
          <p className="text-white/90 mb-4">
            Review widgets allow you to display your customer reviews directly on your website. Create custom widgets that match your brand, 
            choose which reviews to show, and embed them anywhere on your site.
          </p>
          <p className="text-white/90">
            Each widget is fully customizable with different layouts, colors, and display options. You can filter reviews by rating, 
            date, or specific keywords to showcase your best customer feedback.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <Star className="w-8 h-8 text-yellow-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Widget Display</h3>
            <p className="text-white/80 mb-4">
              Show your reviews in a beautiful, customizable widget on your website.
            </p>
            <ul className="text-sm text-white/70 space-y-1">
              <li>• Display star ratings</li>
              <li>• Show reviewer names and dates</li>
              <li>• Include review text</li>
              <li>• Add verified badges</li>
            </ul>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <Monitor className="w-8 h-8 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Layout Options</h3>
            <p className="text-white/80 mb-4">
              Choose from different layout styles to match your website design.
            </p>
            <ul className="text-sm text-white/70 space-y-1">
              <li>• List view for multiple reviews</li>
              <li>• Card layout with borders</li>
              <li>• Compact view for sidebars</li>
              <li>• Full-width testimonial style</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Installation Process */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">How to Create and Install Widgets</h2>
        
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">1</div>
              <h3 className="text-xl font-semibold text-white">Create Your Widget</h3>
            </div>
            <p className="text-white/90 mb-4">
              Go to the Widgets section in your dashboard and click "Create New Widget". Choose which reviews to display.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold">2</div>
              <h3 className="text-xl font-semibold text-white">Customize Your Widget</h3>
            </div>
            <p className="text-white/90 mb-4">
              Customize colors, fonts, layout, and display options. Filter reviews by rating or date. Preview your widget in real-time.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold">3</div>
              <h3 className="text-xl font-semibold text-white">Embed on Your Website</h3>
            </div>
            <p className="text-white/90 mb-4">
              Copy the generated embed code and paste it into your website's HTML. The widget will automatically load and display your reviews.
            </p>
            <div className="bg-white/5 rounded-lg p-4 font-mono text-sm text-green-300">
              {`<!-- Prompt Reviews Widget -->`}<br/>
              {`<div id="prompt-reviews-widget-[id]"></div>`}<br/>
              {`<script src="https://app.promptreviews.com/widget/[id].js"></script>`}
            </div>
          </div>
        </div>
      </div>

      {/* Widget Customization */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Widget Customization</h2>
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Palette className="w-5 h-5 mr-2" />
                Style Options
              </h3>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Background colors</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Text colors and fonts</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Border radius and shadows</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Star rating colors</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Display Options
              </h3>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Number of reviews to show</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Minimum star rating filter</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Show/hide dates</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Review text length</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Where to Use Widgets</h2>
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
          <p className="text-white/90 mb-6">
            Review widgets can be embedded anywhere on your website to build trust and credibility.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-white mb-3">Popular Placements</h3>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-start space-x-2">
                  <span className="text-green-300">→</span>
                  <span>Homepage testimonial section</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-300">→</span>
                  <span>Product or service pages</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-300">→</span>
                  <span>Sidebar on blog posts</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-300">→</span>
                  <span>Footer for social proof</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-3">Benefits</h3>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-300">→</span>
                  <span>Build trust with visitors</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-300">→</span>
                  <span>Increase conversion rates</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-300">→</span>
                  <span>Show real customer feedback</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-300">→</span>
                  <span>Improve SEO with fresh content</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Widget Management */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Managing Your Widgets</h2>
        
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Widget Dashboard</h3>
              <p className="text-white/80 mb-4">
                Manage all your widgets from a central dashboard. Create new widgets, edit existing ones, 
                and track performance metrics.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-white/90 font-medium mb-1">Multiple Widgets</p>
                <p className="text-white/70">Create unlimited widgets for different pages</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-white/90 font-medium mb-1">Real-time Updates</p>
                <p className="text-white/70">Changes appear instantly on your site</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-white/90 font-medium mb-1">Analytics</p>
                <p className="text-white/70">Track views and engagement</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Add Reviews to Your Website?</h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Start showcasing your customer reviews and build trust with website visitors.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/troubleshooting"
              className="inline-flex items-center space-x-2 bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 border border-white/30 transition-colors font-medium backdrop-blur-sm"
            >
              <span>Troubleshooting Guide</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            
            <a
              href="https://app.promptreviews.com/dashboard/widgets"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <span>Go to Widgets Dashboard</span>
              <Code className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </DocsLayout>
  )
}
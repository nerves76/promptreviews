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
  title: 'Website Integration - Review Widgets & Embeds | Prompt Reviews Help',
  description: 'Learn how to embed Prompt Reviews widgets on your website. Display customer reviews, star ratings, and review collection forms with customizable designs.',
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
          <span>Website Integration</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 text-balance">
          Display Reviews on Your Website
        </h1>
        
        <p className="text-xl text-white/90 mb-8 text-balance">
          Embed beautiful review widgets on your website. Show off your best reviews, 
          display star ratings, and collect new reviews—all with simple copy-paste code.
        </p>
      </div>

      {/* Widget Types */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Available Widget Types</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <Star className="w-8 h-8 text-yellow-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Review Carousel</h3>
            <p className="text-white/80 mb-4">
              Showcase your best reviews in an auto-rotating carousel. Perfect for homepages and landing pages.
            </p>
            <ul className="text-sm text-white/70 space-y-1">
              <li>• Auto-rotation with pause on hover</li>
              <li>• Show 1-5 reviews at a time</li>
              <li>• Filter by rating or platform</li>
            </ul>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <Monitor className="w-8 h-8 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Review Grid</h3>
            <p className="text-white/80 mb-4">
              Display multiple reviews in a responsive grid layout. Great for testimonial pages.
            </p>
            <ul className="text-sm text-white/70 space-y-1">
              <li>• Responsive columns</li>
              <li>• Load more button</li>
              <li>• Masonry or uniform layout</li>
            </ul>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <Zap className="w-8 h-8 text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Rating Badge</h3>
            <p className="text-white/80 mb-4">
              Compact badge showing your average rating and total reviews. Ideal for headers and footers.
            </p>
            <ul className="text-sm text-white/70 space-y-1">
              <li>• Average star rating</li>
              <li>• Total review count</li>
              <li>• Platform logos</li>
            </ul>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <Globe className="w-8 h-8 text-green-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Review Popup</h3>
            <p className="text-white/80 mb-4">
              Floating widget that prompts visitors to leave a review. Non-intrusive and mobile-friendly.
            </p>
            <ul className="text-sm text-white/70 space-y-1">
              <li>• Customizable triggers</li>
              <li>• Exit intent detection</li>
              <li>• Mobile optimized</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Installation Process */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">How to Install Widgets</h2>
        
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">1</div>
              <h3 className="text-xl font-semibold text-white">Choose Your Widget</h3>
            </div>
            <p className="text-white/90 mb-4">
              Select the widget type that best fits your website design and goals.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold">2</div>
              <h3 className="text-xl font-semibold text-white">Customize Design</h3>
            </div>
            <p className="text-white/90 mb-4">
              Match your brand with custom colors, fonts, and layout options. Preview changes in real-time.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold">3</div>
              <h3 className="text-xl font-semibold text-white">Copy & Paste Code</h3>
            </div>
            <p className="text-white/90 mb-4">
              Get your unique embed code. Simply paste it into your website's HTML where you want the widget to appear.
            </p>
            <div className="bg-white/5 rounded-lg p-4 font-mono text-sm text-green-300">
              {`<script src="https://promptreviews.com/widget.js"></script>`}<br/>
              {`<div id="pr-widget" data-key="your-key"></div>`}
            </div>
          </div>
        </div>
      </div>

      {/* Customization Options */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Customization Options</h2>
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Palette className="w-5 h-5 mr-2" />
                Design Options
              </h3>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Custom colors and fonts</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Light/dark themes</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Border and shadow styles</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Custom CSS support</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Display Settings
              </h3>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Filter by rating or date</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Show/hide reviewer names</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Platform logos display</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Character limits for reviews</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Compatibility */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Works With Any Website</h2>
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
          <p className="text-white/90 mb-6">
            Our widgets are compatible with all major website platforms and frameworks.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="bg-white/10 rounded-lg p-4 mb-2">
                <Globe className="w-8 h-8 text-blue-300 mx-auto" />
              </div>
              <p className="text-sm text-white/80">WordPress</p>
            </div>
            <div className="text-center">
              <div className="bg-white/10 rounded-lg p-4 mb-2">
                <Globe className="w-8 h-8 text-green-300 mx-auto" />
              </div>
              <p className="text-sm text-white/80">Shopify</p>
            </div>
            <div className="text-center">
              <div className="bg-white/10 rounded-lg p-4 mb-2">
                <Globe className="w-8 h-8 text-purple-300 mx-auto" />
              </div>
              <p className="text-sm text-white/80">Wix</p>
            </div>
            <div className="text-center">
              <div className="bg-white/10 rounded-lg p-4 mb-2">
                <Globe className="w-8 h-8 text-yellow-300 mx-auto" />
              </div>
              <p className="text-sm text-white/80">Squarespace</p>
            </div>
          </div>
          
          <div className="mt-6 bg-blue-400/10 border border-blue-400/20 rounded-lg p-4">
            <p className="text-white/90 text-sm">
              <strong className="text-blue-300">Developer Friendly:</strong> Full API access, React/Vue/Angular components, and webhook support for custom integrations.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Optimization */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Mobile-First Design</h2>
        
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
          <div className="flex items-start space-x-4 mb-6">
            <Smartphone className="w-8 h-8 text-blue-300 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Responsive & Fast</h3>
              <p className="text-white/80">
                All widgets are fully responsive and optimized for mobile devices. They adapt to any screen size and load lightning fast.
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-white/90 font-medium mb-1">Touch Optimized</p>
              <p className="text-white/70">Swipe gestures and touch-friendly buttons</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-white/90 font-medium mb-1">Fast Loading</p>
              <p className="text-white/70">Lazy loading and optimized assets</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-white/90 font-medium mb-1">SEO Friendly</p>
              <p className="text-white/70">Schema markup and structured data</p>
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
              href="https://promptreviews.com/dashboard/widgets"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <span>Create Your Widget</span>
              <Code className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </DocsLayout>
  )
}
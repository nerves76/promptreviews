import { Metadata } from 'next';
import Link from 'next/link';
import DocsLayout from '../../docs-layout';
import PageHeader from '../../components/PageHeader';
import { Code, Palette, Copy, Eye, Settings, Monitor, Smartphone, ArrowRight, Info, CheckCircle, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Set Up Your Review Widget | Prompt Reviews',
  description: 'Learn how to create and embed customizable review widgets on your website to showcase customer testimonials.',
  keywords: 'review widget, embed reviews, website integration, review display, prompt reviews',
};

export default function ReviewWidgetPage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' },
            { label: 'Getting Started', href: '/getting-started' }
          ]}
          currentPage="Review Widget"
          categoryLabel="Step 6"
          categoryIcon={Code}
          categoryColor="teal"
          title="Set up your review widget"
          description="Display your best reviews on your website with customizable widgets that match your brand."
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

        {/* What is a Review Widget */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">What is a Review Widget?</h2>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <p className="text-white/90 mb-6">
              Review widgets are embeddable components that display your customer reviews directly on your website. 
              They automatically update with new reviews and can be customized to match your site's design.
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center bg-white/5 rounded-lg p-4">
                <Star className="w-8 h-8 text-yellow-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white">Build Trust</h4>
                <p className="text-xs text-white/70 mt-1">Show real customer feedback</p>
              </div>
              <div className="text-center bg-white/5 rounded-lg p-4">
                <Palette className="w-8 h-8 text-purple-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white">Customizable</h4>
                <p className="text-xs text-white/70 mt-1">Match your brand style</p>
              </div>
              <div className="text-center bg-white/5 rounded-lg p-4">
                <Monitor className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white">Responsive</h4>
                <p className="text-xs text-white/70 mt-1">Works on all devices</p>
              </div>
            </div>
          </div>
        </div>

        {/* Widget Types */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Available Widget Types</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Grid Layout</h3>
              <p className="text-white/80 text-sm mb-4">
                Display multiple reviews in a clean grid format. Perfect for testimonial pages.
              </p>
              <ul className="space-y-1 text-white/70 text-sm">
                <li>• 2-4 columns responsive grid</li>
                <li>• Shows reviewer name and rating</li>
                <li>• Expandable review text</li>
                <li>• Platform badges (Google, Facebook, etc.)</li>
              </ul>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Carousel Slider</h3>
              <p className="text-white/80 text-sm mb-4">
                Auto-rotating reviews that save space. Great for headers and sidebars.
              </p>
              <ul className="space-y-1 text-white/70 text-sm">
                <li>• Smooth auto-rotation</li>
                <li>• Manual navigation controls</li>
                <li>• Adjustable rotation speed</li>
                <li>• Touch/swipe enabled</li>
              </ul>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Badge Widget</h3>
              <p className="text-white/80 text-sm mb-4">
                Compact rating summary with star average. Ideal for product pages.
              </p>
              <ul className="space-y-1 text-white/70 text-sm">
                <li>• Average star rating display</li>
                <li>• Total review count</li>
                <li>• Click to expand reviews</li>
                <li>• Minimal space required</li>
              </ul>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Floating Button</h3>
              <p className="text-white/80 text-sm mb-4">
                Fixed position button that opens reviews overlay. Non-intrusive option.
              </p>
              <ul className="space-y-1 text-white/70 text-sm">
                <li>• Customizable position</li>
                <li>• Opens review modal</li>
                <li>• Shows rating preview</li>
                <li>• Mobile-friendly</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Creating Your Widget */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Creating Your First Widget</h2>
          
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">1</div>
                <h3 className="text-xl font-semibold text-white">Navigate to Widgets</h3>
              </div>
              <p className="text-white/90">
                From your dashboard, go to <strong>"Widgets"</strong> in the main navigation and click 
                <strong>"Create New Widget"</strong>.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold">2</div>
                <h3 className="text-xl font-semibold text-white">Choose Widget Type</h3>
              </div>
              <p className="text-white/90 mb-4">
                Select the layout that best fits your website:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-sm text-white/80">Grid</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-sm text-white/80">Carousel</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-sm text-white/80">Badge</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-sm text-white/80">Floating</p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold">3</div>
                <h3 className="text-xl font-semibold text-white">Select Reviews to Display</h3>
              </div>
              <p className="text-white/90 mb-4">
                Choose which reviews to show in your widget:
              </p>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span><strong>All Reviews:</strong> Show everything (default)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span><strong>Featured Only:</strong> Hand-picked testimonials</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span><strong>4+ Stars:</strong> High ratings only</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span><strong>Recent:</strong> Last 30 days</span>
                </li>
              </ul>
            </div>

            {/* Step 4 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-semibold">4</div>
                <h3 className="text-xl font-semibold text-white">Customize Appearance</h3>
              </div>
              <p className="text-white/90 mb-4">
                Match your widget to your website's design:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">Colors & Style</h4>
                  <ul className="space-y-1 text-white/80 text-sm">
                    <li>• Background color</li>
                    <li>• Text color</li>
                    <li>• Star color</li>
                    <li>• Border style</li>
                    <li>• Shadow effects</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Display Options</h4>
                  <ul className="space-y-1 text-white/80 text-sm">
                    <li>• Number of reviews</li>
                    <li>• Show/hide dates</li>
                    <li>• Platform badges</li>
                    <li>• Reviewer photos</li>
                    <li>• Read more links</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center font-semibold">5</div>
                <h3 className="text-xl font-semibold text-white">Preview Your Widget</h3>
              </div>
              <p className="text-white/90 mb-4">
                See exactly how your widget will look:
              </p>
              <div className="flex items-center space-x-4">
                <button className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors flex items-center space-x-2">
                  <Monitor className="w-4 h-4" />
                  <span>Desktop View</span>
                </button>
                <button className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors flex items-center space-x-2">
                  <Smartphone className="w-4 h-4" />
                  <span>Mobile View</span>
                </button>
              </div>
              <p className="text-white/70 text-sm mt-3">
                Make adjustments until you're happy with the appearance.
              </p>
            </div>

            {/* Step 6 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-semibold">6</div>
                <h3 className="text-xl font-semibold text-white">Get Your Embed Code</h3>
              </div>
              <p className="text-white/90 mb-4">
                Copy the embed code to add to your website:
              </p>
              <div className="bg-black/30 rounded-lg p-4">
                <code className="text-green-300 text-sm">
                  {`<!-- Prompt Reviews Widget -->
<script src="https://app.promptreviews.com/widget.js" 
        data-widget-id="your-widget-id">
</script>
<div id="prompt-reviews-widget"></div>`}
                </code>
              </div>
              <button className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2">
                <Copy className="w-4 h-4" />
                <span>Copy Code</span>
              </button>
            </div>
          </div>
        </div>

        {/* Installation Guide */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Installation Instructions</h2>
          
          <div className="space-y-4">
            <details className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">WordPress</summary>
              <div className="mt-4 space-y-2 text-white/80">
                <p>1. Go to your WordPress admin dashboard</p>
                <p>2. Navigate to Appearance → Widgets or use a Custom HTML block</p>
                <p>3. Paste the embed code</p>
                <p>4. Save and preview your site</p>
              </div>
            </details>
            
            <details className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">Shopify</summary>
              <div className="mt-4 space-y-2 text-white/80">
                <p>1. Go to Online Store → Themes</p>
                <p>2. Click "Customize" on your theme</p>
                <p>3. Add a "Custom HTML" section</p>
                <p>4. Paste the widget code and save</p>
              </div>
            </details>
            
            <details className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">Wix</summary>
              <div className="mt-4 space-y-2 text-white/80">
                <p>1. Open your Wix editor</p>
                <p>2. Click "Add" → "Embed" → "HTML iframe"</p>
                <p>3. Paste the code in the HTML Settings</p>
                <p>4. Adjust size and position as needed</p>
              </div>
            </details>
            
            <details className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">Custom Website</summary>
              <div className="mt-4 space-y-2 text-white/80">
                <p>1. Open your HTML file in a code editor</p>
                <p>2. Paste the code where you want the widget to appear</p>
                <p>3. Save and upload to your server</p>
                <p>4. Clear cache if needed</p>
              </div>
            </details>
          </div>
        </div>

        {/* Best Practices */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Widget Best Practices</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Strategic Placement</h3>
              <p className="text-white/80 text-sm">
                Place widgets where they'll have maximum impact - homepage, product pages, and checkout.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Mobile Optimization</h3>
              <p className="text-white/80 text-sm">
                Always test on mobile devices. Over 60% of visitors will view on phones.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Regular Updates</h3>
              <p className="text-white/80 text-sm">
                Widgets auto-update with new reviews, but periodically check appearance.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Loading Speed</h3>
              <p className="text-white/80 text-sm">
                Widget loads asynchronously and won't slow down your site.
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="mb-12">
          <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-300 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Congratulations!</h3>
                <p className="text-white/80">
                  You've completed the entire setup process! Your Prompt Reviews system is now fully operational:
                </p>
                <ul className="mt-3 space-y-1 text-white/80">
                  <li>✓ Account created and configured</li>
                  <li>✓ Prompt page designed and published</li>
                  <li>✓ Contacts imported and organized</li>
                  <li>✓ Review requests being sent</li>
                  <li>✓ Widget displaying reviews on your website</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Setup Complete! What's Next?
          </h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Explore advanced features to maximize your review collection and management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/advanced"
              className="inline-flex items-center px-6 py-3 bg-white/20 text-white backdrop-blur-sm font-medium rounded-lg hover:bg-white/30 transition-colors"
            >
              Advanced Features
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 border border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
            >
              Back to Help Center
            </Link>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}
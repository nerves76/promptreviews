import { Metadata } from 'next';
import { Globe, QrCode, Link2, Zap, Shield, Clock } from 'lucide-react';
import DocsLayout from '../../../docs-layout';

export const metadata: Metadata = {
  title: 'The Universal Prompt Page - One Page for All Reviews | Prompt Reviews',
  description: 'Learn about the Universal Prompt Page - the all-purpose review collection solution for any business type.',
  keywords: 'universal prompt page, general reviews, QR code reviews, all-purpose reviews, simple review pages',
  openGraph: {
    title: 'The Universal Prompt Page - Simple Review Collection',
    description: 'Learn about the Universal Prompt Page for simple, effective review collection that works for any business.',
  },
};

export default function UniversalPromptPages() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-cyan-300" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              The Universal Prompt Page
            </h1>
          </div>
          <p className="text-xl text-white/80">
            The all-purpose review collection solution. One page that works for any customer, any time, anywhere.
            Perfect for businesses that want a simple, always-ready review collection tool.
          </p>
        </div>

        {/* Why Choose Universal Page */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Why Choose The Universal Prompt Page?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-yellow-300" />
              </div>
              <h3 className="font-semibold text-white mb-2">Always Ready</h3>
              <p className="text-white/70 text-sm">One link that works for every customer interaction</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-purple-300" />
              </div>
              <h3 className="font-semibold text-white mb-2">Simple Setup</h3>
              <p className="text-white/70 text-sm">Create once, use everywhere forever</p>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <div className="flex items-center space-x-2 mb-3">
                <QrCode className="w-5 h-5 text-cyan-300" />
                <h3 className="text-lg font-bold text-white">QR Code Generation</h3>
              </div>
              <p className="text-white/80 text-sm mb-3">
                Automatically generates a QR code for your universal page, perfect for business cards, 
                table tents, receipts, and any physical location.
              </p>
              <div className="bg-cyan-500/20 border border-cyan-400/30 rounded-lg p-3">
                <p className="text-white/80 text-sm">
                  <strong className="text-cyan-300">Pro tip:</strong> Print once, use everywhere
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <div className="flex items-center space-x-2 mb-3">
                <Link2 className="w-5 h-5 text-white" />
                <h3 className="text-lg font-bold text-white">One Simple Link</h3>
              </div>
              <p className="text-white/80 text-sm mb-3">
                A single, memorable link that you can share via email, text, social media, or anywhere
                else. No need to create different pages for different situations.
              </p>
              <div className="bg-white/10 border border-white/30 rounded-lg p-3">
                <p className="text-white/80 text-sm">
                  <strong className="text-yellow-300">Example:</strong> promptreviews.com/r/yourbusiness
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Perfect Use Cases */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Perfect Use Cases</h2>
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-3">Business Cards & Marketing Materials</h3>
              <p className="text-white/80 text-sm mb-3">
                Add your universal QR code to business cards, brochures, and flyers. Customers can scan 
                and leave a review anytime.
              </p>
              <ul className="space-y-1 text-white/70 text-sm">
                <li>• Business cards with QR code</li>
                <li>• Brochures and flyers</li>
                <li>• Trade show materials</li>
                <li>• Vehicle wraps and signage</li>
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-3">Physical Locations</h3>
              <p className="text-white/80 text-sm mb-3">
                Display your QR code at checkout counters, waiting areas, or anywhere customers interact 
                with your business.
              </p>
              <ul className="space-y-1 text-white/70 text-sm">
                <li>• Front desk displays</li>
                <li>• Table tents and counters</li>
                <li>• Window stickers</li>
                <li>• Reception area posters</li>
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-3">Digital Communications</h3>
              <p className="text-white/80 text-sm mb-3">
                Include your universal link in all digital communications for consistent review collection.
              </p>
              <ul className="space-y-1 text-white/70 text-sm">
                <li>• Email signatures</li>
                <li>• Newsletter footers</li>
                <li>• Social media bios</li>
                <li>• Website headers/footers</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Universal vs Specific */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Universal vs. Specific Pages</h2>
          <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Use Universal When:</h3>
                <ul className="space-y-2 text-white/80">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-300">✓</span>
                    <span>You want one simple solution</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-300">✓</span>
                    <span>General reviews are sufficient</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-300">✓</span>
                    <span>You need QR codes for physical locations</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-300">✓</span>
                    <span>Simplicity is priority</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Use Specific When:</h3>
                <ul className="space-y-2 text-white/80">
                  <li className="flex items-start space-x-2">
                    <span className="text-yellow-300">✓</span>
                    <span>You need targeted feedback</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-yellow-300">✓</span>
                    <span>Tracking specific services/products</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-yellow-300">✓</span>
                    <span>Personalization matters</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-yellow-300">✓</span>
                    <span>Different customer segments</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">How The Universal Prompt Page Works</h2>
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center font-semibold">1</div>
                <h3 className="text-lg font-semibold text-white">Create Your Page</h3>
              </div>
              <p className="text-white/80 text-sm">
                Set up your universal page once with your business information and branding. This becomes 
                your permanent review collection hub.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center font-semibold">2</div>
                <h3 className="text-lg font-semibold text-white">Get Your Assets</h3>
              </div>
              <p className="text-white/80 text-sm">
                Download your QR code and copy your unique link. These never change, so you can use them 
                on permanent materials.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center font-semibold">3</div>
                <h3 className="text-lg font-semibold text-white">Share Everywhere</h3>
              </div>
              <p className="text-white/80 text-sm">
                Add your QR code and link to all touchpoints - physical and digital. Every customer 
                interaction becomes a review opportunity.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center font-semibold">4</div>
                <h3 className="text-lg font-semibold text-white">Collect Reviews</h3>
              </div>
              <p className="text-white/80 text-sm">
                Customers visit your page, write reviews with AI assistance, and submit to your chosen 
                platforms - all from one universal page.
              </p>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Best Practices</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-2">Make It Visible</h3>
              <p className="text-white/80 text-sm">
                Place QR codes where customers naturally look - receipts, counters, waiting areas.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-2">Include Instructions</h3>
              <p className="text-white/80 text-sm">
                Add "Scan to Review" or similar text near QR codes to clarify the action.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-2">Train Your Team</h3>
              <p className="text-white/80 text-sm">
                Ensure all employees know about the universal page and can guide customers.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-2">Monitor Performance</h3>
              <p className="text-white/80 text-sm">
                Track which placement locations generate the most scans and reviews.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}
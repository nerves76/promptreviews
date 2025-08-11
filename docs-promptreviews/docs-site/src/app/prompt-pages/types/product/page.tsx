import { Metadata } from 'next';
import { Gift, Star, ShoppingCart, Package, TrendingUp, CheckCircle } from 'lucide-react';
import DocsLayout from '../../../docs-layout';

export const metadata: Metadata = {
  title: 'Product Prompt Pages - Complete Guide | Prompt Reviews',
  description: 'Learn how to create effective Product prompt pages for e-commerce and retail businesses. Get more product reviews with our proven approach.',
  keywords: 'product prompt pages, product reviews, e-commerce reviews, retail reviews, product feedback',
  openGraph: {
    title: 'Product Prompt Pages - Perfect for E-commerce & Retail',
    description: 'Create effective Product prompt pages to collect better product reviews from your customers.',
  },
};

export default function ProductPromptPages() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Gift className="w-6 h-6 text-green-300" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              Product Prompt Pages
            </h1>
          </div>
          <p className="text-xl text-white/80">
            Perfect for e-commerce stores, retail businesses, and any company selling physical or digital products. 
            Collect detailed product-specific reviews that help customers make informed purchase decisions.
          </p>
        </div>

        {/* Why Choose Product Pages */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Why Choose Product Prompt Pages?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Package className="w-6 h-6 text-blue-300" />
              </div>
              <h3 className="font-semibold text-white mb-2">Product-Focused</h3>
              <p className="text-white/70 text-sm">Questions specifically about product quality and features</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-6 h-6 text-green-300" />
              </div>
              <h3 className="font-semibold text-white mb-2">Purchase Context</h3>
              <p className="text-white/70 text-sm">Capture the complete shopping experience</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-purple-300" />
              </div>
              <h3 className="font-semibold text-white mb-2">Conversion Boost</h3>
              <p className="text-white/70 text-sm">Product reviews increase sales conversions</p>
            </div>
          </div>
        </div>

        {/* Product-Specific Examples */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Product Review Examples</h2>
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Physical Products</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-3">Example Questions</h4>
                  <ul className="space-y-2 text-white/80 text-sm">
                    <li>• How would you rate the product quality?</li>
                    <li>• Did the product meet your expectations?</li>
                    <li>• How was the packaging and delivery?</li>
                    <li>• Would you purchase this product again?</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-3">Best For</h4>
                  <ul className="space-y-2 text-white/80 text-sm">
                    <li>• Online retailers</li>
                    <li>• Product manufacturers</li>
                    <li>• Dropshipping businesses</li>
                    <li>• Handmade/craft sellers</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Digital Products</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-3">Example Questions</h4>
                  <ul className="space-y-2 text-white/80 text-sm">
                    <li>• How easy was the product to use?</li>
                    <li>• Did it solve your problem effectively?</li>
                    <li>• How was the download/setup process?</li>
                    <li>• Would you recommend to others?</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-3">Best For</h4>
                  <ul className="space-y-2 text-white/80 text-sm">
                    <li>• Software companies</li>
                    <li>• Course creators</li>
                    <li>• Digital asset sellers</li>
                    <li>• App developers</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Best Practices</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-3">Include Product Details</h3>
              <p className="text-white/80 mb-3">Add product images, specifications, and SKU numbers to help customers remember what they purchased.</p>
              <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3">
                <p className="text-white/80 text-sm">
                  <strong className="text-blue-300">Tip:</strong> Include the product photo to jog customer memory
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-3">Ask About Use Cases</h3>
              <p className="text-white/80 mb-3">Understanding how customers use your product provides valuable insights for marketing and development.</p>
              <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-3">
                <p className="text-white/80 text-sm">
                  <strong className="text-green-300">Example:</strong> "How are you using this product?"
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-3">Request Photos</h3>
              <p className="text-white/80 mb-3">Customer photos provide authentic visual proof and great marketing content.</p>
              <div className="bg-purple-500/20 border border-purple-400/30 rounded-lg p-3">
                <p className="text-white/80 text-sm">
                  <strong className="text-purple-300">Tip:</strong> Enable photo uploads for visual reviews
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-3">Focus on Benefits</h3>
              <p className="text-white/80 mb-3">Ask how the product improved their life or solved their problem.</p>
              <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-3">
                <p className="text-white/80 text-sm">
                  <strong className="text-yellow-300">Example:</strong> "What problem did this solve for you?"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Guide */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Setup Guide</h2>
          <ol className="space-y-4">
            <li className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">1</div>
              <div>
                <p className="font-medium text-white">Choose Product Type</p>
                <p className="text-white/70 text-sm">Select "Product" when creating your prompt page</p>
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">2</div>
              <div>
                <p className="font-medium text-white">Add Product Information</p>
                <p className="text-white/70 text-sm">Include product name, image, price, and key features</p>
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">3</div>
              <div>
                <p className="font-medium text-white">Customize Questions</p>
                <p className="text-white/70 text-sm">Add product-specific review prompts</p>
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">4</div>
              <div>
                <p className="font-medium text-white">Set Up Automation</p>
                <p className="text-white/70 text-sm">Configure when to send review requests after purchase</p>
              </div>
            </li>
          </ol>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Collect Product Reviews?
          </h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Start collecting detailed product reviews that help customers make purchase decisions and boost your sales.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://app.promptreviews.com/dashboard"
              className="inline-flex items-center px-6 py-3 bg-white/20 text-white backdrop-blur-sm font-medium rounded-lg hover:bg-white/30 transition-colors"
            >
              Create Product Page
            </a>
            <a
              href="/prompt-pages/types"
              className="inline-flex items-center px-6 py-3 border border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
            >
              View All Types
            </a>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}
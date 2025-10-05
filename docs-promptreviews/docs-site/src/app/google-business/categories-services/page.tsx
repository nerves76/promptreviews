import { Metadata } from 'next';
import Link from 'next/link';
import DocsLayout from '../../docs-layout';
import { Tag, ChevronRight, List, Building2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Categories & Services - Google Business Profile | Prompt Reviews Help',
  description: 'Learn how to set business categories and define services in your Google Business Profile.',
  alternates: {
    canonical: 'https://docs.promptreviews.app/google-business/categories-services',
  },
}

export default function CategoriesServicesPage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center text-sm text-white/60 mb-6">
          <Link href="/" className="hover:text-white">Home</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <Link href="/google-business" className="hover:text-white">Google Business Profile</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-white">Categories & Services</span>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <Tag className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Categories & services</h1>
          </div>
          <p className="text-xl text-white/80">
            Define your business categories and services to help customers find exactly what you offer.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
          <p className="text-white/80">
            Categories and services help Google understand your business and show you in relevant searches. Choose accurate categories and provide detailed service descriptions to improve your visibility.
          </p>
        </div>

        {/* Categories Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Business categories</h2>
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
              <div className="flex items-start gap-3">
                <Tag className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Primary category</h3>
                  <p className="text-white/80 mb-3">
                    Your main business category determines which Google Business Profile features are available and how you appear in search results. Choose the most specific category that accurately describes your core business.
                  </p>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <p className="text-sm text-yellow-200">
                      <strong>Important:</strong> Your primary category cannot be changed frequently, so choose carefully.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
              <div className="flex items-start gap-3">
                <List className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Additional categories</h3>
                  <p className="text-white/80 mb-3">
                    Add up to 9 additional categories (10 total including primary) to describe other aspects of your business. These help you appear in more search results.
                  </p>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <p className="text-sm text-yellow-200">
                      <strong>Example:</strong> A restaurant might use "Italian Restaurant" as primary, with "Pizza Restaurant" and "Wine Bar" as additional categories.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Services</h2>
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
            <p className="text-white/80 mb-4">
              Service items help customers understand exactly what you offer. Each service can include a description to provide more detail.
            </p>
            <div className="space-y-3 mt-4">
              <div className="flex gap-3">
                <span className="text-green-400">✓</span>
                <span className="text-white/80"><strong className="text-white">Be specific:</strong> "Oil Change & Filter Replacement" is better than just "Maintenance"</span>
              </div>
              <div className="flex gap-3">
                <span className="text-green-400">✓</span>
                <span className="text-white/80"><strong className="text-white">Use AI assistance:</strong> Prompt Reviews can generate professional service descriptions for you</span>
              </div>
              <div className="flex gap-3">
                <span className="text-green-400">✓</span>
                <span className="text-white/80"><strong className="text-white">Include keywords:</strong> Use terms customers search for when looking for your services</span>
              </div>
              <div className="flex gap-3">
                <span className="text-green-400">✓</span>
                <span className="text-white/80"><strong className="text-white">Update regularly:</strong> Add new services as your business evolves</span>
              </div>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Best practices</h2>
          <ul className="space-y-3 text-white/80">
            <li className="flex gap-3">
              <span className="text-green-400">✓</span>
              <span><strong className="text-white">Choose accurate categories:</strong> Incorrect categories can hurt your search ranking</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">✓</span>
              <span><strong className="text-white">Research competitors:</strong> See what categories successful competitors use</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">✓</span>
              <span><strong className="text-white">Be comprehensive with services:</strong> List all services you offer to capture more searches</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">✓</span>
              <span><strong className="text-white">Use AI-generated descriptions:</strong> Let Prompt Reviews write professional service descriptions that include relevant keywords</span>
            </li>
          </ul>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Related articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/google-business/business-info" className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group">
              <Building2 className="w-5 h-5 text-yellow-300" />
              <div className="flex-1">
                <div className="font-semibold text-white group-hover:underline">Business Info</div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/40" />
            </Link>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}

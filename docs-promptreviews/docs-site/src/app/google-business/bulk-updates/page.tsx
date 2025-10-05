import { Metadata } from 'next';
import Link from 'next/link';
import DocsLayout from '../../docs-layout';
import { Layers, ChevronRight, Building2, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Bulk Updates - Google Business Profile | Prompt Reviews Help',
  description: 'Learn how to manage multiple Google Business Profile locations with bulk updates and edits.',
  alternates: {
    canonical: 'https://docs.promptreviews.app/google-business/bulk-updates',
  },
}

export default function BulkUpdatesPage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center text-sm text-white/60 mb-6">
          <Link href="/" className="hover:text-white">Home</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <Link href="/google-business" className="hover:text-white">Google Business Profile</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-white">Bulk Updates</span>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
              <Layers className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Bulk updates</h1>
          </div>
          <p className="text-xl text-white/80">
            Efficiently manage multiple Google Business Profile locations with bulk editing capabilities.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
          <p className="text-white/80">
            Managing multiple Google Business Profile locations is simple with Prompt Reviews. Update posts, photos, and information across all your locations at once, saving time and ensuring consistency.
          </p>
        </div>

        {/* Plan Limitations */}
        <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Plan-based location limits</h2>
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="text-yellow-300">•</span>
              <span className="text-white/80"><strong className="text-white">Grower Plan:</strong> Manage 1 Google Business Profile location</span>
            </div>
            <div className="flex gap-3">
              <span className="text-yellow-300">•</span>
              <span className="text-white/80"><strong className="text-white">Builder & Maven Plans:</strong> Manage multiple locations simultaneously</span>
            </div>
          </div>
        </div>

        {/* Multi-Location Features */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Multi-location features</h2>
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
              <div className="flex items-start gap-3">
                <Layers className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Bulk post creation</h3>
                  <p className="text-white/80 mb-3">
                    Create Google Business Profile posts and publish them to multiple locations at once. Perfect for announcing sales, events, or new products across all your locations.
                  </p>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <p className="text-sm text-yellow-200">
                      <strong>Tip:</strong> Select specific locations or choose "All locations" to broadcast your message everywhere.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Location selection</h3>
                  <p className="text-white/80 mb-3">
                    Easily switch between locations or select multiple locations at once. The system remembers your last selected location for convenience.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
              <div className="flex items-start gap-3">
                <Building2 className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Photo management</h3>
                  <p className="text-white/80">
                    Upload photos to multiple locations simultaneously. Great for chain businesses that want to maintain consistent branding across all locations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How to Use */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Using multi-location management</h2>
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="text-yellow-300 font-bold">1.</span>
              <span className="text-white/80">Connect all your Google Business Profile locations using OAuth</span>
            </div>
            <div className="flex gap-3">
              <span className="text-yellow-300 font-bold">2.</span>
              <span className="text-white/80">In the Google Business dashboard, select the locations you want to update</span>
            </div>
            <div className="flex gap-3">
              <span className="text-yellow-300 font-bold">3.</span>
              <span className="text-white/80">Create your post, upload photos, or update information</span>
            </div>
            <div className="flex gap-3">
              <span className="text-yellow-300 font-bold">4.</span>
              <span className="text-white/80">Review your selections and publish to all chosen locations at once</span>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Best practices</h2>
          <ul className="space-y-3 text-white/80">
            <li className="flex gap-3">
              <span className="text-green-400">✓</span>
              <span><strong className="text-white">Maintain consistency:</strong> Use bulk updates to ensure all locations have the same branding and messaging</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">✓</span>
              <span><strong className="text-white">Customize when needed:</strong> Some updates (like location-specific events) should only go to certain locations</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">✓</span>
              <span><strong className="text-white">Upgrade for more locations:</strong> If you have multiple locations, consider the Builder or Maven plan for full access</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">✓</span>
              <span><strong className="text-white">Schedule posts strategically:</strong> Use bulk scheduling to plan campaigns across all locations in advance</span>
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
                <div className="text-xs text-white/60">Manage core business details</div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60" />
            </Link>
            <Link href="/billing/upgrades-downgrades" className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group">
              <MapPin className="w-5 h-5 text-green-300" />
              <div className="flex-1">
                <div className="font-semibold text-white group-hover:underline">Plan Upgrades</div>
                <div className="text-xs text-white/60">Unlock multiple locations</div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60" />
            </Link>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}

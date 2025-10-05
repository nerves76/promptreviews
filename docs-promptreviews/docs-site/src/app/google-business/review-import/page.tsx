import { Metadata } from 'next';
import Link from 'next/link';
import DocsLayout from '../../docs-layout';
import { Download, ChevronRight, Star, Building2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Review Import - Google Business Profile | Prompt Reviews Help',
  description: 'Learn how to import Google reviews into Prompt Reviews for website display and double-dip campaigns.',
  alternates: {
    canonical: 'https://docs.promptreviews.app/google-business/review-import',
  },
}

export default function ReviewImportPage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center text-sm text-white/60 mb-6">
          <Link href="/" className="hover:text-white">Home</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <Link href="/google-business" className="hover:text-white">Google Business Profile</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-white">Review Import</span>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl">
              <Download className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Review import</h1>
          </div>
          <p className="text-xl text-white/80">
            Import your existing Google reviews to feature on your website and launch effective double-dip campaigns.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
          <p className="text-white/80">
            Import your existing Google reviews to showcase them on your website and identify customers for strategic review campaigns across multiple platforms.
          </p>
        </div>

        {/* Import Process */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">How review import works</h2>
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
              <div className="flex items-start gap-3">
                <Download className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Automatic sync</h3>
                  <p className="text-white/80 mb-3">
                    Connect your Google Business Profile using OAuth to automatically import all existing reviews. The system syncs regularly to capture new reviews as they come in.
                  </p>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <p className="text-sm text-yellow-200">
                      <strong>What's imported:</strong> Review text, star rating, reviewer name, review date, and reviewer profile information (when available).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
              <div className="flex items-start gap-3">
                <Building2 className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Website display</h3>
                  <p className="text-white/80 mb-3">
                    Once imported, display your Google reviews on your website using Prompt Reviews widgets. Choose from multiple widget styles and customize the appearance to match your brand.
                  </p>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <p className="text-sm text-yellow-200">
                      <strong>Widget options:</strong> Grid layout, carousel, single review spotlight, or photo reviews gallery.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Double-Dip Strategy */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Double-dip campaigns</h2>
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-4">
            <p className="text-white/80 mb-4">
              The Double-Dip strategy leverages your existing Google reviewers to gather reviews on other platforms. Since these customers already took time to review you once, they're more likely to help again.
            </p>
            <div className="space-y-3 mt-4">
              <div className="flex gap-3">
                <span className="text-yellow-300 font-bold">1.</span>
                <span className="text-white/80">Import Google reviews to identify satisfied customers</span>
              </div>
              <div className="flex gap-3">
                <span className="text-yellow-300 font-bold">2.</span>
                <span className="text-white/80">Filter by 4 and 5-star reviewers who are likely to leave positive reviews elsewhere</span>
              </div>
              <div className="flex gap-3">
                <span className="text-yellow-300 font-bold">3.</span>
                <span className="text-white/80">Reach out via email or SMS asking them to share their experience on Facebook, Yelp, or other platforms</span>
              </div>
              <div className="flex gap-3">
                <span className="text-yellow-300 font-bold">4.</span>
                <span className="text-white/80">Track which customers respond to avoid duplicate requests</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-3">Why double-dip works</h3>
            <ul className="space-y-2 text-white/80">
              <li className="flex gap-3">
                <span className="text-yellow-300">•</span>
                <span>Customers already demonstrated willingness to leave feedback</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-300">•</span>
                <span>They're familiar with the review process</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-300">•</span>
                <span>Higher response rate than cold outreach (typically 15-25% vs 3-8%)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-300">•</span>
                <span>Builds presence across multiple review platforms simultaneously</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Best Practices */}
        <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Best practices</h2>
          <ul className="space-y-3 text-white/80">
            <li className="flex gap-3">
              <span className="text-green-400">✓</span>
              <span><strong className="text-white">Time it right:</strong> Wait 2-4 weeks after their Google review before asking for another platform</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">✓</span>
              <span><strong className="text-white">Personalize the ask:</strong> Reference their original Google review to show you remember them</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">✓</span>
              <span><strong className="text-white">Make it easy:</strong> Provide direct links to the review platform and pre-filled information when possible</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">✓</span>
              <span><strong className="text-white">Focus on happy customers:</strong> Only reach out to 4 and 5-star reviewers for double-dip campaigns</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">✓</span>
              <span><strong className="text-white">Track results:</strong> Monitor which platforms generate the best response to optimize future campaigns</span>
            </li>
          </ul>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Related articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/strategies/double-dip" className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group">
              <Star className="w-5 h-5 text-yellow-300" />
              <div className="flex-1">
                <div className="font-semibold text-white group-hover:underline">Double-Dip Strategy</div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/40" />
            </Link>
            <Link href="/widgets" className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group">
              <Building2 className="w-5 h-5 text-purple-300" />
              <div className="flex-1">
                <div className="font-semibold text-white group-hover:underline">Website Widgets</div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/40" />
            </Link>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}

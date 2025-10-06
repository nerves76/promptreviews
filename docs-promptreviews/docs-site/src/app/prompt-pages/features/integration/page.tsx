import { Metadata } from 'next';
import Link from 'next/link';
import { Globe, ChevronRight, Star, MapPin, ThumbsUp, Building2, Zap, Link2 } from 'lucide-react';
import { getArticleBySlug } from '@/lib/articles';
import { getIconComponent } from '@/lib/iconMapper';

export async function generateMetadata(): Promise<Metadata> {
  const article = await getArticleBySlug('prompt-pages/features/integration');

  if (!article) {
    return {
      title: 'Platform Integration | Prompt Reviews',
    };
  }

  const seoTitle = article.metadata?.seo_title || article.title;
  const seoDescription = article.metadata?.seo_description || article.metadata?.description || '';

  return {
    title: `${seoTitle} | Prompt Reviews`,
    description: seoDescription,
    keywords: article.metadata?.keywords || [],
  };
}

export default async function IntegrationPage() {
  const article = await getArticleBySlug('prompt-pages/features/integration');

  const keyFeatures = article?.metadata?.key_features || [];
  const howItWorks = article?.metadata?.how_it_works || [];
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-white/60 mb-6">
        <Link href="/" className="hover:text-white">Home</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <Link href="/prompt-pages" className="hover:text-white">Prompt Pages</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <Link href="/prompt-pages/features" className="hover:text-white">Features</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-white">Platform Integration</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">Platform integration</h1>
        </div>
        <p className="text-xl text-white/80">
          Seamlessly connect your prompt pages with Google, Facebook, Yelp, and other major review platforms to maximize visibility, streamline management, and improve local search rankings.
        </p>
      </div>

      {/* Overview */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">What is platform integration?</h2>
        <p className="text-white/80 mb-4">
          Platform Integration allows you to connect your prompt pages directly with major review platforms like Google Business Profile, Facebook, Yelp, and other business directories. This creates a seamless flow from review collection to platform publication.
        </p>
        <p className="text-white/80">
          Instead of managing reviews on multiple platforms separately, you get one unified system that distributes reviews appropriately and tracks performance across all platforms.
        </p>
      </div>

      {/* Supported Platforms */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Supported platforms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-red-300" />
              <h3 className="font-semibold text-white">Google Business Profile</h3>
            </div>
            <p className="text-sm text-white/70">
              Direct integration with Google for local search visibility and review management
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <ThumbsUp className="w-5 h-5 text-blue-300" />
              <h3 className="font-semibold text-white">Facebook</h3>
            </div>
            <p className="text-sm text-white/70">
              Connect with Facebook Pages to collect and manage Facebook reviews
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-orange-300" />
              <h3 className="font-semibold text-white">Yelp</h3>
            </div>
            <p className="text-sm text-white/70">
              Direct customers to your Yelp page for reviews and ratings
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-green-300" />
              <h3 className="font-semibold text-white">Trustpilot</h3>
            </div>
            <p className="text-sm text-white/70">
              Integrate with Trustpilot for verified customer reviews
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-5 h-5 text-purple-300" />
              <h3 className="font-semibold text-white">Industry-Specific Platforms</h3>
            </div>
            <p className="text-sm text-white/70">
              Support for industry-specific platforms like Healthgrades, Avvo, and more
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-5 h-5 text-yellow-300" />
              <h3 className="font-semibold text-white">Custom Platforms</h3>
            </div>
            <p className="text-sm text-white/70">
              Ability to add custom review platform URLs for niche platforms
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      {howItWorks.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">How it works</h2>
          <ol className="space-y-4">
            {howItWorks.map((step) => (
              <li key={step.number} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">{step.number}</span>
                <div>
                  <h4 className="font-semibold text-white mb-1">{step.title}</h4>
                  <p className="text-white/70 text-sm">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Integration Features */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Integration capabilities</h2>
        <div className="space-y-3">
          <div className="flex gap-3 items-start">
            <div className="text-green-400 text-xl mt-0.5">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Direct platform connection</h4>
              <p className="text-sm text-white/70">OAuth integration for secure, authorized access to platforms</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="text-green-400 text-xl mt-0.5">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Smart routing</h4>
              <p className="text-sm text-white/70">Automatically send customers to the right platform based on sentiment</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="text-green-400 text-xl mt-0.5">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Unified dashboard</h4>
              <p className="text-sm text-white/70">View reviews from all platforms in one place</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="text-green-400 text-xl mt-0.5">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Response management</h4>
              <p className="text-sm text-white/70">Respond to reviews across platforms from a single interface</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="text-green-400 text-xl mt-0.5">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Performance tracking</h4>
              <p className="text-sm text-white/70">Compare performance across different review platforms</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="text-green-400 text-xl mt-0.5">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Platform-specific optimization</h4>
              <p className="text-sm text-white/70">Automatically format reviews for each platform's requirements</p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Key benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Maximum visibility</h4>
              <p className="text-sm text-white/70">Reviews appear on multiple high-visibility platforms</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Streamlined management</h4>
              <p className="text-sm text-white/70">Manage all reviews from one central dashboard</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Improved local SEO</h4>
              <p className="text-sm text-white/70">More reviews on Google and other platforms boost search rankings</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Time savings</h4>
              <p className="text-sm text-white/70">Eliminate manual review management across multiple platforms</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Better insights</h4>
              <p className="text-sm text-white/70">Compare performance across platforms to optimize strategy</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Consistent branding</h4>
              <p className="text-sm text-white/70">Maintain brand voice across all review platforms</p>
            </div>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Integration best practices</h2>
        <div className="space-y-3">
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Connect all major platforms</h4>
            <p className="text-sm text-white/70">
              Maximize visibility by integrating with Google, Facebook, Yelp, and industry-specific platforms
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Configure smart routing</h4>
            <p className="text-sm text-white/70">
              Send positive reviews to public platforms, constructive feedback to you directly
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Respond promptly</h4>
            <p className="text-sm text-white/70">
              Use the unified dashboard to respond quickly to reviews across all platforms
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Monitor platform performance</h4>
            <p className="text-sm text-white/70">
              Track which platforms generate the most and best quality reviews
            </p>
          </div>
        </div>
      </div>

      {/* Perfect For */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Perfect for</h2>
        <ul className="space-y-3">
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Local businesses</strong> wanting to dominate local search results</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Multi-location businesses</strong> managing reviews across multiple locations</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Service businesses</strong> with active Google Business Profiles</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">E-commerce</strong> collecting reviews on multiple platforms</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Any business</strong> wanting to maximize review visibility and streamline management</span>
          </li>
        </ul>
      </div>

      {/* Related Features */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Related features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/google-business"
            className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
          >
            <div className="flex-1">
              <div className="font-semibold text-white group-hover:underline">Google Business Profile</div>
              <div className="text-xs text-white/60">Connect your GBP</div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60" />
          </Link>

          <Link
            href="/prompt-pages/features"
            className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
          >
            <div className="flex-1">
              <div className="font-semibold text-white group-hover:underline">All Features</div>
              <div className="text-xs text-white/60">View all prompt page features</div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export const revalidate = 300; // Revalidate every 5 minutes

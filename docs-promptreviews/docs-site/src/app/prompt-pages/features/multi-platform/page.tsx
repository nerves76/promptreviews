import { Metadata } from 'next';
import Link from 'next/link';
import { Share2, ChevronRight, Globe, Mail, Facebook, Instagram, Twitter, Link2, Copy } from 'lucide-react';
import { getArticleBySlug } from '@/lib/articles';
import { getIconComponent } from '@/lib/iconMapper';

export async function generateMetadata(): Promise<Metadata> {
  const article = await getArticleBySlug('prompt-pages/features/multi-platform');

  if (!article) {
    return {
      title: 'Multi-Platform Sharing | Prompt Reviews',
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

export default async function MultiPlatformPage() {
  const article = await getArticleBySlug('prompt-pages/features/multi-platform');

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
        <span className="text-white">Multi-Platform Sharing</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
            <Share2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">Multi-platform sharing</h1>
        </div>
        <p className="text-xl text-white/80">
          Distribute your prompt pages across all your marketing channels - social media, email, websites, and physical materials - to maximize review collection opportunities.
        </p>
      </div>

      {/* Overview */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">What is multi-platform sharing?</h2>
        <p className="text-white/80 mb-4">
          Multi-Platform Sharing enables you to easily distribute your prompt pages across every customer touchpoint. Whether it's social media posts, email campaigns, website embedding, or QR codes on physical materials, you can reach customers wherever they are.
        </p>
        <p className="text-white/80">
          The more places your prompt pages appear, the more opportunities you create for collecting reviews. Multi-platform sharing ensures consistent messaging while maximizing your reach.
        </p>
      </div>

      {/* Sharing Channels */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Available sharing channels</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-5 h-5 text-blue-300" />
              <h3 className="font-semibold text-white">Direct Links</h3>
            </div>
            <p className="text-sm text-white/70">
              Share custom URLs via text, messaging apps, or anywhere you communicate with customers
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-5 h-5 text-green-300" />
              <h3 className="font-semibold text-white">Email Campaigns</h3>
            </div>
            <p className="text-sm text-white/70">
              Include prompt page links in newsletters, transactional emails, and email campaigns
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Facebook className="w-5 h-5 text-purple-300" />
              <h3 className="font-semibold text-white">Social Media</h3>
            </div>
            <p className="text-sm text-white/70">
              Share to Facebook, Instagram, Twitter, LinkedIn, and other social platforms
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-5 h-5 text-orange-300" />
              <h3 className="font-semibold text-white">Website Embedding</h3>
            </div>
            <p className="text-sm text-white/70">
              Embed prompt pages directly on your website with custom code snippets
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Copy className="w-5 h-5 text-yellow-300" />
              <h3 className="font-semibold text-white">QR Codes</h3>
            </div>
            <p className="text-sm text-white/70">
              Generate QR codes for print materials, signage, and physical locations
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Instagram className="w-5 h-5 text-pink-300" />
              <h3 className="font-semibold text-white">Stories & Posts</h3>
            </div>
            <p className="text-sm text-white/70">
              Share in Instagram Stories, Facebook Stories, and other ephemeral content
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

      {/* Benefits */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Key benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Maximum reach</h4>
              <p className="text-sm text-white/70">Connect with customers across all their preferred channels</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Consistent messaging</h4>
              <p className="text-sm text-white/70">Same professional experience across all platforms</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">More review opportunities</h4>
              <p className="text-sm text-white/70">Every channel is a new chance to collect reviews</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Easy sharing</h4>
              <p className="text-sm text-white/70">One-click sharing to popular platforms</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Channel-specific tracking</h4>
              <p className="text-sm text-white/70">See which channels perform best</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Flexible deployment</h4>
              <p className="text-sm text-white/70">Use in digital and physical marketing simultaneously</p>
            </div>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Sharing best practices</h2>
        <div className="space-y-3">
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Match content to channel</h4>
            <p className="text-sm text-white/70">
              Tailor your message for each platform - casual for social media, professional for email
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Test different channels</h4>
            <p className="text-sm text-white/70">
              Try various platforms to discover where your customers are most responsive
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Track and optimize</h4>
            <p className="text-sm text-white/70">
              Monitor performance by channel and focus efforts on what works best
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Maintain consistency</h4>
            <p className="text-sm text-white/70">
              Keep your branding and core message consistent across all channels
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
            <span className="text-white/80"><strong className="text-white">Businesses with active social media</strong> wanting to leverage existing audiences</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">E-commerce stores</strong> collecting reviews through email and website</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Multi-channel marketers</strong> maintaining presence across platforms</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Physical locations</strong> combining digital and offline marketing</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Growing businesses</strong> wanting to maximize review collection reach</span>
          </li>
        </ul>
      </div>

      {/* Related Features */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Related features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/prompt-pages/features/qr-codes"
            className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
          >
            <div className="flex-1">
              <div className="font-semibold text-white group-hover:underline">QR Code Generation</div>
              <div className="text-xs text-white/60">Print and share QR codes</div>
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

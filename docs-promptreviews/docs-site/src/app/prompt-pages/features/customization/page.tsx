import { Metadata } from 'next';
import Link from 'next/link';
import { Palette, ChevronRight, Image, Type, Layout, Eye, Sparkles, CheckCircle } from 'lucide-react';
import { getArticleBySlug } from '@/lib/articles';
import { getIconComponent } from '@/lib/iconMapper';

export async function generateMetadata(): Promise<Metadata> {
  const article = await getArticleBySlug('prompt-pages/features/customization');

  if (!article) {
    return {
      title: 'Customization Options | Prompt Reviews',
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

export default async function CustomizationPage() {
  const article = await getArticleBySlug('prompt-pages/features/customization');

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
        <span className="text-white">Customization Options</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl">
            <Palette className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">Customization options</h1>
        </div>
        <p className="text-xl text-white/80">
          Personalize your prompt pages with your brand colors, logos, custom messaging, and business-specific styling to create a cohesive, professional brand experience.
        </p>
      </div>

      {/* Overview */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">What can you customize?</h2>
        <p className="text-white/80 mb-4">
          Every aspect of your prompt pages can be tailored to match your brand identity. From colors and logos to questions and messaging, you have complete control over how your review collection pages look and feel.
        </p>
        <p className="text-white/80">
          Customization isn't just about aesthetics - it's about creating a familiar, trustworthy experience that encourages customers to leave reviews and reflects your brand values.
        </p>
      </div>

      {/* Customization Options */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Customization capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Palette className="w-5 h-5 text-pink-300" />
              <h3 className="font-semibold text-white">Brand Colors</h3>
            </div>
            <p className="text-sm text-white/70">
              Choose custom colors for buttons, headers, backgrounds, and accents to match your brand
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Image className="w-5 h-5 text-blue-300" />
              <h3 className="font-semibold text-white">Logo & Images</h3>
            </div>
            <p className="text-sm text-white/70">
              Upload your business logo and custom images to personalize the page appearance
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Type className="w-5 h-5 text-green-300" />
              <h3 className="font-semibold text-white">Custom Messaging</h3>
            </div>
            <p className="text-sm text-white/70">
              Write your own questions, prompts, and thank you messages in your brand voice
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Layout className="w-5 h-5 text-purple-300" />
              <h3 className="font-semibold text-white">Page Layout</h3>
            </div>
            <p className="text-sm text-white/70">
              Choose from different layout styles and arrangements to fit your preferences
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <h3 className="font-semibold text-white">Custom Fields</h3>
            </div>
            <p className="text-sm text-white/70">
              Add business-specific fields and questions relevant to your industry
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-5 h-5 text-orange-300" />
              <h3 className="font-semibold text-white">Live Preview</h3>
            </div>
            <p className="text-sm text-white/70">
              See changes in real-time as you customize your prompt page
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      {howItWorks.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">How to customize your prompt pages</h2>
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
              <h4 className="font-semibold text-white mb-1">Professional appearance</h4>
              <p className="text-sm text-white/70">Create a polished, branded experience that builds trust</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Brand consistency</h4>
              <p className="text-sm text-white/70">Maintain your brand identity across all customer touchpoints</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Increased recognition</h4>
              <p className="text-sm text-white/70">Customers recognize your brand and feel more comfortable</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Better engagement</h4>
              <p className="text-sm text-white/70">Familiar branding increases customer participation</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Competitive differentiation</h4>
              <p className="text-sm text-white/70">Stand out from generic review collection pages</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Complete control</h4>
              <p className="text-sm text-white/70">Tailor every detail to match your business needs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Customization best practices</h2>
        <div className="space-y-3">
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Keep it simple</h4>
            <p className="text-sm text-white/70">
              Don't overdo customization - maintain clean, easy-to-read pages
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Use high-quality images</h4>
            <p className="text-sm text-white/70">
              Upload clear, professional logos and images for the best appearance
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Match your website</h4>
            <p className="text-sm text-white/70">
              Use the same colors and style as your website for consistency
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Test on mobile</h4>
            <p className="text-sm text-white/70">
              Preview your customizations on mobile devices to ensure they look good
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
            <span className="text-white/80"><strong className="text-white">Businesses with strong brand identities</strong> wanting to maintain consistency</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Professional services</strong> creating a polished, trustworthy impression</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Restaurants and retail</strong> matching their physical space branding</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Franchises</strong> maintaining brand standards across locations</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Any business</strong> wanting a professional, branded review experience</span>
          </li>
        </ul>
      </div>

      {/* Related Features */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Related features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/prompt-pages/settings"
            className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
          >
            <div className="flex-1">
              <div className="font-semibold text-white group-hover:underline">Prompt Page Settings</div>
              <div className="text-xs text-white/60">Configure your prompt pages</div>
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

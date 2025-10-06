import { Metadata } from 'next';
import Link from 'next/link';
import { Bot, ChevronRight, Sparkles, Zap, FileText, CheckCircle } from 'lucide-react';
import { getArticleBySlug } from '@/lib/articles';
import { getIconComponent } from '@/lib/iconMapper';

export async function generateMetadata(): Promise<Metadata> {
  const article = await getArticleBySlug('prompt-pages/features/ai-powered');

  if (!article) {
    return {
      title: 'AI-Powered Content | Prompt Reviews',
    };
  }

  // Use SEO-specific fields if available, otherwise fallback to regular title/description
  const seoTitle = article.metadata?.seo_title || article.title;
  const seoDescription = article.metadata?.seo_description || article.metadata?.description || '';

  return {
    title: `${seoTitle} | Prompt Reviews`,
    description: seoDescription,
    keywords: article.metadata?.keywords || [],
  };
}

export default async function AIPoweredPage() {
  const article = await getArticleBySlug('prompt-pages/features/ai-powered');

  // Fallback to static content if database fetch fails
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
        <span className="text-white">AI-Powered Content</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">AI-powered content</h1>
        </div>
        <p className="text-xl text-white/80">
          Prompty AI helps your customers write better, more detailed reviews with intelligent content generation, grammar improvements, and SEO optimization.
        </p>
      </div>

      {/* Overview */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">What is AI-powered content?</h2>
        <p className="text-white/80 mb-4">
          Our AI-powered system, Prompty AI, analyzes your business context and helps customers write comprehensive, high-quality reviews. Instead of staring at a blank text box, customers get intelligent suggestions tailored to their specific experience.
        </p>
        <p className="text-white/80">
          Prompty AI doesn't write fake reviews - it helps real customers articulate their genuine experiences more effectively. The AI suggests specific details to mention, improves grammar and spelling, and helps structure thoughts into coherent, helpful reviews.
        </p>
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

      {/* Features */}
      {keyFeatures.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">AI capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {keyFeatures.map((feature, i) => (
              <div key={i} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getIconComponent(feature.icon)}
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                </div>
                <p className="text-sm text-white/70">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Benefits */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Key benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Higher completion rates</h4>
              <p className="text-sm text-white/70">More customers finish writing reviews when they have AI assistance</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Better quality reviews</h4>
              <p className="text-sm text-white/70">More detailed, helpful, and well-written feedback</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Saves customer time</h4>
              <p className="text-sm text-white/70">Reduces the effort required to write a thoughtful review</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Professional presentation</h4>
              <p className="text-sm text-white/70">Grammar corrections ensure reviews look polished and credible</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">SEO benefits</h4>
              <p className="text-sm text-white/70">Reviews include relevant keywords that improve search rankings</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Always authentic</h4>
              <p className="text-sm text-white/70">Customers control final content - AI only suggests and enhances</p>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">AI guidelines configuration</h2>
        <p className="text-white/80 mb-4">
          Train Prompty AI to generate content that aligns with your brand through the Prompt Page Settings:
        </p>
        <div className="space-y-3">
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Keywords</h4>
            <p className="text-sm text-white/70">
              Add relevant keywords that AI should incorporate (e.g., "best therapist in Portland, compassionate care")
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">AI Dos</h4>
            <p className="text-sm text-white/70">
              Things you want AI to emphasize (e.g., "Always mention our excellent customer service and fast response times")
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">AI Don'ts</h4>
            <p className="text-sm text-white/70">
              Things to avoid (e.g., "Never mention pricing or costs, don't make medical claims")
            </p>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Perfect for</h2>
        <ul className="space-y-3">
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Service businesses</strong> wanting detailed, professional reviews</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Restaurants</strong> helping customers describe food and service quality</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Healthcare providers</strong> guiding patients to write helpful feedback</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">E-commerce</strong> improving product review quality</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Any business</strong> wanting to make review writing easier for customers</span>
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
              <div className="text-xs text-white/60">Configure AI guidelines</div>
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

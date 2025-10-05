/**
 * CMS Article Viewer - renders articles from database with full design
 */

import { getArticleBySlug } from '@/lib/docs/articles';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function CMSArticlePage({ params }: PageProps) {
  const { slug: slugArray } = await params;

  // Join slug parts (e.g., ["prompt-pages", "features", "ai-powered"] -> "prompt-pages/features/ai-powered")
  const slug = slugArray.join('/');

  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const metadata = article.metadata || {};
  const keyFeatures = metadata.key_features || [];
  const howItWorks = metadata.how_it_works || [];
  const bestPractices = metadata.best_practices || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            {metadata.category_icon && (
              <div className={`p-3 bg-gradient-to-br ${metadata.category_color || 'from-blue-500 to-indigo-600'} rounded-xl`}>
                <span className="text-3xl">{metadata.category_icon}</span>
              </div>
            )}
            <div>
              <h1 className="text-4xl font-bold text-white">{article.title}</h1>
              {metadata.description && (
                <p className="text-white/70 mt-2">{metadata.description}</p>
              )}
            </div>
          </div>

          {metadata.category_label && (
            <span className="inline-block px-3 py-1 text-sm rounded-full bg-white/10 text-white/90">
              {metadata.category_label}
            </span>
          )}
        </div>

        {/* Main Content */}
        {article.content && (
          <div className="prose prose-invert max-w-none mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
              >
                {article.content}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* How It Works */}
        {howItWorks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">How it works</h2>
            <ol className="space-y-4">
              {howItWorks.map((step) => (
                <li key={step.number} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold">
                    {step.number}
                  </span>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{step.title}</h4>
                    <p className="text-white/70 text-sm">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Key Features */}
        {keyFeatures.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Key features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {keyFeatures.map((feature, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{feature.icon}</span>
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-white/70">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Best Practices */}
        {bestPractices.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Best practices</h2>
            <div className="space-y-3">
              {bestPractices.map((practice, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/5 rounded-lg p-4">
                  <span className="text-xl flex-shrink-0">{practice.icon}</span>
                  <div>
                    <h4 className="font-medium text-white">{practice.title}</h4>
                    <p className="text-sm text-white/70 mt-1">{practice.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Debug Info */}
        <div className="mt-12 pt-6 border-t border-white/10">
          <details className="text-white/50 text-xs">
            <summary className="cursor-pointer">Debug Info</summary>
            <pre className="mt-2 bg-black/20 p-3 rounded overflow-auto">
              {JSON.stringify({
                slug: article.slug,
                content_length: article.content?.length || 0,
                key_features: keyFeatures.length,
                how_it_works: howItWorks.length,
                best_practices: bestPractices.length,
              }, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}

export const revalidate = 300; // Revalidate every 5 minutes

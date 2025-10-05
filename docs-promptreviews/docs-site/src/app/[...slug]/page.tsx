import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getArticleBySlug, getAllArticles } from '@/lib/articles';
import { getIconComponent } from '@/lib/iconMapper';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: slugArray } = await params;
  const slug = slugArray.join('/');
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: 'Article Not Found | Prompt Reviews',
    };
  }

  return {
    title: `${article.title} | Prompt Reviews`,
    description: article.metadata?.description || '',
    keywords: article.metadata?.keywords || [],
  };
}

export default async function DynamicDocsPage({ params }: PageProps) {
  const { slug: slugArray } = await params;
  const slug = slugArray.join('/');
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const metadata = article.metadata || {};
  const keyFeatures = metadata.key_features || [];
  const howItWorks = metadata.how_it_works || [];
  const bestPractices = metadata.best_practices || [];

  // Build breadcrumbs from slug
  const breadcrumbs = [];
  let currentPath = '';
  for (let i = 0; i < slugArray.length; i++) {
    currentPath += (i > 0 ? '/' : '') + slugArray[i];
    breadcrumbs.push({
      label: slugArray[i].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      href: `/${currentPath}`,
      isLast: i === slugArray.length - 1
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-white/60 mb-6">
        <Link href="/" className="hover:text-white">Home</Link>
        {breadcrumbs.map((crumb, i) => (
          <div key={i} className="flex items-center">
            <ChevronRight className="w-4 h-4 mx-2" />
            {crumb.isLast ? (
              <span className="text-white">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-white">{crumb.label}</Link>
            )}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          {metadata.category_icon && (
            <div className={`p-3 bg-gradient-to-br ${metadata.category_color || 'from-blue-500 to-indigo-600'} rounded-xl`}>
              <span className="text-3xl">{metadata.category_icon}</span>
            </div>
          )}
          <h1 className="text-4xl font-bold text-white">{article.title}</h1>
        </div>
        {metadata.description && (
          <p className="text-xl text-white/80">
            {metadata.description}
          </p>
        )}
      </div>

      {/* Main Content - Overview */}
      {article.content && article.content.length > 50 && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
          <div className="text-white/80 whitespace-pre-wrap">
            {article.content}
          </div>
        </div>
      )}

      {/* How It Works */}
      {howItWorks.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">How it works</h2>
          <ol className="space-y-4">
            {howItWorks.map((step) => (
              <li key={step.number} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
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
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            {slug.includes('features') ? 'Key features' : 'Features'}
          </h2>
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

      {/* Best Practices */}
      {bestPractices.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Best practices</h2>
          <div className="space-y-3">
            {bestPractices.map((practice, i) => (
              <div key={i} className="flex items-start gap-3">
                {typeof getIconComponent(practice.icon) === 'string' ? (
                  <span className="text-xl flex-shrink-0">{practice.icon}</span>
                ) : (
                  <div className="flex-shrink-0">{getIconComponent(practice.icon)}</div>
                )}
                <div>
                  <h4 className="font-medium text-white">{practice.title}</h4>
                  <p className="text-sm text-white/70 mt-1">{practice.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Features - Placeholder for future */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Related articles</h2>
        <p className="text-white/60 text-sm">
          Explore more documentation topics
        </p>
      </div>
    </div>
  );
}

// Generate static paths for all articles
export async function generateStaticParams() {
  const articles = await getAllArticles();

  return articles.map((article) => ({
    slug: article.slug.split('/'),
  }));
}

export const revalidate = 300; // Revalidate every 5 minutes

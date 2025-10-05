import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getArticleBySlug, getAllArticles } from '@/lib/articles';
import { getIconComponent } from '@/lib/iconMapper';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
        <h1 className="text-4xl font-bold text-white mb-4">{article.title}</h1>
        {metadata.description && (
          <p className="text-xl text-white/80">
            {metadata.description}
          </p>
        )}
      </div>

      {/* Markdown Content */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8">
        <style jsx global>{`
          .markdown-content h1 {
            font-size: 2em;
            font-weight: 700;
            margin-top: 0;
            margin-bottom: 1rem;
            color: #fff;
            border-bottom: 2px solid rgba(255,255,255,0.2);
            padding-bottom: 0.5rem;
          }
          .markdown-content h2 {
            font-size: 1.75em;
            font-weight: 600;
            margin-top: 2rem;
            margin-bottom: 1rem;
            color: #fff;
          }
          .markdown-content h3 {
            font-size: 1.35em;
            font-weight: 600;
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
            color: rgba(255,255,255,0.95);
          }
          .markdown-content h4 {
            font-size: 1.15em;
            font-weight: 600;
            margin-top: 1rem;
            margin-bottom: 0.5rem;
            color: rgba(255,255,255,0.9);
          }
          .markdown-content p {
            margin-bottom: 1rem;
            color: rgba(255,255,255,0.8);
            line-height: 1.7;
          }
          .markdown-content ul,
          .markdown-content ol {
            margin-bottom: 1rem;
            padding-left: 1.5rem;
            color: rgba(255,255,255,0.8);
          }
          .markdown-content li {
            margin-bottom: 0.5rem;
            line-height: 1.6;
          }
          .markdown-content strong {
            color: #fff;
            font-weight: 600;
          }
          .markdown-content code {
            background-color: rgba(0,0,0,0.3);
            padding: 0.2em 0.4em;
            border-radius: 0.25rem;
            font-size: 0.9em;
            color: rgba(255,255,255,0.95);
            font-family: 'Courier New', monospace;
          }
          .markdown-content pre {
            background-color: rgba(0,0,0,0.4);
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin-bottom: 1rem;
          }
          .markdown-content pre code {
            background-color: transparent;
            padding: 0;
          }
          .markdown-content blockquote {
            border-left: 4px solid rgba(255,255,255,0.4);
            padding-left: 1rem;
            margin-left: 0;
            margin-bottom: 1rem;
            color: rgba(255,255,255,0.7);
            font-style: italic;
          }
          .markdown-content a {
            color: #60a5fa;
            text-decoration: underline;
          }
          .markdown-content a:hover {
            color: #93c5fd;
          }
          .markdown-content table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1rem;
          }
          .markdown-content th,
          .markdown-content td {
            border: 1px solid rgba(255,255,255,0.2);
            padding: 0.5rem;
            text-align: left;
            color: rgba(255,255,255,0.8);
          }
          .markdown-content th {
            background-color: rgba(255,255,255,0.1);
            font-weight: 600;
            color: #fff;
          }
        `}</style>
        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {article.content || 'No content available.'}
          </ReactMarkdown>
        </div>
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

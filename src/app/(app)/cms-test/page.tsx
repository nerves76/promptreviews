/**
 * Test page for docs CMS functionality
 *
 * This page tests:
 * - Fetching articles from database
 * - Rendering markdown content
 * - Displaying metadata
 */

import { getArticleBySlug, getAllArticles } from '@/lib/docs/articles';
import { Suspense } from 'react';
import Link from 'next/link';

async function ArticleList() {
  const articles = await getAllArticles();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">All Articles ({articles.length})</h2>
      <div className="grid gap-4">
        {articles.map(article => (
          <div key={article.id} className="border rounded-lg p-4 bg-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{article.title}</h3>
                <p className="text-sm text-gray-600">Slug: {article.slug}</p>
                <p className="text-sm text-gray-600">
                  Category: {article.metadata.category || 'N/A'}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                  {article.status}
                </span>
              </div>
            </div>

            {article.metadata.key_features && article.metadata.key_features.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-700">
                  {article.metadata.key_features.length} key features
                </p>
              </div>
            )}

            <div className="mt-2">
              <p className="text-xs text-gray-500">
                Content: {article.content.length} characters
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function ArticlePreview() {
  const article = await getArticleBySlug('getting-started');

  if (!article) {
    return <div className="text-red-600">Article not found</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Article Preview: Getting Started</h2>

      <div className="border rounded-lg p-6 bg-white">
        <h1 className="text-3xl font-bold mb-2">{article.title}</h1>
        <p className="text-gray-600 mb-4">{article.metadata.description}</p>

        {article.metadata.category_label && (
          <span className="inline-block px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-800 mb-4">
            {article.metadata.category_label}
          </span>
        )}

        <div className="prose max-w-none">
          <div className="whitespace-pre-wrap">{article.content.substring(0, 500)}...</div>
        </div>

        {article.metadata.key_features && article.metadata.key_features.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-3">Key Features</h3>
            <div className="space-y-2">
              {article.metadata.key_features.map((feature, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className="text-blue-600">
                    {feature.icon && <span className="font-mono text-xs">[{feature.icon}]</span>}
                  </div>
                  <div>
                    <h4 className="font-medium">{feature.title}</h4>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {article.metadata.how_it_works && article.metadata.how_it_works.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-3">How It Works</h3>
            <div className="space-y-3">
              {article.metadata.how_it_works.map((step) => (
                <div key={step.number} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    {step.number}
                  </div>
                  <div>
                    <h4 className="font-medium">{step.title}</h4>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default async function DocsTestPage() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Docs CMS Test Page</h1>
        <p className="text-gray-600">
          Testing article fetching and rendering from Supabase
        </p>
      </div>

      <Suspense fallback={<div>Loading article preview...</div>}>
        <ArticlePreview />
      </Suspense>

      <hr className="my-8" />

      <Suspense fallback={<div>Loading articles...</div>}>
        <ArticleList />
      </Suspense>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Test URLs:</h3>
        <ul className="space-y-1 text-sm">
          <li>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/docs/articles/getting-started" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              API: /api/docs/articles/getting-started
            </a>
          </li>
          <li>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/docs/search?q=prompt" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              API: /api/docs/search?q=prompt
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

export const revalidate = 300; // Revalidate every 5 minutes

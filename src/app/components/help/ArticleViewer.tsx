/**
 * Article Viewer Component
 * Displays help articles inline within the help modal
 */

'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';
import { Tutorial } from './types';

interface ArticleViewerProps {
  article: Tutorial;
  onBack: () => void;
}

export default function ArticleViewer({ article, onBack }: ArticleViewerProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArticleContent();
  }, [article.id]);

  const fetchArticleContent = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Extract the article path from the URL
      const urlParts = article.url.split('/docs/');
      const articlePath = urlParts[1] || article.id;
      
      // Fetch the article content
      const response = await fetch(`/api/help-docs/content?path=${articlePath}`);
      
      if (!response.ok) {
        throw new Error('Failed to load article');
      }
      
      const data = await response.json();
      setContent(data.content || getDefaultContent());
    } catch (err) {
      console.error('Error fetching article:', err);
      setError('Unable to load article content');
      // Fallback to default content
      setContent(getDefaultContent());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultContent = () => {
    // Provide default content based on article ID
    const defaultContents: Record<string, string> = {
      'faq': `
        <h2>Frequently Asked Questions</h2>
        <h3>What is Prompt Reviews?</h3>
        <p>Prompt Reviews is a comprehensive platform for managing customer reviews, creating review collection pages, and building your online reputation.</p>
        
        <h3>How do I get started?</h3>
        <p>1. Create your business profile<br>
        2. Set up your first prompt page<br>
        3. Share it with your customers<br>
        4. Watch the reviews come in!</p>
        
        <h3>Can I customize my review pages?</h3>
        <p>Yes! You can fully customize your review pages with your branding, colors, and messaging.</p>
      `,
      '1': `
        <h2>Getting Started with Prompt Pages</h2>
        <p>Prompt pages are customizable review collection pages that make it easy for your customers to leave reviews.</p>
        
        <h3>Creating Your First Page</h3>
        <ol>
          <li>Navigate to Dashboard → Prompt Pages</li>
          <li>Click "Create New Page"</li>
          <li>Choose a template or start from scratch</li>
          <li>Customize your page content and design</li>
          <li>Share the link with your customers</li>
        </ol>
      `,
      '2': `
        <h2>Managing Business Locations</h2>
        <p>Add and manage multiple business locations from a single dashboard.</p>
        
        <h3>Adding a Location</h3>
        <ol>
          <li>Go to Settings → Business Locations</li>
          <li>Click "Add Location"</li>
          <li>Enter your location details</li>
          <li>Verify your location</li>
        </ol>
      `
    };
    
    return defaultContents[article.id] || `
      <h2>${article.title}</h2>
      <p>${article.description}</p>
      <p><em>Full content is available in our documentation.</em></p>
    `;
  };

  const formatContent = (html: string) => {
    // Basic formatting for better display
    return html
      .replace(/<h1/g, '<h1 class="text-2xl font-bold mb-4 text-gray-900"')
      .replace(/<h2/g, '<h2 class="text-xl font-semibold mb-3 mt-6 text-gray-800"')
      .replace(/<h3/g, '<h3 class="text-lg font-medium mb-2 mt-4 text-gray-700"')
      .replace(/<p/g, '<p class="mb-4 text-gray-600 leading-relaxed"')
      .replace(/<ul/g, '<ul class="list-disc list-inside mb-4 space-y-2"')
      .replace(/<ol/g, '<ol class="list-decimal list-inside mb-4 space-y-2"')
      .replace(/<li/g, '<li class="text-gray-600"')
      .replace(/<code/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono"')
      .replace(/<pre/g, '<pre class="bg-gray-50 p-4 rounded-lg overflow-x-auto mb-4"')
      .replace(/<blockquote/g, '<blockquote class="border-l-4 border-slate-blue pl-4 italic my-4"');
  };

  if (loading) {
    return (
      <div className="p-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-blue hover:text-slate-blue/80 mb-4"
        >
          <Icon name="FaChevronLeft" className="w-4 h-4" size={16} />
          <span>Back to tutorials</span>
        </button>
        
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-blue"></div>
          <span className="ml-3 text-gray-600">Loading article...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-blue hover:text-slate-blue/80"
        >
          <Icon name="FaChevronLeft" className="w-4 h-4" size={16} />
          <span>Back</span>
        </button>
        
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1 text-gray-500 hover:text-slate-blue text-sm"
        >
          <span>Open in docs</span>
          <Icon name="FaLink" className="w-3 h-3" size={12} />
        </a>
      </div>

      {/* Article metadata */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{article.title}</h1>
        <div className="flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">{error}</p>
          <p className="text-sm text-yellow-600 mt-1">
            Showing cached content below.
          </p>
        </div>
      )}

      {/* Article content */}
      <div 
        className="prose prose-gray max-w-none"
        dangerouslySetInnerHTML={{ __html: formatContent(content) }}
      />

      {/* Related articles */}
      {article.relatedArticles && article.relatedArticles.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Related Articles</h3>
          <div className="space-y-2">
            {article.relatedArticles.map((relatedId) => (
              <button
                key={relatedId}
                className="text-slate-blue hover:text-slate-blue/80 text-sm"
                onClick={() => {
                  // TODO: Load related article
                  console.log('Load related article:', relatedId);
                }}
              >
                View related article →
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
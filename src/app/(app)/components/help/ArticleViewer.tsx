/**
 * Article Viewer Component
 * Displays help articles inline within the help modal
 */

'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';
import { Tutorial } from './types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
      // Try the new CMS API first - use article.id as the slug
      const slug = article.id;
      const response = await fetch(`/api/docs/articles/${encodeURIComponent(slug)}`);

      if (response.ok) {
        const data = await response.json();
        // Content is in markdown format - store as-is for ReactMarkdown
        setContent(data.article.content);
      } else {
        // Fallback to legacy API
        console.warn('CMS API failed, trying legacy API');
        await fetchArticleContentLegacy();
      }
    } catch (err) {
      console.error('Error fetching article from CMS:', err);
      // Try legacy API as fallback
      try {
        await fetchArticleContentLegacy();
      } catch (legacyErr) {
        console.error('Error fetching article from legacy API:', legacyErr);
        setError('Unable to load article content');
        setContent(getDefaultContent());
      }
    } finally {
      setLoading(false);
    }
  };

  // Legacy API fallback for backward compatibility
  const fetchArticleContentLegacy = async () => {
    const urlParts = article.url.split('/docs/');
    const articlePath = urlParts[1] || article.id;

    const response = await fetch(`/api/help-docs/content?path=${articlePath}`);

    if (!response.ok) {
      throw new Error('Failed to load article from legacy API');
    }

    const data = await response.json();
    setContent(data.content || getDefaultContent());
  };

  // Simple markdown to HTML converter
  const convertMarkdownToHtml = (markdown: string): string => {
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold and italic
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Lists
      .replace(/^\* (.+)$/gim, '<li>$1</li>')
      .replace(/^- (.+)$/gim, '<li>$1</li>')
      .replace(/^\d+\. (.+)$/gim, '<li>$1</li>')
      // Blockquotes
      .replace(/^> (.+)$/gim, '<blockquote>$1</blockquote>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    // Wrap in paragraphs if not already wrapped
    if (!html.startsWith('<h') && !html.startsWith('<ul>') && !html.startsWith('<ol>') && !html.startsWith('<p>')) {
      html = `<p>${html}</p>`;
    }

    // Wrap consecutive list items in ul/ol tags
    html = html.replace(/(<li>.*<\/li>\s*)+/g, (match) => {
      return `<ul>${match}</ul>`;
    });

    return html;
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
        <h2>Customizing Your Business Profile</h2>
        <p>Set up your business information, branding, and contact details to create a professional presence.</p>
        
        <h3>Setting Up Your Profile</h3>
        <ol>
          <li>Go to Dashboard → Business Profile</li>
          <li>Add your business name and description</li>
          <li>Upload your logo and brand colors</li>
          <li>Add contact information and social links</li>
          <li>Save your changes</li>
        </ol>
      `,
      '5': `
        <h2>Google Business Profile Integration</h2>
        <p>Connect and sync with your Google Business Profile for enhanced visibility and better review management.</p>
        
        <h3>Connecting Your Google Business Profile</h3>
        <ol>
          <li>Navigate to Dashboard → Google Business</li>
          <li>Click "Connect Google Business Profile"</li>
          <li>Sign in with your Google account</li>
          <li>Select the business location you want to connect</li>
          <li>Grant necessary permissions</li>
          <li>Review and confirm the connection</li>
        </ol>
        
        <h3>Benefits of Integration</h3>
        <ul>
          <li>Automatic sync of business information</li>
          <li>Direct posting of reviews to Google</li>
          <li>Unified dashboard for all review platforms</li>
          <li>Enhanced local SEO performance</li>
        </ul>
        
        <h3>Managing Your Connection</h3>
        <p>Once connected, you can manage your Google Business Profile directly from your dashboard, including updating business hours, responding to reviews, and posting updates.</p>
      `
    };
    
    return defaultContents[article.id] || `
      <h2>${article.title}</h2>
      <p>${article.description}</p>
      <p><em>Full content is available in our documentation.</em></p>
    `;
  };

  const formatContent = (html: string) => {
    // Remove icon elements that don't render properly
    let formatted = html
      .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '') // Remove SVG icons
      .replace(/<i[^>]*class="[^"]*(?:fa-|icon-)[^"]*"[^>]*><\/i>/gi, '') // Remove FontAwesome icons
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, ''); // Remove emoji if they're causing issues

    // Fix "Available on" text color - change from white/light to dark
    formatted = formatted
      .replace(/<span([^>]*)class="([^"]*text-(?:white|gray-(?:100|200|300|400))[^"]*)"([^>]*)>Available on:/gi,
        '<span$1 class="text-gray-900 font-semibold"$3>Available on:')
      .replace(/>Available on:</gi, ' style="color: #111827; font-weight: 600;">Available on:')

      // Improve plan pill contrast - replace light backgrounds with darker, high-contrast versions
      .replace(/class="([^"]*)(?:bg-(?:gray|slate|blue|indigo)-(?:50|100|200))[^"]*([^"]*)"/gi, (match) => {
        // Only replace if it's a plan badge/pill context
        if (match.toLowerCase().includes('grower') || match.toLowerCase().includes('builder') || match.toLowerCase().includes('maven') ||
            match.includes('badge') || match.includes('pill') || match.includes('plan')) {
          return match
            .replace(/bg-(?:gray|slate|blue|indigo)-(?:50|100|200)/g, 'bg-indigo-600')
            .replace(/text-(?:gray|slate|blue|indigo)-(?:600|700|800|900)/g, 'text-white');
        }
        return match;
      })

      // Specifically target plan name badges/pills to ensure high contrast
      .replace(/<span([^>]*class="[^"]*(?:badge|pill|tag)[^"]*"[^>]*)>(grower|builder|maven)<\/span>/gi,
        '<span class="inline-block px-3 py-1 text-xs font-bold rounded-full bg-indigo-600 text-white">$2</span>');

    // Basic formatting for better display
    return formatted
      .replace(/<h1/g, '<h1 class="text-2xl font-bold mb-4 mt-2 text-gray-900"')
      .replace(/<h2/g, '<h2 class="text-xl font-semibold mb-3 mt-6 text-gray-800"')
      .replace(/<h3/g, '<h3 class="text-lg font-medium mb-2 mt-4 text-gray-700"')
      .replace(/<p/g, '<p class="mb-4 text-gray-700 leading-relaxed"')
      .replace(/<ul/g, '<ul class="list-disc list-inside mb-4 space-y-2"')
      .replace(/<ol/g, '<ol class="list-decimal list-inside mb-4 space-y-2"')
      .replace(/<li/g, '<li class="text-gray-700"')
      .replace(/<code/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-900"')
      .replace(/<pre/g, '<pre class="bg-gray-50 p-4 rounded-lg overflow-x-auto mb-4"')
      .replace(/<blockquote/g, '<blockquote class="border-l-4 border-slate-blue pl-4 italic my-4 text-gray-700"')
      // Fix "Available on:" text specifically
      .replace(/<span([^>]*)>Available on:<\/span>/gi, '<span$1 class="text-gray-900 font-semibold">Available on:</span>');
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
      <div className="flex items-center justify-between mb-3">
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
      <div className="mb-3">
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
      <div className="prose prose-gray max-w-none markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ node, ...props }) => (
              <h1 className="text-2xl font-bold mb-4 mt-2 text-gray-900" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 className="text-xl font-semibold mb-3 mt-6 text-gray-800" {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="text-lg font-medium mb-2 mt-4 text-gray-700" {...props} />
            ),
            p: ({ node, ...props }) => (
              <p className="mb-4 text-gray-700 leading-relaxed" {...props} />
            ),
            ul: ({ node, ...props }) => (
              <ul className="list-disc list-inside mb-4 space-y-2" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />
            ),
            li: ({ node, ...props }) => (
              <li className="text-gray-700" {...props} />
            ),
            code: ({ node, inline, ...props }: any) => {
              if (inline) {
                return (
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-900" {...props} />
                );
              }
              return <code className="block" {...props} />;
            },
            pre: ({ node, ...props }) => (
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto mb-4" {...props} />
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote className="border-l-4 border-slate-blue pl-4 italic my-4 text-gray-700" {...props} />
            ),
            a: ({ node, ...props }) => (
              <a className="text-blue-600 hover:text-blue-800 underline" {...props} />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {/* Related articles - placeholder for future implementation */}
    </div>
  );
}
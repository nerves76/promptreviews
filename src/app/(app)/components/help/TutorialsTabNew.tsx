/**
 * Enhanced Tutorials tab with featured articles and full category browsing
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Icon, { IconName } from '@/components/Icon';
import { Tutorial } from './types';
import { calculateRelevanceScore } from './contextMapper';
import { trackEvent } from '@/utils/analytics';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TutorialsTabProps {
  pathname: string;
  contextKeywords: string[];
  pageName: string;
  initialArticleId?: string;
}

// Define help categories that mirror the docs site structure
const helpCategories = [
  {
    id: 'getting-started',
    title: 'Getting started',
    description: 'Complete guide to setting up your account',
    icon: 'FaRocket',
    color: 'green',
    articles: [
      { id: 'quickstart-overview', title: 'Overview', path: '/getting-started' },
      { id: 'quickstart-business-setup', title: 'Account Setup', path: '/getting-started/account-setup' },
      { id: 'quickstart-choosing-plan', title: 'Choose Your Plan', path: '/getting-started/choosing-plan' },
      { id: 'quickstart-prompt-page', title: 'First Prompt Page', path: '/getting-started/first-prompt-page' },
      { id: 'quickstart-contacts', title: 'Adding Contacts', path: '/getting-started/adding-contacts' },
      { id: 'quickstart-review-request', title: 'First Review Request', path: '/getting-started/first-review-request' },
      { id: 'quickstart-widget', title: 'Review Widget Setup', path: '/getting-started/review-widget' },
    ]
  },
  {
    id: 'prompt-pages',
    title: 'Prompt pages',
    description: 'Create and manage review collection pages',
    icon: 'FaGlobe',
    color: 'blue',
    articles: [
      { id: 'prompt-overview', title: 'Overview', path: '/prompt-pages' },
      { id: 'prompt-settings', title: 'Prompt Page Settings', path: '/prompt-pages/settings' },
      { id: 'prompt-features', title: 'Features', path: '/prompt-pages/features' },
      { id: 'prompt-universal', title: 'Universal Page', path: '/prompt-pages/types/universal' },
      { id: 'prompt-service', title: 'Service Pages', path: '/prompt-pages/types/service' },
      { id: 'prompt-event', title: 'Event Pages', path: '/prompt-pages/types/event' },
      { id: 'prompt-employee', title: 'Employee Pages', path: '/prompt-pages/types/employee' },
      { id: 'prompt-product', title: 'Product Pages', path: '/prompt-pages/types/product' },
      { id: 'prompt-photo', title: 'Photo Pages', path: '/prompt-pages/types/photo' },
      { id: 'prompt-video', title: 'Video Pages', path: '/prompt-pages/types/video' },
    ]
  },
  {
    id: 'ai-reviews',
    title: 'AI assisted reviews',
    description: 'AI-powered review generation and management',
    icon: 'prompty',
    color: 'purple',
    articles: [
      { id: 'ai-overview', title: 'AI Features Overview', path: '/ai-reviews' },
    ]
  },
  {
    id: 'google-business',
    title: 'Google Business Profile',
    description: 'Integration with Google Business Profile',
    icon: 'FaGoogle',
    color: 'yellow',
    articles: [
      { id: 'google-overview', title: 'Overview', path: '/google-business' },
      { id: 'google-services-seo', title: 'Services & SEO', path: '/google-business-services-seo' },
      { id: 'google-products', title: 'Products Guide', path: '/google-business-products' },
      { id: 'google-post-types', title: 'Post Types', path: '/google-business-post-types' },
      // Google Biz Optimizer Help Articles
      { id: 'google-biz-optimizer/metrics/total-reviews', title: 'Total Reviews - Why They Matter', path: '/docs/help/google-biz-optimizer/metrics/total-reviews.md' },
      { id: 'google-biz-optimizer/metrics/average-rating', title: 'Average Star Rating Impact', path: '/docs/help/google-biz-optimizer/metrics/average-rating.md' },
      { id: 'google-biz-optimizer/metrics/review-trends', title: 'Review Growth Trends', path: '/docs/help/google-biz-optimizer/metrics/review-trends.md' },
      { id: 'google-biz-optimizer/metrics/monthly-patterns', title: 'Monthly Review Patterns', path: '/docs/help/google-biz-optimizer/metrics/monthly-patterns.md' },
      { id: 'google-biz-optimizer/optimization/seo-score', title: 'SEO Score Explained', path: '/docs/help/google-biz-optimizer/optimization/seo-score.md' },
      { id: 'google-biz-optimizer/optimization/categories', title: 'Business Categories Guide', path: '/docs/help/google-biz-optimizer/optimization/categories.md' },
      { id: 'google-biz-optimizer/optimization/services', title: 'Services & Descriptions', path: '/docs/help/google-biz-optimizer/optimization/services.md' },
      { id: 'google-biz-optimizer/optimization/photos', title: 'Photo Strategy Guide', path: '/docs/help/google-biz-optimizer/optimization/photos.md' },
      { id: 'google-biz-optimizer/engagement/review-responses', title: 'Responding to Reviews', path: '/docs/help/google-biz-optimizer/engagement/review-responses.md' },
      { id: 'google-biz-optimizer/engagement/questions-answers', title: 'Q&A Management', path: '/docs/help/google-biz-optimizer/engagement/questions-answers.md' },
      { id: 'google-biz-optimizer/engagement/posts', title: 'Google Posts Strategy', path: '/docs/help/google-biz-optimizer/engagement/posts.md' },
      { id: 'google-biz-optimizer/performance/customer-actions', title: 'Customer Actions', path: '/docs/help/google-biz-optimizer/performance/customer-actions.md' },
      { id: 'google-biz-optimizer/optimization/quick-wins', title: 'Quick Wins & Priority Tasks', path: '/docs/help/google-biz-optimizer/optimization/quick-wins.md' },
    ]
  },
  {
    id: 'reviews-management',
    title: 'Reviews & analytics',
    description: 'View, manage, and analyze your reviews',
    icon: 'FaStar',
    color: 'orange',
    articles: [
      { id: 'reviews-dashboard', title: 'Reviews Dashboard', path: '/reviews' },
      { id: 'analytics', title: 'Analytics', path: '/analytics' },
    ]
  },
  {
    id: 'widgets',
    title: 'Review widgets',
    description: 'Embed reviews on your website',
    icon: 'FaCode',
    color: 'indigo',
    articles: [
      { id: 'widgets-overview', title: 'Widget Types', path: '/widgets' },
      { id: 'style-settings', title: 'Style Settings', path: '/style-settings' },
    ]
  },
  {
    id: 'contacts',
    title: 'Contact management',
    description: 'Manage your customer database',
    icon: 'FaUsers',
    color: 'teal',
    articles: [
      { id: 'contacts-overview', title: 'Managing Contacts', path: '/contacts' },
    ]
  },
  {
    id: 'strategies',
    title: 'Review strategies',
    description: 'Best practices for collecting reviews',
    icon: 'FaLightbulb',
    color: 'pink',
    articles: [
      { id: 'strategies-overview', title: 'Overview', path: '/strategies' },
      { id: 'double-dip', title: 'Double Dip Strategy', path: '/strategies/double-dip' },
      { id: 'reciprocity', title: 'Reciprocity', path: '/strategies/reciprocity' },
      { id: 'novelty', title: 'Novelty Approach', path: '/strategies/novelty' },
      { id: 'personal-outreach', title: 'Personal Outreach', path: '/strategies/personal-outreach' },
      { id: 'reviews-on-fly', title: 'Reviews on the Fly', path: '/strategies/reviews-on-fly' },
      { id: 'non-ai', title: 'Non-AI Strategies', path: '/strategies/non-ai-strategies' },
    ]
  },
  {
    id: 'settings',
    title: 'Settings & configuration',
    description: 'Account and business settings',
    icon: 'FaCog',
    color: 'gray',
    articles: [
      { id: 'business-profile', title: 'Business Profile', path: '/business-profile' },
      { id: 'billing', title: 'Billing & Plans', path: '/billing' },
      { id: 'team', title: 'Team Management', path: '/team' },
      { id: 'advanced', title: 'Advanced Settings', path: '/advanced' },
    ]
  }
];

export default function TutorialsTabNew({
  pathname,
  contextKeywords,
  pageName,
  initialArticleId
}: TutorialsTabProps) {
  const [featuredArticles, setFeaturedArticles] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [articleContent, setArticleContent] = useState<string>('');
  const [isHtmlContent, setIsHtmlContent] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle initial article if provided - Store state for later loading
  const [pendingInitialLoad, setPendingInitialLoad] = useState<{article: any, category: any} | null>(null);

  useEffect(() => {
    if (initialArticleId) {
      console.log('TutorialsTabNew - Looking for article with ID:', initialArticleId);

      // Search through all categories for the article
      for (const category of helpCategories) {
        const article = category.articles.find(a => a.id === initialArticleId);
        if (article) {
          console.log('TutorialsTabNew - Found article:', article);
          // Set both the category and the article
          setSelectedCategory(category);
          setSelectedArticle(article);
          // Store for loading after handleArticleClick is defined
          setPendingInitialLoad({ article, category });
          break;
        }
      }
    }
  }, [initialArticleId]);

  // Get featured articles based on current page context - now using CMS API
  useEffect(() => {
    const getFeaturedArticles = async () => {
      try {
        const response = await fetch('/api/docs/contextual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            route: pathname,
            limit: 3,
            // userPlan can be added later for plan-based filtering
          })
        });

    if (response.ok) {
      const data = await response.json();
      // Transform Article type to featured article format
      const featured = data.articles.map((article: any) => ({
        id: article.slug,
        title: article.title,
        category: article.metadata?.category || 'general',
        icon: article.metadata?.category_icon || 'FaQuestionCircle',
        slug: article.slug,
        path: `/${article.slug}`,
        content: article.content || ''
      }));

      setFeaturedArticles(featured.length > 0 ? featured : getDefaultFeatured());
    } else {
      // Fallback to hardcoded featured articles
      setFeaturedArticles(getDefaultFeatured());
    }
      } catch (error) {
        console.error('Error fetching featured articles:', error);
        setFeaturedArticles(getDefaultFeatured());
      }
    };

    const getDefaultFeatured = () => {
      // Fallback featured articles if API fails
      if (pathname.includes('prompt-pages') || pathname.includes('edit-prompt-page')) {
        return [
          { id: 'prompt-pages-settings', title: 'Prompt Page Settings', category: 'prompt-pages', icon: 'FaCog', slug: 'prompt-pages/settings', path: '/prompt-pages/settings' },
          { id: 'prompt-pages-types-universal', title: 'The Universal Prompt Page', category: 'prompt-pages', icon: 'FaGlobe', slug: 'prompt-pages/types/universal', path: '/prompt-pages/types/universal' },
          { id: 'prompt-pages-features', title: 'Prompt Page Features', category: 'prompt-pages', icon: 'FaStar', slug: 'prompt-pages/features', path: '/prompt-pages/features' },
        ];
      } else if (pathname.includes('widget')) {
        return [
          { id: 'widgets', title: 'Widget Types', category: 'widgets', icon: 'FaCode', slug: 'widgets', path: '/widgets' },
          { id: 'style-settings', title: 'Customize Widget Style', category: 'widgets', icon: 'FaPaintBrush', slug: 'style-settings', path: '/style-settings' },
        ];
      } else if (pathname.includes('contacts')) {
        return [
          { id: 'contacts', title: 'Managing Contacts', category: 'contacts', icon: 'FaUsers', slug: 'contacts', path: '/contacts' },
        ];
      } else {
        // Default for dashboard
        return [
          { id: 'getting-started', title: 'Getting Started Guide', category: 'getting-started', icon: 'FaRocket', slug: 'getting-started', path: '/getting-started' },
        ];
      }
    };

    getFeaturedArticles();
  }, [pathname]);

  // Load article content from CMS - updated to use new API
  const loadArticleContent = async (identifier: { slug?: string; path?: string; legacyId?: string; content?: string }) => {
    if (identifier.content) {
      setArticleContent(identifier.content);
      setIsHtmlContent(false);
      return;
    }
    setLoadingContent(true);
    try {
      const slug = identifier.slug;

      if (slug) {
        // Use the new /api/docs/articles/[slug] endpoint
        const response = await fetch(`/api/docs/articles/${encodeURIComponent(slug)}`);

        if (response.ok) {
          const data = await response.json();
          // The new API returns { article, source }
          // Article content is in markdown format
          setArticleContent(data.article.content);
          setIsHtmlContent(false);
        } else {
          console.warn('New API failed, falling back to legacy fetch-from-docs API');
          await loadArticleContentLegacy(identifier);
        }
      } else {
        // No slug available yet - use legacy path/id immediately
        await loadArticleContentLegacy(identifier);
      }
    } catch (error) {
      console.error('Error loading article:', error);
      // Fallback to old API
      await loadArticleContentLegacy(identifier);
    } finally {
      setLoadingContent(false);
    }
  };

  // Legacy fallback for articles not yet in CMS
  const loadArticleContentLegacy = async (identifier: { path?: string; legacyId?: string; slug?: string }) => {
    try {
      const legacyId = identifier.legacyId || '';
      const normalizedPath = normalizePath(identifier.path, identifier.slug);
      const isGoogleBizOptimizer = legacyId.startsWith('google-biz-optimizer/');

      const response = await fetch('/api/help-docs/fetch-from-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isGoogleBizOptimizer
            ? { articleId: legacyId }
            : { path: normalizedPath }
        )
      });

      if (response.ok) {
        const data = await response.json();
        setArticleContent(formatLegacyHtml(data.content));
        setIsHtmlContent(true);
      } else {
        setArticleContent('**Failed to load article content. Please try again.**');
        setIsHtmlContent(false);
      }
    } catch (error) {
      console.error('Error loading article with legacy API:', error);
      setArticleContent('**Failed to load article content. Please try again.**');
      setIsHtmlContent(false);
    }
  };

  const normalizeSlug = (value?: string): string | undefined => {
    if (!value) return undefined;

    const withoutDomain = value.replace(/^https?:\/\/[^/]+\//, '');
    let cleaned = withoutDomain
      .replace(/^docs\//, '')
      .replace(/^docs\/help\//, '')
      .replace(/^help\//, '')
      .replace(/^\//, '')
      .replace(/\.md$/i, '');

    if (cleaned.startsWith('docs/')) {
      cleaned = cleaned.replace(/^docs\//, '');
    }

    return cleaned;
  };

  const normalizePath = (value?: string, fallbackSlug?: string): string => {
    if (value) {
      if (value.startsWith('http')) {
        try {
          const url = new URL(value);
          return url.pathname || '/';
        } catch (_error) {
          // Fall through to general handling
        }
      }

      const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
      return withLeadingSlash.replace(/\.md$/i, '');
    }

    if (fallbackSlug) {
      return `/${fallbackSlug}`;
    }

    return '/';
  };

  const formatLegacyHtml = (html: string) => {
    if (!html) return '';
    let formatted = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
      .replace(/<i[^>]*class="[^"]*(?:fa-|icon-)[^"]*"[^>]*>[\s\S]*?<\/i>/gi, '')
      .replace(/<div[^>]*class="[^"]*(?:w-12|w-10|w-8|w-6)[^"]*h-(?:12|10|8|6)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/<div[^>]*class="[^"]*icon[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/\s{3,}/g, ' ')
      .replace(/>\s+</g, '><');

    formatted = formatted
      .replace(/<h1([^>]*)>/g, '<h1$1 style="color: #111827;">')
      .replace(/<h2([^>]*)>/g, '<h2$1 style="color: #111827;">')
      .replace(/<h3([^>]*)>/g, '<h3$1 style="color: #111827;">')
      .replace(/<p([^>]*)>/g, '<p$1 style="color: #111827;">')
      .replace(/<li([^>]*)>/g, '<li$1 style="color: #111827;">')
      .replace(/<strong([^>]*)>/g, '<strong$1 style="color: #111827;">')
      .replace(/<a([^>]*)>/g, '<a$1 style="color: #1e40af; text-decoration: underline;">')
      .replace(/Available on:\/span>/gi, 'Available on:')
      .replace(/Available on:/gi, '<strong style="color: #000000;">Available on:</strong>')
      .replace(/<span([^>]*)>(grower|builder|maven)<\/span>/gi,
        '<span style="color: white;" class="inline-block px-2 py-1 text-xs font-bold rounded bg-slate-900 mx-1">$2</span>')
      .replace(/text-green-300/gi, 'text-slate-900')
      .replace(/text-blue-300/gi, 'text-slate-900')
      .replace(/text-purple-300/gi, 'text-slate-900')
      .replace(/text-yellow-300/gi, 'text-slate-900')
      .replace(/text-pink-300/gi, 'text-slate-900')
      .replace(/text-red-300/gi, 'text-slate-900')
      .replace(/text-orange-300/gi, 'text-slate-900')
      .replace(/text-cyan-300/gi, 'text-slate-900')
      .replace(/text-indigo-300/gi, 'text-slate-900')
      .replace(/text-teal-300/gi, 'text-slate-900');

    return formatted.trim();
  };

  // Render article content with consistent styling inside the modal
  const renderMarkdown = (content: string) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ node, ...props }) => (
          <h1 className="text-xl font-bold text-slate-900 mb-4" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-3" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h3 className="text-base font-semibold text-slate-900 mt-4 mb-2" {...props} />
        ),
        p: ({ node, ...props }) => (
          <p className="text-sm leading-6 text-slate-700 mb-3" {...props} />
        ),
        ul: ({ node, ordered, ...props }) => (
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700 mb-3" {...props} />
        ),
        ol: ({ node, ordered, ...props }) => (
          <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700 mb-3" {...props} />
        ),
        li: ({ node, ...props }) => (
          <li className="leading-6" {...props} />
        ),
        a: ({ node, ...props }) => (
          <a className="text-indigo-600 underline" target="_blank" rel="noopener noreferrer" {...props} />
        ),
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-4 border-indigo-200 pl-4 italic text-slate-600 my-4" {...props} />
        ),
        code: ({ inline, className, children, ...props }) => {
          if (inline) {
            return (
              <code className="bg-slate-200/80 text-slate-800 px-1.5 py-0.5 rounded text-xs" {...props}>
                {children}
              </code>
            );
          }
          return (
            <pre className="bg-slate-900/90 text-slate-50 rounded-lg p-4 overflow-x-auto text-xs" {...props}>
              <code>{children}</code>
            </pre>
          );
        },
        hr: ({ node, ...props }) => (
          <hr className="my-6 border-slate-200" {...props} />
        ),
        table: ({ node, ...props }) => (
          <div className="overflow-x-auto my-4">
            <table className="w-full text-sm text-left text-slate-700" {...props} />
          </div>
        ),
        thead: ({ node, ...props }) => (
          <thead className="bg-slate-100 text-slate-900" {...props} />
        ),
        th: ({ node, ...props }) => (
          <th className="px-4 py-2 font-semibold" {...props} />
        ),
        td: ({ node, ...props }) => (
          <td className="px-4 py-2" {...props} />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );

  // Handle article click - updated to use slug
  const handleArticleClick = async (article: any, category: any) => {
    trackEvent('help_article_clicked', {
      article_id: article.slug || article.id,
      article_title: article.title,
      category: category.id,
      context: pathname
    });

    setSelectedArticle(article);
    setSelectedCategory(category);

    const slug = normalizeSlug(article.slug || article.path || article.id);
    const path = normalizePath(article.path || article.slug, slug);

    await loadArticleContent({
      slug,
      path,
      legacyId: article.id,
      content: article.content
    });
  };

  // Load initial article if one was pending
  useEffect(() => {
    if (pendingInitialLoad) {
      handleArticleClick(pendingInitialLoad.article, pendingInitialLoad.category);
      setPendingInitialLoad(null);
    }
  }, [pendingInitialLoad]);

  // Handle featured article click - updated for slug-based system
  const handleFeaturedClick = async (featured: any) => {
    // With the new CMS, featured articles have slugs we can use directly
    const fallbackSlug = normalizeSlug(featured.slug || featured.id);
    const articleToLoad = {
      id: featured.slug || featured.id,
      slug: fallbackSlug,
      title: featured.title,
      path: featured.path || normalizePath(featured.slug || featured.id, fallbackSlug),
      content: featured.content
    };

    const mockCategory = {
      id: featured.category,
      title: featured.category.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      icon: featured.icon
    };

    await handleArticleClick(articleToLoad, mockCategory);
  };

  // Back to categories
  const handleBackToCategories = () => {
    setSelectedArticle(null);
    setSelectedCategory(null);
    setArticleContent('');
    setIsHtmlContent(false);
  };

  // Handle clicks on links within article content
  useEffect(() => {
    if (!contentRef.current || !articleContent) return;

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if clicked element is a link
      if (target.tagName === 'A' && target.getAttribute('href')) {
        e.preventDefault();
        const href = target.getAttribute('href') || '';
        
        // Extract path from URL
        let path = '';
        if (href.includes('promptreviews.app/docs')) {
          path = href.replace(/^https?:\/\/[^\/]+\/docs/, '');
        } else if (href.startsWith('/')) {
          path = href;
        } else {
          // For relative links
          path = '/' + href;
        }
        
        // Try to find matching article in our categories
        let foundArticle = null;
        let foundCategory = null;
        
        for (const category of helpCategories) {
          const article = category.articles.find(art => 
            art.path === path || 
            art.path === `/docs${path}` ||
            art.path.endsWith(path)
          );
          if (article) {
            foundArticle = article;
            foundCategory = category;
            break;
          }
        }
        
        if (foundArticle && foundCategory) {
          // Load the article within the modal
          handleArticleClick(foundArticle, foundCategory);
        } else {
          // If article not found in our categories, try to load it anyway
          const newArticle = {
            id: path.replace(/\//g, '-'),
            title: target.textContent || 'Documentation',
            path: path
          };
          const category = helpCategories[0]; // Use first category as fallback
          handleArticleClick(newArticle, category);
        }
      }
    };

    // Add click listener to content
    contentRef.current.addEventListener('click', handleLinkClick);
    
    return () => {
      if (contentRef.current) {
        contentRef.current.removeEventListener('click', handleLinkClick);
      }
    };
  }, [articleContent, isHtmlContent]);

  // Show article viewer if article is selected
  if (selectedArticle) {
    return (
      <div className="h-full flex flex-col" style={{
        background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #ddd6fe 100%)'
      }}>
        {/* Header with back button */}
        <div className="px-4 md:px-6 pt-4 md:pt-6 pb-2">
          <button
            onClick={handleBackToCategories}
            className="flex items-center space-x-2 text-indigo-700 hover:text-indigo-900 font-medium mb-4"
          >
            <Icon name="FaArrowLeft" className="w-4 h-4" size={16} />
            <span>Back to Help</span>
          </button>

          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-1">{selectedArticle.title}</h2>
          <div className="text-sm text-gray-600 font-medium mb-0">
            From: {selectedCategory.title}
          </div>
        </div>

        {/* Article content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 md:px-6">
            {loadingContent ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div
                ref={contentRef}
                className="article-content prose prose-sm max-w-none"
                style={{ margin: 0, padding: 0 }}
              >
                {isHtmlContent ? (
                  <div dangerouslySetInnerHTML={{ __html: articleContent }} />
                ) : (
                  renderMarkdown(articleContent)
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main categories view
  return (
    <div className="h-full flex flex-col p-4 md:p-6" style={{ 
      background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #ddd6fe 100%)'
    }}>
      {/* Featured Articles Section */}
      <div className="mb-4 md:mb-6">
        <h3 className="text-xs md:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
          Suggested for this page
        </h3>
        <div className="grid gap-2">
          {featuredArticles.map((featured) => (
            <button
              key={featured.id}
              onClick={() => handleFeaturedClick(featured)}
              className="flex items-center space-x-2 md:space-x-3 p-2.5 md:p-3 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors text-left group"
            >
              <div className="flex-shrink-0">
                <Icon 
                  name={featured.icon} 
                  className="w-4 h-4 md:w-5 md:h-5 text-slate-600 group-hover:text-indigo-600" 
                  size={20} 
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm md:text-base text-gray-900 group-hover:text-primary-700 truncate">
                  {featured.title}
                </h4>
              </div>
              <Icon 
                name="FaChevronRight" 
                className="w-3 h-3 md:w-4 md:h-4 text-gray-400 group-hover:text-indigo-600 flex-shrink-0" 
                size={16} 
              />
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-3 md:my-4"></div>

      {/* All Categories Section */}
      <div className="flex-1 overflow-y-auto -mx-4 md:-mx-6 px-4 md:px-6">
        <h3 className="text-xs md:text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
          Browse all help topics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pb-4">
          {helpCategories.map((category) => {
            // Get the overview article (first article in the category)
            const overviewArticle = category.articles[0];
            
            return (
              <button
                key={category.id}
                onClick={() => handleArticleClick(overviewArticle, category)}
                className="flex items-center space-x-3 p-3 md:p-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors text-left group"
              >
                <div className="flex-shrink-0">
                  <Icon 
                    name={category.icon as IconName} 
                    className="w-5 h-5 md:w-6 md:h-6 text-slate-600 group-hover:text-indigo-600" 
                    size={24} 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm md:text-base text-gray-900 group-hover:text-indigo-700">
                    {category.title}
                  </h4>
                  <p className="text-xs text-gray-700 mt-0.5">
                    {category.description}
                  </p>
                </div>
                <Icon 
                  name="FaChevronRight" 
                  className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 flex-shrink-0" 
                  size={16} 
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

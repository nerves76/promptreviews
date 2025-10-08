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

interface HelpCategory {
  id: string;
  title: string;
  icon?: IconName | string | null;
  description?: string | null;
  articles: Array<{
    id: string;
    title: string;
    path: string;
    slug: string;
    icon?: IconName | string | null;
    content?: string;
  }>;
}

type NavigationNode = {
  id?: string;
  title?: string;
  href?: string | null;
  icon?: string | null;
  children?: NavigationNode[];
};

function mapNavigationToCategories(nodes: NavigationNode[]): HelpCategory[] {
  if (!Array.isArray(nodes)) {
    return [];
  }

  return nodes
    .map((node) => {
      const articles = collectArticlesFromNode(node);

      if (articles.length === 0) {
        return null;
      }

      return {
        id: node.id || slugFromPath(node.href) || (node.title ? node.title.toLowerCase().replace(/\s+/g, '-') : 'category'),
        title: node.title || 'Documentation',
        icon: node.icon,
        description: null,
        articles,
      } as HelpCategory;
    })
    .filter((value): value is HelpCategory => Boolean(value));
}

function collectArticlesFromNode(node: NavigationNode | undefined): HelpCategory['articles'] {
  if (!node) return [];

  const results: HelpCategory['articles'] = [];
  const seen = new Set<string>();

  const visit = (current: NavigationNode, fallbackIcon?: string | null) => {
    if (!current) return;

    if (current.href) {
      const slug = slugFromPath(current.href);
      if (slug && !seen.has(slug)) {
        seen.add(slug);
        results.push({
          id: slug,
          slug,
          title: current.title || slug,
          path: normalizePathFromHref(current.href),
          icon: current.icon || fallbackIcon,
        });
      }
    }

    if (Array.isArray(current.children)) {
      current.children.forEach((child) => visit(child, current.icon || fallbackIcon));
    }
  };

  visit(node, node.icon);
  return results;
}

function slugFromPath(path?: string | null): string | undefined {
  if (!path) return undefined;
  return path.replace(/^https?:\/\/[^/]+\//, '').replace(/^\//, '').replace(/\.md$/i, '');
}

function normalizePathFromHref(href?: string | null): string {
  if (!href) return '/';
  if (href.startsWith('http')) {
    try {
      const url = new URL(href);
      return url.pathname || '/';
    } catch (_error) {
      return `/${href.replace(/^https?:\/\/[^/]+\//, '')}`;
    }
  }

  return href.startsWith('/') ? href.replace(/\.md$/i, '') : `/${href.replace(/\.md$/i, '')}`;
}

function formatCategoryLabel(value: string): string {
  return value
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function TutorialsTabNew({
  pathname,
  contextKeywords,
  pageName,
  initialArticleId
}: TutorialsTabProps) {
  const [helpCategories, setHelpCategories] = useState<HelpCategory[]>([]);
  const [navigationLoading, setNavigationLoading] = useState(true);
  const [featuredArticles, setFeaturedArticles] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpCategory['articles'][number] | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [articleContent, setArticleContent] = useState<string>('');
  const [fullArticleData, setFullArticleData] = useState<any>(null);
  const [isHtmlContent, setIsHtmlContent] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle initial article if provided - Store state for later loading
  const [pendingInitialLoad, setPendingInitialLoad] = useState<{
    article: HelpCategory['articles'][number];
    category: HelpCategory;
  } | null>(null);

  useEffect(() => {
    const loadNavigation = async () => {
      try {
        setNavigationLoading(true);
        const response = await fetch('/api/docs/navigation', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to fetch navigation');
        }

        const data = await response.json();
        const mappedCategories = mapNavigationToCategories(data.navigation || []);
        setHelpCategories(mappedCategories);
      } catch (error) {
        console.error('Error fetching navigation:', error);
        setHelpCategories([]);
      } finally {
        setNavigationLoading(false);
      }
    };

    loadNavigation();
  }, []);

  useEffect(() => {
    if (helpCategories.length === 0) {
      setSelectedCategory(null);
      return;
    }

    setSelectedCategory((previous) => {
      if (!previous) {
        return helpCategories[0];
      }

      const stillExists = helpCategories.find((category) => category.id === previous.id);
      return stillExists ?? helpCategories[0];
    });
  }, [helpCategories]);

  useEffect(() => {
    if (!selectedCategory) {
      setSelectedArticle(null);
      return;
    }

    setSelectedArticle((previous) => {
      if (!previous) {
        return null;
      }

      const stillExists = selectedCategory.articles.find((article) => article.slug === previous.slug);
      return stillExists ?? null;
    });
  }, [selectedCategory]);

  useEffect(() => {
    if (!initialArticleId || helpCategories.length === 0) {
      return;
    }

    for (const category of helpCategories) {
      const article = category.articles.find((item) => item.id === initialArticleId || item.slug === initialArticleId);
      if (article) {
        setSelectedCategory(category);
        setSelectedArticle(article);
        setPendingInitialLoad({ article, category });
        break;
      }
    }
  }, [initialArticleId, helpCategories]);

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
          setFullArticleData(data.article); // Store full article with metadata
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
  const handleArticleClick = async (article: HelpCategory['articles'][number], category: HelpCategory) => {
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
    const slug = normalizeSlug(featured.slug || featured.id);
    if (!slug) {
      return;
    }

    const path = normalizePath(featured.path || featured.slug, slug);

    const existingCategory = helpCategories.find((category) =>
      category.articles.some((article) => article.slug === slug)
    );

    const existingArticle = existingCategory?.articles.find((article) => article.slug === slug);

    const fallbackArticle = existingArticle ?? {
      id: slug,
      slug,
      title: featured.title,
      path,
      icon: featured.icon,
      content: featured.content,
    };

    const categoryForArticle = existingCategory ?? {
      id: featured.category || 'featured',
      title: formatCategoryLabel(featured.category || 'Featured'),
      icon: featured.icon,
      description: null,
      articles: [fallbackArticle],
    };

    await handleArticleClick(fallbackArticle, categoryForArticle);
  };

  // Back to categories
  const handleBackToCategories = () => {
    setSelectedArticle(null);
    setSelectedCategory(helpCategories[0] ?? null);
    setArticleContent('');
    setFullArticleData(null);
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
          handleArticleClick(foundArticle, foundCategory);
        } else if (helpCategories.length > 0) {
          const slug = normalizeSlug(path) || path.replace(/\//g, '-');
          const fallbackArticle = {
            id: slug,
            slug,
            title: target.textContent || 'Documentation',
            path,
            icon: 'FaBook'
          };
          handleArticleClick(fallbackArticle, helpCategories[0]);
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
          <div className="px-4 md:px-6 pb-8">
            {loadingContent ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div ref={contentRef} className="space-y-6 pb-4">
                {/* Main content */}
                {articleContent && (
                  <div
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

                {/* Metadata sections */}
                {fullArticleData?.metadata && (
                  <>
                    {/* Key Features */}
                    {fullArticleData.metadata.key_features && fullArticleData.metadata.key_features.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                          {fullArticleData.metadata.key_features_title || 'Key Features'}
                        </h3>
                        <div className="grid gap-3">
                          {fullArticleData.metadata.key_features.map((feature: any, index: number) => (
                            <div key={index} className="bg-white/50 rounded-lg p-3 border border-gray-200">
                              <h4 className="font-medium text-gray-900 mb-1">{feature.title}</h4>
                              <p className="text-sm text-gray-600">{feature.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* How It Works */}
                    {fullArticleData.metadata.how_it_works && fullArticleData.metadata.how_it_works.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                          {fullArticleData.metadata.how_it_works_title || 'How It Works'}
                        </h3>
                        <div className="space-y-3">
                          {fullArticleData.metadata.how_it_works.map((step: any, index: number) => (
                            <div key={index} className="flex gap-3 bg-white/50 rounded-lg p-3 border border-gray-200">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold">
                                {step.number || index + 1}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 mb-1">{step.title}</h4>
                                <p className="text-sm text-gray-600">{step.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Best Practices */}
                    {fullArticleData.metadata.best_practices && fullArticleData.metadata.best_practices.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                          {fullArticleData.metadata.best_practices_title || 'Best Practices'}
                        </h3>
                        <div className="grid gap-3">
                          {fullArticleData.metadata.best_practices.map((practice: any, index: number) => (
                            <div key={index} className="bg-white/50 rounded-lg p-3 border border-gray-200">
                              <h4 className="font-medium text-gray-900 mb-1">{practice.title}</h4>
                              <p className="text-sm text-gray-600">{practice.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* FAQs */}
                    {fullArticleData.metadata.faqs && fullArticleData.metadata.faqs.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                          {fullArticleData.metadata.faqs_title || 'Frequently Asked Questions'}
                        </h3>
                        <div className="space-y-3">
                          {fullArticleData.metadata.faqs.map((faq: any, index: number) => (
                            <div key={index} className="bg-white/50 rounded-lg p-3 border border-gray-200">
                              <h4 className="font-medium text-gray-900 mb-2">{faq.question}</h4>
                              <div className="text-sm text-gray-600 prose prose-sm max-w-none">
                                {renderMarkdown(faq.answer)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
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
          {navigationLoading ? (
            <div className="col-span-2 text-center text-sm text-gray-600 py-6">
              Loading help navigation…
            </div>
          ) : helpCategories.length === 0 ? (
            <div className="col-span-2 text-center text-sm text-gray-600 py-6">
              No help topics available yet.
            </div>
          ) : (
            helpCategories.map((category) => {
              const overviewArticle = category.articles[0];
              if (!overviewArticle) {
                return null;
              }

              return (
                <button
                  key={category.id}
                  onClick={() => handleArticleClick(overviewArticle, category)}
                  className="flex items-center space-x-3 p-3 md:p-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors text-left group"
                >
                  <div className="flex-shrink-0">
                    <Icon
                      name={(category.icon as IconName) || 'FaBook'}
                      className="w-5 h-5 md:w-6 md:h-6 text-slate-600 group-hover:text-indigo-600"
                      size={24}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm md:text-base text-gray-900 group-hover:text-indigo-700">
                      {category.title}
                    </h4>
                    {category.description && (
                      <p className="text-xs text-gray-700 mt-0.5">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <Icon
                    name="FaChevronRight"
                    className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 flex-shrink-0"
                    size={16}
                  />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

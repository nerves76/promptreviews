/**
 * Enhanced Tutorials tab with featured articles and full category browsing
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Icon, { IconName } from '@/components/Icon';
import { Tutorial } from './types';
import { calculateRelevanceScore } from './contextMapper';
import { trackEvent } from '@/utils/analytics';
import ArticleViewer from './ArticleViewer';

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

  // Get featured articles based on current page context
  useEffect(() => {
    const getFeaturedArticles = () => {
      const featured = [];
      
      // Map pages to relevant articles
      if (pathname.includes('dashboard')) {
        featured.push(
          { id: 'quickstart-overview', title: 'Getting Started Guide', category: 'getting-started', icon: 'FaRocket' },
          { id: 'prompt-universal', title: 'The Universal Prompt Page', category: 'prompt-pages', icon: 'FaGlobe' },
          { id: 'reviews-dashboard', title: 'Managing Reviews', category: 'reviews', icon: 'FaStar' }
        );
      } else if (pathname.includes('plan')) {
        featured.push(
          { id: 'quickstart-choosing-plan', title: 'Choosing the Right Plan', category: 'getting-started', icon: 'FaRocket' },
          { id: 'billing', title: 'Billing Information', category: 'settings', icon: 'FaCreditCard' }
        );
      } else if (pathname.includes('google-business')) {
        featured.push(
          { id: 'google-overview', title: 'Google Business Integration', category: 'google-business', icon: 'FaGoogle' },
          { id: 'google-services-seo', title: 'Boost SEO with Services', category: 'google-business', icon: 'FaSearch' },
          { id: 'google-products', title: 'Products Guide', category: 'google-business', icon: 'FaBox' }
        );
      } else if (pathname.includes('widget')) {
        featured.push(
          { id: 'widgets-overview', title: 'Widget Types', category: 'widgets', icon: 'FaCode' },
          { id: 'style-settings', title: 'Customize Widget Style', category: 'widgets', icon: 'FaPaintBrush' },
          { id: 'quickstart-widget', title: 'Widget Setup Guide', category: 'getting-started', icon: 'FaRocket' }
        );
      } else if (pathname.includes('contacts')) {
        featured.push(
          { id: 'contacts-overview', title: 'Managing Contacts', category: 'contacts', icon: 'FaUsers' },
          { id: 'quickstart-contacts', title: 'Import Your First Contacts', category: 'getting-started', icon: 'FaUpload' }
        );
      } else {
        // Default featured articles
        featured.push(
          { id: 'quickstart-overview', title: 'Getting Started Guide', category: 'getting-started', icon: 'FaRocket' },
          { id: 'prompt-overview', title: 'Understanding Prompt Pages', category: 'prompt-pages', icon: 'FaGlobe' },
          { id: 'reviews-dashboard', title: 'Reviews Dashboard', category: 'reviews-management', icon: 'FaStar' }
        );
      }
      
      setFeaturedArticles(featured);
    };
    
    getFeaturedArticles();
  }, [pathname]);

  // Load article content from docs site
  const loadArticleContent = async (articlePathOrId: string) => {
    setLoadingContent(true);
    try {
      // Check if this is a Google Biz Optimizer article ID or a regular path
      const isGoogleBizOptimizer = articlePathOrId.startsWith('google-biz-optimizer/');

      const response = await fetch('/api/help-docs/fetch-from-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isGoogleBizOptimizer
            ? { articleId: articlePathOrId }
            : { path: articlePathOrId }
        )
      });
      
      if (response.ok) {
        const data = await response.json();
        // Apply formatting to the content
        const formattedContent = formatArticleContent(data.content);
        setArticleContent(formattedContent);
      } else {
        setArticleContent('<p class="text-red-600">Failed to load article content. Please try again.</p>');
      }
    } catch (error) {
      console.error('Error loading article:', error);
      setArticleContent('<p class="text-red-600">Failed to load article content. Please try again.</p>');
    } finally {
      setLoadingContent(false);
    }
  };

  // Format content with proper styling - matching ArticleViewer pattern
  const formatArticleContent = (html: string) => {
    // Remove icon elements and containers that don't render properly
    let formatted = html
      .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '') // Remove SVG icons
      .replace(/<i[^>]*class="[^"]*(?:fa-|icon-)[^"]*"[^>]*><\/i>/gi, '') // Remove FontAwesome icons
      .replace(/<div[^>]*class="[^"]*w-12[^"]*"[^>]*>\s*<\/div>/gi, ''); // Remove empty w-12 icon containers

    // Fix "Available on:" text and plan badges
    formatted = formatted
      .replace(/Available on:\/span>/gi, 'Available on:')
      .replace(/Available on:/gi, '<strong>Available on:</strong>')
      // Fix plan badges - make them dark
      .replace(/<span([^>]*)>(grower|builder|maven)<\/span>/gi,
        '<span class="inline-block px-2 py-1 text-xs font-bold rounded bg-slate-900 text-white mx-1">$2</span>');

    // Simple text color fixes - just ensure text is dark
    formatted = formatted
      .replace(/<h1([^>]*)>/g, '<h1$1 style="color: #111827;">')
      .replace(/<h2([^>]*)>/g, '<h2$1 style="color: #111827;">')
      .replace(/<h3([^>]*)>/g, '<h3$1 style="color: #111827;">')
      .replace(/<h4([^>]*)>/g, '<h4$1 style="color: #111827;">')
      .replace(/<p([^>]*)>/g, '<p$1 style="color: #111827;">')
      .replace(/<li([^>]*)>/g, '<li$1 style="color: #111827;">')
      .replace(/<strong([^>]*)>/g, '<strong$1 style="color: #111827;">')
      .replace(/<span([^>]*)>/g, '<span$1 style="color: #111827;">');

    return formatted.trim();
  };

  // Handle article click
  const handleArticleClick = async (article: any, category: any) => {
    trackEvent('help_article_clicked', {
      article_id: article.id,
      article_title: article.title,
      category: category.id,
      context: pathname
    });

    setSelectedArticle(article);
    setSelectedCategory(category);
    // For Google Biz Optimizer articles, use the ID instead of path
    const contentIdentifier = article.id.startsWith('google-biz-optimizer/')
      ? article.id
      : article.path;
    await loadArticleContent(contentIdentifier);
  };

  // Load initial article if one was pending
  useEffect(() => {
    if (pendingInitialLoad) {
      handleArticleClick(pendingInitialLoad.article, pendingInitialLoad.category);
      setPendingInitialLoad(null);
    }
  }, [pendingInitialLoad]);

  // Handle featured article click
  const handleFeaturedClick = async (featured: any) => {
    const category = helpCategories.find(cat => 
      cat.articles.some(art => art.id === featured.id)
    );
    const article = category?.articles.find(art => art.id === featured.id);
    
    if (article && category) {
      await handleArticleClick(article, category);
    }
  };

  // Back to categories
  const handleBackToCategories = () => {
    setSelectedArticle(null);
    setSelectedCategory(null);
    setArticleContent('');
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
  }, [articleContent]);

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
                className="article-content"
                style={{ margin: 0, padding: 0 }}
                dangerouslySetInnerHTML={{ __html: articleContent }}
              />
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
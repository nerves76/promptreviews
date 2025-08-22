/**
 * Enhanced Tutorials tab with featured articles and full category browsing
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/Icon';
import { Tutorial } from './types';
import { calculateRelevanceScore } from './contextMapper';
import { trackEvent } from '../../../utils/analytics';
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
    title: 'Getting Started',
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
    title: 'Prompt Pages',
    description: 'Create and manage review collection pages',
    icon: 'FaFile',
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
    title: 'AI Assisted Reviews',
    description: 'AI-powered review generation and management',
    icon: 'FaRobot',
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
    ]
  },
  {
    id: 'reviews-management',
    title: 'Reviews & Analytics',
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
    title: 'Review Widgets',
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
    title: 'Contact Management',
    description: 'Manage your customer database',
    icon: 'FaUsers',
    color: 'teal',
    articles: [
      { id: 'contacts-overview', title: 'Managing Contacts', path: '/contacts' },
    ]
  },
  {
    id: 'strategies',
    title: 'Review Strategies',
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
    title: 'Settings & Configuration',
    description: 'Account and business settings',
    icon: 'FaCog',
    color: 'gray',
    articles: [
      { id: 'business-profile', title: 'Business Profile', path: '/business-profile' },
      { id: 'billing', title: 'Billing & Plans', path: '/billing' },
      { id: 'team', title: 'Team Management', path: '/team' },
      { id: 'advanced', title: 'Advanced Settings', path: '/advanced' },
    ]
  },
  {
    id: 'help',
    title: 'Help & Support',
    description: 'FAQs and troubleshooting',
    icon: 'FaQuestionCircle',
    color: 'red',
    articles: [
      { id: 'faq', title: 'Quick FAQs', path: '/faq' },
      { id: 'faq-comprehensive', title: 'All FAQs', path: '/faq-comprehensive' },
      { id: 'troubleshooting', title: 'Troubleshooting', path: '/troubleshooting' },
    ]
  },
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
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  // Get featured articles based on current page context
  useEffect(() => {
    const getFeaturedArticles = () => {
      const featured = [];
      
      // Map pages to relevant articles
      if (pathname.includes('dashboard')) {
        featured.push(
          { id: 'quickstart-overview', title: 'Getting Started Guide', category: 'getting-started', icon: 'FaRocket' },
          { id: 'prompt-universal', title: 'Create Universal Prompt Page', category: 'prompt-pages', icon: 'FaFile' },
          { id: 'reviews-dashboard', title: 'Managing Reviews', category: 'reviews', icon: 'FaStar' }
        );
      } else if (pathname.includes('plan')) {
        featured.push(
          { id: 'quickstart-choosing-plan', title: 'Choosing the Right Plan', category: 'getting-started', icon: 'FaRocket' },
          { id: 'billing', title: 'Billing Information', category: 'settings', icon: 'FaCreditCard' },
          { id: 'faq', title: 'Pricing FAQs', category: 'help', icon: 'FaQuestionCircle' }
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
          { id: 'faq', title: 'Frequently Asked Questions', category: 'help', icon: 'FaQuestionCircle' },
          { id: 'prompt-overview', title: 'Understanding Prompt Pages', category: 'prompt-pages', icon: 'FaFile' }
        );
      }
      
      setFeaturedArticles(featured);
    };
    
    getFeaturedArticles();
  }, [pathname]);

  // Load article content from docs site
  const loadArticleContent = async (articlePath: string) => {
    setLoadingContent(true);
    try {
      const response = await fetch('/api/help-docs/fetch-from-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: articlePath })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Check if content is plain text/markdown and needs conversion
        if (data.source === 'docs-site' && !data.content.includes('<')) {
          // It's plain text/markdown, convert to simple HTML
          const htmlContent = data.content
            .split('\n\n')
            .map(paragraph => {
              // Process markdown links [text](url)
              let processed = paragraph.replace(
                /\[([^\]]+)\]\(([^)]+)\)/g,
                (match, text, url) => {
                  // Convert relative URLs to docs site
                  const absoluteUrl = url.startsWith('http') 
                    ? url 
                    : `https://promptreviews.app/docs${url.startsWith('/') ? url : '/' + url}`;
                  // Only add target="_blank" for external non-docs links
                  const target = absoluteUrl.includes('promptreviews.app/docs') ? '' : ' target="_blank" rel="noopener noreferrer"';
                  return `<a href="${absoluteUrl}"${target} class="text-indigo-600 hover:text-indigo-700 underline cursor-pointer">${text}</a>`;
                }
              );
              
              // Check for headers
              if (processed.startsWith('# ')) {
                return `<h1 class="text-2xl font-bold mb-4">${processed.substring(2)}</h1>`;
              } else if (processed.startsWith('## ')) {
                return `<h2 class="text-xl font-semibold mb-3">${processed.substring(3)}</h2>`;
              } else if (processed.startsWith('### ')) {
                return `<h3 class="text-lg font-medium mb-2">${processed.substring(4)}</h3>`;
              } else if (processed.startsWith('- ') || processed.startsWith('* ')) {
                // Handle lists
                const items = processed.split('\n').map(item => 
                  `<li>${item.replace(/^[*-]\s/, '')}</li>`
                ).join('');
                return `<ul class="list-disc pl-6 mb-4">${items}</ul>`;
              } else if (processed.trim()) {
                return `<p class="mb-4">${processed}</p>`;
              }
              return '';
            })
            .join('');
          setArticleContent(htmlContent);
        } else {
          // It's already HTML
          setArticleContent(data.content);
        }
      } else {
        setArticleContent('<p>Failed to load article content. Please try again.</p>');
      }
    } catch (error) {
      console.error('Error loading article:', error);
      setArticleContent('<p>Error loading article. Please check your connection.</p>');
    } finally {
      setLoadingContent(false);
    }
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
    await loadArticleContent(article.path);
  };

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

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
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
      <div className="h-full flex flex-col">
        {/* Header with back button */}
        <div className="p-4 md:p-6 pb-0">
          <button
            onClick={handleBackToCategories}
            className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4"
          >
            <Icon name="FaArrowLeft" className="w-4 h-4" size={16} />
            <span>Back to Help</span>
          </button>
          
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">{selectedArticle.title}</h2>
          <div className="text-sm text-gray-600 mb-4">
            From: {selectedCategory.title}
          </div>
        </div>
        
        {/* Article content with gradient background */}
        <div className="flex-1 overflow-y-auto">
          <div className="bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 min-h-full">
            <div className="p-4 md:p-6 pt-2">
              {loadingContent ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div 
                  ref={contentRef}
                  className="prose prose-sm md:prose-base max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 prose-a:text-indigo-600 hover:prose-a:text-indigo-700"
                  dangerouslySetInnerHTML={{ __html: articleContent }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main categories view
  return (
    <div className="h-full flex flex-col p-4 md:p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
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
                  className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 group-hover:text-indigo-700" 
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
        
        <div className="space-y-2 pb-4">
          {helpCategories.map((category) => (
            <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-2.5 md:p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className={`p-1.5 md:p-2 rounded-lg bg-${category.color}-100`}>
                    <Icon 
                      name={category.icon} 
                      className={`w-4 h-4 md:w-5 md:h-5 text-${category.color}-600`} 
                      size={20} 
                    />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <h4 className="font-medium text-sm md:text-base text-gray-900">{category.title}</h4>
                    <p className="text-xs text-gray-500 hidden md:block">{category.description}</p>
                  </div>
                </div>
                <Icon 
                  name={expandedCategories.includes(category.id) ? "FaChevronUp" : "FaChevronDown"} 
                  className="w-3 h-3 md:w-4 md:h-4 text-gray-400 flex-shrink-0" 
                  size={16} 
                />
              </button>
              
              {/* Category Articles */}
              {expandedCategories.includes(category.id) && (
                <div className="border-t border-gray-200 bg-gray-50">
                  {category.articles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => handleArticleClick(article, category)}
                      className="w-full flex items-center justify-between px-8 md:px-12 py-2 hover:bg-white transition-colors text-left group"
                    >
                      <span className="text-xs md:text-sm text-gray-700 group-hover:text-indigo-600 truncate pr-2">
                        {article.title}
                      </span>
                      <Icon 
                        name="FaExternalLinkAlt" 
                        className="w-3 h-3 text-gray-400 flex-shrink-0" 
                        size={12} 
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
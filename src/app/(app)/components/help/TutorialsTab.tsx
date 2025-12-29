/**
 * Tutorials tab component for the help modal
 * Enhanced with article association and behavioral tracking
 */

'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';
import { Tutorial, PlanType } from './types';
import { calculateRelevanceScore } from './contextMapper';
import { 
  trackUserAction, 
  getRecommendedArticles,
  getPageKeywords 
} from './articleAssociation';
import { trackEvent } from '@/utils/analytics';
import ArticleViewer from './ArticleViewer';
import { useSubscription } from '@/auth';

interface TutorialsTabProps {
  pathname: string;
  contextKeywords: string[];
  pageName: string;
  initialArticleId?: string;
}

export default function TutorialsTab({ 
  pathname, 
  contextKeywords,
  pageName,
  initialArticleId
}: TutorialsTabProps) {
  const { currentPlan } = useSubscription();
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loadingTutorials, setLoadingTutorials] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendedArticles, setRecommendedArticles] = useState<string[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Tutorial | null>(null);

  // Get user's current plan
  const userPlan: PlanType = (currentPlan as PlanType) || 'grower'; // Default to grower if no plan

  // Filter tutorials based on user's plan
  const filterTutorialsByPlan = (tutorials: Tutorial[]): Tutorial[] => {
    return tutorials.filter(tutorial => {
      // If no plans specified, available to all
      if (!tutorial.plans || tutorial.plans.length === 0) return true;
      
      // Check if user's plan is in the tutorial's allowed plans
      return tutorial.plans.includes(userPlan);
    });
  };

  // Sort tutorials with priority for initial article
  const sortTutorialsWithPriority = (tutorials: Tutorial[], priorityId?: string): Tutorial[] => {
    if (!priorityId) return tutorials;
    
    return [...tutorials].sort((a, b) => {
      // Put the priority article first
      if (a.id === priorityId) return -1;
      if (b.id === priorityId) return 1;
      // Otherwise sort by relevance score
      return (b.relevanceScore || 0) - (a.relevanceScore || 0);
    });
  };

  useEffect(() => {
    fetchTutorials();
    // Track page view for behavioral recommendations
    trackUserAction({
      action: 'page_view',
      page: pathname,
      timestamp: new Date(),
      success: true,
      context: pageName
    });
  }, [pathname, contextKeywords, pageName, initialArticleId]);

  // Automatically open the initial article if specified
  useEffect(() => {
    console.log('TutorialsTab - initialArticleId:', initialArticleId);
    console.log('TutorialsTab - tutorials length:', tutorials.length);
    console.log('TutorialsTab - selectedArticle:', selectedArticle);
    console.log('TutorialsTab - loadingTutorials:', loadingTutorials);

    // Wait for tutorials to be loaded before trying to find the article
    if (initialArticleId && tutorials.length > 0 && !selectedArticle && !loadingTutorials) {
      const articleToOpen = tutorials.find(t => t.id === initialArticleId);
      console.log('TutorialsTab - searching for article with id:', initialArticleId);
      console.log('TutorialsTab - articleToOpen found:', articleToOpen);
      if (articleToOpen) {
        setSelectedArticle(articleToOpen);
        // Track the auto-open
        trackUserAction({
          action: 'tutorial_auto_opened',
          page: pathname,
          timestamp: new Date(),
          success: true,
          context: articleToOpen.title
        });
        trackEvent('help_tutorial_auto_opened', {
          tutorial_id: articleToOpen.id,
          tutorial_title: articleToOpen.title,
          context: pathname
        });
      }
    }
  }, [initialArticleId, tutorials, pathname, selectedArticle, loadingTutorials]);

  const fetchTutorials = async () => {
    setLoadingTutorials(true);
    try {
      // Get recommended articles based on current page and user behavior
      const recommendations = getRecommendedArticles(pathname, 3);
      setRecommendedArticles(recommendations);
      
      // Combine context keywords with page-specific keywords
      const pageKeywords = getPageKeywords(pathname);
      const allKeywords = [...new Set([...contextKeywords, ...pageKeywords])];
      
      const response = await fetch('/api/help-docs/tutorials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: allKeywords,
          pathname: pathname,
          recommendedArticles: recommendations,
          userPlan: userPlan
        })
      });

      if (response.ok) {
        const data = await response.json();
        const tutorialsWithScores = data.tutorials.map((tutorial: Tutorial) => ({
          ...tutorial,
          relevanceScore: calculateRelevanceScore(tutorial, allKeywords)
        }));
        // Filter by plan
        const planFilteredTutorials = filterTutorialsByPlan(tutorialsWithScores);
        // Prioritize initial article if specified
        const sortedTutorials = sortTutorialsWithPriority(planFilteredTutorials, initialArticleId);
        setTutorials(sortedTutorials);
      } else {
        // Fallback to mock data if API not available
        const mockTutorials = getMockTutorials(allKeywords);
        const planFilteredTutorials = filterTutorialsByPlan(mockTutorials);
        // Prioritize initial article if specified
        const sortedTutorials = sortTutorialsWithPriority(planFilteredTutorials, initialArticleId);
        setTutorials(sortedTutorials);
      }
    } catch (error) {
      console.error('Error fetching tutorials:', error);
      // Fallback to mock data
      const mockTutorials = getMockTutorials(contextKeywords);
      const planFilteredTutorials = filterTutorialsByPlan(mockTutorials);
      const sortedTutorials = sortTutorialsWithPriority(planFilteredTutorials, initialArticleId);
      setTutorials(sortedTutorials);
    } finally {
      setLoadingTutorials(false);
    }
  };

  const getMockTutorials = (keywords: string[]): Tutorial[] => {
    const allTutorials: Tutorial[] = [
      {
        id: 'faq',
        title: 'Complete FAQ - All Your Questions Answered',
        description: 'Comprehensive FAQ covering everything about Prompt Reviews - setup, features, pricing, and more',
        url: 'https://promptreviews.app/docs/faq-comprehensive',
        category: 'faq',
        tags: ['faq', 'questions', 'help', 'answers', 'support'],
        plans: ['grower', 'builder', 'maven', 'enterprise'] // Available to all plans
      },
      {
        id: '1',
        title: 'Getting Started with Prompt Pages',
        description: 'Learn how to create your first prompt page to collect customer reviews',
        url: 'https://promptreviews.app/docs/getting-started',
        category: 'getting-started',
        tags: ['prompt-pages', 'create', 'setup'],
        plans: ['grower', 'builder', 'maven', 'enterprise'] // Available to all plans
      },
      {
        id: '2',
        title: 'Customizing Your Business Profile',
        description: 'Set up your business information, branding, and contact details',
        url: 'https://promptreviews.app/docs/business-profile',
        category: 'business',
        tags: ['business', 'profile', 'branding'],
        plans: ['grower', 'builder', 'maven', 'enterprise'] // Available to all plans
      },
      {
        id: '3',
        title: 'Managing Contacts and Import Options',
        description: 'Upload, organize, and manage your customer contacts effectively',
        url: 'https://promptreviews.app/docs/contacts',
        category: 'contacts',
        tags: ['contacts', 'upload', 'import', 'manage'],
        plans: ['builder', 'maven', 'enterprise'] // Builder+ only
      },
      {
        id: '4',
        title: 'Embedding Review Widgets',
        description: 'Add review widgets to your website to showcase customer feedback',
        url: 'https://promptreviews.app/docs/widgets',
        category: 'widgets',
        tags: ['widgets', 'embed', 'website'],
        plans: ['builder', 'maven', 'enterprise'] // Builder+ only
      },
      {
        id: '5',
        title: 'Google Business Profile Integration',
        description: 'Connect and sync with your Google Business Profile for enhanced visibility',
        url: 'https://promptreviews.app/docs/google-business',
        category: 'integrations',
        tags: ['google', 'business-profile', 'integration'],
        plans: ['builder', 'maven', 'enterprise'] // Builder+ only
      },
      {
        id: 'google-services-seo',
        title: 'How Google Business Services Boost Your SEO',
        description: 'Learn how adding services to your Google Business Profile improves local search rankings and visibility',
        url: '/docs/google-business-services-seo',
        category: 'seo',
        tags: ['google', 'business-profile', 'services', 'seo', 'local-search', 'rankings', 'optimization', 'keywords'],
        plans: ['grower', 'builder', 'maven', 'enterprise'] // Available to all plans
      },
      {
        id: 'google-products',
        title: 'Google Business Products: Complete Guide',
        description: 'Master the products feature to showcase offerings, productize services, and increase visibility',
        url: '/docs/google-business-products',
        category: 'google-business',
        tags: ['google', 'business-profile', 'products', 'productize', 'services', 'seo', 'visibility'],
        plans: ['grower', 'builder', 'maven', 'enterprise'] // Available to all plans
      },
      {
        id: 'google-post-types',
        title: 'Google Business Post Types Guide',
        description: 'Learn about different post types and how they boost your SEO and customer engagement',
        url: '/docs/google-business-post-types',
        category: 'google-business',
        tags: ['google', 'business-profile', 'posts', 'seo', 'updates', 'offers', 'events', 'marketing'],
        plans: ['grower', 'builder', 'maven', 'enterprise'] // Available to all plans
      },
      {
        id: 'bulk-update',
        title: 'Bulk Business Information Updates',
        description: 'Learn how to update multiple Google Business Profile locations simultaneously',
        url: 'https://promptreviews.app/docs/bulk-business-info-update',
        category: 'integrations',
        tags: ['google', 'business-profile', 'bulk', 'update', 'multiple', 'locations', 'business-info'],
        plans: ['builder', 'maven', 'enterprise'] // Builder+ only
      },
      // Google Biz Optimizer Help Articles
      {
        id: 'google-biz-optimizer/metrics/total-reviews',
        title: 'Total Reviews - Why They Matter',
        description: 'Learn about review importance, benchmarks, and growth strategies',
        url: '/docs/help/google-biz-optimizer/metrics/total-reviews.md',
        category: 'google-business',
        tags: ['google', 'reviews', 'metrics', 'growth'],
        plans: ['grower', 'builder', 'maven', 'enterprise']
      },
      {
        id: 'google-biz-optimizer/metrics/average-rating',
        title: 'Average Star Rating Impact',
        description: 'Understanding rating psychology, conversion impact, and improvement tactics',
        url: '/docs/help/google-biz-optimizer/metrics/average-rating.md',
        category: 'google-business',
        tags: ['google', 'rating', 'stars', 'conversion'],
        plans: ['grower', 'builder', 'maven', 'enterprise']
      },
      {
        id: 'google-biz-optimizer/metrics/review-trends',
        title: 'Review Growth Trends',
        description: 'Velocity importance, maintaining momentum, and recovery strategies',
        url: '/docs/help/google-biz-optimizer/metrics/review-trends.md',
        category: 'google-business',
        tags: ['google', 'reviews', 'trends', 'velocity'],
        plans: ['grower', 'builder', 'maven', 'enterprise']
      },
      {
        id: 'google-biz-optimizer/metrics/monthly-patterns',
        title: 'Monthly Review Patterns',
        description: 'Reading charts, understanding seasonal trends, optimization timing',
        url: '/docs/help/google-biz-optimizer/metrics/monthly-patterns.md',
        category: 'google-business',
        tags: ['google', 'reviews', 'patterns', 'analytics'],
        plans: ['grower', 'builder', 'maven', 'enterprise']
      },
      {
        id: 'google-biz-optimizer/optimization/seo-score',
        title: 'SEO Score Explained',
        description: 'Score factors, improvement strategies, industry benchmarks',
        url: '/docs/help/google-biz-optimizer/optimization/seo-score.md',
        category: 'google-business',
        tags: ['google', 'seo', 'optimization', 'ranking'],
        plans: ['grower', 'builder', 'maven', 'enterprise']
      },
      {
        id: 'google-biz-optimizer/optimization/categories',
        title: 'Business Categories Guide',
        description: 'Category selection, primary vs secondary, ranking impact',
        url: '/docs/help/google-biz-optimizer/optimization/categories.md',
        category: 'google-business',
        tags: ['google', 'categories', 'optimization'],
        plans: ['grower', 'builder', 'maven', 'enterprise']
      },
      {
        id: 'google-biz-optimizer/optimization/services',
        title: 'Services & Descriptions',
        description: 'Service optimization, keyword strategies, completeness',
        url: '/docs/help/google-biz-optimizer/optimization/services.md',
        category: 'google-business',
        tags: ['google', 'services', 'descriptions', 'keywords'],
        plans: ['grower', 'builder', 'maven', 'enterprise']
      },
      {
        id: 'google-biz-optimizer/optimization/photos',
        title: 'Photo Strategy Guide',
        description: 'Photo categories, upload frequency, quality guidelines',
        url: '/docs/help/google-biz-optimizer/optimization/photos.md',
        category: 'google-business',
        tags: ['google', 'photos', 'images', 'engagement'],
        plans: ['grower', 'builder', 'maven', 'enterprise']
      },
      {
        id: 'google-biz-optimizer/engagement/review-responses',
        title: 'Responding to Reviews',
        description: 'Response templates, timing, impact on rankings',
        url: '/docs/help/google-biz-optimizer/engagement/review-responses.md',
        category: 'google-business',
        tags: ['google', 'reviews', 'responses', 'engagement'],
        plans: ['grower', 'builder', 'maven', 'enterprise']
      },
      {
        id: 'google-biz-optimizer/engagement/questions-answers',
        title: 'Q&A Management',
        description: 'Q&A importance, proactive FAQs, response strategies',
        url: '/docs/help/google-biz-optimizer/engagement/questions-answers.md',
        category: 'google-business',
        tags: ['google', 'questions', 'answers', 'faq'],
        plans: ['grower', 'builder', 'maven', 'enterprise']
      },
      {
        id: 'google-biz-optimizer/engagement/posts',
        title: 'Google Posts Strategy',
        description: 'Post types, frequency, content ideas for engagement',
        url: '/docs/help/google-biz-optimizer/engagement/posts.md',
        category: 'google-business',
        tags: ['google', 'posts', 'content', 'marketing'],
        plans: ['grower', 'builder', 'maven', 'enterprise']
      },
      {
        id: 'google-biz-optimizer/performance/customer-actions',
        title: 'Customer Actions',
        description: 'Understanding calls, directions, website clicks',
        url: '/docs/help/google-biz-optimizer/performance/customer-actions.md',
        category: 'google-business',
        tags: ['google', 'actions', 'conversion', 'analytics'],
        plans: ['grower', 'builder', 'maven', 'enterprise']
      },
      {
        id: 'google-biz-optimizer/optimization/quick-wins',
        title: 'Quick Wins & Priority Tasks',
        description: 'Task prioritization, impact vs effort, implementation guide',
        url: '/docs/help/google-biz-optimizer/optimization/quick-wins.md',
        category: 'google-business',
        tags: ['google', 'optimization', 'quick-wins', 'tasks'],
        plans: ['grower', 'builder', 'maven', 'enterprise']
      },
      {
        id: '6',
        title: 'Dashboard Overview and Navigation',
        description: 'Understanding your dashboard and key features',
        url: 'https://promptreviews.app/docs',
        category: 'dashboard',
        tags: ['dashboard', 'overview', 'navigation'],
        plans: ['grower', 'builder', 'maven', 'enterprise'] // Available to all plans
      }
    ];

    // Add relevance scores and sort
    return allTutorials
      .map(tutorial => ({
        ...tutorial,
        relevanceScore: calculateRelevanceScore(tutorial, keywords)
      }))
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, 6);
  };

  const handleTutorialClick = (tutorial: Tutorial) => {
    // Track tutorial click for behavioral recommendations
    trackUserAction({
      action: 'tutorial_clicked',
      page: pathname,
      timestamp: new Date(),
      success: true,
      context: tutorial.title
    });
    
    trackEvent('help_tutorial_clicked', {
      tutorial_id: tutorial.id,
      tutorial_title: tutorial.title,
      context: pathname,
      relevance_score: tutorial.relevanceScore
    });
    
    // Show article inline instead of opening in new window
    setSelectedArticle(tutorial);
  };

  const handleBackToList = () => {
    setSelectedArticle(null);
  };

  const filteredTutorials = tutorials.filter(tutorial => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tutorial.title.toLowerCase().includes(query) ||
      tutorial.description.toLowerCase().includes(query) ||
      tutorial.tags.some(tag => tag.toLowerCase().includes(query))
    );
  });


  // Show article viewer if an article is selected
  if (selectedArticle) {
    return (
      <ArticleViewer 
        article={selectedArticle} 
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="p-6">
      {/* Context indicator */}
      <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/50 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Icon name="FaMapMarker" className="w-4 h-4 text-indigo-600" size={16} />
            <span className="text-sm font-medium text-indigo-800">
              {pageName}
            </span>
          </div>
          <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
            Smart recommendations
          </span>
        </div>
        <p className="text-sm text-indigo-700">
          These tutorials are tailored to what you're working on and your recent activity.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Icon 
            name="FaSearch" 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" 
            size={16} 
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tutorials..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 backdrop-blur-sm shadow-sm"
          />
        </div>
      </div>

      {/* Tutorials List */}
      {loadingTutorials ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading tutorials...</span>
        </div>
      ) : filteredTutorials.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="FaSearch" className="w-8 h-8 text-indigo-400" size={32} />
          </div>
          <p className="text-gray-500">No tutorials found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTutorials.map((tutorial) => (
            <div
              key={tutorial.id}
              onClick={() => handleTutorialClick(tutorial)}
              className="p-4 border border-gray-200/50 rounded-xl hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer group bg-white/95 backdrop-blur-sm hover:bg-white"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {tutorial.title}
                </h3>
                <div className="flex items-center space-x-1">
                  {recommendedArticles.includes(tutorial.id) && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full whitespace-nowrap">
                      Recommended
                    </span>
                  )}
                  {tutorial.relevanceScore && tutorial.relevanceScore > 80 && (
                    <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full whitespace-nowrap">
                      Relevant
                    </span>
                  )}
                  {tutorial.plans && !tutorial.plans.includes('grower') && (
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full whitespace-nowrap">
                      {tutorial.plans.includes('builder') ? 'Builder+' : 'Pro'}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {tutorial.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {tutorial.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-2 py-1 text-xs bg-gray-100/80 text-gray-600 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <Icon 
                  name="FaChevronRight" 
                  className="w-4 h-4 text-gray-500 group-hover:text-indigo-600 transition-colors flex-shrink-0" 
                  size={16} 
                />
              </div>
            </div>
          ))}
        </div>
      )}


    </div>
  );
}
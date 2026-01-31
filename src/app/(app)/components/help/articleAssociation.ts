/**
 * Article Association System
 * Maps app pages to docs articles and tracks user behavior for better recommendations
 */

export interface ArticleAssociation {
  appPage: string;
  articles: string[];
  keywords: string[];
  priority: 'high' | 'medium' | 'low';
  userActions?: string[];
}

export interface UserAction {
  action: string;
  page: string;
  timestamp: Date;
  success: boolean;
  context?: string;
}

// Article associations for different app pages
const articleAssociations: ArticleAssociation[] = [
  {
    appPage: '/dashboard',
    articles: ['getting-started'],
    keywords: ['dashboard', 'overview', 'getting-started'],
    priority: 'high',
    userActions: ['page_view', 'first_visit']
  },
  {
    appPage: '/dashboard/create-prompt-page',
    articles: ['prompt-pages'],
    keywords: ['prompt-pages', 'create', 'setup'],
    priority: 'high',
    userActions: ['create_prompt_page', 'page_view']
  },
  {
    appPage: '/dashboard/edit-prompt-page',
    articles: ['prompt-pages'],
    keywords: ['prompt-pages', 'edit', 'customize'],
    priority: 'medium',
    userActions: ['edit_prompt_page', 'page_view']
  },
  {
    appPage: '/dashboard/contacts',
    articles: ['contacts'],
    keywords: ['contacts', 'import', 'manage'],
    priority: 'high',
    userActions: ['upload_contacts', 'page_view']
  },
  {
    appPage: '/dashboard/business-profile',
    articles: ['getting-started'],
    keywords: ['business', 'profile', 'setup'],
    priority: 'medium',
    userActions: ['update_profile', 'page_view']
  },
  {
    appPage: '/dashboard/google-business',
    articles: ['troubleshooting', 'bulk-business-info-update'],
    keywords: ['google', 'integration', 'business-profile', 'bulk', 'update', 'multiple', 'locations'],
    priority: 'medium',
    userActions: ['connect_google', 'page_view', 'bulk_update', 'update_business_info']
  },
  {
    appPage: '/dashboard/widget',
    articles: ['getting-started'],
    keywords: ['widgets', 'embed', 'website'],
    priority: 'medium',
    userActions: ['embed_widget', 'page_view']
  },
  {
    appPage: '/dashboard/ai-search',
    articles: ['ai-search'],
    keywords: ['ai', 'search', 'llm', 'visibility', 'chatgpt', 'perplexity'],
    priority: 'high',
    userActions: ['view_ai_search', 'page_view']
  },
  {
    appPage: '/dashboard/ai-search/competitors',
    articles: ['ai-search', 'comparisons'],
    keywords: ['ai', 'competitors', 'llm', 'tracking'],
    priority: 'medium',
    userActions: ['view_ai_competitors', 'page_view']
  },
  {
    appPage: '/dashboard/ai-search/research-sources',
    articles: ['ai-search'],
    keywords: ['ai', 'research', 'sources', 'citations'],
    priority: 'medium',
    userActions: ['view_ai_sources', 'page_view']
  },
  {
    appPage: '/dashboard/comparisons',
    articles: ['comparisons'],
    keywords: ['comparisons', 'competitors', 'competitive', 'analysis'],
    priority: 'high',
    userActions: ['view_comparisons', 'page_view']
  },
  {
    appPage: '/dashboard/comparisons/competitors',
    articles: ['comparisons'],
    keywords: ['competitors', 'tracking', 'benchmark'],
    priority: 'medium',
    userActions: ['view_competitors', 'page_view']
  },
  {
    appPage: '/dashboard/comparisons/features',
    articles: ['comparisons'],
    keywords: ['features', 'compare', 'advantages'],
    priority: 'medium',
    userActions: ['view_feature_comparisons', 'page_view']
  },
  {
    appPage: '/dashboard/comparisons/tables',
    articles: ['comparisons'],
    keywords: ['tables', 'comparison-table', 'embed'],
    priority: 'medium',
    userActions: ['view_comparison_tables', 'page_view']
  },
  {
    appPage: '/dashboard/reviews/sources',
    articles: ['getting-started'],
    keywords: ['reviews', 'sources', 'platforms'],
    priority: 'medium',
    userActions: ['view_review_sources', 'page_view']
  },
  {
    appPage: '/dashboard/get-reviews/sentiment-analyzer',
    articles: ['sentiment-analyzer'],
    keywords: ['sentiment', 'analysis', 'reviews', 'trends'],
    priority: 'medium',
    userActions: ['analyze_sentiment', 'page_view']
  },
  {
    appPage: '/dashboard/social-posting',
    articles: ['social-posting', 'google-post-types'],
    keywords: ['social', 'posting', 'schedule', 'publish'],
    priority: 'high',
    userActions: ['create_post', 'schedule_post', 'page_view']
  },
  {
    appPage: '/dashboard/rss-feeds',
    articles: ['social-posting'],
    keywords: ['rss', 'feeds', 'syndication'],
    priority: 'low',
    userActions: ['view_rss', 'page_view']
  },
  {
    appPage: '/dashboard/backlinks',
    articles: ['backlinks'],
    keywords: ['backlinks', 'seo', 'link-building', 'authority'],
    priority: 'medium',
    userActions: ['view_backlinks', 'page_view']
  },
  {
    appPage: '/dashboard/research',
    articles: ['backlinks'],
    keywords: ['research', 'domains', 'backlinks', 'seo'],
    priority: 'medium',
    userActions: ['view_research', 'page_view']
  },
  {
    appPage: '/dashboard/research/domains',
    articles: ['backlinks'],
    keywords: ['domain', 'research', 'analysis', 'authority'],
    priority: 'medium',
    userActions: ['research_domain', 'page_view']
  },
  {
    appPage: '/dashboard/research/backlinks',
    articles: ['backlinks'],
    keywords: ['backlinks', 'research', 'link-profile'],
    priority: 'medium',
    userActions: ['research_backlinks', 'page_view']
  },
  {
    appPage: '/dashboard/domain-analysis',
    articles: ['backlinks'],
    keywords: ['domain', 'analysis', 'seo', 'audit', 'metrics'],
    priority: 'medium',
    userActions: ['analyze_domain', 'page_view']
  },
  {
    appPage: '/dashboard/keywords/rank-tracking/paa-questions',
    articles: ['rank-tracking'],
    keywords: ['paa', 'people-also-ask', 'questions', 'serp'],
    priority: 'medium',
    userActions: ['view_paa', 'page_view']
  },
  {
    appPage: '/dashboard/testimonials',
    articles: ['testimonials'],
    keywords: ['testimonials', 'showcase', 'social-proof'],
    priority: 'high',
    userActions: ['manage_testimonials', 'page_view']
  },
  {
    appPage: '/dashboard/integrations',
    articles: ['integrations'],
    keywords: ['integrations', 'connect', 'api', 'tools'],
    priority: 'medium',
    userActions: ['view_integrations', 'page_view']
  },
  {
    appPage: '/dashboard/settings/agency-access',
    articles: ['team'],
    keywords: ['agency', 'access', 'permissions', 'client'],
    priority: 'medium',
    userActions: ['manage_agency_access', 'page_view']
  },
  {
    appPage: '/dashboard/credits',
    articles: ['credits'],
    keywords: ['credits', 'billing', 'usage', 'balance'],
    priority: 'high',
    userActions: ['view_credits', 'purchase_credits', 'page_view']
  },
  {
    appPage: '/dashboard/notifications',
    articles: ['getting-started'],
    keywords: ['notifications', 'alerts', 'preferences'],
    priority: 'low',
    userActions: ['update_notifications', 'page_view']
  },
  {
    appPage: '/dashboard/google-business-profile',
    articles: ['google-business'],
    keywords: ['google', 'business-profile', 'gbp', 'reviews'],
    priority: 'high',
    userActions: ['connect_gbp', 'page_view']
  },
  {
    appPage: '/prompt-pages/outreach-templates',
    articles: ['getting-started', 'contacts'],
    keywords: ['outreach', 'templates', 'email', 'sms', 'campaigns'],
    priority: 'medium',
    userActions: ['create_template', 'page_view']
  },
  {
    appPage: '/prompt-pages/individual',
    articles: ['getting-started'],
    keywords: ['individual', 'prompt-pages', 'personalized'],
    priority: 'medium',
    userActions: ['create_individual_page', 'page_view']
  }
];

/**
 * Get associated articles for a specific app page
 */
export function getAssociatedArticles(appPage: string): string[] {
  const association = articleAssociations.find(a => 
    appPage.startsWith(a.appPage)
  );
  
  return association?.articles || ['getting-started'];
}

/**
 * Get keywords for a specific app page
 */
export function getPageKeywords(appPage: string): string[] {
  const association = articleAssociations.find(a => 
    appPage.startsWith(a.appPage)
  );
  
  return association?.keywords || ['general', 'help'];
}

/**
 * Track user action for better article recommendations
 */
export function trackUserAction(action: UserAction): void {
  // Store in localStorage for now (could be sent to analytics later)
  const actions = JSON.parse(localStorage.getItem('userActions') || '[]');
  actions.push(action);
  
  // Keep only last 50 actions
  if (actions.length > 50) {
    actions.splice(0, actions.length - 50);
  }
  
  localStorage.setItem('userActions', JSON.stringify(actions));
}

/**
 * Get recent user actions for context
 */
export function getRecentUserActions(limit: number = 10): UserAction[] {
  const actions = JSON.parse(localStorage.getItem('userActions') || '[]');
  return actions.slice(-limit);
}

/**
 * Calculate article relevance based on user behavior
 */
export function calculateBehavioralRelevance(
  articleId: string, 
  userActions: UserAction[]
): number {
  let score = 0;
  
  // Check if user has performed actions related to this article
  const relevantActions = userActions.filter(action => {
    const association = articleAssociations.find(a => 
      action.page.startsWith(a.appPage) && 
      a.articles.includes(articleId)
    );
    return association && action.success;
  });
  
  // Recent successful actions get higher scores
  relevantActions.forEach(action => {
    try {
      // Ensure timestamp is a Date object
      let timestamp;
      if (action.timestamp instanceof Date) {
        timestamp = action.timestamp;
      } else if (typeof action.timestamp === 'string' || typeof action.timestamp === 'number') {
        timestamp = new Date(action.timestamp);
      } else {
        // Skip invalid timestamp
        return;
      }
      
      if (!timestamp || isNaN(timestamp.getTime())) {
        // Skip invalid dates
        return;
      }
      
      const hoursAgo = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60);
      if (hoursAgo < 1) score += 30;
      else if (hoursAgo < 24) score += 20;
      else if (hoursAgo < 168) score += 10; // 1 week
    } catch (error) {
      // Skip this action if timestamp processing fails
      console.warn('Failed to process timestamp for action:', action, error);
    }
  });
  
  return Math.min(score, 100);
}

/**
 * Get recommended articles based on current page and user behavior
 */
export function getRecommendedArticles(
  currentPage: string, 
  limit: number = 3
): string[] {
  const pageArticles = getAssociatedArticles(currentPage);
  const userActions = getRecentUserActions();
  
  // Start with page-specific articles
  const recommendations = [...pageArticles];
  
  // Add behaviorally relevant articles
  const behavioralArticles = articleAssociations
    .filter(a => !pageArticles.includes(a.articles[0]))
    .map(a => ({
      articleId: a.articles[0],
      score: calculateBehavioralRelevance(a.articles[0], userActions)
    }))
    .filter(a => a.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit - recommendations.length)
    .map(a => a.articleId);
  
  return [...recommendations, ...behavioralArticles];
}

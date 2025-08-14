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
    articles: ['troubleshooting'],
    keywords: ['google', 'integration', 'business-profile'],
    priority: 'medium',
    userActions: ['connect_google', 'page_view']
  },
  {
    appPage: '/dashboard/widget',
    articles: ['getting-started'],
    keywords: ['widgets', 'embed', 'website'],
    priority: 'medium',
    userActions: ['embed_widget', 'page_view']
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

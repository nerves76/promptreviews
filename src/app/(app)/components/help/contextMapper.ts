/**
 * Context mapping utilities for help system
 * Maps routes to relevant help content
 */

interface RouteContext {
  keywords: string[];
  pageName: string;
  helpTopics?: string[];
}

const routeContextMap: Record<string, RouteContext> = {
  '/dashboard': {
    keywords: ['dashboard', 'overview', 'getting-started', 'home'],
    pageName: 'Dashboard',
    helpTopics: ['navigation', 'metrics', 'quick-actions']
  },
  '/dashboard/create-prompt-page': {
    keywords: ['prompt-pages', 'create', 'setup', 'new'],
    pageName: 'Create Prompt Page',
    helpTopics: ['prompt-types', 'customization', 'publishing']
  },
  '/dashboard/edit-prompt-page': {
    keywords: ['prompt-pages', 'edit', 'customize', 'modify'],
    pageName: 'Edit Prompt Page',
    helpTopics: ['editing', 'preview', 'settings']
  },
  '/dashboard/contacts': {
    keywords: ['contacts', 'manage', 'upload', 'import', 'customers'],
    pageName: 'Contacts',
    helpTopics: ['csv-upload', 'contact-management', 'bulk-actions']
  },
  '/dashboard/business-profile': {
    keywords: ['business', 'profile', 'setup', 'branding', 'company'],
    pageName: 'Business Profile',
    helpTopics: ['business-info', 'branding', 'social-links']
  },
  '/dashboard/prompt-page-settings': {
    keywords: ['style', 'branding', 'customize', 'colors', 'fonts', 'design', 'settings'],
    pageName: 'Prompt Page Settings',
    helpTopics: ['colors', 'fonts', 'themes', 'settings']
  },
  '/dashboard/widget': {
    keywords: ['widgets', 'embed', 'website', 'reviews', 'display'],
    pageName: 'Widgets',
    helpTopics: ['widget-types', 'embedding', 'customization']
  },
  '/dashboard/google-business': {
    keywords: ['google', 'business-profile', 'integration', 'gmb', 'maps', 'bulk', 'update', 'multiple', 'locations', 'business-info'],
    pageName: 'Google Business Profile',
    helpTopics: ['connection', 'sync', 'reviews-import', 'bulk-updates', 'location-management']
  },
  '/dashboard/reviews': {
    keywords: ['reviews', 'manage', 'verification', 'feedback', 'ratings'],
    pageName: 'Reviews',
    helpTopics: ['moderation', 'verification', 'responses']
  },
  '/dashboard/team': {
    keywords: ['team', 'collaboration', 'invite', 'members', 'roles'],
    pageName: 'Team Management',
    helpTopics: ['invites', 'permissions', 'roles']
  },
  '/dashboard/plan': {
    keywords: ['billing', 'subscription', 'upgrade', 'payment', 'pricing'],
    pageName: 'Billing & Plans',
    helpTopics: ['plans', 'billing', 'upgrades']
  },
  '/dashboard/analytics': {
    keywords: ['analytics', 'metrics', 'reports', 'insights', 'data'],
    pageName: 'Analytics',
    helpTopics: ['metrics', 'reports', 'export']
  },
  '/prompt-pages': {
    keywords: ['prompt-pages', 'public', 'sharing', 'list', 'manage'],
    pageName: 'Prompt Pages',
    helpTopics: ['management', 'sharing', 'status']
  },
  '/r/': {
    keywords: ['review-page', 'customer', 'submission', 'public', 'feedback'],
    pageName: 'Review Submission Page',
    helpTopics: ['customer-experience', 'submission-process']
  },
  '/dashboard/keywords': {
    keywords: ['keywords', 'concepts', 'search-terms', 'seo', 'tracking', 'library'],
    pageName: 'Keyword Concepts',
    helpTopics: ['keyword-concepts', 'search-terms', 'organization', 'groups']
  },
  '/dashboard/keywords/rank-tracking': {
    keywords: ['rank', 'tracking', 'seo', 'google', 'position', 'serp'],
    pageName: 'Rank Tracking',
    helpTopics: ['rank-tracking', 'seo-monitoring', 'positions']
  },
  '/dashboard/keywords/research': {
    keywords: ['keywords', 'research', 'volume', 'search-volume', 'discover'],
    pageName: 'Keyword Research',
    helpTopics: ['keyword-research', 'search-volume', 'discovery']
  },
  '/dashboard/local-ranking-grids': {
    keywords: ['local', 'ranking', 'grid', 'geo', 'map', 'location', 'gmb'],
    pageName: 'Local Ranking Grids',
    helpTopics: ['local-seo', 'geo-grid', 'map-rankings']
  },
  '/dashboard/ai-search/competitors': {
    keywords: ['ai', 'search', 'competitors', 'llm', 'visibility', 'competitor-tracking'],
    pageName: 'LLM Visibility Competitors',
    helpTopics: ['ai-competitor-tracking', 'llm-visibility', 'brand-mentions']
  },
  '/dashboard/ai-search/research-sources': {
    keywords: ['ai', 'search', 'research', 'sources', 'citations', 'llm'],
    pageName: 'LLM Research Sources',
    helpTopics: ['ai-sources', 'citations', 'content-strategy']
  },
  '/dashboard/ai-search': {
    keywords: ['ai', 'search', 'llm', 'chatgpt', 'perplexity', 'visibility'],
    pageName: 'LLM Visibility',
    helpTopics: ['ai-visibility', 'llm-tracking', 'brand-monitoring']
  },
  '/dashboard/comparisons/competitors': {
    keywords: ['comparisons', 'competitors', 'tracking', 'benchmark', 'rival'],
    pageName: 'Competitor Tracking',
    helpTopics: ['competitor-analysis', 'benchmarking', 'tracking']
  },
  '/dashboard/comparisons/features': {
    keywords: ['comparisons', 'features', 'compare', 'advantages', 'differentiators'],
    pageName: 'Feature Comparisons',
    helpTopics: ['feature-comparison', 'competitive-advantages']
  },
  '/dashboard/comparisons/tables': {
    keywords: ['comparisons', 'tables', 'comparison-table', 'embed', 'publish'],
    pageName: 'Comparison Tables',
    helpTopics: ['comparison-tables', 'embedding', 'publishing']
  },
  '/dashboard/comparisons': {
    keywords: ['comparisons', 'competitors', 'competitive', 'analysis', 'benchmark'],
    pageName: 'Comparisons',
    helpTopics: ['competitor-analysis', 'comparison-tools', 'benchmarking']
  },
  '/dashboard/reviews/sources': {
    keywords: ['reviews', 'sources', 'platforms', 'google', 'facebook', 'yelp'],
    pageName: 'Review Sources',
    helpTopics: ['review-platforms', 'source-management', 'aggregation']
  },
  '/dashboard/get-reviews/sentiment-analyzer': {
    keywords: ['sentiment', 'analysis', 'reviews', 'positive', 'negative', 'trends'],
    pageName: 'Sentiment Analyzer',
    helpTopics: ['sentiment-analysis', 'review-trends', 'insights']
  },
  '/dashboard/social-posting': {
    keywords: ['social', 'posting', 'google', 'posts', 'schedule', 'publish', 'rss', 'feeds', 'syndication', 'content', 'automation'],
    pageName: 'Post Scheduling',
    helpTopics: ['social-posts', 'scheduling', 'google-posts', 'rss-setup', 'content-syndication', 'automation']
  },
  '/dashboard/backlinks': {
    keywords: ['backlinks', 'seo', 'domains', 'link-building', 'authority'],
    pageName: 'Backlinks',
    helpTopics: ['backlink-analysis', 'link-building', 'domain-authority']
  },
  '/dashboard/research/domains': {
    keywords: ['research', 'domains', 'domain-analysis', 'competitors', 'authority'],
    pageName: 'Domain Research',
    helpTopics: ['domain-research', 'competitor-domains', 'authority-analysis']
  },
  '/dashboard/research/backlinks': {
    keywords: ['research', 'backlinks', 'link-analysis', 'referring-domains'],
    pageName: 'Backlink Research',
    helpTopics: ['backlink-research', 'link-profile', 'referring-domains']
  },
  '/dashboard/research': {
    keywords: ['research', 'seo', 'domains', 'backlinks', 'competitive'],
    pageName: 'Research',
    helpTopics: ['seo-research', 'domain-analysis', 'backlink-research']
  },
  '/dashboard/domain-analysis': {
    keywords: ['domain', 'analysis', 'seo', 'authority', 'metrics', 'audit'],
    pageName: 'Domain Analysis',
    helpTopics: ['domain-audit', 'seo-metrics', 'site-health']
  },
  '/dashboard/keywords/rank-tracking/paa-questions': {
    keywords: ['paa', 'people-also-ask', 'questions', 'serp', 'featured-snippets'],
    pageName: 'PAA Questions',
    helpTopics: ['paa-tracking', 'question-optimization', 'featured-snippets']
  },
  '/dashboard/testimonials': {
    keywords: ['testimonials', 'reviews', 'showcase', 'display', 'social-proof'],
    pageName: 'Testimonials',
    helpTopics: ['testimonial-management', 'display', 'social-proof']
  },
  '/dashboard/integrations': {
    keywords: ['integrations', 'connect', 'api', 'zapier', 'webhooks', 'tools'],
    pageName: 'Connect',
    helpTopics: ['available-integrations', 'setup', 'api-access']
  },
  '/dashboard/settings/agency-access': {
    keywords: ['agency', 'access', 'permissions', 'client', 'management'],
    pageName: 'Agency Access',
    helpTopics: ['agency-setup', 'client-access', 'permissions']
  },
  '/dashboard/credits': {
    keywords: ['credits', 'billing', 'usage', 'balance', 'purchase', 'transactions'],
    pageName: 'Credits',
    helpTopics: ['credit-usage', 'purchasing', 'billing']
  },
  '/dashboard/notifications': {
    keywords: ['notifications', 'alerts', 'email', 'preferences', 'settings'],
    pageName: 'Notifications',
    helpTopics: ['notification-settings', 'alerts', 'email-preferences']
  },
  '/dashboard/google-business-profile': {
    keywords: ['google', 'business-profile', 'gbp', 'integration', 'reviews', 'listings'],
    pageName: 'Google Business Profile',
    helpTopics: ['gbp-connection', 'review-sync', 'listing-management']
  },
  '/prompt-pages/outreach-templates': {
    keywords: ['outreach', 'templates', 'email', 'sms', 'review-requests', 'campaigns'],
    pageName: 'Outreach Templates',
    helpTopics: ['template-creation', 'email-campaigns', 'sms-outreach']
  },
  '/prompt-pages/individual': {
    keywords: ['individual', 'prompt-pages', 'personalized', 'custom', 'requests'],
    pageName: 'Individual Prompt Pages',
    helpTopics: ['individual-requests', 'personalization', 'custom-pages']
  },
  '/work-manager': {
    keywords: ['work-manager', 'tasks', 'seo', 'workflow', 'kanban', 'resources', 'project-management'],
    pageName: 'Work Manager',
    helpTopics: ['task-management', 'seo-workflows', 'resources', 'kanban']
  },
  '/agency/work-manager': {
    keywords: ['work-manager', 'agency', 'tasks', 'seo', 'workflow', 'kanban', 'resources', 'clients'],
    pageName: 'Agency Work Manager',
    helpTopics: ['agency-tasks', 'client-management', 'seo-workflows', 'resources']
  }
};

/**
 * Get context information from pathname
 */
export function getContextFromPath(pathname: string): {
  keywords: string[];
  pageName: string;
  helpTopics: string[];
} {
  // Find the most specific match
  let bestMatch: RouteContext = {
    keywords: ['general', 'help'],
    pageName: 'Application',
    helpTopics: ['getting-started']
  };
  let maxMatchLength = 0;

  for (const [path, context] of Object.entries(routeContextMap)) {
    if (pathname.startsWith(path) && path.length > maxMatchLength) {
      bestMatch = context;
      maxMatchLength = path.length;
    }
  }

  return {
    keywords: bestMatch.keywords,
    pageName: bestMatch.pageName,
    helpTopics: bestMatch.helpTopics || []
  };
}

/**
 * Calculate relevance score for a tutorial based on context
 */
export function calculateRelevanceScore(
  tutorial: { tags: string[]; category: string },
  contextKeywords: string[]
): number {
  let score = 0;
  const lowerKeywords = contextKeywords.map(k => k.toLowerCase());
  
  // Check tag matches
  tutorial.tags.forEach(tag => {
    if (lowerKeywords.includes(tag.toLowerCase())) {
      score += 20;
    }
  });
  
  // Check category match
  if (lowerKeywords.includes(tutorial.category.toLowerCase())) {
    score += 30;
  }
  
  // Bonus for exact matches
  const exactMatch = tutorial.tags.some(tag => 
    contextKeywords.some(keyword => 
      tag.toLowerCase() === keyword.toLowerCase()
    )
  );
  if (exactMatch) {
    score += 25;
  }
  
  // Cap at 100
  return Math.min(score, 100);
}
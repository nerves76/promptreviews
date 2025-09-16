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
  '/dashboard/style': {
    keywords: ['style', 'branding', 'customize', 'colors', 'fonts', 'design'],
    pageName: 'Style Settings',
    helpTopics: ['colors', 'fonts', 'themes']
  },
  '/dashboard/widget': {
    keywords: ['widgets', 'embed', 'website', 'reviews', 'display'],
    pageName: 'Review Widgets',
    helpTopics: ['widget-types', 'embedding', 'customization']
  },
  '/dashboard/google-business': {
    keywords: ['google', 'business-profile', 'integration', 'gmb', 'maps', 'bulk', 'update', 'multiple', 'locations', 'business-info'],
    pageName: 'Google Business Profile',
    helpTopics: ['connection', 'sync', 'reviews-import', 'bulk-updates', 'location-management']
  },
  '/dashboard/reviews': {
    keywords: ['reviews', 'manage', 'verification', 'feedback', 'ratings'],
    pageName: 'Reviews Management',
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
    pageName: 'Prompt Pages List',
    helpTopics: ['management', 'sharing', 'status']
  },
  '/r/': {
    keywords: ['review-page', 'customer', 'submission', 'public', 'feedback'],
    pageName: 'Review Submission Page',
    helpTopics: ['customer-experience', 'submission-process']
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